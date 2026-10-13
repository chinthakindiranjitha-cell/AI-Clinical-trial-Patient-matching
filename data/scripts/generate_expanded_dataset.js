/**
 * Synthetic Dataset Generator for ClinMatch
 * Generates 25 expanded fictional patient records (PAT-101 to PAT-125) in:
 * 1. CSV: data/test_uploads/additional_patients.csv
 * 2. TXT: data/test_uploads/additional_notes.txt + individual files in data/test_uploads/notes/
 * 3. DOCX: data/test_uploads/additional_patients.docx (valid OpenXML via JSZip)
 * 4. PDF: data/test_uploads/additional_patients.pdf (digital text-searchable via PDFKit)
 * 5. Markdown documentation: data/test_uploads/README_EXPANDED_DATASET.md
 */

const fs = require('fs');
const path = require('path');
const JSZip = require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'jszip'));
const PDFDocument = require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'pdfkit', 'js', 'pdfkit.js'));

const OUTPUT_DIR = path.join(__dirname, '..', 'test_uploads');
const NOTES_DIR = path.join(OUTPUT_DIR, 'notes');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

const PATIENTS = [
  {
    patient_id: 'PAT-101',
    age: 58,
    gender: 'female',
    race: 'Asian',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '94102',
    conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    biomarkers: { HbA1c: 8.2, eGFR: 68, systolic_bp: 134, diastolic_bp: 82 },
    medications: ['Metformin', 'Lisinopril'],
    allergies: [],
    smoking_status: 'never',
    notes: '58-year-old female with long-standing Type 2 Diabetes Mellitus and Essential Hypertension. HbA1c is 8.2% and eGFR is 68 mL/min/1.73m2. Tolerating Metformin well. Contact: David Chen (Caregiver), Phone: +1-555-0101, Email: dchen.pat101@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'David Chen',
      relationship: 'caregiver',
      phone: '+1-555-0101',
      email: 'dchen.pat101@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekdays 10am-2pm',
      recruitment_status: 'Contacted',
      notes: 'Spouse confirmed interested in SGLT2 study.'
    }
  },
  {
    patient_id: 'PAT-102',
    age: 66,
    gender: 'male',
    race: 'Black or African American',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '30303',
    conditions: ['Non-Small Cell Lung Cancer'],
    biomarkers: { ECOG: 1, PD_L1_expression: 45, systolic_bp: 128 },
    medications: ['Pembrolizumab', 'Carboplatin'],
    allergies: ['Penicillin'],
    smoking_status: 'former',
    notes: '66-year-old male diagnosed with Non-Small Cell Lung Cancer. ECOG performance status 1. PD-L1 expression verified at 45%. No active brain metastases. Contact: Marcus Washington (Patient), Phone: +1-555-0102, Email: mwashington.pat102@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Marcus Washington',
      relationship: 'patient',
      phone: '+1-555-0102',
      email: 'mwashington.pat102@example.org',
      preferred_contact_method: 'phone',
      availability: 'Mornings',
      recruitment_status: 'Interested',
      notes: 'Patient willing to screen for immunotherapy protocol.'
    }
  },
  {
    patient_id: 'PAT-103',
    age: 71,
    gender: 'male',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '60611',
    conditions: ['Heart Failure', 'Hypertension'],
    biomarkers: { LVEF: 32, systolic_bp: 118, eGFR: 54 },
    medications: ['Sacubitril/Valsartan', 'Carvedilol'],
    allergies: [],
    smoking_status: 'never',
    notes: '71-year-old male with chronic Heart Failure and reduced ejection fraction (LVEF 32%). Blood pressure 118/76 mmHg and eGFR 54 mL/min/1.73m2. Contact: Sarah Miller (Caregiver), Phone: +1-555-0103, Email: smiller.pat103@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Sarah Miller',
      relationship: 'caregiver',
      phone: '+1-555-0103',
      email: 'smiller.pat103@example.org',
      preferred_contact_method: 'email',
      availability: 'After 5pm',
      recruitment_status: 'Not Contacted',
      notes: 'Daughter handles clinical scheduling.'
    }
  },
  {
    patient_id: 'PAT-104',
    age: 68,
    gender: 'female',
    race: 'Hispanic or Latino',
    ethnicity: 'Hispanic or Latino',
    postal_code: '33101',
    conditions: ["Alzheimer's Disease"],
    biomarkers: { MMSE: 21, systolic_bp: 122 },
    medications: ['Donepezil', 'Memantine'],
    allergies: [],
    smoking_status: 'never',
    notes: "68-year-old female presenting with mild cognitive decline due to Alzheimer's Disease. MMSE score 21. No severe psychiatric comorbidities. Contact: Carlos Rodriguez (Authorized Representative), Phone: +1-555-0104, Email: crodriguez.pat104@example.org. Preferred contact: phone.",
    contact: {
      contact_person: 'Carlos Rodriguez',
      relationship: 'authorized representative',
      phone: '+1-555-0104',
      email: 'crodriguez.pat104@example.org',
      preferred_contact_method: 'phone',
      availability: 'Anytime',
      recruitment_status: 'Follow-up Required',
      notes: 'Requires follow-up call regarding study visit transportation.'
    }
  },
  {
    patient_id: 'PAT-105',
    age: 52,
    gender: 'female',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '02115',
    conditions: ['Breast Cancer'],
    biomarkers: { HER2_status: 'Positive', LVEF: 62, systolic_bp: 115 },
    medications: ['Trastuzumab', 'Paclitaxel'],
    allergies: [],
    smoking_status: 'never',
    notes: '52-year-old female with histologically confirmed Breast Cancer. HER2 status is Positive. Normal cardiac function with LVEF 62%. Contact: Elena Bennett (Patient), Phone: +1-555-0105, Email: ebennett.pat105@example.org. Preferred contact: portal.',
    contact: {
      contact_person: 'Elena Bennett',
      relationship: 'patient',
      phone: '+1-555-0105',
      email: 'ebennett.pat105@example.org',
      preferred_contact_method: 'portal',
      availability: 'Weekday mornings',
      recruitment_status: 'Contacted',
      notes: 'Patient received trial overview via patient portal.'
    }
  },
  {
    patient_id: 'PAT-106',
    age: 45,
    gender: 'male',
    race: 'American Indian or Alaska Native',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '87501',
    conditions: ['Type 2 Diabetes Mellitus'],
    biomarkers: { HbA1c: 12.4, eGFR: 78, systolic_bp: 138 },
    medications: ['Metformin'],
    allergies: [],
    smoking_status: 'current',
    notes: '45-year-old male with poorly controlled Type 2 Diabetes Mellitus. HbA1c is elevated at 12.4% (exceeds protocol cutoff of 11.0%). eGFR is 78 mL/min/1.73m2. Contact: Thomas Redfeather (Patient), Phone: +1-555-0106, Email: tredfeather.pat106@example.org. Preferred contact: sms.',
    contact: {
      contact_person: 'Thomas Redfeather',
      relationship: 'patient',
      phone: '+1-555-0106',
      email: 'tredfeather.pat106@example.org',
      preferred_contact_method: 'sms',
      availability: 'Afternoon',
      recruitment_status: 'Not Contacted',
      notes: 'Uncontrolled HbA1c exceeds inclusion threshold.'
    }
  },
  {
    patient_id: 'PAT-107',
    age: 63,
    gender: 'female',
    race: 'Multiracial',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '98101',
    conditions: ['Non-Small Cell Lung Cancer'],
    biomarkers: { ECOG: 3, PD_L1_expression: 60, systolic_bp: 132 },
    medications: ['Carboplatin'],
    allergies: ['Sulfa'],
    smoking_status: 'former',
    notes: '63-year-old female with Non-Small Cell Lung Cancer and compromised performance status (ECOG 3). PD-L1 expression 60%. Contact: Maya Johnson (Caregiver), Phone: +1-555-0107, Email: mjohnson.pat107@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Maya Johnson',
      relationship: 'caregiver',
      phone: '+1-555-0107',
      email: 'mjohnson.pat107@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekends',
      recruitment_status: 'Declined',
      notes: 'Caregiver declined due to functional performance impairment.'
    }
  },
  {
    patient_id: 'PAT-108',
    age: 74,
    gender: 'male',
    race: 'Asian',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '94110',
    conditions: ['Heart Failure'],
    biomarkers: { LVEF: 48, systolic_bp: 130, eGFR: 50 },
    medications: ['Furosemide', 'Lisinopril'],
    allergies: [],
    smoking_status: 'never',
    notes: '74-year-old male with Heart Failure and preserved ejection fraction (LVEF 48%, which violates the HFrEF cutoff of <= 40%). Contact: Kenji Tanaka (Caregiver), Phone: +1-555-0108, Email: ktanaka.pat108@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Kenji Tanaka',
      relationship: 'caregiver',
      phone: '+1-555-0108',
      email: 'ktanaka.pat108@example.org',
      preferred_contact_method: 'phone',
      availability: 'Evenings',
      recruitment_status: 'Not Contacted',
      notes: 'Preserved ejection fraction not qualifying for HFrEF protocol.'
    }
  },
  {
    patient_id: 'PAT-109',
    age: 88,
    gender: 'female',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '10021',
    conditions: ["Alzheimer's Disease"],
    biomarkers: { MMSE: 20, systolic_bp: 126 },
    medications: ['Donepezil'],
    allergies: [],
    smoking_status: 'never',
    notes: "88-year-old female with Alzheimer's Disease. MMSE score 20. Age 88 violates protocol inclusion range (18 to 85 years). Contact: Barbara Hayes (Authorized Representative), Phone: +1-555-0109, Email: bhayes.pat109@example.org. Preferred contact: email.",
    contact: {
      contact_person: 'Barbara Hayes',
      relationship: 'authorized representative',
      phone: '+1-555-0109',
      email: 'bhayes.pat109@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekdays',
      recruitment_status: 'Not Contacted',
      notes: 'Age exceeds protocol upper limit of 85.'
    }
  },
  {
    patient_id: 'PAT-110',
    age: 49,
    gender: 'female',
    race: 'Black or African American',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '30318',
    conditions: ['Breast Cancer'],
    biomarkers: { HER2_status: 'Negative', LVEF: 60, systolic_bp: 120 },
    medications: ['Tamoxifen'],
    allergies: [],
    smoking_status: 'never',
    notes: '49-year-old female with Breast Cancer. HER2 status is Negative by IHC and FISH, which violates HER2-positive requirement. Contact: Angela Davis (Patient), Phone: +1-555-0110, Email: adavis.pat110@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Angela Davis',
      relationship: 'patient',
      phone: '+1-555-0110',
      email: 'adavis.pat110@example.org',
      preferred_contact_method: 'phone',
      availability: 'Mornings',
      recruitment_status: 'Not Contacted',
      notes: 'HER2-negative histology not qualifying for targeted anti-HER2 trial.'
    }
  },
  {
    patient_id: 'PAT-111',
    age: 62,
    gender: 'male',
    race: 'Hispanic or Latino',
    ethnicity: 'Hispanic or Latino',
    postal_code: '78201',
    conditions: ['Type 2 Diabetes Mellitus'],
    biomarkers: { HbA1c: 8.9, systolic_bp: 142 },
    medications: ['Metformin'],
    allergies: [],
    smoking_status: 'former',
    notes: '62-year-old male with Type 2 Diabetes Mellitus. HbA1c is 8.9%. Laboratory renal assessment eGFR is currently pending. Contact: Mateo Garcia (Patient), Phone: +1-555-0111, Email: mgarcia.pat111@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Mateo Garcia',
      relationship: 'patient',
      phone: '+1-555-0111',
      email: 'mgarcia.pat111@example.org',
      preferred_contact_method: 'phone',
      availability: 'Mornings',
      recruitment_status: 'Follow-up Required',
      notes: 'Awaiting recent metabolic panel with eGFR calculation.'
    }
  },
  {
    patient_id: 'PAT-112',
    age: 59,
    gender: 'female',
    race: 'Asian',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '90012',
    conditions: ['Non-Small Cell Lung Cancer'],
    biomarkers: { ECOG: 0, systolic_bp: 120 },
    medications: ['Cisplatin'],
    allergies: [],
    smoking_status: 'never',
    notes: '59-year-old female with Non-Small Cell Lung Cancer. ECOG performance status 0. PD-L1 biomarker expression is pending test result. Contact: Sun-Hi Park (Patient), Phone: +1-555-0112, Email: spark.pat112@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Sun-Hi Park',
      relationship: 'patient',
      phone: '+1-555-0112',
      email: 'spark.pat112@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekday afternoons',
      recruitment_status: 'Contacted',
      notes: 'Biopsy sent for PD-L1 immunohistochemistry assay.'
    }
  },
  {
    patient_id: 'PAT-113',
    age: 65,
    gender: 'male',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '43215',
    conditions: ['Heart Failure'],
    biomarkers: { systolic_bp: 112, eGFR: 62 },
    medications: ['Carvedilol'],
    allergies: [],
    smoking_status: 'former',
    notes: '65-year-old male with documented Heart Failure. Blood pressure 112/70 mmHg. LVEF echocardiogram report is pending. Contact: Robert Taylor (Patient), Phone: +1-555-0113, Email: rtaylor.pat113@example.org. Preferred contact: sms.',
    contact: {
      contact_person: 'Robert Taylor',
      relationship: 'patient',
      phone: '+1-555-0113',
      email: 'rtaylor.pat113@example.org',
      preferred_contact_method: 'sms',
      availability: 'Anytime',
      recruitment_status: 'Not Contacted',
      notes: 'Transthoracic echocardiogram scheduled for ejection fraction.'
    }
  },
  {
    patient_id: 'PAT-114',
    age: 72,
    gender: 'male',
    race: 'Black or African American',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '38103',
    conditions: ["Alzheimer's Disease"],
    biomarkers: { systolic_bp: 128 },
    medications: ['Memantine'],
    allergies: [],
    smoking_status: 'never',
    notes: "72-year-old male diagnosed with Alzheimer's Disease. MMSE score evaluation is pending clinic visit. Contact: Gerald Washington (Authorized Representative), Phone: +1-555-0114, Email: gwashington.pat114@example.org. Preferred contact: phone.",
    contact: {
      contact_person: 'Gerald Washington',
      relationship: 'authorized representative',
      phone: '+1-555-0114',
      email: 'gwashington.pat114@example.org',
      preferred_contact_method: 'phone',
      availability: 'Weekdays',
      recruitment_status: 'Interested',
      notes: 'Needs cognitive screening MMSE test administered.'
    }
  },
  {
    patient_id: 'PAT-115',
    age: 55,
    gender: 'female',
    race: 'Other',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '48226',
    conditions: ['Breast Cancer'],
    biomarkers: { LVEF: 58, systolic_bp: 124 },
    medications: ['Doxorubicin'],
    allergies: [],
    smoking_status: 'never',
    notes: '55-year-old female with invasive Breast Cancer. Normal baseline LVEF 58%. HER2 receptor status is pending molecular pathology. Contact: Fatima Al-Mansoor (Patient), Phone: +1-555-0115, Email: falmansoor.pat115@example.org. Preferred contact: portal.',
    contact: {
      contact_person: 'Fatima Al-Mansoor',
      relationship: 'patient',
      phone: '+1-555-0115',
      email: 'falmansoor.pat115@example.org',
      preferred_contact_method: 'portal',
      availability: 'After 4pm',
      recruitment_status: 'Not Contacted',
      notes: 'Pathology report awaiting FISH confirmatory test for HER2.'
    }
  },
  {
    patient_id: 'PAT-116',
    age: 50,
    gender: 'male',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '19104',
    conditions: ['Type 2 Diabetes Mellitus', 'Type 1 Diabetes Mellitus'],
    biomarkers: { HbA1c: 8.5, eGFR: 60, systolic_bp: 126 },
    medications: ['Insulin Glargine'],
    allergies: [],
    smoking_status: 'never',
    notes: '50-year-old male with secondary Type 1 Diabetes Mellitus (violates EXC-01 exclusion criterion). HbA1c is 8.5%. Contact: Luke Adams (Patient), Phone: +1-555-0116, Email: ladams.pat116@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Luke Adams',
      relationship: 'patient',
      phone: '+1-555-0116',
      email: 'ladams.pat116@example.org',
      preferred_contact_method: 'email',
      availability: 'Flexible',
      recruitment_status: 'Declined',
      notes: 'Excluded due to dual diabetes / latent autoimmune adult diabetes diagnosis.'
    }
  },
  {
    patient_id: 'PAT-117',
    age: 64,
    gender: 'female',
    race: 'Hispanic or Latino',
    ethnicity: 'Hispanic or Latino',
    postal_code: '75201',
    conditions: ['Type 2 Diabetes Mellitus'],
    biomarkers: { HbA1c: 8.0, eGFR: 22, systolic_bp: 136 },
    medications: ['Metformin'],
    allergies: [],
    smoking_status: 'never',
    notes: '64-year-old female with Type 2 Diabetes Mellitus and severe renal impairment (eGFR 22 mL/min/1.73m2, violates eGFR < 30 exclusion). Contact: Sofia Morales (Caregiver), Phone: +1-555-0117, Email: smorales.pat117@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Sofia Morales',
      relationship: 'caregiver',
      phone: '+1-555-0117',
      email: 'smorales.pat117@example.org',
      preferred_contact_method: 'phone',
      availability: 'Mornings',
      recruitment_status: 'Not Contacted',
      notes: 'Severe renal impairment (eGFR 22) violates safety criterion.'
    }
  },
  {
    patient_id: 'PAT-118',
    age: 70,
    gender: 'male',
    race: 'Black or African American',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '20001',
    conditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
    biomarkers: { HbA1c: 8.4, eGFR: 58, systolic_bp: 192 },
    medications: ['Metformin', 'Amlodipine'],
    allergies: [],
    smoking_status: 'former',
    notes: '70-year-old male with Type 2 Diabetes Mellitus and severe uncontrolled hypertension (systolic BP 192 mmHg, violates > 180 exclusion). Contact: Arthur King (Patient), Phone: +1-555-0118, Email: aking.pat118@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Arthur King',
      relationship: 'patient',
      phone: '+1-555-0118',
      email: 'aking.pat118@example.org',
      preferred_contact_method: 'phone',
      availability: 'Afternoons',
      recruitment_status: 'Follow-up Required',
      notes: 'Severely uncontrolled hypertension (192 mmHg) requires medical stabilization.'
    }
  },
  {
    patient_id: 'PAT-119',
    age: 53,
    gender: 'male',
    race: 'Native Hawaiian or Other Pacific Islander',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '96813',
    conditions: ['Non-Small Cell Lung Cancer', 'Brain Metastases'],
    biomarkers: { ECOG: 1, PD_L1_expression: 12, systolic_bp: 130 },
    medications: ['Carboplatin'],
    allergies: [],
    smoking_status: 'former',
    notes: '53-year-old male with Non-Small Cell Lung Cancer and active symptomatic Brain Metastases (violates exclusion). Contact: Keanu Kalani (Caregiver), Phone: +1-555-0119, Email: kkalani.pat119@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Keanu Kalani',
      relationship: 'caregiver',
      phone: '+1-555-0119',
      email: 'kkalani.pat119@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekday mornings',
      recruitment_status: 'Not Contacted',
      notes: 'Excluded due to intracranial disease progression.'
    }
  },
  {
    patient_id: 'PAT-120',
    age: 67,
    gender: 'female',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '80202',
    conditions: ['Heart Failure'],
    biomarkers: { LVEF: 35, systolic_bp: 82, eGFR: 40 },
    medications: ['Furosemide'],
    allergies: [],
    smoking_status: 'never',
    notes: '67-year-old female with Heart Failure presenting with symptomatic hypotension (systolic BP 82 mmHg, violates systolic < 90 exclusion). Contact: Nancy Evans (Patient), Phone: +1-555-0120, Email: nevans.pat120@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Nancy Evans',
      relationship: 'patient',
      phone: '+1-555-0120',
      email: 'nevans.pat120@example.org',
      preferred_contact_method: 'phone',
      availability: 'Mornings',
      recruitment_status: 'Not Contacted',
      notes: 'Hypotension violates baseline hemodynamic stability requirement.'
    }
  },
  {
    patient_id: 'PAT-121',
    age: 61,
    gender: 'male',
    race: 'Asian',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '95112',
    conditions: ['Type 2 Diabetes Mellitus'],
    biomarkers: { HbA1c: 9.1, eGFR: 65, systolic_bp: 130 },
    medications: ['Metformin', 'Empagliflozin'],
    allergies: [],
    smoking_status: 'never',
    notes: '61-year-old male with Type 2 Diabetes Mellitus. HbA1c is 9.1%, eGFR is 65 mL/min/1.73m2, and systolic BP is 130 mmHg. Fully meets inclusion criteria for NCT-D2D-001. Contact: Jin Woo (Patient), Phone: +1-555-0121, Email: jwoo.pat121@example.org. Preferred contact: email.',
    contact: {
      contact_person: 'Jin Woo',
      relationship: 'patient',
      phone: '+1-555-0121',
      email: 'jwoo.pat121@example.org',
      preferred_contact_method: 'email',
      availability: '11am-3pm',
      recruitment_status: 'Interested',
      notes: 'Patient confirmed active interest in renal protective therapy.'
    }
  },
  {
    patient_id: 'PAT-122',
    age: 56,
    gender: 'female',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '60614',
    conditions: ['Non-Small Cell Lung Cancer'],
    biomarkers: { ECOG: 0, PD_L1_expression: 80, systolic_bp: 118 },
    medications: ['Pembrolizumab'],
    allergies: [],
    smoking_status: 'never',
    notes: '56-year-old female with Non-Small Cell Lung Cancer. ECOG status 0. High PD-L1 expression at 80%. Fully meets inclusion criteria for NCT-NSCLC-002. Contact: Claire Dupont (Patient), Phone: +1-555-0122, Email: cdupont.pat122@example.org. Preferred contact: portal.',
    contact: {
      contact_person: 'Claire Dupont',
      relationship: 'patient',
      phone: '+1-555-0122',
      email: 'cdupont.pat122@example.org',
      preferred_contact_method: 'portal',
      availability: 'Anytime',
      recruitment_status: 'Contacted',
      notes: 'Strong candidate with high PD-L1 TPS expression.'
    }
  },
  {
    patient_id: 'PAT-123',
    age: 69,
    gender: 'male',
    race: 'Multiracial',
    ethnicity: 'Hispanic or Latino',
    postal_code: '33139',
    conditions: ['Heart Failure'],
    biomarkers: { LVEF: 28, systolic_bp: 110, eGFR: 48 },
    medications: ['Sacubitril/Valsartan', 'Spironolactone'],
    allergies: [],
    smoking_status: 'former',
    notes: '69-year-old male with Heart Failure. Severe LV systolic dysfunction with LVEF 28%. Systolic BP 110 mmHg and eGFR 48 mL/min/1.73m2. Fully meets criteria for NCT-HF-003. Contact: Gabriel Ortiz (Caregiver), Phone: +1-555-0123, Email: gortiz.pat123@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Gabriel Ortiz',
      relationship: 'caregiver',
      phone: '+1-555-0123',
      email: 'gortiz.pat123@example.org',
      preferred_contact_method: 'phone',
      availability: 'Evenings',
      recruitment_status: 'Contacted',
      notes: 'Son reviewed protocol schedule and confirms ability to attend clinic.'
    }
  },
  {
    patient_id: 'PAT-124',
    age: 63,
    gender: 'female',
    race: 'Black or African American',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '21201',
    conditions: ["Alzheimer's Disease"],
    biomarkers: { MMSE: 24, systolic_bp: 120 },
    medications: ['Donepezil'],
    allergies: [],
    smoking_status: 'never',
    notes: "63-year-old female with early-stage Alzheimer's Disease. MMSE score 24. No exclusionary vascular neurological signs. Fully meets criteria for NCT-AD-004. Contact: Denise Jackson (Caregiver), Phone: +1-555-0124, Email: djackson.pat124@example.org. Preferred contact: email.",
    contact: {
      contact_person: 'Denise Jackson',
      relationship: 'caregiver',
      phone: '+1-555-0124',
      email: 'djackson.pat124@example.org',
      preferred_contact_method: 'email',
      availability: 'Weekdays',
      recruitment_status: 'Interested',
      notes: 'Mild stage cognitive impairment fits window perfectly.'
    }
  },
  {
    patient_id: 'PAT-125',
    age: 47,
    gender: 'female',
    race: 'Asian',
    ethnicity: 'Not Hispanic or Latino',
    postal_code: '94107',
    conditions: ['Breast Cancer'],
    biomarkers: { HER2_status: 'Positive', LVEF: 58, systolic_bp: 118 },
    medications: ['Trastuzumab'],
    allergies: [],
    smoking_status: 'never',
    notes: '47-year-old female with invasive Breast Cancer. Confirmed HER2 Positive. LVEF 58%. Fully meets criteria for NCT-BC-005. Contact: Mei-Ling Zhao (Patient), Phone: +1-555-0125, Email: mzhao.pat125@example.org. Preferred contact: phone.',
    contact: {
      contact_person: 'Mei-Ling Zhao',
      relationship: 'patient',
      phone: '+1-555-0125',
      email: 'mzhao.pat125@example.org',
      preferred_contact_method: 'phone',
      availability: 'Weekday mornings',
      recruitment_status: 'Follow-up Required',
      notes: 'Confirmed HER2-positive status; follow up for informed consent visit.'
    }
  }
];

