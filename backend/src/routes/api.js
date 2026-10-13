const express = require('express');
const router = express.Router();
const store = require('../store');
const { evaluateMatching } = require('../matching');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Clinical Trial Patient Matching API',
    timestamp: new Date().toISOString(),
    patients_count: store.getPatients().length,
    trials_count: store.getTrials().length
  });
});

// Patients API
router.get('/patients', (req, res) => {
  const { search, condition, gender, race } = req.query;
  const patients = store.getPatients({ search, condition, gender, race });
  res.json({
    total: patients.length,
    patients
  });
});

router.get('/patients/:id', (req, res) => {
  const patient = store.getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: `Patient '${req.params.id}' not found.` });
  }
  res.json({ patient });
});

router.post('/patients', (req, res) => {
  try {
    const data = req.body;
    if (!data.demographics || typeof data.demographics.age !== 'number') {
      return res.status(400).json({ error: 'Valid demographics (with age) are required.' });
    }
    const created = store.addPatient(data);
    res.status(201).json({ patient: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clinical Trials API
router.get('/trials', (req, res) => {
  const { therapeutic_area, status, search } = req.query;
  const trials = store.getTrials({ therapeutic_area, status, search });
  res.json({
    total: trials.length,
    trials
  });
});

router.get('/trials/:id', (req, res) => {
  const trial = store.getTrialById(req.params.id);
  if (!trial) {
    return res.status(404).json({ error: `Trial '${req.params.id}' not found.` });
  }
  res.json({ trial });
});

router.post('/trials', (req, res) => {
  try {
    const data = req.body;
    if (!data.trial_id || !data.title || !data.inclusion_criteria) {
      return res.status(400).json({ error: 'trial_id, title, and inclusion_criteria are required.' });
    }
    const created = store.addTrial(data);
    res.status(201).json({ trial: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deterministic Eligibility Matching API
router.post('/match/evaluate', (req, res) => {
  try {
    const { patient_id, trial_id } = req.body || {};
    const evaluation = evaluateMatching({ patient_id, trial_id });
    res.json(evaluation);
  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message });
  }
});

// Diversity Analytics API
router.get('/analytics/diversity', (req, res) => {
  const patients = store.getPatients();
  const total = patients.length;

  const genderDist = {};
  const raceDist = {};
  const ethnicityDist = {};
  const ageGroups = { '<30': 0, '30-49': 0, '50-64': 0, '65+': 0 };

  for (const p of patients) {
    const g = p.demographics?.gender || 'unknown';
    genderDist[g] = (genderDist[g] || 0) + 1;

    const r = p.demographics?.race || 'Unspecified / Missing';
    raceDist[r] = (raceDist[r] || 0) + 1;

    const e = p.demographics?.ethnicity || 'Unspecified / Missing';
    ethnicityDist[e] = (ethnicityDist[e] || 0) + 1;

    const age = p.demographics?.age;
    if (age !== undefined && age !== null) {
      if (age < 30) ageGroups['<30']++;
      else if (age < 50) ageGroups['30-49']++;
      else if (age < 65) ageGroups['50-64']++;
      else ageGroups['65+']++;
    }
  }

  res.json({
    total_patients: total,
    gender_distribution: genderDist,
    race_distribution: raceDist,
    ethnicity_distribution: ethnicityDist,
    age_groups: ageGroups
  });
});

// Reset Data to Seed (for live demonstration)
router.post('/reset-data', (req, res) => {
  const result = store.reset();
  res.json(result);
});

module.exports = router;
