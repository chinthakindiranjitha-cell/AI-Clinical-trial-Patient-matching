import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Database,
  ShieldCheck,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function ExportResultsPage({
  trials = [],
  selectedTrial,
  onSelectTrial,
  evaluationData,
  activeDataset = 'demo',
  selectedBatchId = null
}) {
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const results = evaluationData?.results || [];
  const eligibleCount = evaluationData?.eligible_count || 0;
  const pendingCount = evaluationData?.pending_count || 0;
  const ineligibleCount = evaluationData?.ineligible_count || 0;
  const evaluatedCount = evaluationData?.evaluated_count || 0;

  const handleDownload = (format) => {
    if (!selectedTrial) return;

    const url = getExportUrl(
      selectedTrial.trial_id,
      evaluationData?.active_dataset || activeDataset,
      selectedBatchId,
      format
    );

    window.open(url, '_blank');
    setDownloadSuccess(`Export started: ${format.toUpperCase()} report downloading...`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Downloadable Trial Matching Results & Compliance Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export deterministic eligibility determinations, criterion-level evidence, and clinical rationales to verified CSV and JSON files.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Formula-Injection Protected</span>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center space-x-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {/* Trial Selection & Export Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          {/* Trial Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Selected Clinical Trial Protocol:
            </label>
            <div className="relative">
              <select
                value={selectedTrial?.trial_id || ''}
                onChange={(e) => {
                  const found = trials.find((t) => t.trial_id === e.target.value);
                  if (found) onSelectTrial(found);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-3.5 py-2.5 pr-8 focus:ring-2 focus:ring-sky-500"
              >
                {trials.map((t) => (
                  <option key={t.trial_id} value={t.trial_id}>
                    {t.trial_id} - {t.title} ({t.phase})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Active Dataset Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Active Dataset Source Scope:
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-sky-600" />
                <span className="font-semibold text-slate-900 capitalize">
                  {activeDataset} Dataset View
                </span>
                {selectedBatchId && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({selectedBatchId})
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-[11px]">
                {evaluatedCount} candidates ready
              </span>
            </div>
          </div>
        </div>

        {/* Export Metric Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Total Candidates Evaluated</span>
            <strong className="text-xl font-extrabold text-slate-900">{evaluatedCount}</strong>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-emerald-700 block text-[11px]">Eligible Matches (100%)</span>
            <strong className="text-xl font-extrabold text-emerald-800">{eligibleCount}</strong>
          </div>
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-700 block text-[11px]">Pending Information</span>
            <strong className="text-xl font-extrabold text-amber-800">{pendingCount}</strong>
          </div>
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-rose-700 block text-[11px]">Ineligible Violations (0%)</span>
            <strong className="text-xl font-extrabold text-rose-800">{ineligibleCount}</strong>
          </div>
        </div>

        {/* Download Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* CSV Download Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Download CSV Format</h4>
                  <span className="text-[11px] text-slate-500">Spreadsheet analysis · Excel & Google Sheets</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                CSV
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Full candidate spreadsheet with criterion counts, deterministic classification, source organization details, and formula-injection defenses.
            </p>

            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={!selectedTrial || evaluatedCount === 0}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Results ({evaluatedCount} Records)</span>
            </button>
          </div>

          {/* JSON Download Card */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Download JSON Format</h4>
                  <span className="text-[11px] text-slate-500">Structured API payload · System integration</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                JSON
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Structured JSON document including complete evaluation metadata, individual criterion evidence quotations, and trial criteria schemas.
            </p>

            <button
              type="button"
              onClick={() => handleDownload('json')}
              disabled={!selectedTrial || evaluatedCount === 0}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Results ({evaluatedCount} Records)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Export Candidates Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>Export Dataset Preview ({results.length} Candidates)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These exact verified records will be included in the exported file.
            </p>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Patient ID</th>
                  <th className="p-3">Demographics</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Criteria Summary</th>
                  <th className="p-3">Source Organization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.slice(0, 8).map((r) => (
                  <tr key={r.patient_id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900">{r.patient_id}</td>
                    <td className="p-3 text-slate-600">
                      {r.patient_summary?.age}y · {r.patient_summary?.gender} · {r.patient_summary?.race || 'Race unspec.'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.match_status === 'ELIGIBLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {r.match_status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{r.match_score}%</td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      Sat: <strong>{r.summary?.satisfied_count}</strong> | Viol: <strong>{r.summary?.violated_count}</strong> | Unk: <strong>{r.summary?.unknown_count}</strong>
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[160px]">
                      {r.patient_summary?.organization?.name || 'Not available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No candidates evaluated for this trial protocol yet. Run an eligibility check to generate exportable results.
          </div>
        )}
      </div>

      {/* Compliance Advisory Callout */}
      <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <Info className="w-4 h-4 text-amber-600" />
          <span>Clinical Research Export & Data Integrity Notice</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          Matching exports contain verified criterion-by-criterion evaluations generated by ClinMatch's deterministic rule engine. Ineligible candidates receive a score of zero and mandatory exclusions cannot be overridden. All patient data is synthetic demonstration data.
        </p>
      </div>
    </div>
  );
}
