import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import TrialSelector from './components/TrialSelector';
import PatientExplorer from './components/PatientExplorer';
import MatchResultsView from './components/MatchResultsView';
import PatientDetailModal from './components/PatientDetailModal';
import PatientImportModal from './components/PatientImportModal';
import DiversityAnalyticsView from './components/DiversityAnalyticsView';
import {
  fetchHealth,
  fetchPatients,
  fetchTrials,
  evaluateMatch,
  resetSeedData
} from './services/api';

export default function App() {
  const [patients, setPatients] = useState([]);
  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailPatient, setDetailPatient] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('matching'); // 'matching' | 'analytics'

  const [evaluationData, setEvaluationData] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  // Load initial dataset
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Health check
      try {
        await fetchHealth();
        setBackendConnected(true);
      } catch (err) {
        setBackendConnected(false);
        console.warn('Backend currently offline:', err.message);
      }

      // 2. Fetch Patients & Trials
      const [patientsRes, trialsRes] = await Promise.all([
        fetchPatients(),
        fetchTrials()
      ]);

      const loadedPatients = patientsRes.patients || [];
      const loadedTrials = trialsRes.trials || [];

      setPatients(loadedPatients);
      setTrials(loadedTrials);

      const firstTrial = loadedTrials[0] || null;
      const firstPatient = loadedPatients[0] || null;

      setSelectedTrial(firstTrial);
      setSelectedPatient(firstPatient);

      // 3. Run initial cohort evaluation if trial exists
      if (firstTrial) {
        try {
          const evalRes = await evaluateMatch({ trial_id: firstTrial.trial_id });
          setEvaluationData(evalRes);
        } catch (evalErr) {
          console.warn('Initial evaluation failed:', evalErr.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load initial clinical data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Match Evaluation
  const handleEvaluate = async (patientId = null) => {
    if (!selectedTrial) return;
    setEvaluating(true);
    setError(null);
    try {
      const payload = {
        trial_id: selectedTrial.trial_id,
        ...(patientId ? { patient_id: patientId } : {})
      };
      const res = await evaluateMatch(payload);
      setEvaluationData(res);
    } catch (err) {
      setError(err.message || 'Error occurred while evaluating matching criteria.');
    } finally {
      setEvaluating(false);
    }
  };

  // Reset Demo Seed Data
  const handleResetSeed = async () => {
    setResetting(true);
    try {
      await resetSeedData();
      await loadInitialData();
    } catch (err) {
      setError(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Handle Import Success
  const handleImportSuccess = async () => {
    await loadInitialData();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        backendConnected={backendConnected}
        onResetSeed={handleResetSeed}
        resetting={resetting}
        onOpenImport={() => setIsImportOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {activeTab === 'matching' ? (
          <>
            {/* Metric Summary Cards */}
            <MetricCards
              totalPatients={patients.length}
              totalTrials={trials.length}
              eligibleCount={evaluationData?.eligible_count || 0}
              pendingCount={evaluationData?.pending_count || 0}
              evaluatedCount={evaluationData?.evaluated_count || 0}
            />

            {/* Clinical Trial Protocol Banner */}
            <TrialSelector
              trials={trials}
              selectedTrial={selectedTrial}
              onSelectTrial={(trial) => {
                setSelectedTrial(trial);
                // Re-evaluate automatically for newly selected trial
                evaluateMatch({ trial_id: trial.trial_id })
                  .then(setEvaluationData)
                  .catch(console.error);
              }}
            />

            {/* Core Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Patient Cohort Explorer (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <PatientExplorer
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onSelectPatient={(p) => setSelectedPatient(p)}
                  onViewDetails={(p) => setDetailPatient(p)}
                  onOpenImport={() => setIsImportOpen(true)}
                  loading={loading}
                />
              </div>

              {/* Right Column: Deterministic Match & Explainability (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <MatchResultsView
                  selectedPatient={selectedPatient}
                  selectedTrial={selectedTrial}
                  onEvaluate={handleEvaluate}
                  evaluationData={evaluationData}
                  loading={evaluating}
                  error={error}
                />
              </div>
            </div>
          </>
        ) : (
          /* Diversity & Demographic Analytics View */
          <DiversityAnalyticsView
            trials={trials}
            defaultTrialId={selectedTrial?.trial_id}
          />
        )}
      </main>

      {/* Multi-Format Patient Import Modal */}
      <PatientImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Full Patient EHR Modal */}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ClinMatch · AI Clinical Trial Patient Matching System (Hackathon MVP)</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Recharts Analytics</span>
            <span>•</span>
            <span>Express.js</span>
            <span>•</span>
            <span>Deterministic Rule Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
