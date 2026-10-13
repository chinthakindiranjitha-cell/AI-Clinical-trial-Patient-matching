const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const store = require('../store');
const { evaluateMatching } = require('../matching');
const {
  parseCsv,
  extractDocumentText,
  extractClinicalFacts
} = require('../parsers');

// Multer memory storage (files processed in RAM, no disk remnants)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.csv', '.txt', '.docx', '.pdf'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error(
        `Unsupported file type '${ext}'. Allowed formats: .csv, .txt, .docx, .pdf (Max: 10MB)`
      );
      err.status = 400;
      cb(err);
    }
  }
});

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

// Multi-Format Patient Upload & Preview Endpoint
router.post('/patients/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File size exceeds maximum allowed limit of 10MB.'
        });
      }
      return res.status(err.status || 400).json({
        error: err.message || 'File upload error.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please attach a .csv, .txt, .docx, or .pdf file.'
      });
    }

    const filename = req.file.originalname;
    const ext = path.extname(filename).toLowerCase().replace('.', '');

    try {
      if (ext === 'csv') {
        // Parse CSV
        const parsed = parseCsv(req.file.buffer);

        // Check for existing ID collisions
        const annotatedValid = parsed.valid_records.map((rec) => {
          const isDuplicate = rec.patient_id ? !!store.getPatientById(rec.patient_id) : false;
          return {
            ...rec,
            is_duplicate_id: isDuplicate
          };
        });

        const hasDuplicates = annotatedValid.some((r) => r.is_duplicate_id);

        return res.json({
          format: 'CSV',
          filename,
          size_bytes: req.file.size,
          summary: parsed.summary,
          has_duplicate_ids: hasDuplicates,
          valid_records: annotatedValid,
          rejected_records: parsed.rejected_records
        });
      } else {
        // Document Note: TXT, DOCX, PDF
        const docResult = await extractDocumentText(req.file.buffer, filename);
        const extraction = extractClinicalFacts(docResult.text);

        // Provide a suggested candidate ID
        const suggestedId = store.getNextPatientId();
        extraction.draft_patient.patient_id = suggestedId;

        return res.json({
          format: docResult.format,
          filename,
          size_bytes: req.file.size,
          pages: docResult.pages || 1,
          raw_text: extraction.raw_text,
          extracted_facts: extraction.extracted_facts,
          draft_patient: extraction.draft_patient,
          extraction_method: extraction.extraction_method,
          suggested_id: suggestedId
        });
      }
    } catch (parseErr) {
      // Check if scanned document error
      if (parseErr.message && parseErr.message.includes('Scanned document detected')) {
        return res.status(422).json({
          error: parseErr.message
        });
      }
      return res.status(400).json({
        error: `Processing error for ${filename}: ${parseErr.message}`
      });
    }
  });
});

