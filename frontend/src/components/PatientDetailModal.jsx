import React from 'react';
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
  Calendar,
  Layers
} from 'lucide-react';

export default function PatientDetailModal({ patient, onClose }) {
  if (!patient) return null;

  const org = patient.organization || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Patient EHR Profile: {patient.patient_id}
                </h3>
                {patient.dataset_source && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      patient.dataset_source === 'imported'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {patient.dataset_source}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {patient.demographics?.age} years old · {patient.demographics?.gender} · {patient.demographics?.race || 'Race unspecified'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Clinical Narrative */}
          {patient.notes_summary && (
            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100">
              <div className="flex items-center space-x-1.5 font-bold text-sky-950 mb-1">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Clinical Narrative Summary</span>
              </div>
              <p className="text-slate-700 leading-relaxed italic">
                "{patient.notes_summary}"
              </p>
            </div>
          )}

          {/* Demographics */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-sky-600" />
              <span>Demographic Profile</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Age</span>
                <strong className="text-slate-800 text-sm">{patient.demographics?.age ?? 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <strong className="text-slate-800 capitalize text-sm">{patient.demographics?.gender ?? 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Race</span>
                <strong className="text-slate-800 text-sm">{patient.demographics?.race || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ethnicity</span>
                <strong className="text-slate-800 text-sm">{patient.demographics?.ethnicity || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Source Organization Details Section (Requirement 1) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-2">
              <Building2 className="w-4 h-4 text-sky-700" />
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Source Organization Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Organization Name
                </span>
                <strong className="text-slate-900 block mt-0.5">
                  {org.name || 'Not available'}
                </strong>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Official Phone Number
                </span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{org.phone || 'Not available'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Facility Address
                </span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{org.address || 'Not available'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Official Website / Portal
                </span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{org.website || 'Not available'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Official Email Address
                </span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{org.email || 'Not available'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documented Diagnoses */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Documented Diagnoses & Conditions</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions && patient.conditions.length > 0 ? (
                patient.conditions.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No conditions recorded</span>
              )}
            </div>
          </div>

          {/* Biomarkers */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Biomarkers & Laboratory Values</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(patient.biomarkers || {}).length > 0 ? (
                Object.entries(patient.biomarkers || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <span className="text-slate-500 font-medium">{key}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {val !== null && val !== undefined ? String(val) : <em className="text-amber-600">Pending</em>}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-slate-400 italic col-span-full">No biomarkers documented</span>
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
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
                {patient.medications && patient.medications.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {patient.medications.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 italic">No active medications documented</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Drug Allergies</span>
              </h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
                {patient.allergies && patient.allergies.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-rose-700">
                    {patient.allergies.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 italic">No known drug allergies (NKDA)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Close EHR Record
          </button>
        </div>
      </div>
    </div>
  );
}
