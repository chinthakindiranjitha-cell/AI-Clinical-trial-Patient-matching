import React from 'react';
import { X, User, Activity, Pill, AlertCircle, FileText } from 'lucide-react';

export default function PatientDetailModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient EHR Record: {patient.patient_id}
              </h3>
              <p className="text-xs text-slate-500">
                {patient.demographics.age} years old · {patient.demographics.gender} · {patient.demographics.race || 'Race unspecified'}
              </p>
            </div>
          </div>
          <button
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
              <div className="flex items-center space-x-1.5 font-bold text-sky-900 mb-1">
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
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
              Demographic Profile
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Age</span>
                <strong className="text-slate-800">{patient.demographics.age}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Gender</span>
                <strong className="text-slate-800 capitalize">{patient.demographics.gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Race</span>
                <strong className="text-slate-800">{patient.demographics.race || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ethnicity</span>
                <strong className="text-slate-800">{patient.demographics.ethnicity || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
              Documented Diagnoses & Conditions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions?.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Biomarkers */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Biomarkers & Laboratory Values</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(patient.biomarkers || {}).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <span className="text-slate-500 font-medium">{key}</span>
                  <span className="font-bold text-slate-900">
                    {val !== null && val !== undefined ? String(val) : <em className="text-amber-600">Pending</em>}
                  </span>
                </div>
              ))}
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
                {patient.medications?.length > 0 ? (
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
                {patient.allergies?.length > 0 ? (
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
