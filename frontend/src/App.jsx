import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles, Database } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import TrialMatchingPage from './pages/TrialMatchingPage';
import ImportPatientsPage from './pages/ImportPatientsPage';
import ExportResultsPage from './pages/ExportResultsPage';
import DiversityAnalyticsView from './components/DiversityAnalyticsView';
import PatientDetailModal from './components/PatientDetailModal';
import PatientEligibilityModal from './components/PatientEligibilityModal';
import PatientImportModal from './components/PatientImportModal';
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
  const [matchDetailResult, setMatchDetailResult] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Navigation and Layout State
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'patients' | 'matching' | 'analytics' | 'import' | 'export'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        console.warn('Backend offline:', err.message);
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
      setError(err.message || 'Error evaluating matching criteria.');
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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        backendConnected={backendConnected}
        onResetSeed={handleResetSeed}
        resetting={resetting}
        activeDataset={activeDataset}
        demoCount={demoCount}
        importedCount={importedCount}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <Header
          activePage={activePage}
          activeDataset={activeDataset}
          onChangeDataset={handleDatasetChange}
          selectedBatchId={selectedBatchId}
          onChangeBatchId={handleBatchChange}
          batches={batches}
          demoCount={demoCount}
          importedCount={importedCount}
          onOpenImport={() => setIsImportOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
          {/* Import Confirmation Banner */}
          {importSummary && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-950">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm">
                      Import Succeeded · Switched to Isolated Imported Dataset
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                      Active View
                    </span>
                  </div>
                  <p className="mt-1 text-emerald-900">
                    Accepted <strong className="font-bold">{importSummary.accepted_count} patient records</strong> from <code className="bg-emerald-200/70 px-1 py-0.5 rounded text-emerald-950 font-mono text-xs">{importSummary.filename}</code> ({importSummary.format})
                    {importSummary.rejected_count > 0 && <span className="text-amber-800 font-semibold"> · {importSummary.rejected_count} skipped/rejected</span>}
                    &nbsp;· Batch ID: <span className="font-mono text-emerald-950 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">{importSummary.batch_id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="text-emerald-700 hover:text-emerald-950 p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Page Routing */}
          {activePage === 'dashboard' && (
            <DashboardPage
              patients={patients}
              trials={trials}
              selectedTrial={selectedTrial}
              onSelectTrial={handleSelectTrial}
              evaluationData={evaluationData}
              onNavigate={(page) => setActivePage(page)}
              onViewPatientDetails={(p) => setDetailPatient(p)}
              activeDataset={activeDataset}
            />
          )}

          {activePage === 'patients' && (
            <PatientsPage
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
          )}

          {activePage === 'matching' && (
            <TrialMatchingPage
              trials={trials}
              selectedTrial={selectedTrial}
              onSelectTrial={handleSelectTrial}
              selectedPatient={selectedPatient}
              onEvaluate={handleEvaluate}
              evaluationData={evaluationData}
              loading={evaluating}
              error={error}
              activeDataset={activeDataset}
              selectedBatchId={selectedBatchId}
              onViewMatchDetails={(candidate) => setMatchDetailResult(candidate)}
              onViewPatientDetails={(candidate) => setMatchDetailResult(candidate)}
            />
          )}

          {activePage === 'analytics' && (
            <DiversityAnalyticsView
              trials={trials}
              defaultTrialId={selectedTrial?.trial_id}
              activeDataset={activeDataset}
              selectedBatchId={selectedBatchId}
              onChangeDataset={handleDatasetChange}
              batches={batches}
            />
          )}

          {activePage === 'import' && (
            <ImportPatientsPage
              onImportSuccess={handleImportSuccess}
              batches={batches}
              activeDataset={activeDataset}
              selectedBatchId={selectedBatchId}
              onSelectBatch={(batchId) => handleBatchChange(batchId)}
            />
          )}

          {activePage === 'export' && (
            <ExportResultsPage
              trials={trials}
              selectedTrial={selectedTrial}
              onSelectTrial={handleSelectTrial}
              evaluationData={evaluationData}
              activeDataset={activeDataset}
              selectedBatchId={selectedBatchId}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>ClinMatch · AI Clinical Trial Patient Matching System (Hackathon MVP)</span>
            <div className="flex items-center space-x-3 text-slate-400">
              <span>React + Vite</span>
              <span>•</span>
              <span>Tailwind CSS</span>
              <span>•</span>
              <span>Express.js</span>
              <span>•</span>
              <span>Deterministic Rule Engine</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Quick Multi-Format Patient Import Modal */}
      <PatientImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Patient EHR Modal with Source Organization Details */}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />

      {/* Patient Eligibility Criteria Details Modal (Eye Icon Action in Results) */}
      <PatientEligibilityModal
        matchResult={matchDetailResult}
        onClose={() => setMatchDetailResult(null)}
      />
    </div>
  );
}
