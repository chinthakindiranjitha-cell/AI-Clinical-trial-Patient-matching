# ClinMatch Expanded Patient Cohort (Synthetic Dataset)

This directory contains **25 additional fictional patient records** (`PAT-101` through `PAT-125`) prepared for the AI Clinical Trial Patient Matching System.

## File Manifest

| Filename | Format | Description | Record Count |
| :--- | :--- | :--- | :--- |
| `additional_patients.csv` | CSV | Bulk import spreadsheet containing demographics, conditions, biomarkers, medications, allergies, and recruitment contact fields | 25 patients |
| `additional_notes.txt` | TXT | Aggregated clinical progress notes covering all 25 patients with verbatim evidence spans and contact details | 25 patient notes |
| `notes/PAT-*.txt` | TXT | 25 individual clinical progress note files for targeted single-patient note ingestion | 1 note per file (25 total) |
| `additional_patients.docx` | DOCX | Microsoft Word OpenXML document containing formatted clinical consultation summaries | 25 patient summaries |
| `additional_patients.pdf` | PDF | Digitally generated text-searchable PDF containing comprehensive patient EHR profiles | 25 patient summaries |

---

## Clinical Trial Scenario Coverage

The 25 patients represent varied clinical scenarios across the 5 system trial protocols:

1. **Endocrinology (`NCT-D2D-001`)**:
   - Clearly Eligible: `PAT-101`, `PAT-121` (Confirmed T2D, HbA1c in [7.5, 11.0]%, eGFR >= 45, Systolic <= 180)
   - Ineligible: `PAT-106` (HbA1c 12.4% > 11.0%), `PAT-116` (Type 1 Diabetes), `PAT-117` (eGFR 22 < 30), `PAT-118` (Systolic 192 > 180)
   - Insufficient Info: `PAT-111` (Missing eGFR lab measurement)

2. **Oncology (`NCT-NSCLC-002`)**:
   - Clearly Eligible: `PAT-102`, `PAT-122` (Confirmed NSCLC, ECOG <= 1, PD-L1 expression >= 1%)
   - Ineligible: `PAT-107` (ECOG 3 > 1), `PAT-119` (Active Brain Metastases)
   - Insufficient Info: `PAT-112` (Missing PD-L1 TPS result)

3. **Cardiology (`NCT-HF-003`)**:
   - Clearly Eligible: `PAT-103`, `PAT-123` (Confirmed Heart Failure, LVEF <= 40%, Systolic >= 90, eGFR >= 20)
   - Ineligible: `PAT-108` (LVEF 48% > 40%), `PAT-120` (Systolic 82 < 90)
   - Insufficient Info: `PAT-113` (Missing LVEF measurement)

4. **Neurology (`NCT-AD-004`)**:
   - Clearly Eligible: `PAT-104`, `PAT-124` (Age 50-85, Alzheimer's, MMSE in [18, 26])
   - Ineligible: `PAT-109` (Age 88 > 85)
   - Insufficient Info: `PAT-114` (Missing MMSE cognitive score)

5. **Oncology (`NCT-BC-005`)**:
   - Clearly Eligible: `PAT-105`, `PAT-125` (Breast Cancer, HER2 Positive, LVEF >= 50%)
   - Ineligible: `PAT-110` (HER2 Negative)
   - Insufficient Info: `PAT-115` (Missing HER2 receptor status)

---

## Recruitment Contact Fields

Each patient record contains fictional recruitment outreach fields:
- `contact_person`: Name of fictional patient or caregiver
- `relationship`: `patient`, `caregiver`, or `authorized representative`
- `phone`: Fictional 555 telephone number
- `email`: Fictional `@example.org` address
- `preferred_contact_method`: `email`, `phone`, `sms`, or `portal`
- `availability`: Preferred time for trial coordinator outreach
- `recruitment_status`: `Not Contacted`, `Contacted`, `Interested`, `Declined`, or `Follow-up Required`
- `notes`: Clinical trial coordinator recruitment note

> **Notice:** All data in this directory is fictional and generated for hackathon demonstration. Clinical eligibility matching is distinct from patient consent or protocol enrollment.
