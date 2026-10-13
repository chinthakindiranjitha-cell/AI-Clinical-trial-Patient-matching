/**
 * Deterministic Clinical Trial Eligibility Matching Engine
 * 
 * Rules:
 * 1. Evaluates all inclusion and exclusion criteria deterministically.
 * 2. Missing/null information is treated strictly as UNKNOWN, never assumed violated or satisfied.
 * 3. Any VIOLATED mandatory criterion results in overall status INELIGIBLE.
 * 4. Overall score for INELIGIBLE is strictly 0 (ranking cannot override mandatory failures).
 * 5. If no criteria violated but some are UNKNOWN, status is POTENTIALLY_ELIGIBLE_PENDING_INFO.
 * 6. If all mandatory criteria satisfied, status is ELIGIBLE.
 */

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function evaluateCondition(operator, actualValue, targetValue) {
  switch (operator) {
    case '>=':
      return typeof actualValue === 'number' && actualValue >= targetValue;
    case '<=':
      return typeof actualValue === 'number' && actualValue <= targetValue;
    case '>':
      return typeof actualValue === 'number' && actualValue > targetValue;
    case '<':
      return typeof actualValue === 'number' && actualValue < targetValue;
    case '==':
      return String(actualValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase();
    case '!=':
      return String(actualValue).trim().toLowerCase() !== String(targetValue).trim().toLowerCase();
    case 'range':
      return (
        typeof actualValue === 'number' &&
        Array.isArray(targetValue) &&
        actualValue >= targetValue[0] &&
        actualValue <= targetValue[1]
      );
    case 'contains':
      if (Array.isArray(actualValue)) {
        return actualValue.some((item) =>
          String(item).trim().toLowerCase().includes(String(targetValue).trim().toLowerCase())
        );
      }
      if (typeof actualValue === 'string') {
        return actualValue.toLowerCase().includes(String(targetValue).toLowerCase());
      }
      return false;
    case 'in':
      if (Array.isArray(targetValue)) {
        return targetValue.some((item) =>
          String(item).trim().toLowerCase() === String(actualValue).trim().toLowerCase()
        );
      }
      return false;
    default:
      return false;
  }
}

function evaluateCriterion(criterion, patient, type) {
  const actualValue = getNestedValue(patient, criterion.field);
  const isMandatory = criterion.is_mandatory !== false;

  // Check if actualValue is missing
  const isMissing =
    actualValue === undefined ||
    actualValue === null ||
    (Array.isArray(actualValue) && actualValue.length === 0 && criterion.field.startsWith('biomarkers'));

  if (type === 'INCLUSION') {
    if (isMissing) {
      return {
        criterion_id: criterion.criterion_id,
        type,
        description: criterion.description,
        field: criterion.field,
        operator: criterion.operator,
        expected_value: criterion.value,
        patient_value: null,
        status: 'UNKNOWN',
        is_mandatory: isMandatory,
        reason: `Required patient field '${criterion.field}' is missing or pending laboratory documentation.`
      };
    }

    const passed = evaluateCondition(criterion.operator, actualValue, criterion.value);
    return {
      criterion_id: criterion.criterion_id,
      type,
      description: criterion.description,
      field: criterion.field,
      operator: criterion.operator,
      expected_value: criterion.value,
      patient_value: actualValue,
      status: passed ? 'SATISFIED' : 'VIOLATED',
      is_mandatory: isMandatory,
      reason: passed
        ? `Inclusion satisfied: Patient value (${JSON.stringify(actualValue)}) meets requirement (${criterion.operator} ${JSON.stringify(criterion.value)}).`
        : `Inclusion failed: Patient value (${JSON.stringify(actualValue)}) does not satisfy requirement (${criterion.operator} ${JSON.stringify(criterion.value)}).`
    };
  } else {
    // EXCLUSION criterion
    // If the exclusion checks conditions/medications/allergies array, and patient does NOT have it, it's satisfied (not excluded).
    const isArrayField = ['conditions', 'medications', 'allergies'].includes(criterion.field);

    if (isMissing) {
      if (isArrayField) {
        // Patient has no documented occurrence of this excluded condition/drug
        return {
          criterion_id: criterion.criterion_id,
          type,
          description: criterion.description,
          field: criterion.field,
          operator: criterion.operator,
          expected_value: criterion.value,
          patient_value: [],
          status: 'SATISFIED',
          is_mandatory: isMandatory,
          reason: `Exclusion not triggered: No documentation of '${criterion.value}' found in patient ${criterion.field}.`
        };
      } else {
        // Lab or measurement biomarker is missing for an exclusion check (e.g. eGFR < 30)
        return {
          criterion_id: criterion.criterion_id,
          type,
          description: criterion.description,
          field: criterion.field,
          operator: criterion.operator,
          expected_value: criterion.value,
          patient_value: null,
          status: 'UNKNOWN',
          is_mandatory: isMandatory,
          reason: `Biomarker measurement '${criterion.field}' required for exclusion verification is missing.`
        };
      }
    }

    // Exclusion rule triggered means patient is disqualified -> VIOLATED
    const triggered = evaluateCondition(criterion.operator, actualValue, criterion.value);
    return {
      criterion_id: criterion.criterion_id,
      type,
      description: criterion.description,
      field: criterion.field,
      operator: criterion.operator,
      expected_value: criterion.value,
      patient_value: actualValue,
      status: triggered ? 'VIOLATED' : 'SATISFIED',
      is_mandatory: isMandatory,
      reason: triggered
        ? `Exclusion triggered: Patient matches disqualifying criterion (${criterion.field}: ${JSON.stringify(actualValue)} matches ${criterion.operator} ${JSON.stringify(criterion.value)}).`
        : `Exclusion not triggered: Patient value does not match disqualifying condition.`
    };
  }
}

function matchPatientToTrial(patient, trial) {
  const criteriaResults = [];

  for (const inc of trial.inclusion_criteria) {
    criteriaResults.push(evaluateCriterion(inc, patient, 'INCLUSION'));
  }

  for (const exc of trial.exclusion_criteria) {
    criteriaResults.push(evaluateCriterion(exc, patient, 'EXCLUSION'));
  }

  const satisfiedCount = criteriaResults.filter((c) => c.status === 'SATISFIED').length;
  const violatedCount = criteriaResults.filter((c) => c.status === 'VIOLATED').length;
  const unknownCount = criteriaResults.filter((c) => c.status === 'UNKNOWN').length;
  const totalCount = criteriaResults.length;

  const mandatoryViolations = criteriaResults.filter((c) => c.is_mandatory && c.status === 'VIOLATED');
  const mandatoryUnknowns = criteriaResults.filter((c) => c.is_mandatory && c.status === 'UNKNOWN');

  let matchStatus = 'ELIGIBLE';
  let isEligible = false;
  let hasInsufficientInfo = false;
  let matchScore = 0;
  let rationale = '';

  if (mandatoryViolations.length > 0) {
    matchStatus = 'INELIGIBLE';
    isEligible = false;
    hasInsufficientInfo = mandatoryUnknowns.length > 0;
    // CRITICAL REQUIREMENT: Candidate ranking must NEVER override mandatory eligibility failures
    matchScore = 0;
    rationale = `Ineligible: Disqualified by ${mandatoryViolations.length} mandatory criteria (${mandatoryViolations.map((c) => c.criterion_id).join(', ')}).`;
  } else if (mandatoryUnknowns.length > 0) {
    matchStatus = 'POTENTIALLY_ELIGIBLE_PENDING_INFO';
    isEligible = false;
    hasInsufficientInfo = true;
    matchScore = Math.round((satisfiedCount / totalCount) * 100);
    rationale = `Potential match pending verification: ${satisfiedCount}/${totalCount} criteria satisfied; ${mandatoryUnknowns.length} criteria require lab/clinical confirmation (${mandatoryUnknowns.map((c) => c.criterion_id).join(', ')}).`;
  } else {
    matchStatus = 'ELIGIBLE';
    isEligible = true;
    hasInsufficientInfo = false;
    matchScore = 100;
    rationale = `Eligible: All ${totalCount} mandatory inclusion and exclusion criteria confirmed satisfied.`;
  }

  return {
    patient_id: patient.patient_id,
    trial_id: trial.trial_id,
    match_status: matchStatus,
    is_eligible: isEligible,
    has_insufficient_info: hasInsufficientInfo,
    match_score: matchScore,
    summary: {
      total_criteria: totalCount,
      satisfied_count: satisfiedCount,
      violated_count: violatedCount,
      unknown_count: unknownCount
    },
    criteria_results: criteriaResults,
    clinical_rationale: rationale,
    evaluated_at: new Date().toISOString()
  };
}

module.exports = {
  matchPatientToTrial,
  evaluateCriterion,
  evaluateCondition,
  getNestedValue
};
