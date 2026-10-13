import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  Pill,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Save,
  RotateCcw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { updatePatientRecruitment } from '../services/api';

export default function PatientDetailModal({ patient, onClose, onUpdatePatient }) {
  if (!patient) return null;

  const initialContact = patient.recruitment_contact || {};
  const [status, setStatus] = useState(initialContact.recruitment_status || 'Not Contacted');
  const [notes, setNotes] = useState(initialContact.notes || '');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const contact = patient.recruitment_contact || {};
    setStatus(contact.recruitment_status || 'Not Contacted');
    setNotes(contact.notes || '');
    setSavedMessage(false);
    setSaveError(null);
  }, [patient]);

  const handleSaveContact = async () => {
    setSaving(true);
    setSaveError(null);
    setSavedMessage(false);
    try {
      const res = await updatePatientRecruitment(patient.patient_id, {
        recruitment_status: status,
        notes: notes
      });
      setSavedMessage(true);
      if (onUpdatePatient && res.patient) {
        onUpdatePatient(res.patient);
      }
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update recruitment details.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'Interested':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Contacted':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Follow-up Required':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Declined':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Not Contacted':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

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
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Patient EHR Record: {patient.patient_id}
                </h3>
                {patient.dataset_source && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      patient.dataset_source === 'imported'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {patient.dataset_source}
                  </span>
                )}
              </div>
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

          {/* Recruitment Contact Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Recruitment Contact & Coordinator Outreach
                </h4>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(
                  status
                )}`}
              >
                {status}
              </span>
            </div>

            {/* Read-only contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Person & Relationship</span>
                <strong className="text-slate-900">
                  {initialContact.contact_person || <em className="text-slate-400 font-normal">Not provided</em>}
                </strong>
                {initialContact.relationship && (
                  <span className="text-slate-500 ml-1 font-normal">({initialContact.relationship})</span>
                )}
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fictional Telephone</span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{initialContact.phone || <em className="text-slate-400 font-normal">Unknown / None</em>}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fictional Email Address</span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{initialContact.email || <em className="text-slate-400 font-normal">Unknown / None</em>}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Preferred Channel & Window</span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="capitalize">
                    {initialContact.preferred_contact_method || 'Any'}
                    {initialContact.availability ? ` (${initialContact.availability})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Coordinator Status & Notes */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-1/2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Update Recruitment Follow-up Status:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  >
                    <option value="Not Contacted">Not Contacted</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Declined">Declined</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                  </select>
                </div>

                <div className="w-full sm:w-1/2 flex items-end">
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Update...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Recruitment Update</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Researcher Outreach & Compliance Notes:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record coordinator notes, consent discussion logs, or IRB scheduling details..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {savedMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recruitment outreach status updated successfully.</span>
                </div>
              )}

              {saveError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Error saving recruitment status: {saveError}</span>
                </div>
              )}
            </div>

            {/* IRB / Protocol Consent Disclaimer */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-amber-800 text-[11px] flex items-start space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Protocol Governance Advisory:</strong> Clinical trial matching eligibility is strictly separate from patient informed consent or trial enrollment. Fictional contact information only.
              </span>
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
