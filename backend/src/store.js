const fs = require('fs');
const path = require('path');

const SEED_PATIENTS_PATH = path.join(__dirname, '..', '..', 'data', 'seed', 'patients.json');
const SEED_TRIALS_PATH = path.join(__dirname, '..', '..', 'data', 'seed', 'trials.json');

// In-Memory Database store with synthetic seed defaults
class DataStore {
  constructor() {
    this.patients = [];
    this.trials = [];
    this.loadSeedData();
  }

  loadSeedData() {
    try {
      this.patients = JSON.parse(fs.readFileSync(SEED_PATIENTS_PATH, 'utf8'));
      this.trials = JSON.parse(fs.readFileSync(SEED_TRIALS_PATH, 'utf8'));
      console.log(`[DataStore] Loaded ${this.patients.length} patients and ${this.trials.length} trials from seed.`);
    } catch (err) {
      console.error('[DataStore] Failed to load seed data:', err.message);
      this.patients = [];
      this.trials = [];
    }
  }

  // Patients Methods
  getPatients({ search = '', condition = '', gender = '', race = '' } = {}) {
    let result = [...this.patients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.patient_id.toLowerCase().includes(q) ||
          (p.notes_summary && p.notes_summary.toLowerCase().includes(q)) ||
          p.conditions.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (condition) {
      const cLower = condition.toLowerCase();
      result = result.filter((p) => p.conditions.some((c) => c.toLowerCase().includes(cLower)));
    }

    if (gender) {
      result = result.filter((p) => p.demographics?.gender?.toLowerCase() === gender.toLowerCase());
    }

    if (race) {
      result = result.filter((p) => p.demographics?.race?.toLowerCase() === race.toLowerCase());
    }

    return result;
  }

  getPatientById(id) {
    return this.patients.find((p) => p.patient_id.toLowerCase() === id.toLowerCase()) || null;
  }

  getNextPatientId() {
    let maxNum = 0;
    for (const p of this.patients) {
      const match = p.patient_id && p.patient_id.match(/PAT-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `PAT-${String(nextNum).padStart(3, '0')}`;
  }

  addPatient(patientData) {
    if (!patientData.patient_id) {
      patientData.patient_id = this.getNextPatientId();
    }

    const existingIdx = this.patients.findIndex((p) => p.patient_id === patientData.patient_id);
    const enriched = {
      ...patientData,
      created_at: patientData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      this.patients[existingIdx] = enriched;
    } else {
      this.patients.push(enriched);
    }

    return enriched;
  }

  addPatientsBatch(records, duplicateResolution = 'assign_new_id') {
    const imported = [];
    const updated = [];
    const skipped = [];

    for (const rec of records) {
      let targetId = rec.patient_id;
      const existing = this.getPatientById(targetId);

      if (existing) {
        if (duplicateResolution === 'skip_duplicate') {
          skipped.push(rec);
          continue;
        } else if (duplicateResolution === 'assign_new_id') {
          targetId = this.getNextPatientId();
          rec.patient_id = targetId;
        }
        // if 'update_existing', we keep targetId
      }

      const saved = this.addPatient({ ...rec, patient_id: targetId });
      if (existing && duplicateResolution === 'update_existing') {
        updated.push(saved);
      } else {
        imported.push(saved);
      }
    }

    return {
      imported_count: imported.length,
      updated_count: updated.length,
      skipped_count: skipped.length,
      total_cohort_count: this.patients.length,
      imported,
      updated,
      skipped
    };
  }

  // Trials Methods
  getTrials({ therapeutic_area = '', status = '', search = '' } = {}) {
    let result = [...this.trials];

    if (therapeutic_area) {
      result = result.filter(
        (t) => t.therapeutic_area.toLowerCase() === therapeutic_area.toLowerCase()
      );
    }

    if (status) {
      result = result.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.trial_id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getTrialById(id) {
    return this.trials.find((t) => t.trial_id.toLowerCase() === id.toLowerCase()) || null;
  }

  addTrial(trialData) {
    const existingIdx = this.trials.findIndex((t) => t.trial_id === trialData.trial_id);
    const enriched = {
      ...trialData,
      created_at: trialData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      this.trials[existingIdx] = enriched;
    } else {
      this.trials.push(enriched);
    }

    return enriched;
  }

  reset() {
    this.loadSeedData();
    return {
      message: 'Store reset to initial synthetic seed data.',
      patients_count: this.patients.length,
      trials_count: this.trials.length
    };
  }
}

const store = new DataStore();
module.exports = store;
