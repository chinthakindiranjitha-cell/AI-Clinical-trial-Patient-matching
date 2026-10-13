/**
 * Frontend API Client
 * Interfaces with Express backend via relative /api proxy
 */

const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch (e) {
      // Body not JSON
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function fetchPatients(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.condition) query.append('condition', params.condition);
  if (params.gender) query.append('gender', params.gender);
  if (params.race) query.append('race', params.race);

  const qs = query.toString();
  const url = `${BASE_URL}/patients${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchPatientById(id) {
  const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function fetchTrials(params = {}) {
  const query = new URLSearchParams();
  if (params.therapeutic_area) query.append('therapeutic_area', params.therapeutic_area);
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  const url = `${BASE_URL}/trials${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchTrialById(id) {
  const res = await fetch(`${BASE_URL}/trials/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function evaluateMatch(payload) {
  const res = await fetch(`${BASE_URL}/match/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function uploadPatientFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/patients/upload`, {
    method: 'POST',
    body: formData
  });
  return handleResponse(res);
}

export async function confirmPatientImport(records, duplicateResolution = 'assign_new_id') {
  const res = await fetch(`${BASE_URL}/patients/confirm-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records,
      duplicate_resolution: duplicateResolution
    })
  });
  return handleResponse(res);
}

export async function fetchDiversityAnalytics(trialId = null) {
  const query = trialId ? `?trial_id=${encodeURIComponent(trialId)}` : '';
  const res = await fetch(`${BASE_URL}/analytics/diversity${query}`);
  return handleResponse(res);
}

export async function resetSeedData() {
  const res = await fetch(`${BASE_URL}/reset-data`, {
    method: 'POST'
  });
  return handleResponse(res);
}
