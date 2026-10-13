"""
Shared Pydantic Models for AI Clinical Trial Patient Matching System.
Ensures unified API contracts between FastAPI, Express backend, and Frontend.
"""

from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field

GenderType = Literal["male", "female", "other", "unknown"]
RaceType = Optional[Literal[
    "White",
    "Black or African American",
    "Asian",
    "American Indian or Alaska Native",
    "Native Hawaiian or Other Pacific Islander",
    "Multiracial",
    "Other"
]]
EthnicityType = Optional[Literal["Hispanic or Latino", "Not Hispanic or Latino", "Unknown"]]
SmokingStatusType = Optional[Literal["never", "former", "current", "unknown"]]
CriterionOperatorType = Literal[
    ">=", "<=", ">", "<", "==", "!=", "in", "not_in", "range", "contains", "not_contains", "exists"
]
CriterionStatusType = Literal["SATISFIED", "VIOLATED", "UNKNOWN"]
MatchStatusType = Literal["ELIGIBLE", "INELIGIBLE", "POTENTIALLY_ELIGIBLE_PENDING_INFO"]


class Demographics(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: GenderType
    race: RaceType = None
    ethnicity: EthnicityType = None
    postal_code: Optional[str] = None


class PatientRecord(BaseModel):
    patient_id: str
    demographics: Demographics
    conditions: List[str] = Field(default_factory=list)
    biomarkers: Dict[str, Union[float, int, str, bool, None]] = Field(default_factory=dict)
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    smoking_status: SmokingStatusType = None
    notes_summary: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CriterionRule(BaseModel):
    criterion_id: str
    description: str
    field: str
    operator: CriterionOperatorType
    value: Any
    is_mandatory: bool = True


class ClinicalTrialRecord(BaseModel):
    trial_id: str
    title: str
    phase: str
    therapeutic_area: str
    status: str
    description: str
    target_enrollment: int
    inclusion_criteria: List[CriterionRule]
    exclusion_criteria: List[CriterionRule]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CriterionEvaluation(BaseModel):
    criterion_id: str
    type: Literal["INCLUSION", "EXCLUSION"]
    description: str
    field: str
    operator: str
    expected_value: Any
    patient_value: Any
    status: CriterionStatusType
    is_mandatory: bool
    reason: str


class MatchSummary(BaseModel):
    total_criteria: int
    satisfied_count: int
    violated_count: int
    unknown_count: int


class MatchResult(BaseModel):
    patient_id: str
    trial_id: str
    match_status: MatchStatusType
    is_eligible: bool
    has_insufficient_info: bool
    match_score: float = Field(..., ge=0.0, le=100.0)
    summary: MatchSummary
    criteria_results: List[CriterionEvaluation]
    clinical_rationale: str
    evaluated_at: str


class ExtractedFact(BaseModel):
    category: Literal["condition", "biomarker", "medication", "allergy", "demographics", "smoking_status"]
    field_name: str
    value: Any
    unit: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_text: str
    char_start: int
    char_end: int


class ExtractNotesRequest(BaseModel):
    note_id: Optional[str] = None
    patient_id: Optional[str] = None
    raw_text: str


class ExtractNotesResponse(BaseModel):
    note_id: Optional[str] = None
    patient_id: Optional[str] = None
    extracted_facts: List[ExtractedFact]
    structured_patient_patch: Dict[str, Any]


class ExplainMatchRequest(BaseModel):
    patient: PatientRecord
    trial: ClinicalTrialRecord
    match_result: MatchResult


class ExplainMatchResponse(BaseModel):
    patient_id: str
    trial_id: str
    summary_explanation: str
    satisfied_explanations: List[str]
    violated_explanations: List[str]
    unknown_explanations: List[str]
    recommended_clinical_actions: List[str]
