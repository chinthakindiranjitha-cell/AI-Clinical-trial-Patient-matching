const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

/**
 * Multi-Format Clinical Data Parser
 * Supports CSV, TXT, DOCX, and PDF with deterministic clinical fact extraction.
 */

// 1. CSV Parser & Validator
function parseCsv(buffer) {
  const content = buffer.toString('utf8').trim();
  if (!content) {
    throw new Error('CSV file is empty.');
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one patient record.');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());

  const ageIdx = headers.indexOf('age');
  const genderIdx = headers.indexOf('gender');

  if (ageIdx === -1 || genderIdx === -1) {
    throw new Error(
      `CSV header must contain required 'age' and 'gender' columns. Found: [${headers.join(', ')}]`
    );
  }

  const idIdx = headers.indexOf('patient_id') !== -1 ? headers.indexOf('patient_id') : headers.indexOf('id');
  const raceIdx = headers.indexOf('race');
  const ethnicityIdx = headers.indexOf('ethnicity');
  const postalIdx = headers.indexOf('postal_code') !== -1 ? headers.indexOf('postal_code') : headers.indexOf('zip');
  const conditionsIdx = headers.indexOf('conditions');
  const biomarkersIdx = headers.indexOf('biomarkers');
  const medicationsIdx = headers.indexOf('medications');
  const allergiesIdx = headers.indexOf('allergies');
  const smokingIdx = headers.indexOf('smoking_status');
  const notesIdx = headers.indexOf('notes_summary') !== -1 ? headers.indexOf('notes_summary') : headers.indexOf('notes');

  // Recruitment Contact columns
  const contactPersonIdx = headers.indexOf('contact_person') !== -1 ? headers.indexOf('contact_person') : headers.indexOf('contact_name');
  const relationshipIdx = headers.indexOf('relationship');
  const phoneIdx = headers.indexOf('phone') !== -1 ? headers.indexOf('phone') : headers.indexOf('contact_phone');
  const emailIdx = headers.indexOf('email') !== -1 ? headers.indexOf('email') : headers.indexOf('contact_email');
  const prefMethodIdx = headers.indexOf('preferred_contact_method') !== -1 ? headers.indexOf('preferred_contact_method') : headers.indexOf('contact_method');
  const availabilityIdx = headers.indexOf('availability') !== -1 ? headers.indexOf('availability') : headers.indexOf('contact_availability');
  const recruitStatusIdx = headers.indexOf('recruitment_status');
  const recruitNotesIdx = headers.indexOf('recruitment_notes') !== -1 ? headers.indexOf('recruitment_notes') : headers.indexOf('contact_notes');

  const validRecords = [];
  const rejectedRecords = [];
  const seenIds = new Set();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cols = parseCsvLine(lines[i]);

    if (cols.length === 0 || cols.every((c) => !c.trim())) {
      continue;
    }

    const rowErrors = [];

    // Patient ID
    let patientId = idIdx !== -1 && cols[idIdx] ? cols[idIdx].trim() : null;
    if (patientId) {
      if (seenIds.has(patientId)) {
        rowErrors.push(`Duplicate patient_id '${patientId}' within uploaded CSV.`);
      } else {
        seenIds.add(patientId);
      }
    }

    // Age validation
    const rawAge = cols[ageIdx] !== undefined ? cols[ageIdx].trim() : '';
    const age = parseInt(rawAge, 10);
    if (!rawAge || isNaN(age) || age < 0 || age > 120) {
      rowErrors.push(`Invalid age value '${rawAge}'. Must be an integer between 0 and 120.`);
    }

    // Gender validation
    const rawGender = cols[genderIdx] !== undefined ? cols[genderIdx].trim().toLowerCase() : '';
    const validGenders = ['male', 'female', 'other', 'unknown'];
    let gender = 'unknown';
    if (!rawGender || !validGenders.includes(rawGender)) {
      rowErrors.push(`Invalid gender '${rawGender}'. Must be one of: male, female, other, unknown.`);
    } else {
      gender = rawGender;
    }

    if (rowErrors.length > 0) {
      rejectedRecords.push({
        row_number: rowNum,
        raw_row: lines[i],
        errors: rowErrors
      });
      continue;
    }

    // Parse list & object fields
    const race = raceIdx !== -1 && cols[raceIdx] ? cols[raceIdx].trim() : null;
    const ethnicity = ethnicityIdx !== -1 && cols[ethnicityIdx] ? cols[ethnicityIdx].trim() : null;
    const postalCode = postalIdx !== -1 && cols[postalIdx] ? cols[postalIdx].trim() : null;

    const conditions = conditionsIdx !== -1 && cols[conditionsIdx]
      ? cols[conditionsIdx].split(/[;,|]/).map((c) => c.trim()).filter(Boolean)
      : [];

    const biomarkers = {};
    if (biomarkersIdx !== -1 && cols[biomarkersIdx]) {
      const bioPairs = cols[biomarkersIdx].split(/[;,]/);
      for (const pair of bioPairs) {
        const [k, v] = pair.split(':');
        if (k && v !== undefined) {
          const numVal = parseFloat(v.trim());
          biomarkers[k.trim()] = isNaN(numVal) ? v.trim() : numVal;
        }
      }
    }

    const medications = medicationsIdx !== -1 && cols[medicationsIdx]
      ? cols[medicationsIdx].split(/[;,|]/).map((m) => m.trim()).filter(Boolean)
      : [];

    const allergies = allergiesIdx !== -1 && cols[allergiesIdx]
      ? cols[allergiesIdx].split(/[;,|]/).map((a) => a.trim()).filter(Boolean)
      : [];

    const smokingStatus = smokingIdx !== -1 && cols[smokingIdx] ? cols[smokingIdx].trim().toLowerCase() : null;
    const notesSummary = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx].trim() : null;

    // Recruitment contact
    const contactPerson = contactPersonIdx !== -1 && cols[contactPersonIdx] ? cols[contactPersonIdx].trim() : null;
    const relationship = relationshipIdx !== -1 && cols[relationshipIdx] ? cols[relationshipIdx].trim() : null;
    const phone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx].trim() : null;
    const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].trim() : null;
    const prefMethod = prefMethodIdx !== -1 && cols[prefMethodIdx] ? cols[prefMethodIdx].trim().toLowerCase() : null;
    const availability = availabilityIdx !== -1 && cols[availabilityIdx] ? cols[availabilityIdx].trim() : null;
    const rawStatus = recruitStatusIdx !== -1 && cols[recruitStatusIdx] ? cols[recruitStatusIdx].trim() : 'Not Contacted';
    const validStatuses = ['Not Contacted', 'Contacted', 'Interested', 'Declined', 'Follow-up Required'];
    const recruitmentStatus = validStatuses.includes(rawStatus) ? rawStatus : 'Not Contacted';
    const recruitNotes = recruitNotesIdx !== -1 && cols[recruitNotesIdx] ? cols[recruitNotesIdx].trim() : null;

    const recruitmentContact = {
      contact_person: contactPerson,
      relationship: relationship,
      phone: phone,
      email: email,
      preferred_contact_method: prefMethod,
      availability: availability,
      recruitment_status: recruitmentStatus,
      notes: recruitNotes
    };

    validRecords.push({
      patient_id: patientId, // may be null, store will assign if not set
      demographics: {
        age,
        gender,
        race,
        ethnicity,
        postal_code: postalCode
      },
      conditions,
      biomarkers,
      medications,
      allergies,
      smoking_status: smokingStatus,
      notes_summary: notesSummary,
      recruitment_contact: recruitmentContact
    });
  }

  return {
    format: 'CSV',
    summary: {
      total_rows: lines.length - 1,
      valid_count: validRecords.length,
      rejected_count: rejectedRecords.length
    },
    valid_records: validRecords,
    rejected_records: rejectedRecords
  };
}