// Helper to escape CSV values
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 1. Generate CSV
function generateCsv() {
  const headers = [
    'patient_id',
    'age',
    'gender',
    'race',
    'ethnicity',
    'postal_code',
    'conditions',
    'biomarkers',
    'medications',
    'allergies',
    'smoking_status',
    'notes_summary',
    'contact_person',
    'relationship',
    'phone',
    'email',
    'preferred_contact_method',
    'availability',
    'recruitment_status',
    'recruitment_notes'
  ];

  const rows = [headers.join(',')];

  for (const p of PATIENTS) {
    const biomarkerPairs = Object.entries(p.biomarkers)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');

    const row = [
      p.patient_id,
      p.age,
      p.gender,
      escapeCsv(p.race),
      escapeCsv(p.ethnicity),
      p.postal_code,
      escapeCsv(p.conditions.join(';')),
      escapeCsv(biomarkerPairs),
      escapeCsv(p.medications.join(';')),
      escapeCsv(p.allergies.join(';')),
      p.smoking_status,
      escapeCsv(p.notes),
      escapeCsv(p.contact.contact_person),
      escapeCsv(p.contact.relationship),
      escapeCsv(p.contact.phone),
      escapeCsv(p.contact.email),
      escapeCsv(p.contact.preferred_contact_method),
      escapeCsv(p.contact.availability),
      escapeCsv(p.contact.recruitment_status),
      escapeCsv(p.contact.notes)
    ];

    rows.push(row.join(','));
  }

  const csvPath = path.join(OUTPUT_DIR, 'additional_patients.csv');
  fs.writeFileSync(csvPath, rows.join('\r\n'), 'utf8');
  console.log(`[CSV] Generated ${PATIENTS.length} records -> ${csvPath}`);
}

