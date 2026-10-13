import React, { useState } from 'react';
import {
  X,
  User,
  Activity,
  Pill,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  FlaskConical,
  Info
} from 'lucide-react';

export default function PatientEligibilityModal({ matchResult, onClose }) {
  if (!matchResult) return null;

  const [activeTab, setActiveTab] = useState('criteria'); // 'criteria' | 'clinical' | 'organization'

  const patient = matchResult.patient_summary || {};
  const trial = matchResult.trial_summary || {};
  const org = patient.organization || {};
  const status = matchResult.match_status;
  const score = matchResult.match_score ?? 0;
  const summary = matchResult.summary || { satisfied_count: 0, violated_count: 0, unknown_count: 0 };
  const inclusions = matchResult.inclusion_results || [];
  const exclusions = matchResult.exclusion_results || [];
  const unknownList = matchResult.unknown_criteria || [];

  const getStatusBadge = () => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ELIGIBLE · {score}%</span>
          </span>
        );
      case 'POTENTIALLY_ELIGIBLE_PENDING_INFO':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>PENDING INFO · {score}%</span>
          </span>
        );
      case 'INELIGIBLE':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>INELIGIBLE · 0%</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {patient.patient_id} · Protocol Eligibility Evaluation
                </h3>
                {patient.dataset_source && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      patient.dataset_source === 'imported'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {patient.dataset_source}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trial: <strong className="text-slate-800 font-semibold">{trial.trial_id || 'Selected Trial'}</strong> · {trial.title || 'Protocol Evaluation'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 bg-white flex space-x-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'criteria'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Eligibility Criteria & Evidence ({inclusions.length + exclusions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'clinical'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Patient Clinical & Demographic Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('organization')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'organization'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Source Organization Details</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {activeTab === 'criteria' && (
            <div className="space-y-5">
              {/* Trial Protocol & Description Callout */}
              {trial.description && (
                <div className="p-4 rounded-xl border border-sky-200/80 bg-sky-50/40 text-slate-800 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 font-bold text-sky-950 text-xs">
                      <FlaskConical className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Trial Protocol Overview & Objectives · {trial.trial_id || 'Protocol'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {trial.phase && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold border border-sky-200">
                          {trial.phase}
                        </span>
                      )}
                      {trial.therapeutic_area && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                          {trial.therapeutic_area}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="leading-relaxed text-xs text-slate-700">
                    {trial.description}
                  </p>
                </div>
              )}

              {/* Clinical Rationale Summary */}
              <div
                className={`p-4 rounded-xl border ${
                  status === 'ELIGIBLE'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : status === 'POTENTIALLY_ELIGIBLE_PENDING_INFO'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Clinical Eligibility Decision Rationale</span>
                </div>
                <p className="leading-relaxed">{matchResult.clinical_rationale}</p>
              </div>

              {/* Criteria Summary Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider block">
                    Satisfied Criteria
                  </span>
                  <span className="text-xl font-bold text-emerald-800">{summary.satisfied_count}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[11px] text-rose-700 font-semibold uppercase tracking-wider block">
                    Violated Criteria
                  </span>
                  <span className="text-xl font-bold text-rose-800">{summary.violated_count}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider block">
                    Missing / Unknown
                  </span>
                  <span className="text-xl font-bold text-amber-800">{summary.unknown_count}</span>
                </div>
              </div>

              {/* Missing Information Callout */}
              {unknownList.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Missing Clinical Data Requiring Diagnostic Confirmation ({unknownList.length})</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                    {unknownList.map((crit, idx) => (
                      <li key={idx}>
                        <strong>{crit.criterion_id}:</strong> {crit.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inclusion Criteria Evaluation */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Protocol Inclusion Criteria Evaluation ({inclusions.length})</span>
                </h4>
                <div className="space-y-2">
                  {inclusions.map((crit) => (
                    <div
                      key={crit.criterion_id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        crit.satisfied
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : crit.unknown
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {crit.criterion_id}
                            </span>
                            <span className="font-medium text-slate-900">{crit.description}</span>
                          </div>
                          {crit.evidence && (
                            <p className="text-slate-600 text-[11px] pl-2 border-l-2 border-slate-300">
                              <strong>Supporting Evidence:</strong> {crit.evidence}
                            </p>
                          )}
                          {crit.reasoning && (
                            <p className="text-slate-500 text-[11px] pl-2">
                              <em>Reasoning:</em> {crit.reasoning}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${
                            crit.satisfied
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : crit.unknown
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {crit.satisfied ? 'Satisfied' : crit.unknown ? 'Unknown / Pending' : 'Not Satisfied'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusion Criteria Evaluation */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Protocol Exclusion Criteria Evaluation ({exclusions.length})</span>
                </h4>
                <div className="space-y-2">
                  {exclusions.map((crit) => (
                    <div
                      key={crit.criterion_id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        crit.violated
                          ? 'bg-rose-50/40 border-rose-200'
                          : crit.unknown
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-emerald-50/40 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {crit.criterion_id}
                            </span>
                            <span className="font-medium text-slate-900">{crit.description}</span>
                          </div>
                          {crit.evidence && (
                            <p className="text-slate-600 text-[11px] pl-2 border-l-2 border-slate-300">
                              <strong>Supporting Evidence:</strong> {crit.evidence}
                            </p>
                          )}
                          {crit.reasoning && (
                            <p className="text-slate-500 text-[11px] pl-2">
                              <em>Reasoning:</em> {crit.reasoning}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${
                            crit.violated
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : crit.unknown
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {crit.violated ? 'VIOLATED (Excluded)' : crit.unknown ? 'Unknown / Pending' : 'No Violation'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="space-y-5">
              {/* Demographics Card */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>Demographic Profile</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Age</span>
                    <strong className="text-slate-900 text-sm">{patient.age ?? 'N/A'} yrs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender</span>
                    <strong className="text-slate-900 capitalize text-sm">{patient.gender || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Race</span>
                    <strong className="text-slate-900 text-sm">{patient.race || 'Undisclosed'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ethnicity</span>
                    <strong className="text-slate-900 text-sm">{patient.ethnicity || 'Undisclosed'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Postal Code</span>
                    <strong className="text-slate-900 text-sm">{patient.postal_code || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Conditions Diagnoses */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Documented Diagnoses & Medical Conditions</span>
                </h4>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[50px]">
                  {patient.conditions && patient.conditions.length > 0 ? (
                    patient.conditions.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No conditions documented.</span>
                  )}
                </div>
              </div>

              {/* Biomarkers & Labs */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>Biomarkers & Laboratory Measurements</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(patient.biomarkers || {}).length > 0 ? (
                    Object.entries(patient.biomarkers || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <span className="text-slate-600 font-medium">{key}</span>
                        <strong className="text-slate-900 font-mono">
                          {val !== null && val !== undefined ? String(val) : <em className="text-amber-600">Pending</em>}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                      No biomarker values recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Medications & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Active Medications</span>
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[60px]">
                    {patient.medications && patient.medications.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {patient.medications.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">No active medications documented.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Documented Allergies</span>
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[60px]">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-rose-700">
                        {patient.allergies.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">No known drug allergies (NKDA).</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    Source Healthcare Organization Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Organization Name
                    </span>
                    <strong className="text-slate-900 block mt-0.5 text-sm">
                      {org.name || 'Not available'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Official Phone Number
                    </span>
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.phone || 'Not available'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Facility Address
                    </span>
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.address || 'Not available'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Official Website / Portal
                    </span>
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.website || 'Not available'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Official Institutional Email
                    </span>
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.email || 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Evaluating exact patient: <strong className="text-slate-700">{patient.patient_id}</strong> against trial <strong className="text-slate-700">{trial.trial_id}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Close Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}
