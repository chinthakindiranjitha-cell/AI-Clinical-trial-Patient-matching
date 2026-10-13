const path = require('path');
const { matchPatientToTrial } = require('../../data/scripts/matching_engine');
const store = require('./store');

/**
 * Matching Service
 * Executes deterministic evaluation and candidate ranking with non-override rule.
 */
function evaluateMatching({ patient_id, trial_id }) {
  const allPatients = store.getPatients();
  const allTrials = store.getTrials();

  let targetPatients = allPatients;
  let targetTrials = allTrials;

  if (patient_id) {
    const patient = store.getPatientById(patient_id);
    if (!patient) {
      const err = new Error(`Patient with ID '${patient_id}' not found.`);
      err.status = 404;
      throw err;
    }
    targetPatients = [patient];
  }

  if (trial_id) {
    const trial = store.getTrialById(trial_id);
    if (!trial) {
      const err = new Error(`Trial with ID '${trial_id}' not found.`);
      err.status = 404;
      throw err;
    }
    targetTrials = [trial];
  }

  const results = [];

  for (const p of targetPatients) {
    for (const t of targetTrials) {
      const matchResult = matchPatientToTrial(p, t);
      results.push({
        ...matchResult,
        patient_summary: {
          patient_id: p.patient_id,
          age: p.demographics.age,
          gender: p.demographics.gender,
          race: p.demographics.race,
          ethnicity: p.demographics.ethnicity,
          conditions: p.conditions
        },
        trial_summary: {
          trial_id: t.trial_id,
          title: t.title,
          phase: t.phase,
          therapeutic_area: t.therapeutic_area
        }
      });
    }
  }

  // Candidate Ranking:
  // 1. ELIGIBLE (score 100)
  // 2. POTENTIALLY_ELIGIBLE_PENDING_INFO (score > 0, partial)
  // 3. INELIGIBLE (score strictly 0, cannot override failure)
  const statusPrecedence = {
    ELIGIBLE: 1,
    POTENTIALLY_ELIGIBLE_PENDING_INFO: 2,
    INELIGIBLE: 3
  };

  results.sort((a, b) => {
    const precDiff = statusPrecedence[a.match_status] - statusPrecedence[b.match_status];
    if (precDiff !== 0) return precDiff;
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    return a.patient_id.localeCompare(b.patient_id);
  });

  return {
    evaluated_count: results.length,
    eligible_count: results.filter((r) => r.match_status === 'ELIGIBLE').length,
    pending_count: results.filter((r) => r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO').length,
    ineligible_count: results.filter((r) => r.match_status === 'INELIGIBLE').length,
    results
  };
}

module.exports = { evaluateMatching };
