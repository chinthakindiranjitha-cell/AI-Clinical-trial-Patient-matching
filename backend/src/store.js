const fs = require('fs');
const path = require('path');

const SEED_PATIENTS_PATH = path.join(__dirname, '..', '..', 'data', 'seed', 'patients.json');
const SEED_TRIALS_PATH = path.join(__dirname, '..', '..', 'data', 'seed', 'trials.json');

// In-Memory Database store with synthetic seed defaults
class DataStore {
  constructor() {
    this.patients = [];
    this.trials = [];
    this.batches = [];
    this.loadSeedData();
  }

  loadSeedData() {
    try {
      const rawPatients = JSON.parse(fs.readFileSync(SEED_PATIENTS_PATH, 'utf8'));
      this.patients = rawPatients.map((p) => ({
        ...p,
        dataset_source: p.dataset_source || 'demo',
        import_batch_id: p.import_batch_id || null,
        recruitment_contact: p.recruitment_contact || {
          contact_person: null,
          relationship: null,
          phone: null,
          email: null,
          preferred_contact_method: null,
          availability: null,
          recruitment_status: 'Not Contacted',
          notes: null
        }
      }));
      this.trials = JSON.parse(fs.readFileSync(SEED_TRIALS_PATH, 'utf8'));
      this.batches = [];
      console.log(`[DataStore] Loaded ${this.patients.length} patients and ${this.trials.length} trials from seed.`);
    } catch (err) {
      console.error('[DataStore] Failed to load seed data:', err.message);
      this.patients = [];
      this.trials = [];
      this.batches = [];
    }
  }

  // Patients Methods
  getPatients({ search = '', condition = '', gender = '', race = '', dataset = 'all', import_batch_id = '' } = {}) {
    let result = [...this.patients];

    // Dataset Isolation Filtering
    if (dataset === 'demo') {
      result = result.filter((p) => !p.dataset_source || p.dataset_source === 'demo');
    } else if (dataset === 'imported') {
      result = result.filter((p) => p.dataset_source === 'imported');
      if (import_batch_id) {
        result = result.filter((p) => p.import_batch_id === import_batch_id);
      }
    } else if (import_batch_id) {
      result = result.filter((p) => p.import_batch_id === import_batch_id);
    }

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

  getBatches() {
    return [...this.batches];
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
      dataset_source: patientData.dataset_source || 'imported',
      recruitment_contact: patientData.recruitment_contact || {
        contact_person: null,
        relationship: null,
        phone: null,
        email: null,
        preferred_contact_method: null,
        availability: null,
        recruitment_status: 'Not Contacted',
        notes: null
      },
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

  addPatientsBatch(records, duplicateResolution = 'assign_new_id', batchMeta = {}) {
    const batchId =
      batchMeta.batch_id || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

      const recordToSave = {
        ...rec,
        patient_id: targetId,
        dataset_source: 'imported',
        import_batch_id: batchId,
        recruitment_contact: rec.recruitment_contact || {
          contact_person: null,
          relationship: null,
          phone: null,
          email: null,
          preferred_contact_method: null,
          availability: null,
          recruitment_status: 'Not Contacted',
          notes: null
        }
      };

      const saved = this.addPatient(recordToSave);
      if (existing && duplicateResolution === 'update_existing') {
        updated.push(saved);
      } else {
        imported.push(saved);
      }
    }

    const batchRecord = {
      batch_id: batchId,
      batch_name: batchMeta.batch_name || `Imported Batch (${batchId.slice(-6)})`,
      filename: batchMeta.filename || 'imported_file',
      format: batchMeta.format || 'CSV',
      imported_at: new Date().toISOString(),
      record_count: imported.length + updated.length
    };
    this.batches.unshift(batchRecord);

    return {
      import_batch_id: batchId,
      batch_record: batchRecord,
      imported_count: imported.length,
      updated_count: updated.length,
      skipped_count: skipped.length,
      total_cohort_count: this.patients.length,
      imported,
      updated,
      skipped
    };
  }

  updateRecruitmentContact(patientId, contactData) {
    const patient = this.getPatientById(patientId);
    if (!patient) {
      const err = new Error(`Patient '${patientId}' not found.`);
      err.status = 404;
      throw err;
    }

    const existingContact = patient.recruitment_contact || {
      contact_person: null,
      relationship: null,
      phone: null,
      email: null,
      preferred_contact_method: null,
      availability: null,
      recruitment_status: 'Not Contacted',
      notes: null
    };

    patient.recruitment_contact = {
      ...existingContact,
      ...contactData
    };
    patient.updated_at = new Date().toISOString();

    return patient;
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