// Helper to parse standard CSV line with quotes
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// 2. Document Text Extractors (.txt, .docx, .pdf)
async function extractDocumentText(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase();

  switch (ext) {
    case 'txt': {
      const text = buffer.toString('utf8').trim();
      if (!text) throw new Error('Text document is empty.');
      return { format: 'TXT', text };
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ? result.value.trim() : '';
      if (!text) throw new Error('Word document contains no extractable text.');
      return { format: 'DOCX', text };
    }
    case 'pdf': {
      try {
        let text = '';
        let numPages = 1;

        if (typeof pdfParse === 'function') {
          const data = await pdfParse(buffer);
          text = data.text ? data.text.trim() : '';
          numPages = data.numpages || 1;
        } else if (pdfParse && pdfParse.PDFParse) {
          const parser = new pdfParse.PDFParse({ data: buffer });
          const result = await parser.getText();
          text = result && result.text ? result.text.trim() : '';
          numPages = result && result.total ? result.total : 1;
        }

        const alphaCount = (text.match(/[a-zA-Z0-9]/g) || []).length;

        if (!text || alphaCount < 15) {
          throw new Error(
            'Scanned document detected: No selectable digital text found. OCR is not supported. Please upload a digitally generated PDF, Word DOCX, TXT note, or CSV.'
          );
        }
        return { format: 'PDF', text, pages: numPages };
      } catch (err) {
        if (err.message.includes('Scanned document detected')) throw err;
        throw new Error(`Failed to read PDF document: ${err.message}`);
      }
    }
    default:
      throw new Error(`Unsupported document extension '.${ext}'.`);
  }
}

