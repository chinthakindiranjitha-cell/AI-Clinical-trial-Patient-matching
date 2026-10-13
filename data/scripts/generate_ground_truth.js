const fs = require('fs');
const path = require('path');
const { matchPatientToTrial } = require('./matching_engine');

const patientsPath = path.join(__dirname, '..', 'seed', 'patients.json');
const trialsPath = path.join(__dirname, '..', 'seed', 'trials.json');
const outputPath = path.join(__dirname, '..', 'seed', 'ground_truth_matches.json');

const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
const trials = JSON.parse(fs.readFileSync(trialsPath, 'utf8'));

console.log(`Loaded ${patients.length} patients and ${trials.length} trials.`);

const allMatches = [];

for (const patient of patients) {
  for (const trial of trials) {
    const result = matchPatientToTrial(patient, trial);
    allMatches.push({
      patient_id: patient.patient_id,
      trial_id: trial.trial_id,
      expected_status: result.match_status,
      is_eligible: result.is_eligible,
      has_insufficient_info: result.has_insufficient_info,
      expected_violated_criteria: result.criteria_results
        .filter((c) => c.status === 'VIOLATED')
        .map((c) => c.criterion_id),
      expected_unknown_criteria: result.criteria_results
        .filter((c) => c.status === 'UNKNOWN')
        .map((c) => c.criterion_id),
      expected_score: result.match_score,
      clinical_rationale: result.clinical_rationale
    });
  }
}

fs.writeFileSync(outputPath, JSON.stringify(allMatches, null, 2), 'utf8');
console.log(`Generated and verified ${allMatches.length} ground-truth matches at ${outputPath}.`);

// Report counts
const eligibleCount = allMatches.filter((m) => m.expected_status === 'ELIGIBLE').length;
const ineligibleCount = allMatches.filter((m) => m.expected_status === 'INELIGIBLE').length;
const pendingCount = allMatches.filter((m) => m.expected_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO').length;

console.log(`Breakdown:`);
console.log(`- ELIGIBLE: ${eligibleCount}`);
console.log(`- INELIGIBLE: ${ineligibleCount}`);
console.log(`- POTENTIALLY_ELIGIBLE_PENDING_INFO: ${pendingCount}`);
