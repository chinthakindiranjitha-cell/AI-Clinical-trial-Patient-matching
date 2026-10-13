const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/server');

const TEST_PORT = 5098;
const FIXTURES_DIR = path.join(__dirname, '..', 'data', 'test_uploads');

function uploadFile(filePath, fieldName = 'file') {
  return new Promise((resolve, reject) => {
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const postDataHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    const postDataFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const totalLength = postDataHeader.length + fileData.length + postDataFooter.length;

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/patients/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': totalLength
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
    req.write(postDataHeader);
    req.write(fileData);
    req.write(postDataFooter);
    req.end();
  });
}

function postJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: urlPath,
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

async function runUploadTests() {
  console.log('====================================================');
  console.log(' RUNNING MULTI-FORMAT UPLOAD & EXTRACTION TEST SUITE');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Valid CSV Upload
    console.log('[Test 1] Valid CSV Upload...');
    const validCsvRes = await uploadFile(path.join(FIXTURES_DIR, 'valid_patients.csv'));
    console.log(`  -> Status: ${validCsvRes.status}, Valid Rows: ${validCsvRes.data.summary?.valid_count}, Duplicate Found: ${validCsvRes.data.has_duplicate_ids}`);
    if (validCsvRes.status !== 200 || validCsvRes.data.summary?.valid_count !== 3) {
      throw new Error(`Valid CSV failed: ${JSON.stringify(validCsvRes.data)}`);
    }

    // 2. Invalid CSV Header (missing age/gender)
    console.log('[Test 2] Invalid CSV Header Validation...');
    const invalidHeaderRes = await uploadFile(path.join(FIXTURES_DIR, 'invalid_header.csv'));
    console.log(`  -> Status: ${invalidHeaderRes.status}, Error: ${invalidHeaderRes.data.error}`);
    if (invalidHeaderRes.status !== 400 || !invalidHeaderRes.data.error.includes('required')) {
      throw new Error(`Invalid header check failed: ${JSON.stringify(invalidHeaderRes.data)}`);
    }

    // 3. Malformed CSV Rows
    console.log('[Test 3] Malformed CSV Rows Validation...');
    const malformedRowsRes = await uploadFile(path.join(FIXTURES_DIR, 'malformed_rows.csv'));
    console.log(`  -> Status: ${malformedRowsRes.status}, Valid: ${malformedRowsRes.data.summary?.valid_count}, Rejected: ${malformedRowsRes.data.summary?.rejected_count}`);
    if (malformedRowsRes.status !== 200 || malformedRowsRes.data.summary?.rejected_count !== 2) {
      throw new Error(`Malformed rows check failed: ${JSON.stringify(malformedRowsRes.data)}`);
    }

    // 4. Clinical Note TXT Upload & Entity Extraction
    console.log('[Test 4] Clinical Note TXT Upload & Entity Extraction...');
    const txtRes = await uploadFile(path.join(FIXTURES_DIR, 'clinical_note.txt'));
    console.log(`  -> Status: ${txtRes.status}, Extracted Facts: ${txtRes.data.extracted_facts?.length}, Suggested ID: ${txtRes.data.suggested_id}`);
    console.log(`  -> Extracted: Age ${txtRes.data.draft_patient?.demographics.age}, HbA1c ${txtRes.data.draft_patient?.biomarkers.HbA1c}, Conditions: ${txtRes.data.draft_patient?.conditions.join(', ')}`);
    if (txtRes.status !== 200 || txtRes.data.draft_patient?.biomarkers.HbA1c !== 8.8 || txtRes.data.draft_patient?.demographics.age !== 61) {
      throw new Error(`TXT extraction failed: ${JSON.stringify(txtRes.data)}`);
    }

    // 5. Clinical Note DOCX Upload
    console.log('[Test 5] Clinical Note DOCX Upload...');
    const docxRes = await uploadFile(path.join(FIXTURES_DIR, 'clinical_note.docx'));
    console.log(`  -> Status: ${docxRes.status}, Format: ${docxRes.data.format}, Facts: ${docxRes.data.extracted_facts?.length}`);
    if (docxRes.status !== 200 || docxRes.data.format !== 'DOCX') {
      throw new Error(`DOCX extraction failed: ${JSON.stringify(docxRes.data)}`);
    }

    // 6. Text-based Digital PDF Upload
    console.log('[Test 6] Text-based Digital PDF Upload...');
    const pdfRes = await uploadFile(path.join(FIXTURES_DIR, 'digital_note.pdf'));
    console.log(`  -> Status: ${pdfRes.status}, Format: ${pdfRes.data.format}, Extracted Age: ${pdfRes.data.draft_patient?.demographics.age}`);
    if (pdfRes.status !== 200 || pdfRes.data.draft_patient?.demographics.age !== 61) {
      throw new Error(`Digital PDF extraction failed: ${JSON.stringify(pdfRes.data)}`);
    }

    // 7. Scanned PDF Detection (No selectable text)
    console.log('[Test 7] Scanned PDF Detection (Non-digital OCR rejection)...');
    const scannedRes = await uploadFile(path.join(FIXTURES_DIR, 'scanned_note.pdf'));
    console.log(`  -> Status: ${scannedRes.status}, Message: ${scannedRes.data.error}`);
    if (scannedRes.status !== 422 || !scannedRes.data.error.includes('Scanned document detected')) {
      throw new Error(`Scanned PDF detection failed: ${JSON.stringify(scannedRes.data)}`);
    }

    // 8. Unsupported File Type (.exe)
    console.log('[Test 8] Unsupported File Type Rejection...');
    const exeRes = await uploadFile(path.join(FIXTURES_DIR, 'malicious_app.exe'));
    console.log(`  -> Status: ${exeRes.status}, Error: ${exeRes.data.error}`);
    if (exeRes.status !== 400 || !exeRes.data.error.includes('Unsupported file type')) {
      throw new Error(`Unsupported file rejection failed: ${JSON.stringify(exeRes.data)}`);
    }

    // 9. Confirm & Save New Patient with Deterministic Matching Check
    console.log('[Test 9] Confirm Import of New Patient & Evaluate Match...');
    const newPatientDraft = txtRes.data.draft_patient;
    newPatientDraft.patient_id = 'PAT-TEST-100'; // Specific new patient
    const confirmRes = await postJson('/api/patients/confirm-import', {
      records: [newPatientDraft],
      duplicate_resolution: 'assign_new_id'
    });
    console.log(`  -> Status: ${confirmRes.status}, Imported Count: ${confirmRes.data.imported_count}, Total Cohort: ${confirmRes.data.total_cohort_count}`);
    if (confirmRes.status !== 201 || confirmRes.data.imported_count !== 1) {
      throw new Error(`Confirm import failed: ${JSON.stringify(confirmRes.data)}`);
    }

    // Evaluate matching for this newly added patient against NCT-D2D-001 (Diabetes trial)
    // 61y, T2D, HbA1c 8.8, eGFR 52 -> Satisfies all criteria -> Should be ELIGIBLE!
    const matchRes = await postJson('/api/match/evaluate', {
      patient_id: 'PAT-TEST-100',
      trial_id: 'NCT-D2D-001'
    });
    const matchResult = matchRes.data.results[0];
    console.log(`  -> Evaluated PAT-TEST-100 vs NCT-D2D-001: ${matchResult.match_status}, Score: ${matchResult.match_score}`);
    if (matchResult.match_status !== 'ELIGIBLE' || matchResult.match_score !== 100) {
      throw new Error(`Match of newly imported patient failed: ${JSON.stringify(matchResult)}`);
    }

    // 10. Duplicate ID Resolution (update_existing vs assign_new_id)
    console.log('[Test 10] Duplicate ID Resolution Handling...');
    const duplicateDraft = { ...newPatientDraft, notes_summary: 'Updated notes narrative' };
    const updateRes = await postJson('/api/patients/confirm-import', {
      records: [duplicateDraft],
      duplicate_resolution: 'update_existing'
    });
    console.log(`  -> Status: ${updateRes.status}, Updated Count: ${updateRes.data.updated_count}`);
    if (updateRes.status !== 201 || updateRes.data.updated_count !== 1) {
      throw new Error(`Update existing duplicate failed: ${JSON.stringify(updateRes.data)}`);
    }

    console.log('\n====================================================');
    console.log(' ALL 10 MULTI-FORMAT UPLOAD TESTS PASSED (100%)!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runUploadTests().catch((err) => {
  console.error('Upload test suite failed:', err);
  process.exit(1);
});
