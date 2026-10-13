import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles, Database } from 'lucide-react';
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
  fetchBatches,
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

  // Dataset Isolation State
  const [activeDataset, setActiveDataset] = useState('demo'); // 'demo' | 'imported' | 'all'
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState([]);
  const [demoCount, setDemoCount] = useState(25);
  const [importedCount, setImportedCount] = useState(0);
  const [importSummary, setImportSummary] = useState(null);

  const [evaluationData, setEvaluationData] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  // Load cohort data for specific dataset & batch
  const loadCohortData = useCallback(async (dataset = activeDataset, batchId = selectedBatchId) => {
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

      // 2. Fetch Batches, Patients for active dataset, and All trials
      const [batchesRes, patientsRes, trialsRes, allDemoRes, allImportedRes] = await Promise.all([
        fetchBatches().catch(() => ({ batches: [] })),
        fetchPatients({ dataset, batch_id: batchId }),
        fetchTrials(),
        fetchPatients({ dataset: 'demo' }).catch(() => ({ patients: [] })),
        fetchPatients({ dataset: 'imported' }).catch(() => ({ patients: [] }))
      ]);

      const loadedBatches = batchesRes.batches || [];
      const loadedPatients = patientsRes.patients || [];
      const loadedTrials = trialsRes.trials || [];

      setBatches(loadedBatches);
      setPatients(loadedPatients);
      setTrials(loadedTrials);
      setDemoCount(allDemoRes.patients?.length ?? 25);
      setImportedCount(allImportedRes.patients?.length ?? 0);

      // Default selection if current selection is not in list
      const targetTrial = selectedTrial || loadedTrials[0] || null;
      if (!selectedTrial && loadedTrials.length > 0) {
        setSelectedTrial(loadedTrials[0]);
      }

      if (loadedPatients.length > 0) {
        // Keep selected patient if still in active dataset, else select first
        const exists = loadedPatients.find((p) => p.patient_id === selectedPatient?.patient_id);
        setSelectedPatient(exists || loadedPatients[0]);
      } else {
        setSelectedPatient(null);
      }

      // Re-evaluate if trial is selected
      if (targetTrial) {
        try {
          const evalRes = await evaluateMatch({
            trial_id: targetTrial.trial_id,
            dataset,
            batch_id: batchId
          });
          setEvaluationData(evalRes);
        } catch (evalErr) {
          console.warn('Evaluation failed:', evalErr.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load clinical data.');
    } finally {
      setLoading(false);
    }
  }, [activeDataset, selectedBatchId, selectedTrial, selectedPatient]);

  useEffect(() => {
    loadCohortData();
  }, []);

  // Handle Dataset Switch
  const handleDatasetChange = async (newDataset) => {
    setActiveDataset(newDataset);
    setSelectedBatchId('');
    await loadCohortData(newDataset, '');
  };

  // Handle Specific Batch Switch
  const handleBatchChange = async (newBatchId) => {
    setSelectedBatchId(newBatchId);
    await loadCohortData('imported', newBatchId);
  };

  // Handle Match Evaluation
  const handleEvaluate = async (patientId = null) => {
    if (!selectedTrial) return;
    setEvaluating(true);
    setError(null);
    try {
      const payload = {
        trial_id: selectedTrial.trial_id,
        dataset: activeDataset,
        batch_id: selectedBatchId || null,
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

  // Handle Trial Protocol Selection Change
  const handleSelectTrial = (trial) => {
    setSelectedTrial(trial);
    evaluateMatch({
      trial_id: trial.trial_id,
      dataset: activeDataset,
      batch_id: selectedBatchId || null
    })
      .then(setEvaluationData)
      .catch((err) => console.error('Evaluation on trial change failed:', err));
  };

  // Reset Demo Seed Data
  const handleResetSeed = async () => {
    setResetting(true);
    try {
      await resetSeedData();
      setActiveDataset('demo');
      setSelectedBatchId('');
      setImportSummary(null);
      await loadCohortData('demo', '');
    } catch (err) {
      setError(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Handle Import Success
  const handleImportSuccess = async (result) => {
    // Requirement 2: After importing, automatically switch to Imported Dataset view
    const newBatchId = result?.import_batch_id || '';
    setActiveDataset('imported');
    setSelectedBatchId(newBatchId);

    setImportSummary({
      batch_id: newBatchId,
      accepted_count: result?.imported_count || result?.batch_record?.record_count || 0,
      rejected_count: result?.skipped_count || 0,
      filename: result?.batch_record?.filename || 'Imported File',
      format: result?.batch_record?.format || 'Clinical Data',
      timestamp: new Date().toLocaleTimeString()
    });

    await loadCohortData('imported', newBatchId);
  };

  // Handle Patient Recruitment Contact Update
  const handlePatientUpdated = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p.patient_id === updatedPatient.patient_id ? updatedPatient : p))
    );
    if (selectedPatient?.patient_id === updatedPatient.patient_id) {
      setSelectedPatient(updatedPatient);
    }
    if (detailPatient?.patient_id === updatedPatient.patient_id) {
      setDetailPatient(updatedPatient);
    }

    if (evaluationData?.results) {
      setEvaluationData((prev) => ({
        ...prev,
        results: prev.results.map((r) => {
          if (r.patient_id === updatedPatient.patient_id) {
            return {
              ...r,
              patient_summary: {
                ...r.patient_summary,
                recruitment_contact: updatedPatient.recruitment_contact
              }
            };
          }
          return r;
        })
      }));
    }
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
        {/* Import Confirmation Banner */}
        {importSummary && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-emerald-950">
                    Import Succeeded · Switched to Isolated Imported Dataset
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                    Active View
                  </span>
                </div>
                <p className="text-emerald-900 text-xs mt-1">
                  Accepted <span className="font-semibold">{importSummary.accepted_count} patient records</span> from <code className="bg-emerald-200/70 px-1 py-0.5 rounded text-emerald-950 font-mono text-xs">{importSummary.filename}</code> ({importSummary.format})
                  {importSummary.rejected_count > 0 && <span className="text-amber-800 font-semibold"> · {importSummary.rejected_count} skipped/rejected</span>}
                  &nbsp;· Batch ID: <span className="font-mono text-emerald-950 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">{importSummary.batch_id}</span>
                </p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  ✓ Clinical matching evaluation is now strictly isolated to this imported dataset cohort. Demo seed patients are excluded.
                </p>
              </div>
            </div>
            <button
              onClick={() => setImportSummary(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded hover:bg-emerald-100 transition-colors"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              onSelectTrial={handleSelectTrial}
            />

            {/* Core Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Patient Cohort Explorer with Dataset Selector (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <PatientExplorer
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onSelectPatient={(p) => setSelectedPatient(p)}
                  onViewDetails={(p) => setDetailPatient(p)}
                  onOpenImport={() => setIsImportOpen(true)}
                  loading={loading}
                  activeDataset={activeDataset}
                  onChangeDataset={handleDatasetChange}
                  selectedBatchId={selectedBatchId}
                  onChangeBatchId={handleBatchChange}
                  batches={batches}
                  demoCount={demoCount}
                  importedCount={importedCount}
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
                  activeDataset={activeDataset}
                  selectedBatchId={selectedBatchId}
                  onViewPatientDetails={(p) => setDetailPatient(p)}
                />
              </div>
            </div>
          </>
        ) : (
          /* Diversity & Demographic Analytics View */
          <DiversityAnalyticsView
            trials={trials}
            defaultTrialId={selectedTrial?.trial_id}
            activeDataset={activeDataset}
            selectedBatchId={selectedBatchId}
            onChangeDataset={handleDatasetChange}
            batches={batches}
          />
        )}
      </main>

      {/* Multi-Format Patient Import Modal */}
      <PatientImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Full Patient EHR & Recruitment Contact Outreach Modal */}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
        onUpdatePatient={handlePatientUpdated}
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