// 2. Generate TXT Notes (Individual & Aggregated)
function generateTxtNotes() {
  const aggregatedNotes = [];

  for (const p of PATIENTS) {
    const lines = [
      `================================================================================`,
      `CLINICAL PROGRESS NOTE: ${p.patient_id}`,
      `================================================================================`,
      `PATIENT ID: ${p.patient_id}`,
      `DEMOGRAPHICS: ${p.age}-year-old ${p.gender}, Race: ${p.race}, Ethnicity: ${p.ethnicity}`,
      `DIAGNOSES: ${p.conditions.join(', ')}`,
      `BIOMARKERS & LABS: ${Object.entries(p.biomarkers).map(([k, v]) => `${k} = ${v}`).join(', ')}`,
      `MEDICATIONS: ${p.medications.join(', ')}`,
      `ALLERGIES: ${p.allergies.length > 0 ? p.allergies.join(', ') : 'No known drug allergies (NKDA)'}`,
      `SMOKING HISTORY: ${p.smoking_status}`,
      `NARRATIVE: ${p.notes}`,
      `RECRUITMENT CONTACT:`,
      `  - Contact Person: ${p.contact.contact_person} (${p.contact.relationship})`,
      `  - Phone: ${p.contact.phone}`,
      `  - Email: ${p.contact.email}`,
      `  - Preferred Method: ${p.contact.preferred_contact_method}`,
      `  - Availability: ${p.contact.availability}`,
      `  - Outreach Status: ${p.contact.recruitment_status}`,
      `  - Clinical Notes: ${p.contact.notes}`,
      `\n`
    ];

    const noteContent = lines.join('\n');
    aggregatedNotes.push(noteContent);

    // Write individual text file
    fs.writeFileSync(path.join(NOTES_DIR, `${p.patient_id}.txt`), noteContent, 'utf8');
  }

  const aggPath = path.join(OUTPUT_DIR, 'additional_notes.txt');
  fs.writeFileSync(aggPath, aggregatedNotes.join('\n'), 'utf8');
  console.log(`[TXT] Generated ${PATIENTS.length} individual notes & aggregated -> ${aggPath}`);
}