// Confirmation & Commit Endpoint
router.post('/patients/confirm-import', (req, res) => {
  try {
    const { records, duplicate_resolution = 'assign_new_id' } = req.body || {};

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No patient records provided to import.' });
    }

    // Validate minimal schema requirements for every record
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.demographics || typeof r.demographics.age !== 'number') {
        return res.status(400).json({
          error: `Record #${i + 1} (${r.patient_id || 'unassigned'}) missing valid demographics age.`
        });
      }
    }

    const result = store.addPatientsBatch(records, duplicate_resolution);
    res.status(201).json({
      success: true,
      message: `Successfully processed ${result.imported_count + result.updated_count} patient records.`,
      ...result
    });
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
  const { trial_id } = req.query;
  const patients = store.getPatients();
  const total = patients.length;

  // Cohort distributions
  const genderDist = {};
  const raceDist = {};
  const ethnicityDist = {};
  const ageGroups = { '<30': 0, '30-49': 0, '50-64': 0, '65+': 0 };

  for (const p of patients) {
    const g = p.demographics?.gender || 'unknown';
    genderDist[g] = (genderDist[g] || 0) + 1;

    const r = p.demographics?.race || 'Undisclosed / Missing';
    raceDist[r] = (raceDist[r] || 0) + 1;

    const e = p.demographics?.ethnicity || 'Undisclosed / Missing';
    ethnicityDist[e] = (ethnicityDist[e] || 0) + 1;

    const age = p.demographics?.age;
    if (age !== undefined && age !== null) {
      if (age < 30) ageGroups['<30']++;
      else if (age < 50) ageGroups['30-49']++;
      else if (age < 65) ageGroups['50-64']++;
      else ageGroups['65+']++;
    } else {
      ageGroups['Undisclosed / Missing'] = (ageGroups['Undisclosed / Missing'] || 0) + 1;
    }
  }

  // Trial-specific comparison
  let targetTrialId = trial_id;
  const allTrials = store.getTrials();
  if (!targetTrialId && allTrials.length > 0) {
    targetTrialId = allTrials[0].trial_id;
  }

  let trialSummary = null;
  const comparison = {
    gender: [],
    race: [],
    ethnicity: [],
    age_groups: []
  };
  const representationGaps = [];

  if (targetTrialId) {
    const targetTrial = store.getTrialById(targetTrialId);
    if (targetTrial) {
      const matchEval = evaluateMatching({ trial_id: targetTrialId });
      // Filter candidates who are confirmed ELIGIBLE or POTENTIALLY_ELIGIBLE_PENDING_INFO
      const eligibleResults = matchEval.results.filter(
        (r) => r.match_status === 'ELIGIBLE' || r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO'
      );
      const strictlyEligibleResults = matchEval.results.filter((r) => r.match_status === 'ELIGIBLE');

      trialSummary = {
        trial_id: targetTrial.trial_id,
        title: targetTrial.title,
        therapeutic_area: targetTrial.therapeutic_area,
        evaluated_count: matchEval.evaluated_count,
        strictly_eligible_count: strictlyEligibleResults.length,
        potential_eligible_count: eligibleResults.length, // eligible + pending
        ineligible_count: matchEval.ineligible_count
      };

      const eligiblePatients = eligibleResults.map((r) => store.getPatientById(r.patient_id)).filter(Boolean);
      const eligibleTotal = eligiblePatients.length;

      // Helper to compute comparison table
      const computeGroupComparison = (cohortDist, extractor, categoryName) => {
        const eligibleDist = {};
        for (const p of eligiblePatients) {
          const key = extractor(p);
          eligibleDist[key] = (eligibleDist[key] || 0) + 1;
        }

        const keys = Array.from(new Set([...Object.keys(cohortDist), ...Object.keys(eligibleDist)]));
        return keys.map((key) => {
          const cCount = cohortDist[key] || 0;
          const eCount = eligibleDist[key] || 0;
          const cPct = total > 0 ? Number(((cCount / total) * 100).toFixed(1)) : 0;
          const ePct = eligibleTotal > 0 ? Number(((eCount / eligibleTotal) * 100).toFixed(1)) : 0;

          // Flag representation gap if group in cohort has 0 eligible candidates or significantly reduced representation
          if (cCount > 0 && eCount === 0) {
            representationGaps.push({
              category: categoryName,
              group: key,
              cohort_count: cCount,
              cohort_pct: cPct,
              eligible_count: 0,
              eligible_pct: 0,
              note: `Zero candidates from '${key}' met eligibility criteria for ${targetTrial.trial_id}.`
            });
          }

          return {
            name: key,
            cohort_count: cCount,
            cohort_pct: cPct,
            eligible_count: eCount,
            eligible_pct: ePct
          };
        });
      };

      comparison.gender = computeGroupComparison(
        genderDist,
        (p) => p.demographics?.gender || 'unknown',
        'Gender'
      );
      comparison.race = computeGroupComparison(
        raceDist,
        (p) => p.demographics?.race || 'Undisclosed / Missing',
        'Race'
      );
      comparison.ethnicity = computeGroupComparison(
        ethnicityDist,
        (p) => p.demographics?.ethnicity || 'Undisclosed / Missing',
        'Ethnicity'
      );
      comparison.age_groups = computeGroupComparison(
        ageGroups,
        (p) => {
          const a = p.demographics?.age;
          if (a === undefined || a === null) return 'Undisclosed / Missing';
          if (a < 30) return '<30';
          if (a < 50) return '30-49';
          if (a < 65) return '50-64';
          return '65+';
        },
        'Age Group'
      );
    }
  }

  res.json({
    total_patients: total,
    gender_distribution: genderDist,
    race_distribution: raceDist,
    ethnicity_distribution: ethnicityDist,
    age_groups: ageGroups,
    trial_summary: trialSummary,
    comparison,
    representation_gaps: representationGaps,
    disclaimer:
      'These analytics describe the available synthetic dataset and do not establish population-level epidemiological representativeness or verify that a clinical trial is demographically diverse.'
  });
});

// Reset Data to Seed (for live demonstration)
router.post('/reset-data', (req, res) => {
  const result = store.reset();
  res.json(result);
});

module.exports = router;
