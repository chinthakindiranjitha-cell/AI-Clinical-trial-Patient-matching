import React, { useState } from 'react';
import { FlaskConical, ChevronDown, Info, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function TrialSelector({ trials = [], selectedTrial, onSelectTrial }) {
  const [showCriteria, setShowCriteria] = useState(false);

  const getAreaColor = (area) => {
    switch (area?.toLowerCase()) {
      case 'oncology':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'endocrinology':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cardiology':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'neurology':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-sky-600" />
            <span>Target Clinical Trial Protocol</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select protocol to evaluate eligibility criteria against patient records
          </p>
        </div>

        {/* Dropdown */}
        <div className="relative min-w-[280px]">
          <select
            value={selectedTrial?.trial_id || ''}
            onChange={(e) => {
              const trial = trials.find((t) => t.trial_id === e.target.value);
              if (trial) onSelectTrial(trial);
            }}
            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
          >
            {trials.map((t) => (
              <option key={t.trial_id} value={t.trial_id}>
                {t.trial_id} - {t.therapeutic_area} ({t.phase})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {selectedTrial && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-base font-bold text-slate-900">
              {selectedTrial.trial_id}: {selectedTrial.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getAreaColor(selectedTrial.therapeutic_area)}`}>
              {selectedTrial.therapeutic_area}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {selectedTrial.phase}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Status: {selectedTrial.status}
            </span>
            <span className="text-xs text-slate-500">
              Target Enrollment: <strong className="text-slate-700">{selectedTrial.target_enrollment}</strong> participants
            </span>
          </div>

          {selectedTrial.description && (
            <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="uppercase tracking-wider text-[11px] text-slate-600">Protocol Overview & Clinical Objectives</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {selectedTrial.description}
              </p>
            </div>
          )}

          {/* Toggle Criteria View */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCriteria(!showCriteria)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
            >
              <span>{showCriteria ? 'Hide Protocol Rules' : `View Rules (${selectedTrial.inclusion_criteria?.length || 0} Inclusion, ${selectedTrial.exclusion_criteria?.length || 0} Exclusion)`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showCriteria ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCriteria && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
              {/* Inclusion */}
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-800 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory Inclusion Criteria</span>
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  {selectedTrial.inclusion_criteria?.map((inc) => (
                    <li key={inc.criterion_id} className="flex items-start space-x-1.5">
                      <span className="font-semibold text-emerald-700 whitespace-nowrap">[{inc.criterion_id}]</span>
                      <span>{inc.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusion */}
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/60">
                <div className="flex items-center space-x-1.5 font-bold text-rose-800 mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Mandatory Exclusion Criteria</span>
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  {selectedTrial.exclusion_criteria?.map((exc) => (
                    <li key={exc.criterion_id} className="flex items-start space-x-1.5">
                      <span className="font-semibold text-rose-700 whitespace-nowrap">[{exc.criterion_id}]</span>
                      <span>{exc.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
