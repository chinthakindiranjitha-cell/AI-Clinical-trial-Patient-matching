import React from 'react';
import MetricCards from '../components/MetricCards';
import TrialSelector from '../components/TrialSelector';
import {
  Users,
  Scale,
  BarChart3,
  UploadCloud,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  FileText
} from 'lucide-react';

export default function DashboardPage({
  patients = [],
  trials = [],
  selectedTrial,
  onSelectTrial,
  evaluationData,
  onNavigate,
  onViewPatientDetails,
  activeDataset = 'demo'
}) {
  const eligibleCount = evaluationData?.eligible_count || 0;
  const pendingCount = evaluationData?.pending_count || 0;
  const evaluatedCount = evaluationData?.evaluated_count || 0;
  const ineligibleCount = evaluationData?.ineligible_count || 0;

  const quickActions = [
    {
      title: 'Trial Matching & Eligibility Check',
      desc: 'Evaluate patient cohort against trial inclusion & exclusion criteria with deterministic rationale.',
      page: 'matching',
      icon: Scale,
      color: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-300'
    },
    {
      title: 'Cohort Patients Explorer',
      desc: `Search, filter, and inspect detailed EHR profiles across ${patients.length} active patients.`,
      page: 'patients',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300'
    },
    {
      title: 'Diversity & Demographic Analytics',
      desc: 'Inspect representation breakdown across gender, race, and age groups versus trial eligibility.',
      page: 'analytics',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300'
    },
    {
      title: 'Multi-Format Patient Import',
      desc: 'Import patient records from CSV, TXT notes, Word DOCX, or digital text-based PDF files.',
      page: 'import',
      icon: UploadCloud,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300'
    },
    {
      title: 'Downloadable Matching Results',
      desc: 'Export verified clinical eligibility results to formula-safe CSV and structured JSON reports.',
      page: 'export',
      icon: Download,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <MetricCards
        totalPatients={patients.length}
        totalTrials={trials.length}
        eligibleCount={eligibleCount}
        pendingCount={pendingCount}
        evaluatedCount={evaluatedCount}
      />

      {/* Trial Selector Spotlight */}
      <TrialSelector
        trials={trials}
        selectedTrial={selectedTrial}
        onSelectTrial={onSelectTrial}
      />

      {/* Match Cohort Status & Quick Protocol Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Match Status Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Eligibility Status Distribution · {selectedTrial?.trial_id}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active evaluated cohort: <span className="font-semibold text-slate-700 capitalize">{activeDataset}</span> ({evaluatedCount} patients evaluated)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('matching')}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              <span>View Full Evaluation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress / Status Distribution Bar */}
          {evaluatedCount > 0 ? (
            <div className="space-y-3">
              <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                <div
                  style={{ width: `${(eligibleCount / evaluatedCount) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Eligible: ${eligibleCount}`}
                />
                <div
                  style={{ width: `${(pendingCount / evaluatedCount) * 100}%` }}
                  className="bg-amber-400 transition-all"
                  title={`Pending Info: ${pendingCount}`}
                />
                <div
                  style={{ width: `${(ineligibleCount / evaluatedCount) * 100}%` }}
                  className="bg-slate-300 transition-all"
                  title={`Ineligible: ${ineligibleCount}`}
                />
              </div>

              {/* 3 Status Cards */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-1 text-emerald-800 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Eligible</span>
                  </div>
                  <strong className="text-xl text-emerald-950 font-extrabold">{eligibleCount}</strong>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">
                    {evaluatedCount > 0 ? `${((eligibleCount / evaluatedCount) * 100).toFixed(0)}%` : '0%'} of cohort
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-1 text-amber-800 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Info</span>
                  </div>
                  <strong className="text-xl text-amber-950 font-extrabold">{pendingCount}</strong>
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    {evaluatedCount > 0 ? `${((pendingCount / evaluatedCount) * 100).toFixed(0)}%` : '0%'} needs labs
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-1 text-slate-700 font-semibold mb-1">
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ineligible</span>
                  </div>
                  <strong className="text-xl text-slate-900 font-extrabold">{ineligibleCount}</strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {evaluatedCount > 0 ? `${((ineligibleCount / evaluatedCount) * 100).toFixed(0)}%` : '0%'} excluded
                  </span>
                </div>
              </div>

              {/* Top Candidates Preview List */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-2">High-Match Candidates Sample:</h4>
                <div className="space-y-1.5">
                  {evaluationData?.results?.slice(0, 4).map((r) => (
                    <div
                      key={r.patient_id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{r.patient_id}</span>
                        <span className="text-slate-500 text-[11px]">
                          ({r.patient_summary?.age}y, {r.patient_summary?.gender})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.match_status === 'ELIGIBLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.match_status === 'ELIGIBLE' ? '100% Eligible' : r.match_status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO' ? `${r.match_score}% Pending` : '0% Ineligible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching evaluations recorded yet. Run an eligibility check to see candidate ranking.
            </div>
          )}
        </div>

        {/* Right Column: Active Patient Cohort Snapshot (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Active Cohort Preview</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {patients.length} patient records loaded in <span className="capitalize font-medium">{activeDataset}</span> view
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('patients')}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[340px]">
            {patients.slice(0, 5).map((p) => (
              <div
                key={p.patient_id}
                onClick={() => onViewPatientDetails(p)}
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{p.patient_id}</span>
                    <span className="text-slate-500 text-[11px]">
                      {p.demographics?.age}y · {p.demographics?.gender}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Click to view EHR</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.conditions?.slice(0, 2).map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Workstations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.page}
                type="button"
                onClick={() => onNavigate(qa.page)}
                className={`p-4 rounded-xl border text-left transition-all hover:shadow-sm flex flex-col justify-between ${qa.color}`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center mb-2 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1">{qa.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{qa.desc}</p>
                </div>
                <div className="mt-3 flex items-center space-x-1 text-[11px] font-bold text-slate-800">
                  <span>Open Page</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
