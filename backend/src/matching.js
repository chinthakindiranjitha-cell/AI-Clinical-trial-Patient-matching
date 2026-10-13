const path = require('path');
const { matchPatientToTrial } = require('../../data/scripts/matching_engine');
const store = require('./store');

/**
 * Matching Service
 * Executes deterministic evaluation and candidate ranking with non-override rule.
 */
function evaluateMatching({ patient_id, trial_id, dataset = 'all', import_batch_id = null }) {
  const allPatients = store.getPatients({ dataset, import_batch_id });
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
          postal_code: p.demographics.postal_code,
          conditions: p.conditions,
          biomarkers: p.biomarkers || {},
          medications: p.medications || [],
          allergies: p.allergies || [],
          smoking_status: p.smoking_status || null,
          notes_summary: p.notes_summary || null,
          dataset_source: p.dataset_source || 'demo',
          import_batch_id: p.import_batch_id || null,
          organization: p.organization || null,
          recruitment_contact: p.recruitment_contact || null
        },
        trial_summary: {
          trial_id: t.trial_id,
          title: t.title,
          phase: t.phase,
          therapeutic_area: t.therapeutic_area,
          description: t.description || null
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
    active_dataset: dataset,
    active_batch_id: import_batch_id,
    evaluated_count: results.length,
    eligible_count: results.filter((r) => r.match_status === 'ELIGIBLE').length,
    pending_count: results.filter((r) => r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO').length,
    ineligible_count: results.filter((r) => r.match_status === 'INELIGIBLE').length,
    results
  };
}

module.exports = { evaluateMatching };
