import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  FlaskConical,
  Scale,
  Download,
  FileSpreadsheet,
  FileCode,
  Phone
} from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function MatchResultsView({
  selectedPatient,
  selectedTrial,
  onEvaluate,
  evaluationData,
  loading,
  error,
  activeDataset = 'demo',
  selectedBatchId = null,
  onViewPatientDetails
}) {
  const [evalMode, setEvalMode] = useState('ALL'); // 'ALL' or 'SINGLE'
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  const results = evaluationData?.results || [];

  const handleDownload = (format) => {
    if (!selectedTrial) return;
    const url = getExportUrl(
      selectedTrial.trial_id,
      evaluationData?.active_dataset || activeDataset,
      selectedBatchId,
      format
    );
    window.open(url, '_blank');
  };

  const getStatusBadge = (status, score) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ELIGIBLE ({score}%)</span>
          </span>
        );
      case 'POTENTIALLY_ELIGIBLE_PENDING_INFO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>PENDING INFO ({score}%)</span>
          </span>
        );
      case 'INELIGIBLE':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>INELIGIBLE (0%)</span>
          </span>
        );
    }
  };

  const getCriterionBadge = (status) => {
    switch (status) {
      case 'SATISFIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SATISFIED</span>
          </span>
        );
      case 'VIOLATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>VIOLATED</span>
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>UNKNOWN / MISSING</span>
          </span>
        );
    }
  };

  const toggleExpand = (patientId) => {
    setExpandedPatientId(expandedPatientId === patientId ? null : patientId);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Scale className="w-4 h-4 text-sky-600" />
            <span>Eligibility Matching & Explainability</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rule engine evaluates all criteria against the active{' '}
            <strong className="text-slate-700 capitalize">{activeDataset}</strong> dataset
          </p>
        </div>

        {/* Evaluation Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setEvalMode('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                evalMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evaluate Active Dataset
            </button>
            <button
              type="button"
              onClick={() => setEvalMode('SINGLE')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                evalMode === 'SINGLE'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selected Patient Only
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEvaluate(evalMode === 'SINGLE' ? selectedPatient?.patient_id : null)}
            disabled={loading || !selectedTrial}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Criteria...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {evalMode === 'SINGLE' && selectedPatient
                    ? `Match ${selectedPatient.patient_id}`
                    : `Evaluate Cohort against ${selectedTrial?.trial_id || 'Trial'}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error evaluating match: {error}</span>
        </div>
      )}

      {/* Results Content */}
      <div className="mt-4">
        {!evaluationData && !loading && (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No Matching Evaluation Run Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Select a clinical trial protocol and click "Evaluate Active Dataset" to run the deterministic rule engine.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
            <RotateCcw className="w-6 h-6 animate-spin text-sky-600" />
            <span>Evaluating protocol rules against electronic health records...</span>
          </div>
        )}

        {evaluationData && !loading && (
          <div className="space-y-4">
            {/* Summary Bar & Export Action */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Dataset Evaluated:
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-sky-100 text-sky-800 border border-sky-200 capitalize">
                    {evaluationData.active_dataset || activeDataset} Dataset
                  </span>
                  {evaluationData.active_batch_id && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({evaluationData.active_batch_id.slice(-8)})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 font-medium">
                  <span className="text-slate-600">
                    Total: <strong>{evaluationData.evaluated_count}</strong>
                  </span>
                  <span className="text-emerald-700">
                    ● <strong>{evaluationData.eligible_count}</strong> Eligible
                  </span>
                  <span className="text-amber-700">
                    ● <strong>{evaluationData.pending_count}</strong> Pending Info
                  </span>
                  <span className="text-rose-700">
                    ● <strong>{evaluationData.ineligible_count}</strong> Ineligible
                  </span>
                </div>
              </div>

              {/* Download Results Action */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className="text-slate-500 font-medium text-[11px] hidden md:inline">
                  Download Results:
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload('csv')}
                  title="Export verified trial matching results to CSV for spreadsheet review"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('json')}
                  title="Export verified trial matching results to structured JSON format"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>

            {/* Empty Evaluated Set */}
            {results.length === 0 && (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No patients available in this dataset to evaluate for {selectedTrial?.trial_id}.
              </div>
            )}

            {/* Results List */}
            <div className="space-y-3">
              {results.map((res, idx) => {
                const isExpanded = expandedPatientId === res.patient_id;
                const contact = res.patient_summary?.recruitment_contact || {};
                return (
                  <div
                    key={`${res.patient_id}-${res.trial_id}`}
                    className={`rounded-xl border transition-all ${
                      res.match_status === 'ELIGIBLE'
                        ? 'border-emerald-200 bg-white hover:border-emerald-300 shadow-sm'
                        : res.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO'
                        ? 'border-amber-200 bg-white hover:border-amber-300 shadow-sm'
                        : 'border-slate-200 bg-white/60 hover:border-slate-300'
                    }`}
                  >
                    {/* Candidate Row Header */}
                    <div
                      onClick={() => toggleExpand(res.patient_id)}
                      className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center space-x-3">
                        <span className="text-xs font-bold text-slate-400 w-6">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-900">
                              {res.patient_id}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({res.patient_summary?.age}y, {res.patient_summary?.gender},{' '}
                              {res.patient_summary?.race || 'Race unspecified'})
                            </span>
                            {/* Recruitment Follow-up Badge */}
                            {contact.recruitment_status && (
                              <span
                                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  contact.recruitment_status === 'Interested'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : contact.recruitment_status === 'Contacted'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : contact.recruitment_status === 'Follow-up Required'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : contact.recruitment_status === 'Declined'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{contact.recruitment_status}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            {res.clinical_rationale}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right hidden sm:block text-[11px] text-slate-500">
                          <div>
                            Sat: <strong className="text-emerald-600">{res.summary.satisfied_count}</strong> | Viol:{' '}
                            <strong className="text-rose-600">{res.summary.violated_count}</strong> | Unk:{' '}
                            <strong className="text-amber-600">{res.summary.unknown_count}</strong>
                          </div>
                        </div>

                        {getStatusBadge(res.match_status, res.match_score)}

                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Criterion-Level Audit Drawer */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                        <div className="mb-3 pt-2 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>Criterion-by-Criterion Protocol Audit</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Evaluated at: {new Date(res.evaluated_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {res.criteria_results?.map((crit) => (
                            <div
                              key={crit.criterion_id}
                              className={`p-3 rounded-lg border text-xs ${
                                crit.status === 'SATISFIED'
                                  ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800'
                                  : crit.status === 'VIOLATED'
                                  ? 'bg-rose-50/40 border-rose-200/80 text-slate-800'
                                  : 'bg-amber-50/40 border-amber-200/80 text-slate-800'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900">
                                    [{crit.criterion_id}]
                                  </span>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                                    {crit.type}
                                  </span>
                                  {crit.is_mandatory && (
                                    <span className="text-[10px] text-rose-600 font-semibold">
                                      *Mandatory
                                    </span>
                                  )}
                                  <span className="font-medium text-slate-700">
                                    {crit.description}
                                  </span>
                                </div>
                                <div>{getCriterionBadge(crit.status)}</div>
                              </div>

                              <div className="mt-1.5 pl-2 border-l-2 border-slate-300 text-[11px] text-slate-600 space-y-0.5">
                                <div>
                                  <strong>Target Requirement:</strong> {crit.field} {crit.operator}{' '}
                                  {JSON.stringify(crit.expected_value)}
                                </div>
                                <div>
                                  <strong>Patient Record Value:</strong>{' '}
                                  {crit.patient_value !== null && crit.patient_value !== undefined ? (
                                    <span className="font-semibold text-slate-800">
                                      {JSON.stringify(crit.patient_value)}
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 font-semibold italic">
                                      Missing / Pending in EHR
                                    </span>
                                  )}
                                </div>
                                <div className="pt-0.5 text-slate-700 font-medium">
                                  <strong>Audit Reason:</strong> {crit.reason}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
