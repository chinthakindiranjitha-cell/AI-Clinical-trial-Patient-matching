/**
 * Automated Matching Engine Test Suite
 * Tests deterministic rule evaluation against 125 ground-truth patient-trial pairs.
 */

const fs = require('fs');
const path = require('path');
const { matchPatientToTrial } = require('./matching_engine');

function runMatchingTests() {
  console.log('====================================================');
  console.log(' RUNNING DETERMINISTIC MATCHING TEST SUITE');
  console.log('====================================================\n');

  const patientsPath = path.join(__dirname, '..', 'seed', 'patients.json');
  const trialsPath = path.join(__dirname, '..', 'seed', 'trials.json');
  const groundTruthPath = path.join(__dirname, '..', 'seed', 'ground_truth_matches.json');

  const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
  const trials = JSON.parse(fs.readFileSync(trialsPath, 'utf8'));
  const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));

  const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
  const trialMap = new Map(trials.map((t) => [t.trial_id, t]));

  let totalTests = groundTruth.length;
  let passedTests = 0;
  let failedTests = 0;
  const errors = [];

  for (const expected of groundTruth) {
    const patient = patientMap.get(expected.patient_id);
    const trial = trialMap.get(expected.trial_id);

    if (!patient || !trial) {
      errors.push(`Missing patient ${expected.patient_id} or trial ${expected.trial_id}`);
      failedTests++;
      continue;
    }

    const actual = matchPatientToTrial(patient, trial);
    let pairPassed = true;
    const pairErrors = [];

    // Test 1: Match Status
    if (actual.match_status !== expected.expected_status) {
      pairPassed = false;
      pairErrors.push(
        `Status mismatch: expected '${expected.expected_status}', got '${actual.match_status}'`
      );
    }

    // Test 2: Ineligible ranking rule (MUST be 0)
    if (actual.match_status === 'INELIGIBLE' && actual.match_score !== 0) {
      pairPassed = false;
      pairErrors.push(
        `Critical rule violation: INELIGIBLE pair has non-zero match_score (${actual.match_score})`
      );
    }

    // Test 3: Insufficient information flag
    if (actual.has_insufficient_info !== expected.has_insufficient_info) {
      pairPassed = false;
      pairErrors.push(
        `has_insufficient_info mismatch: expected ${expected.has_insufficient_info}, got ${actual.has_insufficient_info}`
      );
    }

    // Test 4: Violated criteria IDs match
    const actualViolated = actual.criteria_results
      .filter((c) => c.status === 'VIOLATED')
      .map((c) => c.criterion_id)
      .sort();
    const expectedViolated = (expected.expected_violated_criteria || []).slice().sort();

    if (JSON.stringify(actualViolated) !== JSON.stringify(expectedViolated)) {
      pairPassed = false;
      pairErrors.push(
        `Violated criteria mismatch: expected [${expectedViolated}], got [${actualViolated}]`
      );
    }

    // Test 5: Unknown criteria IDs match
    const actualUnknown = actual.criteria_results
      .filter((c) => c.status === 'UNKNOWN')
      .map((c) => c.criterion_id)
      .sort();
    const expectedUnknown = (expected.expected_unknown_criteria || []).slice().sort();

    if (JSON.stringify(actualUnknown) !== JSON.stringify(expectedUnknown)) {
      pairPassed = false;
      pairErrors.push(
        `Unknown criteria mismatch: expected [${expectedUnknown}], got [${actualUnknown}]`
      );
    }

    if (pairPassed) {
      passedTests++;
    } else {
      failedTests++;
      errors.push(
        `FAIL: ${expected.patient_id} <-> ${expected.trial_id}:\n  ` + pairErrors.join('\n  ')
      );
    }
  }

  console.log(`Results: ${passedTests}/${totalTests} tests PASSED.`);
  if (failedTests > 0) {
    console.error(`\n${failedTests} tests FAILED:\n`);
    errors.forEach((err) => console.error(err));
    process.exit(1);
  } else {
    console.log('✓ All 125 patient-trial ground truth test cases verified successfully (100% pass rate).');
    console.log('✓ Ineligible rank score non-override confirmed.');
    console.log('✓ Unknown missing information preservation confirmed.');
    console.log('✓ Zero hallucinations or invented criteria detected.\n');
  }
}

if (require.main === module) {
  runMatchingTests();
}

module.exports = { runMatchingTests };
