const http = require('http');
const app = require('./src/server');

const TEST_PORT = 5097;

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method: 'GET'
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
    req.end();
  });
}

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
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
    req.write(data);
    req.end();
  });
}

async function runAnalyticsTests() {
  console.log('====================================================');
  console.log(' RUNNING DIVERSITY & DEMOGRAPHICS ANALYTICS TEST SUITE');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Baseline diversity analytics
    console.log('[Test 1] Baseline Diversity Analytics Fetch...');
    const baseRes = await get('/api/analytics/diversity');
    console.log(`  -> Status: ${baseRes.status}, Total Patients: ${baseRes.data.total_patients}`);
    if (baseRes.status !== 200 || baseRes.data.total_patients !== 25) {
      throw new Error(`Baseline analytics failed: ${JSON.stringify(baseRes.data)}`);
    }

    // Verify demographic sums match total
    const genderSum = Object.values(baseRes.data.gender_distribution).reduce((a, b) => a + b, 0);
    const raceSum = Object.values(baseRes.data.race_distribution).reduce((a, b) => a + b, 0);
    const ethnicitySum = Object.values(baseRes.data.ethnicity_distribution).reduce((a, b) => a + b, 0);
    const ageSum = Object.values(baseRes.data.age_groups).reduce((a, b) => a + b, 0);

    console.log(`  -> Demographic sums: Gender=${genderSum}, Race=${raceSum}, Ethnicity=${ethnicitySum}, Age=${ageSum}`);
    if (genderSum !== 25 || raceSum !== 25 || ethnicitySum !== 25 || ageSum !== 25) {
      throw new Error(`Demographic counts do not sum to total patients!`);
    }

    // 2. Scientific disclaimer check
    console.log('[Test 2] Scientific Disclaimer Presence Check...');
    if (!baseRes.data.disclaimer || !baseRes.data.disclaimer.includes('synthetic')) {
      throw new Error(`Scientific disclaimer missing or incomplete: ${baseRes.data.disclaimer}`);
    }
    console.log(`  -> Disclaimer verified: "${baseRes.data.disclaimer.slice(0, 60)}..."`);

    // 3. Trial-Specific Representation Comparison (NCT-D2D-001)
    console.log('[Test 3] Trial-Specific Representation for NCT-D2D-001...');
    const trialRes = await get('/api/analytics/diversity?trial_id=NCT-D2D-001');
    console.log(`  -> Status: ${trialRes.status}, Trial: ${trialRes.data.trial_summary?.trial_id}, Evaluated: ${trialRes.data.trial_summary?.evaluated_count}`);
    if (
      trialRes.status !== 200 ||
      trialRes.data.trial_summary?.trial_id !== 'NCT-D2D-001' ||
      trialRes.data.trial_summary?.evaluated_count !== 25
    ) {
      throw new Error(`Trial comparison failed: ${JSON.stringify(trialRes.data)}`);
    }

    // 4. Verify Percentages and Counts in Comparison Data
    console.log('[Test 4] Comparison Table Percentages & Consistency...');
    const compRace = trialRes.data.comparison?.race;
    if (!Array.isArray(compRace) || compRace.length === 0) {
      throw new Error(`Comparison race table missing: ${JSON.stringify(trialRes.data.comparison)}`);
    }
    for (const r of compRace) {
      if (r.cohort_pct < 0 || r.cohort_pct > 100 || r.eligible_pct < 0 || r.eligible_pct > 100) {
        throw new Error(`Invalid percentage in race row: ${JSON.stringify(r)}`);
      }
    }
    console.log(`  -> Verified ${compRace.length} race categories: all percentages bounded in [0, 100]%`);

    // 5. Representation Gaps Identification
    console.log('[Test 5] Representation Gaps Identification...');
    const gaps = trialRes.data.representation_gaps;
    console.log(`  -> Detected ${gaps?.length} representation gaps for protocol NCT-D2D-001`);
    if (!Array.isArray(gaps) || gaps.length === 0) {
      throw new Error(`Expected at least one representation gap alert for strict protocol criteria.`);
    }

    // 6. Test Analytics Update After Importing New Patient
    console.log('[Test 6] Analytics Re-computation After New Patient Import...');
    const newPatient = {
      patient_id: 'PAT-DIV-999',
      demographics: {
        age: 24, // <30 group
        gender: 'female',
        race: 'American Indian or Alaska Native',
        ethnicity: 'Hispanic or Latino',
        postal_code: '87501'
      },
      conditions: ['Type 2 Diabetes Mellitus'],
      biomarkers: { HbA1c: 7.8, eGFR: 88 },
      medications: ['Metformin'],
      allergies: []
    };

    const importRes = await postJson('/api/patients/confirm-import', {
      records: [newPatient],
      duplicate_resolution: 'assign_new_id'
    });
    console.log(`  -> Imported new patient: Status ${importRes.status}, Total cohort now: ${importRes.data.total_cohort_count}`);

    const updatedRes = await get('/api/analytics/diversity?trial_id=NCT-D2D-001');
    console.log(`  -> Updated Total Patients: ${updatedRes.data.total_patients}, Age <30 count: ${updatedRes.data.age_groups['<30']}`);
    if (
      updatedRes.data.total_patients !== 26 ||
      updatedRes.data.age_groups['<30'] !== 2 // Was 1 in baseline, now 2
    ) {
      throw new Error(`Analytics did not dynamically update after patient import: ${JSON.stringify(updatedRes.data)}`);
    }

    console.log('\n====================================================');
    console.log(' ALL 6 DIVERSITY ANALYTICS TESTS PASSED (100%)!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runAnalyticsTests().catch((err) => {
  console.error('Diversity analytics tests failed:', err);
  process.exit(1);
});
