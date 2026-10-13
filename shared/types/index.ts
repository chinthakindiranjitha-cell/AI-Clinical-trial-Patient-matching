/**
 * Shared Type Definitions for AI Clinical Trial Patient Matching System
 * Aligned across Frontend, Backend, Python Pydantic models, and Seed Data.
 */

export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type Race =
  | 'White'
  | 'Black or African American'
  | 'Asian'
  | 'American Indian or Alaska Native'
  | 'Native Hawaiian or Other Pacific Islander'
  | 'Multiracial'
  | 'Other';
export type Ethnicity = 'Hispanic or Latino' | 'Not Hispanic or Latino' | 'Unknown';
export type SmokingStatus = 'never' | 'former' | 'current' | 'unknown';

export interface Demographics {
  age: number;
  gender: Gender;
  race?: Race | null;
  ethnicity?: Ethnicity | null;
  postal_code?: string | null;
}

export type RecruitmentStatus =
  | 'Not Contacted'
  | 'Contacted'
  | 'Interested'
  | 'Declined'
  | 'Follow-up Required';

export interface RecruitmentContact {
  contact_person?: string | null;
  relationship?: 'patient' | 'caregiver' | 'authorized representative' | 'other' | string | null;
  phone?: string | null;
  email?: string | null;
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'portal' | string | null;
  availability?: string | null;
  recruitment_status: RecruitmentStatus;
  notes?: string | null;
}

export interface SourceOrganization {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface PatientRecord {
  patient_id: string;
  demographics: Demographics;
  conditions: string[];
  biomarkers: Record<string, number | string | boolean | null>;
  medications: string[];
  allergies: string[];
  smoking_status?: SmokingStatus | null;
  notes_summary?: string | null;
  dataset_source?: 'demo' | 'imported';
  import_batch_id?: string | null;
  recruitment_contact?: RecruitmentContact | null;
  organization?: SourceOrganization | null;
  created_at?: string;
  updated_at?: string;
}

export type CriterionOperator =
  | '>='
  | '<='
  | '>'
  | '<'
  | '=='
  | '!='
  | 'in'
  | 'not_in'
  | 'range'
  | 'contains'
  | 'not_contains'
  | 'exists';

export interface CriterionRule {
  criterion_id: string;
  description: string;
  field: string;
  operator: CriterionOperator;
  value: any;
  is_mandatory: boolean;
}

export type TrialPhase = 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 1/2' | 'Phase 2/3';
export type TherapeuticArea =
  | 'Oncology'
  | 'Endocrinology'
  | 'Cardiology'
  | 'Neurology'
  | 'Immunology'
  | 'Pulmonology';
export type TrialStatus = 'Recruiting' | 'Active' | 'Completed' | 'Suspended';

export interface ClinicalTrialRecord {
  trial_id: string;
  title: string;
  phase: TrialPhase;
  therapeutic_area: TherapeuticArea;
  status: TrialStatus;
  description: string;
  target_enrollment: number;
  inclusion_criteria: CriterionRule[];
  exclusion_criteria: CriterionRule[];
  created_at?: string;
  updated_at?: string;
}

export type CriterionStatus = 'SATISFIED' | 'VIOLATED' | 'UNKNOWN';
export type MatchStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'POTENTIALLY_ELIGIBLE_PENDING_INFO';

export interface CriterionEvaluation {
  criterion_id: string;
  type: 'INCLUSION' | 'EXCLUSION';
  description: string;
  field: string;
  operator: string;
  expected_value: any;
  patient_value: any;
  status: CriterionStatus;
  is_mandatory: boolean;
  reason: string;
}

export interface MatchSummary {
  total_criteria: number;
  satisfied_count: number;
  violated_count: number;
  unknown_count: number;
}

export interface MatchResult {
  patient_id: string;
  trial_id: string;
  match_status: MatchStatus;
  is_eligible: boolean;
  has_insufficient_info: boolean;
  match_score: number; // 0-100; strictly 0 if INELIGIBLE
  summary: MatchSummary;
  criteria_results: CriterionEvaluation[];
  clinical_rationale: string;
  evaluated_at: string;
}

export interface ExtractedFact {
  category: 'condition' | 'biomarker' | 'medication' | 'allergy' | 'demographics' | 'smoking_status';
  field_name: string;
  value: any;
  unit?: string | null;
  confidence: number;
  evidence_text: string;
  char_start: number;
  char_end: number;
}

export interface ClinicalNoteExtraction {
  note_id: string;
  patient_id?: string;
  raw_text: string;
  extracted_facts: ExtractedFact[];
  structured_patient_patch?: Partial<PatientRecord>;
}

export interface DiversityDemographicCount {
  category: string;
  group: string;
  count: number;
  percentage: number;
}

export interface DiversityAnalytics {
  total_patients: number;
  gender_distribution: Record<string, number>;
  race_distribution: Record<string, number>;
  ethnicity_distribution: Record<string, number>;
  age_groups: Record<string, number>;
  eligible_by_demographic: Record<string, { total: number; eligible: number }>;
}
