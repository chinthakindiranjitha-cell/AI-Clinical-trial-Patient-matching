const http = require('http');
const app = require('./src/server');

const TEST_PORT = 5099;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, data: resBody });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING BACKEND INTEGRATION API TESTS');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log(`[Test 1] Health Check: Status ${health.status}, Patients: ${health.data.patients_count}`);
    if (health.status !== 200 || health.data.patients_count !== 25) {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }

    // 2. Get Patients
    const patients = await request('GET', '/api/patients');
    console.log(`[Test 2] Get Patients: Total ${patients.data.total}`);
    if (patients.status !== 200 || patients.data.total !== 25) {
      throw new Error(`Patients fetch failed: ${JSON.stringify(patients)}`);
    }

    // 3. Get Trials
    const trials = await request('GET', '/api/trials');
    console.log(`[Test 3] Get Trials: Total ${trials.data.total}`);
    if (trials.status !== 200 || trials.data.total !== 5) {
      throw new Error(`Trials fetch failed: ${JSON.stringify(trials)}`);
    }

    // 4. Eligible Match Evaluation
    const evalEligible = await request('POST', '/api/match/evaluate', {
      patient_id: 'PAT-001',
      trial_id: 'NCT-D2D-001'
    });
    const match1 = evalEligible.data.results[0];
    console.log(`[Test 4] PAT-001 <-> NCT-D2D-001: ${match1.match_status}, Score: ${match1.match_score}`);
    if (match1.match_status !== 'ELIGIBLE' || match1.match_score !== 100) {
      throw new Error(`Expected ELIGIBLE with score 100, got: ${JSON.stringify(match1)}`);
    }

    // 5. Ineligible Match Evaluation
    const evalIneligible = await request('POST', '/api/match/evaluate', {
      patient_id: 'PAT-002',
      trial_id: 'NCT-D2D-001'
    });
    const match2 = evalIneligible.data.results[0];
    console.log(`[Test 5] PAT-002 <-> NCT-D2D-001: ${match2.match_status}, Score: ${match2.match_score}`);
    if (match2.match_status !== 'INELIGIBLE' || match2.match_score !== 0) {
      throw new Error(`Expected INELIGIBLE with score 0, got: ${JSON.stringify(match2)}`);
    }

    // 6. Insufficient Info Match Evaluation
    const evalPending = await request('POST', '/api/match/evaluate', {
      patient_id: 'PAT-003',
      trial_id: 'NCT-D2D-001'
    });
    const match3 = evalPending.data.results[0];
    console.log(`[Test 6] PAT-003 <-> NCT-D2D-001: ${match3.match_status}, Score: ${match3.match_score}`);
    if (match3.match_status !== 'POTENTIALLY_ELIGIBLE_PENDING_INFO' || !match3.has_insufficient_info) {
      throw new Error(`Expected POTENTIALLY_ELIGIBLE_PENDING_INFO, got: ${JSON.stringify(match3)}`);
    }

    // 7. Diversity Analytics
    const analytics = await request('GET', '/api/analytics/diversity');
    console.log(`[Test 7] Diversity Analytics: Total Patients ${analytics.data.total_patients}`);
    if (analytics.status !== 200 || analytics.data.total_patients !== 25) {
      throw new Error(`Analytics failed: ${JSON.stringify(analytics)}`);
    }

    console.log('\n====================================================');
    console.log(' ALL 7 BACKEND API TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
