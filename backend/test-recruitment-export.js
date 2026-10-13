const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/server');
const store = require('./src/store');
const { parseCsv } = require('./src/parsers');

const TEST_PORT = 5098;

function request(method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: reqPath,
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
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: resBody
          });
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
  console.log(' RUNNING RECRUITMENT CONTACTS, ISOLATION & EXPORT TESTS');
  console.log('====================================================\n');

  // Ensure clean store seed state
  store.reset();
  const server = app.listen(TEST_PORT);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Initial Dataset Isolation Check (Demo vs Imported)
    // -------------------------------------------------------------------------
    console.log('[Test 1] Verifying Initial Dataset Isolation...');
    const demoRes = await request('GET', '/api/patients?dataset=demo');
    if (demoRes.status !== 200 || demoRes.data.total !== 25) {
      throw new Error(`Expected 25 demo patients, got ${demoRes.data.total}`);
    }
    const hasOnlyDemo = demoRes.data.patients.every(
      (p) => p.dataset_source === 'demo' && p.patient_id.startsWith('PAT-0')
    );
    if (!hasOnlyDemo) {
      throw new Error('Non-demo patient found in Demo Dataset view!');
    }

    const importedEmptyRes = await request('GET', '/api/patients?dataset=imported');
    if (importedEmptyRes.status !== 200 || importedEmptyRes.data.total !== 0) {
      throw new Error(`Expected 0 imported patients before any import, got ${importedEmptyRes.data.total}`);
    }
    console.log('  -> Demo dataset has 25 patients; Imported dataset is initially empty.');

    // -------------------------------------------------------------------------
    // TEST 2: Import 25 New Synthetic Patients from CSV & Assign Batch ID
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Importing 25 New Synthetic Patients from additional_patients.csv...');
    const csvPath = path.join(__dirname, '../data/test_uploads/additional_patients.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Fixture file not found: ${csvPath}`);
    }
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsedCsv = parseCsv(csvContent);

    if (parsedCsv.valid_records.length !== 25) {
      throw new Error(`Expected 25 records parsed from additional_patients.csv, got ${parsedCsv.valid_records.length}`);
    }

    const importRes = await request('POST', '/api/patients/confirm-import', {
      records: parsedCsv.valid_records,
      duplicate_resolution: 'assign_new_id',
      batch_name: 'Expanded Protocol Cohort',
      filename: 'additional_patients.csv',
      format: 'CSV'
    });

    if (importRes.status !== 201 || importRes.data.imported_count !== 25) {
      throw new Error(`Import failed: ${JSON.stringify(importRes.data)}`);
    }

    const batchId = importRes.data.import_batch_id;
    if (!batchId) {
      throw new Error('Import did not return a valid import_batch_id');
    }
    console.log(`  -> Successfully imported 25 records. Assigned Batch ID: ${batchId}`);

    // -------------------------------------------------------------------------
    // TEST 3: Strict Dataset Isolation After Import
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Verifying Strict Dataset Isolation After Import...');
    // 3a. Imported dataset should contain exactly 25 patients
    const importedRes = await request('GET', `/api/patients?dataset=imported&batch_id=${batchId}`);
    if (importedRes.status !== 200 || importedRes.data.total !== 25) {
      throw new Error(`Expected 25 patients in imported view, got ${importedRes.data.total}`);
    }
    const allImported = importedRes.data.patients.every(
      (p) => p.dataset_source === 'imported' && p.import_batch_id === batchId
    );
    if (!allImported) {
      throw new Error('Found patient in imported view without matching dataset_source or batch_id!');
    }

    // 3b. Verify NO demo patients leaked into imported view
    const demoInImported = importedRes.data.patients.some((p) => p.patient_id.startsWith('PAT-0'));
    if (demoInImported) {
      throw new Error('Demo patient leaked into Imported Dataset view!');
    }

    // 3c. Verify Demo Dataset still has exactly 25 and no imported patients
    const demoResAfter = await request('GET', '/api/patients?dataset=demo');
    if (demoResAfter.data.total !== 25) {
      throw new Error(`Demo dataset count changed! Expected 25, got ${demoResAfter.data.total}`);
    }
    const importedInDemo = demoResAfter.data.patients.some((p) => p.dataset_source === 'imported');
    if (importedInDemo) {
      throw new Error('Imported patient leaked into Demo Dataset view!');
    }
    console.log('  -> Isolation confirmed: 0 demo patients in imported view, 0 imported patients in demo view.');

    // -------------------------------------------------------------------------
    // TEST 4: Batch Management Endpoint (/api/batches)
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Verifying /api/batches Endpoint...');
    const batchesRes = await request('GET', '/api/batches');
    if (batchesRes.status !== 200 || batchesRes.data.total < 1) {
      throw new Error(`Expected at least 1 batch, got ${batchesRes.data.total}`);
    }
    const registeredBatch = batchesRes.data.batches.find((b) => b.batch_id === batchId);
    if (!registeredBatch || registeredBatch.record_count !== 25) {
      throw new Error(`Batch record invalid or count mismatch: ${JSON.stringify(registeredBatch)}`);
    }
    console.log(`  -> Batch '${registeredBatch.batch_name}' verified with 25 records.`);

    // -------------------------------------------------------------------------
    // TEST 5: Isolated Matching Evaluation (Only Active Dataset is Evaluated)
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Verifying Isolated Deterministic Matching...');
    // 5a. Match against imported dataset only
    const evalImportedRes = await request('POST', '/api/match/evaluate', {
      trial_id: 'NCT-D2D-001',
      dataset: 'imported',
      batch_id: batchId
    });
    if (evalImportedRes.status !== 200) {
      throw new Error(`Matching evaluation failed: ${JSON.stringify(evalImportedRes.data)}`);
    }
    if (evalImportedRes.data.evaluated_count !== 25) {
      throw new Error(`Expected exactly 25 evaluated imported candidates, got ${evalImportedRes.data.evaluated_count}`);
    }
    const anyDemoEvaluated = evalImportedRes.data.results.some((r) => r.patient_id.startsWith('PAT-0'));
    if (anyDemoEvaluated) {
      throw new Error('Demo patient was evaluated when dataset=imported was selected!');
    }

    // 5b. Match against demo dataset only
    const evalDemoRes = await request('POST', '/api/match/evaluate', {
      trial_id: 'NCT-D2D-001',
      dataset: 'demo'
    });
    if (evalDemoRes.data.evaluated_count !== 25) {
      throw new Error(`Expected 25 evaluated demo candidates, got ${evalDemoRes.data.evaluated_count}`);
    }
    const anyImportedInDemoEval = evalDemoRes.data.results.some((r) => r.patient_id.startsWith('PAT-1'));
    if (anyImportedInDemoEval) {
      throw new Error('Imported patient evaluated when dataset=demo was selected!');
    }
    console.log('  -> Deterministic matching correctly evaluates ONLY active dataset cohort.');

    // -------------------------------------------------------------------------
    // TEST 6: Recruitment Contact Fields & Validation
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Verifying Recruitment Contact Fields...');
    const patient101Res = await request('GET', '/api/patients/PAT-101');
    if (patient101Res.status !== 200 || !patient101Res.data.patient) {
      throw new Error('Could not fetch PAT-101');
    }
    const p101 = patient101Res.data.patient;
    const contact = p101.recruitment_contact;
    if (!contact || !contact.contact_person || !contact.phone || !contact.email) {
      throw new Error(`PAT-101 missing recruitment contact details: ${JSON.stringify(contact)}`);
    }
    console.log(`  -> Patient PAT-101 contact person: ${contact.contact_person} (${contact.relationship}), Phone: ${contact.phone}`);

    // Missing contact fields remain missing (e.g. PAT-001 has no phone or email provided)
    const patient001Res = await request('GET', '/api/patients/PAT-001');
    const p001Contact = patient001Res.data.patient.recruitment_contact;
    if (p001Contact.phone !== null || p001Contact.email !== null || p001Contact.contact_person !== null) {
      throw new Error(`Expected PAT-001 contact details to be null (unprovided), but got: ${JSON.stringify(p001Contact)}`);
    }
    console.log('  -> Verified missing contact details remain null/unfabricated.');

    // -------------------------------------------------------------------------
    // TEST 7: Update Recruitment Contact Details & Persistence
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] Updating Recruitment Contact Status & Notes...');
    const patchRes = await request('PATCH', '/api/patients/PAT-101/recruitment', {
      recruitment_status: 'Interested',
      notes: 'Spoke with coordinator; patient willing to undergo screening next Tuesday.'
    });
    if (patchRes.status !== 200 || !patchRes.data.success) {
      throw new Error(`Recruitment update failed: ${JSON.stringify(patchRes.data)}`);
    }

    // Verify persistence via GET
    const verifyPatient = await request('GET', '/api/patients/PAT-101');
    const updatedContact = verifyPatient.data.patient.recruitment_contact;
    if (
      updatedContact.recruitment_status !== 'Interested' ||
      !updatedContact.notes.includes('screening next Tuesday')
    ) {
      throw new Error(`Recruitment persistence check failed: ${JSON.stringify(updatedContact)}`);
    }
    console.log('  -> Status successfully updated to "Interested" and persisted in data store.');

    // Test rejection of invalid recruitment status
    const invalidStatusRes = await request('PATCH', '/api/patients/PAT-101/recruitment', {
      recruitment_status: 'RandomUnknownStatus'
    });
    if (invalidStatusRes.status !== 400) {
      throw new Error(`Expected 400 for invalid recruitment status, got ${invalidStatusRes.status}`);
    }
    console.log('  -> Successfully rejected invalid status with HTTP 400.');

    // Verify clinical eligibility is completely unaltered by contact status
    const reEvalRes = await request('POST', '/api/match/evaluate', {
      patient_id: 'PAT-101',
      trial_id: 'NCT-D2D-001'
    });
    const p101Match = reEvalRes.data.results[0];
    if (p101Match.match_status !== 'ELIGIBLE' || p101Match.match_score !== 100) {
      throw new Error('Clinical eligibility score was improperly modified by recruitment status!');
    }
    console.log('  -> Confirmed clinical eligibility is completely decoupled from recruitment status.');

    // -------------------------------------------------------------------------
    // TEST 8: Downloadable Trial Matching Results - CSV Export
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] Verifying CSV Export Endpoint (/api/match/export?format=csv)...');
    const csvExportRes = await request(
      'GET',
      `/api/match/export?trial_id=NCT-D2D-001&dataset=imported&batch_id=${batchId}&format=csv`
    );
    if (csvExportRes.status !== 200) {
      throw new Error(`CSV Export failed: Status ${csvExportRes.status}`);
    }
    const contentType = csvExportRes.headers['content-type'];
    if (!contentType || !contentType.includes('text/csv')) {
      throw new Error(`Expected Content-Type text/csv, got ${contentType}`);
    }

    const lines = csvExportRes.raw.trim().split(/\r?\n/);
    if (lines.length !== 26) {
      // 1 header + 25 patient rows
      throw new Error(`Expected 26 lines in CSV export (1 header + 25 data rows), got ${lines.length}`);
    }

    const header = lines[0];
    if (
      !header.includes('Patient ID') ||
      !header.includes('Match Status') ||
      !header.includes('Recruitment Follow-up Status')
    ) {
      throw new Error(`CSV Header missing required columns: ${header}`);
    }

    // Verify formula injection escaping
    // Check that cells starting with '+' (like phone '+1-555-0101') have been escaped with a leading single quote
    const hasEscapedPlus = csvExportRes.raw.includes("\"'+1-555-0101\"");
    if (!hasEscapedPlus) {
      throw new Error("Formula escaping check failed: expected \"'+1-555-0101\" in CSV export");
    }
    const hasRawFormulaUnescaped = lines.some((l) => /^"[=+\-@]/.test(l));
    if (hasRawFormulaUnescaped) {
      throw new Error('Unescaped formula injection character found at start of CSV cell!');
    }
    console.log('  -> CSV export successfully generated (25 candidate rows, formula-escaped).');

    // -------------------------------------------------------------------------
    // TEST 9: Downloadable Trial Matching Results - JSON Export
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] Verifying JSON Export Endpoint (/api/match/export?format=json)...');
    const jsonExportRes = await request(
      'GET',
      `/api/match/export?trial_id=NCT-D2D-001&dataset=imported&batch_id=${batchId}&format=json`
    );
    if (jsonExportRes.status !== 200) {
      throw new Error(`JSON Export failed: Status ${jsonExportRes.status}`);
    }
    const exportData = jsonExportRes.data;
    if (!exportData.export_metadata || !exportData.evaluated_candidates) {
      throw new Error('Export JSON structure invalid (missing metadata or candidates)');
    }
    if (exportData.evaluated_candidates.length !== 25) {
      throw new Error(`Expected 25 evaluated candidates in JSON export, got ${exportData.evaluated_candidates.length}`);
    }
    if (exportData.export_metadata.active_dataset !== 'imported') {
      throw new Error(`Active dataset metadata mismatch: ${exportData.export_metadata.active_dataset}`);
    }
    console.log(`  -> JSON export successfully verified with ${exportData.evaluated_candidates.length} evaluated records.`);

    // -------------------------------------------------------------------------
    // TEST 10: Export Error Handling (Missing or Invalid Parameters)
    // -------------------------------------------------------------------------
    console.log('\n[Test 10] Verifying Export Error Handling...');
    const noTrialRes = await request('GET', '/api/match/export?format=csv');
    if (noTrialRes.status !== 400) {
      throw new Error(`Expected 400 when trial_id is missing, got ${noTrialRes.status}`);
    }
    const badTrialRes = await request('GET', '/api/match/export?trial_id=NON_EXISTENT_TRIAL&format=csv');
    if (badTrialRes.status !== 404) {
      throw new Error(`Expected 404 for nonexistent trial, got ${badTrialRes.status}`);
    }
    console.log('  -> Export error handling verified (400 on missing trial_id, 404 on nonexistent trial).');

    console.log('\n====================================================');
    console.log(' ALL 10 RECRUITMENT & EXPORT TESTS PASSED (100%)!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n[TEST RUN FAILED]:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