// 3. Clinical Fact Extractor (Deterministic Heuristics with Provenance)
function extractClinicalFacts(text) {
  const extractedFacts = [];
  const biomarkers = {};
  const conditions = [];
  const medications = [];
  const allergies = [];
  let age = null;
  let gender = 'unknown';
  let smokingStatus = null;

  // Age & Gender
  const ageMatch = text.match(/\b(\d{1,3})[- ](?:year[- ]old|yo|yr old)\b/i);
  if (ageMatch) {
    age = parseInt(ageMatch[1], 10);
    extractedFacts.push({
      category: 'demographics',
      field_name: 'age',
      value: age,
      unit: 'years',
      evidence_text: ageMatch[0],
      confidence: 0.95
    });
  }

  const genderMatch = text.match(/\b(male|female|man|woman|non-binary)\b/i);
  if (genderMatch) {
    const raw = genderMatch[1].toLowerCase();
    gender = raw === 'man' ? 'male' : raw === 'woman' ? 'female' : raw;
    extractedFacts.push({
      category: 'demographics',
      field_name: 'gender',
      value: gender,
      unit: null,
      evidence_text: genderMatch[0],
      confidence: 0.95
    });
  }

  // Conditions
  const conditionDict = [
    'Type 2 Diabetes Mellitus',
    'Type 1 Diabetes Mellitus',
    'Diabetic Nephropathy',
    'Non-Small Cell Lung Cancer',
    'Stage IIIb Adenocarcinoma',
    'Stage IV Metastatic Breast Cancer',
    'Invasive Breast Cancer',
    'Heart Failure',
    'Coronary Artery Disease',
    'Atrial Fibrillation',
    'Mild Cognitive Impairment',
    'Alzheimer\'s Dementia',
    'Alzheimer\'s Disease',
    'Essential Hypertension',
    'Hypertension',
    'Hyperlipidemia',
    'COPD',
    'Osteoporosis',
    'Rheumatoid Arthritis',
    'Systemic Lupus Erythematosus',
    'Allergic Rhinitis'
  ];

  for (const cond of conditionDict) {
    const regex = new RegExp(`\\b${cond.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const m = text.match(regex);
    if (m && !conditions.includes(cond)) {
      conditions.push(cond);
      extractedFacts.push({
        category: 'condition',
        field_name: 'conditions',
        value: cond,
        unit: null,
        evidence_text: m[0],
        confidence: 0.9
      });
    }
  }

  // Biomarkers
  // HbA1c
  const hba1cMatch = text.match(/(?:HbA1c|Hemoglobin A1c|A1C)[^\d]*(\d{1,2}(?:\.\d{1,2})?)\s*%?/i);
  if (hba1cMatch) {
    const val = parseFloat(hba1cMatch[1]);
    biomarkers.HbA1c = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'HbA1c',
      value: val,
      unit: '%',
      evidence_text: hba1cMatch[0],
      confidence: 0.95
    });
  }

  // eGFR
  const egfrMatch = text.match(/(?:eGFR|estimated GFR)[^\d]*(\d{1,3}(?:\.\d{1,2})?)/i);
  if (egfrMatch) {
    const val = parseFloat(egfrMatch[1]);
    biomarkers.eGFR = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'eGFR',
      value: val,
      unit: 'mL/min/1.73m2',
      evidence_text: egfrMatch[0],
      confidence: 0.95
    });
  }

  // LVEF
  const lvefMatch = text.match(/(?:LVEF|ejection fraction)[^\d]*(\d{1,2}(?:\.\d{1,2})?)\s*%?/i);
  if (lvefMatch) {
    const val = parseFloat(lvefMatch[1]);
    biomarkers.LVEF = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'LVEF',
      value: val,
      unit: '%',
      evidence_text: lvefMatch[0],
      confidence: 0.95
    });
  }

  // ECOG
  const ecogMatch = text.match(/ECOG(?: performance status)?[^\d]*([0-4])\b/i);
  if (ecogMatch) {
    const val = parseInt(ecogMatch[1], 10);
    biomarkers.ECOG = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'ECOG',
      value: val,
      unit: null,
      evidence_text: ecogMatch[0],
      confidence: 0.95
    });
  }

  // PD-L1 expression
  const pdl1Match = text.match(/PD-L1(?: expression)?[^\d]*(\d{1,3}(?:\.\d{1,2})?)\s*%?/i);
  if (pdl1Match) {
    const val = parseFloat(pdl1Match[1]);
    biomarkers.PD_L1_expression = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'PD_L1_expression',
      value: val,
      unit: '%',
      evidence_text: pdl1Match[0],
      confidence: 0.95
    });
  }

  // HER2
  const her2Match = text.match(/HER2(?: status)?[^\w]*(positive|negative)/i);
  if (her2Match) {
    const val = her2Match[1].toLowerCase();
    biomarkers.HER2_status = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'HER2_status',
      value: val,
      unit: null,
      evidence_text: her2Match[0],
      confidence: 0.95
    });
  }

  // ER & PR
  const erMatch = text.match(/\bER[^\w]*(positive|negative)/i);
  if (erMatch) {
    biomarkers.ER_status = erMatch[1].toLowerCase();
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'ER_status',
      value: biomarkers.ER_status,
      unit: null,
      evidence_text: erMatch[0],
      confidence: 0.9
    });
  }

  const prMatch = text.match(/\bPR[^\w]*(positive|negative)/i);
  if (prMatch) {
    biomarkers.PR_status = prMatch[1].toLowerCase();
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'PR_status',
      value: biomarkers.PR_status,
      unit: null,
      evidence_text: prMatch[0],
      confidence: 0.9
    });
  }

  // MMSE
  const mmseMatch = text.match(/MMSE(?: score)?[^\d]*(\d{1,2})/i);
  if (mmseMatch) {
    const val = parseInt(mmseMatch[1], 10);
    biomarkers.MMSE = val;
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'MMSE',
      value: val,
      unit: 'points',
      evidence_text: mmseMatch[0],
      confidence: 0.95
    });
  }

  // Blood Pressure
  const bpMatch = text.match(/\b(\d{2,3})\/(\d{2,3})\s*(?:mmHg)?\b/i);
  if (bpMatch) {
    biomarkers.systolic_bp = parseInt(bpMatch[1], 10);
    biomarkers.diastolic_bp = parseInt(bpMatch[2], 10);
    extractedFacts.push({
      category: 'biomarker',
      field_name: 'systolic_bp',
      value: biomarkers.systolic_bp,
      unit: 'mmHg',
      evidence_text: bpMatch[0],
      confidence: 0.9
    });
  }

  // Medications
  const medDict = [
    'Metformin', 'Lisinopril', 'Amlodipine', 'Insulin Glargine', 'Insulin Lispro',
    'Losartan', 'Carboplatin', 'Pemetrexed', 'Carvedilol', 'Furosemide', 'Aspirin',
    'Atorvastatin', 'Donepezil', 'Memantine', 'Prednisone', 'Warfarin', 'Capecitabine'
  ];

  for (const med of medDict) {
    const regex = new RegExp(`\\b${med}\\b`, 'i');
    const m = text.match(regex);
    if (m && !medications.includes(med)) {
      medications.push(med);
      extractedFacts.push({
        category: 'medication',
        field_name: 'medications',
        value: med,
        unit: null,
        evidence_text: m[0],
        confidence: 0.9
      });
    }
  }

  // Allergies
  const allergyMatch = text.match(/(?:ALLERGIES|Allergic to)[^\w\n]*([A-Za-z0-9 ,()]+)/i);
  if (allergyMatch) {
    const raw = allergyMatch[1].trim();
    if (/no known|NKDA|none/i.test(raw)) {
      // No allergies
    } else {
      const items = raw.split(/[;,]/).map((s) => s.trim().replace(/\([^)]*\)/, '').trim()).filter(Boolean);
      allergies.push(...items);
      extractedFacts.push({
        category: 'allergy',
        field_name: 'allergies',
        value: items,
        unit: null,
        evidence_text: allergyMatch[0],
        confidence: 0.85
      });
    }
  }

  // Smoking status
  if (/former smoker|quit smoking/i.test(text)) {
    smokingStatus = 'former';
  } else if (/current smoker|smokes/i.test(text)) {
    smokingStatus = 'current';
  } else if (/never smoked|non-smoker/i.test(text)) {
    smokingStatus = 'never';
  }

  // Recruitment Contact details (if mentioned in clinical note)
  let contactPerson = null;
  let contactRelationship = null;
  let contactPhone = null;
  let contactEmail = null;

  const contactMatch = text.match(/(?:Contact|Emergency Contact|Caregiver|Representative):\s*([A-Za-z ]+?)(?:\s*\(([^)]+)\))?(?=[,\n]|$)/i);
  if (contactMatch) {
    contactPerson = contactMatch[1].trim();
    if (contactMatch[2]) contactRelationship = contactMatch[2].trim().toLowerCase();
  }

  const phoneMatch = text.match(/(?:Phone|Tel|Mobile):\s*([+\d- ()]+)/i);
  if (phoneMatch) {
    contactPhone = phoneMatch[1].trim();
  }

  const emailMatch = text.match(/(?:Email):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    contactEmail = emailMatch[1].trim();
  }

  // Create candidate patient draft
  const draftPatient = {
    patient_id: null,
    demographics: {
      age: age || 0,
      gender: gender,
      race: null,
      ethnicity: null,
      postal_code: null
    },
    conditions,
    biomarkers,
    medications,
    allergies,
    smoking_status: smokingStatus,
    notes_summary: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
    recruitment_contact: {
      contact_person: contactPerson,
      relationship: contactRelationship || (contactPerson ? 'patient' : null),
      phone: contactPhone,
      email: contactEmail,
      preferred_contact_method: contactEmail ? 'email' : (contactPhone ? 'phone' : null),
      availability: null,
      recruitment_status: 'Not Contacted',
      notes: null
    }
  };

  return {
    raw_text: text,
    extracted_facts: extractedFacts,
    draft_patient: draftPatient,
    extraction_method: 'Deterministic Clinical Fact Extractor (Zero-hallucination baseline)'
  };
}

module.exports = {
  parseCsv,
  parseCsvLine,
  extractDocumentText,
  extractClinicalFacts
};
