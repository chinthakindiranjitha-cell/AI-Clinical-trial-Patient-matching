import React from 'react';
import { Users, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MetricCards({
  totalPatients = 0,
  totalTrials = 0,
  eligibleCount = 0,
  pendingCount = 0,
  evaluatedCount = 0
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Patients */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort Patients</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalPatients}</h3>
          <p className="text-xs text-slate-500 mt-1">Synthetic EHR records</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Active Clinical Trials */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Protocols</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTrials}</h3>
          <p className="text-xs text-slate-500 mt-1">4 therapeutic areas</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FlaskConical className="w-6 h-6" />
        </div>
      </div>

      {/* Confirmed Eligible Matches */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible Candidates</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <h3 className="text-2xl font-bold text-emerald-600">{eligibleCount}</h3>
            {evaluatedCount > 0 && (
              <span className="text-xs text-slate-500">/ {evaluatedCount} evaluated</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">All criteria satisfied</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Pending / Insufficient Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Info</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <h3 className="text-2xl font-bold text-amber-600">{pendingCount}</h3>
            {evaluatedCount > 0 && (
              <span className="text-xs text-slate-500">needs lab data</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Unknown criteria flagged</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
