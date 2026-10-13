const fs = require('fs');
const path = require('path');
const JSZip = require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'jszip'));

const UPLOADS_DIR = path.join(__dirname, '..', 'test_uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 1. Valid CSV
const validCsvContent = `patient_id,age,gender,race,ethnicity,conditions,biomarkers,medications,allergies,notes_summary
PAT-101,61,male,Asian,Not Hispanic or Latino,Type 2 Diabetes Mellitus;Essential Hypertension,"HbA1c:8.8;eGFR:52;systolic_bp:130",Metformin;Lisinopril,Sulfa,61-year-old male with poorly controlled diabetes.
PAT-102,52,female,White,Not Hispanic or Latino,Invasive Breast Cancer,"HER2_status:negative;ER_status:negative;PR_status:negative",,Penicillin,52yo female with triple-negative breast cancer.
PAT-001,58,male,Black or African American,Not Hispanic or Latino,Type 2 Diabetes Mellitus,"HbA1c:8.4;eGFR:58",Metformin,Penicillin,Duplicate ID test row.
`;
fs.writeFileSync(path.join(UPLOADS_DIR, 'valid_patients.csv'), validCsvContent);

// 2. Invalid CSV (Header missing gender, malformed row with invalid age)
const invalidCsvContent = `patient_id,age,race,conditions
PAT-901,invalid_age,White,Type 2 Diabetes Mellitus
PAT-902,45,Asian,Heart Failure
`;
fs.writeFileSync(path.join(UPLOADS_DIR, 'invalid_header.csv'), invalidCsvContent);

const malformedRowsCsv = `patient_id,age,gender,race,conditions
PAT-801,65,male,White,Heart Failure
PAT-802,not_a_number,female,Asian,Non-Small Cell Lung Cancer
PAT-803,145,invalid_sex,White,Diabetes
`;
fs.writeFileSync(path.join(UPLOADS_DIR, 'malformed_rows.csv'), malformedRowsCsv);

// 3. Clinical Note TXT
const txtContent = `CLINICAL PROGRESS NOTE:
PATIENT EVALUATION: 61-year-old male presenting for endocrinology follow-up.
DIAGNOSES: Type 2 Diabetes Mellitus, Essential Hypertension.
VITALS: BP 134/82 mmHg.
LABORATORY RESULTS: HbA1c is 8.8%. Estimated GFR (eGFR) is 52 mL/min/1.73m2.
CURRENT MEDICATIONS: Metformin 1000mg BID, Lisinopril 10mg daily.
ALLERGIES: Allergic to Sulfa drugs.
SOCIAL HISTORY: Former smoker (stopped 4 years ago).
ASSESSMENT: Suboptimal glycemic control. Candidate for SGLT2 inhibitor trial.`;
fs.writeFileSync(path.join(UPLOADS_DIR, 'clinical_note.txt'), txtContent);

// 4. Clinical Note DOCX (built using JSZip for 100% standard OOXML format)
async function generateDocx() {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>CLINICAL CONSULTATION SUMMARY</w:t></w:r></w:p>
    <w:p><w:r><w:t>61-year-old male presenting with Type 2 Diabetes Mellitus and Essential Hypertension.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Biomarkers: HbA1c 8.8%, eGFR 52 mL/min/1.73m2, BP 134/82 mmHg.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Medications: Metformin, Lisinopril. Allergies: Sulfa. Former smoker.</w:t></w:r></w:p>
  </w:body>
</w:document>`);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(UPLOADS_DIR, 'clinical_note.docx'), buffer);
}

// 5. Valid Digital PDF (Minimal standard PDF-1.4 with text)
const digitalPdfBuffer = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 380 >>
stream
BT
/F1 12 Tf
72 712 Td
(CLINICAL CONSULTATION NOTE) Tj
0 -20 Td
(61-year-old male with Type 2 Diabetes Mellitus and Essential Hypertension.) Tj
0 -20 Td
(Baseline labs: HbA1c 8.8 percent and eGFR 52 mL/min/1.73m2. Seated BP 134/82 mmHg.) Tj
0 -20 Td
(Active medications: Metformin and Lisinopril. ALLERGIES: Sulfa.) Tj
0 -20 Td
(Patient is a former smoker. Recommended for clinical study screening.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000668 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
744
%%EOF`
);
fs.writeFileSync(path.join(UPLOADS_DIR, 'digital_note.pdf'), digitalPdfBuffer);

// 6. Scanned PDF (Minimal PDF without any text objects or stream)
const scannedPdfBuffer = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
185
%%EOF`
);
fs.writeFileSync(path.join(UPLOADS_DIR, 'scanned_note.pdf'), scannedPdfBuffer);

// 7. Unsupported File Type (.exe)
fs.writeFileSync(path.join(UPLOADS_DIR, 'malicious_app.exe'), Buffer.from('MZ_FAKE_BINARY_PAYLOAD'));

generateDocx().then(() => {
  console.log(`Generated all test upload fixtures in: ${UPLOADS_DIR}`);
});