// 3. Generate DOCX (OpenXML archive via JSZip)
async function generateDocx() {
  const zip = new JSZip();

  // Standard OpenXML manifest
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  let docXmlBody = '';
  for (const p of PATIENTS) {
    const escapeXml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    docXmlBody += `
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>CLINICAL RECORD: ${escapeXml(p.patient_id)}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Demographics: ${p.age}-year-old ${p.gender}, ${escapeXml(p.race)}, ${escapeXml(p.ethnicity)}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Diagnoses: ${escapeXml(p.conditions.join(', '))}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Biomarkers: ${escapeXml(Object.entries(p.biomarkers).map(([k, v]) => `${k}: ${v}`).join(', '))}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Medications: ${escapeXml(p.medications.join(', '))}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Narrative: ${escapeXml(p.notes)}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Recruitment Contact: ${escapeXml(p.contact.contact_person)} (${escapeXml(p.contact.relationship)}), Phone: ${escapeXml(p.contact.phone)}, Email: ${escapeXml(p.contact.email)}, Status: ${escapeXml(p.contact.recruitment_status)}</w:t></w:r>
      </w:p>
      <w:p><w:r><w:t>--------------------------------------------------</w:t></w:r></w:p>
    `;
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docXmlBody}
  </w:body>
</w:document>`;

  zip.folder('word').file('document.xml', documentXml);

  const docxBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const docxPath = path.join(OUTPUT_DIR, 'additional_patients.docx');
  fs.writeFileSync(docxPath, docxBuffer);
  console.log(`[DOCX] Generated ${PATIENTS.length} records -> ${docxPath}`);
}

// 4. Generate Digital Searchable PDF (via PDFKit)
function generatePdf() {
  return new Promise((resolve, reject) => {
    const pdfPath = path.join(OUTPUT_DIR, 'additional_patients.pdf');
    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).fillColor('#0369a1').text('ClinMatch Fictional Clinical Patient Cohort', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('Synthetic Demonstration Dataset for Protocol Eligibility Matching', { align: 'center' });
    doc.moveDown(1.5);

    for (let i = 0; i < PATIENTS.length; i++) {
      const p = PATIENTS[i];
      if (i > 0 && i % 3 === 0) {
        doc.addPage();
      }

      doc.fontSize(13).fillColor('#0f172a').text(`Patient Record: ${p.patient_id}`, { underline: true });
      doc.fontSize(9).fillColor('#334155');
      doc.text(`Demographics: ${p.age} years old · ${p.gender} · ${p.race} · ${p.ethnicity}`);
      doc.text(`Documented Conditions: ${p.conditions.join(', ')}`);
      doc.text(`Key Biomarkers: ${Object.entries(p.biomarkers).map(([k, v]) => `${k} = ${v}`).join(' | ')}`);
      doc.text(`Active Medications: ${p.medications.join(', ')}`);
      doc.text(`Clinical Summary: ${p.notes}`);
      doc.fillColor('#0284c7').text(
        `Recruitment Contact: ${p.contact.contact_person} (${p.contact.relationship}) | Phone: ${p.contact.phone} | Email: ${p.contact.email} | Status: ${p.contact.recruitment_status}`
      );
      doc.moveDown(1);
    }

    doc.end();
    stream.on('finish', () => {
      console.log(`[PDF] Generated digital searchable PDF with ${PATIENTS.length} records -> ${pdfPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

// 5. Generate Markdown Data Dictionary
function generateReadme() {
  const content = `# ClinMatch Expanded Patient Cohort (Synthetic Dataset)

This directory contains **25 additional fictional patient records** (\`PAT-101\` through \`PAT-125\`) prepared for the AI Clinical Trial Patient Matching System.

## File Manifest

| Filename | Format | Description | Record Count |
| :--- | :--- | :--- | :--- |
| \`additional_patients.csv\` | CSV | Bulk import spreadsheet containing demographics, conditions, biomarkers, medications, allergies, and recruitment contact fields | 25 patients |
| \`additional_notes.txt\` | TXT | Aggregated clinical progress notes covering all 25 patients with verbatim evidence spans and contact details | 25 patient notes |
| \`notes/PAT-*.txt\` | TXT | 25 individual clinical progress note files for targeted single-patient note ingestion | 1 note per file (25 total) |
| \`additional_patients.docx\` | DOCX | Microsoft Word OpenXML document containing formatted clinical consultation summaries | 25 patient summaries |
| \`additional_patients.pdf\` | PDF | Digitally generated text-searchable PDF containing comprehensive patient EHR profiles | 25 patient summaries |

---

## Clinical Trial Scenario Coverage

The 25 patients represent varied clinical scenarios across the 5 system trial protocols:

1. **Endocrinology (\`NCT-D2D-001\`)**:
   - Clearly Eligible: \`PAT-101\`, \`PAT-121\` (Confirmed T2D, HbA1c in [7.5, 11.0]%, eGFR >= 45, Systolic <= 180)
   - Ineligible: \`PAT-106\` (HbA1c 12.4% > 11.0%), \`PAT-116\` (Type 1 Diabetes), \`PAT-117\` (eGFR 22 < 30), \`PAT-118\` (Systolic 192 > 180)
   - Insufficient Info: \`PAT-111\` (Missing eGFR lab measurement)

2. **Oncology (\`NCT-NSCLC-002\`)**:
   - Clearly Eligible: \`PAT-102\`, \`PAT-122\` (Confirmed NSCLC, ECOG <= 1, PD-L1 expression >= 1%)
   - Ineligible: \`PAT-107\` (ECOG 3 > 1), \`PAT-119\` (Active Brain Metastases)
   - Insufficient Info: \`PAT-112\` (Missing PD-L1 TPS result)

3. **Cardiology (\`NCT-HF-003\`)**:
   - Clearly Eligible: \`PAT-103\`, \`PAT-123\` (Confirmed Heart Failure, LVEF <= 40%, Systolic >= 90, eGFR >= 20)
   - Ineligible: \`PAT-108\` (LVEF 48% > 40%), \`PAT-120\` (Systolic 82 < 90)
   - Insufficient Info: \`PAT-113\` (Missing LVEF measurement)

4. **Neurology (\`NCT-AD-004\`)**:
   - Clearly Eligible: \`PAT-104\`, \`PAT-124\` (Age 50-85, Alzheimer's, MMSE in [18, 26])
   - Ineligible: \`PAT-109\` (Age 88 > 85)
   - Insufficient Info: \`PAT-114\` (Missing MMSE cognitive score)

5. **Oncology (\`NCT-BC-005\`)**:
   - Clearly Eligible: \`PAT-105\`, \`PAT-125\` (Breast Cancer, HER2 Positive, LVEF >= 50%)
   - Ineligible: \`PAT-110\` (HER2 Negative)
   - Insufficient Info: \`PAT-115\` (Missing HER2 receptor status)

---

## Recruitment Contact Fields

Each patient record contains fictional recruitment outreach fields:
- \`contact_person\`: Name of fictional patient or caregiver
- \`relationship\`: \`patient\`, \`caregiver\`, or \`authorized representative\`
- \`phone\`: Fictional 555 telephone number
- \`email\`: Fictional \`@example.org\` address
- \`preferred_contact_method\`: \`email\`, \`phone\`, \`sms\`, or \`portal\`
- \`availability\`: Preferred time for trial coordinator outreach
- \`recruitment_status\`: \`Not Contacted\`, \`Contacted\`, \`Interested\`, \`Declined\`, or \`Follow-up Required\`
- \`notes\`: Clinical trial coordinator recruitment note

> **Notice:** All data in this directory is fictional and generated for hackathon demonstration. Clinical eligibility matching is distinct from patient consent or protocol enrollment.
`;

  const readmePath = path.join(OUTPUT_DIR, 'README_EXPANDED_DATASET.md');
  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`[README] Generated data dictionary -> ${readmePath}`);
}

async function run() {
  console.log('Generating expanded synthetic dataset for ClinMatch...');
  generateCsv();
  generateTxtNotes();
  await generateDocx();
  await generatePdf();
  generateReadme();
  console.log('All synthetic patient dataset files generated successfully!');
}

run().catch((err) => {
  console.error('Error generating dataset:', err);
  process.exit(1);
});
