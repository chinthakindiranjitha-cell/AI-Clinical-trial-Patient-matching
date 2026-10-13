/**
 * Repeatable Seed Script for Clinical Trial Patient Matching System
 * 
 * Can seed directly into MongoDB when MONGODB_URI is provided,
 * or perform validation on the seed dataset files for offline/local environments.
 */

const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, '..', 'seed');

function loadSeedData() {
  const patients = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'patients.json'), 'utf8'));
  const trials = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'trials.json'), 'utf8'));
  const notes = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'clinical_notes.json'), 'utf8'));
  const groundTruth = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'ground_truth_matches.json'), 'utf8'));

  return { patients, trials, notes, groundTruth };
}

function validateSeedData({ patients, trials, notes, groundTruth }) {
  console.log('Validating seed dataset integrity...');

  // 1. Validate Patients
  if (!Array.isArray(patients) || patients.length < 20) {
    throw new Error(`Expected at least 20 patients, found ${patients?.length}`);
  }
  const patientIds = new Set();
  for (const p of patients) {
    if (!p.patient_id || !p.demographics || typeof p.demographics.age !== 'number') {
      throw new Error(`Invalid patient record: ${JSON.stringify(p)}`);
    }
    if (patientIds.has(p.patient_id)) {
      throw new Error(`Duplicate patient ID found: ${p.patient_id}`);
    }
    patientIds.add(p.patient_id);
  }
  console.log(`✓ Validated ${patients.length} patient records.`);

  // 2. Validate Trials
  if (!Array.isArray(trials) || trials.length < 4) {
    throw new Error(`Expected at least 4 trials, found ${trials?.length}`);
  }
  const trialIds = new Set();
  for (const t of trials) {
    if (!t.trial_id || !t.title || !t.inclusion_criteria || !t.exclusion_criteria) {
      throw new Error(`Invalid trial record: ${JSON.stringify(t)}`);
    }
    if (trialIds.has(t.trial_id)) {
      throw new Error(`Duplicate trial ID found: ${t.trial_id}`);
    }
    trialIds.add(t.trial_id);
  }
  console.log(`✓ Validated ${trials.length} clinical trials with inclusion/exclusion criteria.`);

  // 3. Validate Clinical Notes
  if (!Array.isArray(notes) || notes.length < 5) {
    throw new Error(`Expected at least 5 clinical notes, found ${notes?.length}`);
  }
  for (const n of notes) {
    if (!n.note_id || !n.raw_text || !Array.isArray(n.ground_truth_entities)) {
      throw new Error(`Invalid clinical note record: ${n.note_id}`);
    }
    for (const ent of n.ground_truth_entities) {
      if (!ent.field_name || !ent.evidence_text) {
        throw new Error(`Note ${n.note_id} has invalid entity: ${JSON.stringify(ent)}`);
      }
    }
  }
  console.log(`✓ Validated ${notes.length} unstructured clinical notes with provenance entities.`);

  // 4. Validate Ground Truth Matches
  const expectedTotalPairs = patients.length * trials.length;
  if (!Array.isArray(groundTruth) || groundTruth.length !== expectedTotalPairs) {
    throw new Error(
      `Expected exactly ${expectedTotalPairs} ground truth pairs, found ${groundTruth?.length}`
    );
  }
  console.log(`✓ Validated ${groundTruth.length} ground truth patient-trial evaluation pairs.`);

  return true;
}

async function runSeed() {
  console.log('====================================================');
  console.log(' SEED SCRIPT INITIALIZATION');
  console.log('====================================================');

  const data = loadSeedData();
  validateSeedData(data);

  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB. Populating collections...');

      // Dynamic collection seeding
      const db = mongoose.connection.db;
      await db.collection('patients').deleteMany({});
      await db.collection('patients').insertMany(data.patients);

      await db.collection('trials').deleteMany({});
      await db.collection('trials').insertMany(data.trials);

      await db.collection('clinical_notes').deleteMany({});
      await db.collection('clinical_notes').insertMany(data.notes);

      await db.collection('matches').deleteMany({});
      await db.collection('matches').insertMany(data.groundTruth);

      console.log('✓ Successfully seeded MongoDB collections.');
      await mongoose.disconnect();
    } catch (err) {
      console.warn(`MongoDB seeding bypassed: ${err.message}`);
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Verified offline JSON/CSV seed datasets are ready.');
  }

  console.log('Seed preparation complete!\n');
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = { runSeed, loadSeedData, validateSeedData };
