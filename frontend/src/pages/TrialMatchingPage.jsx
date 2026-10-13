import React from 'react';
import TrialSelector from '../components/TrialSelector';
import MatchResultsView from '../components/MatchResultsView';
import { Scale, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TrialMatchingPage({
  trials = [],
  selectedTrial,
  onSelectTrial,
  selectedPatient,
  onEvaluate,
  evaluationData,
  loading,
  error,
  activeDataset = 'demo',
  selectedBatchId = null,
  onViewMatchDetails,
  onViewPatientDetails
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Trial Matching & Deterministic Eligibility Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate cohort candidates against clinical trial inclusion and exclusion criteria with explainable evidence and non-override rule validation.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Deterministic Engine Active</span>
        </div>
      </div>

      {/* Trial Protocol Selector */}
      <TrialSelector
        trials={trials}
        selectedTrial={selectedTrial}
        onSelectTrial={onSelectTrial}
      />

      {/* Matching Results & Criteria Evaluation */}
      <MatchResultsView
        selectedPatient={selectedPatient}
        selectedTrial={selectedTrial}
        onEvaluate={onEvaluate}
        evaluationData={evaluationData}
        loading={loading}
        error={error}
        activeDataset={activeDataset}
        selectedBatchId={selectedBatchId}
        onViewMatchDetails={onViewMatchDetails}
        onViewPatientDetails={onViewPatientDetails}
      />
    </div>
  );
}
