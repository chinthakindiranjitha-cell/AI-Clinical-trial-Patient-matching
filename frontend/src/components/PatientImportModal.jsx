import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Info,
  Pill,
  Activity,
  UserCheck
} from 'lucide-react';
import { uploadPatientFile, confirmPatientImport } from '../services/api';

export default function PatientImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [duplicateResolution, setDuplicateResolution] = useState('assign_new_id');
  const [isDragOver, setIsDragOver] = useState(false);

  // Editable single draft patient state (for TXT / DOCX / PDF notes)
  const [draftPatient, setDraftPatient] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setDraftPatient(null);
    setError(null);
    setUploading(false);
    setConfirming(false);
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit: 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    // Check extension
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExts = ['csv', 'txt', 'docx', 'pdf'];
    if (!validExts.includes(ext)) {
      setError(`Unsupported file extension '.${ext}'. Allowed formats: .csv, .txt, .docx, .pdf (Max 10MB).`);
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setError(null);

    try {
      const data = await uploadPatientFile(selectedFile);
      setPreviewData(data);
      if (data.draft_patient) {
        setDraftPatient(data.draft_patient);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and parse file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmSave = async () => {
    setConfirming(true);
    setError(null);
    try {
      let recordsToSave = [];

      if (previewData.format === 'CSV') {
        recordsToSave = previewData.valid_records || [];
      } else if (draftPatient) {
        recordsToSave = [draftPatient];
      }

      if (recordsToSave.length === 0) {
        throw new Error('No valid records to confirm.');
      }

      const res = await confirmPatientImport(recordsToSave, duplicateResolution);
      onImportSuccess(res);
      handleReset();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving confirmed patient records.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Format Patient Data Import
              </h3>
              <p className="text-xs text-slate-500">
                Bulk CSV records or unstructured clinical notes (.txt, .docx, .pdf)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="font-semibold block">Import Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Upload File Area (if no preview yet) */}
          {!previewData && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-3 ${
                  isDragOver
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.docx,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />

                <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-sky-600">
                  {uploading ? (
                    <RotateCcw className="w-6 h-6 animate-spin text-sky-600" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {uploading ? 'Parsing and extracting clinical data...' : 'Drop your file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts structured records or unstructured clinical progress notes
                  </p>
                </div>

                {/* Accepted Types Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>.CSV (Bulk)</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>.TXT (Notes)</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>.DOCX (Word)</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>.PDF (Digital)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">Max 10 MB</span>
                </div>
              </div>

              {/* Format Guidance Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  <span>Format Specifications & Validation Rules:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>CSV:</strong> Must include headers for <code>age</code> and <code>gender</code>. Optional: <code>conditions</code>, <code>biomarkers</code>, <code>medications</code>, <code>allergies</code>.</li>
                  <li><strong>TXT, DOCX, & PDF:</strong> Narrative text is automatically processed using our clinical fact extractor (diagnoses, labs, medications, vitals).</li>
                  <li><strong>Scanned PDFs:</strong> Scanned images without selectable digital text are rejected (OCR not supported).</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: CSV Preview & Validation */}
          {previewData && previewData.format === 'CSV' && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{previewData.filename}</span>
                  <span className="text-slate-500">({(previewData.size_bytes / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex items-center space-x-3 font-semibold">
                  <span className="text-emerald-700">
                    ✓ {previewData.summary?.valid_count} Valid Rows
                  </span>
                  {previewData.summary?.rejected_count > 0 && (
                    <span className="text-rose-600">
                      ✗ {previewData.summary?.rejected_count} Rejected Rows
                    </span>
                  )}
                </div>
              </div>

              {/* Duplicate ID Resolution Notice */}
              {previewData.has_duplicate_ids && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Existing Patient ID Collision Detected</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Some rows share patient IDs already present in the cohort. Select how to resolve:
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="dup_resolution"
                        value="assign_new_id"
                        checked={duplicateResolution === 'assign_new_id'}
                        onChange={(e) => setDuplicateResolution(e.target.value)}
                        className="text-sky-600"
                      />
                      <span>Assign New Auto IDs (Recommended)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="dup_resolution"
                        value="update_existing"
                        checked={duplicateResolution === 'update_existing'}
                        onChange={(e) => setDuplicateResolution(e.target.value)}
                        className="text-sky-600"
                      />
                      <span>Update Existing Records</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="dup_resolution"
                        value="skip_duplicate"
                        checked={duplicateResolution === 'skip_duplicate'}
                        onChange={(e) => setDuplicateResolution(e.target.value)}
                        className="text-sky-600"
                      />
                      <span>Skip Colliding Rows</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Valid Records Table Preview */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                  Validated Candidate Records ({previewData.valid_records?.length})
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 sticky top-0 text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Patient ID</th>
                        <th className="py-2 px-3">Age / Gender</th>
                        <th className="py-2 px-3">Conditions</th>
                        <th className="py-2 px-3">Biomarkers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.valid_records?.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {r.patient_id || <em className="text-slate-400">Auto-assign</em>}
                            {r.is_duplicate_id && (
                              <span className="ml-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded">
                                ID exists
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {r.demographics.age}y / {r.demographics.gender}
                          </td>
                          <td className="py-2 px-3">{r.conditions?.join(', ') || 'None'}</td>
                          <td className="py-2 px-3 font-mono text-[11px]">
                            {Object.entries(r.biomarkers || {})
                              .map(([k, v]) => `${k}:${v}`)
                              .join('; ') || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rejected Records Details */}
              {previewData.rejected_records?.length > 0 && (
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                  <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Rejected Records ({previewData.rejected_records.length})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {previewData.rejected_records.map((rej, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-rose-200 text-[11px]">
                        <span className="font-bold text-rose-700">Row #{rej.row_number}:</span>{' '}
                        <span className="text-slate-700">{rej.errors?.join('; ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Unstructured Clinical Note Preview & Extracted Profile */}
          {previewData && previewData.format !== 'CSV' && draftPatient && (
            <div className="space-y-4">
              {/* Document Info Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900">{previewData.filename}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                    {previewData.format}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Method: <strong className="text-slate-700">{previewData.extraction_method}</strong>
                </div>
              </div>

              {/* Extracted Facts with Provenance Highlights */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600" />
                  <span>Extracted Medical Facts with Verbatim Text Evidence ({previewData.extracted_facts?.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  {previewData.extracted_facts?.map((fact, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded text-[11px] bg-white border border-slate-200 shadow-2xs"
                      title={`Evidence: "${fact.evidence_text}"`}
                    >
                      <strong className="text-slate-800 mr-1">{fact.field_name}:</strong>{' '}
                      <span className="text-sky-700 font-semibold">{String(fact.value)}</span>
                      {fact.unit && <span className="ml-1 text-slate-500">{fact.unit}</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Editable Candidate EHR Form */}
              <div className="p-4 bg-sky-50/30 rounded-xl border border-sky-100 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Researcher Review: Candidate Patient EHR Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Patient ID (Assigned)
                    </label>
                    <input
                      type="text"
                      value={draftPatient.patient_id || ''}
                      onChange={(e) => setDraftPatient({ ...draftPatient, patient_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      value={draftPatient.demographics?.age || 0}
                      onChange={(e) =>
                        setDraftPatient({
                          ...draftPatient,
                          demographics: { ...draftPatient.demographics, age: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={draftPatient.demographics?.gender || 'unknown'}
                      onChange={(e) =>
                        setDraftPatient({
                          ...draftPatient,
                          demographics: { ...draftPatient.demographics, gender: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Diagnosed Conditions (Semicolon-separated)
                  </label>
                  <input
                    type="text"
                    value={draftPatient.conditions?.join('; ') || ''}
                    onChange={(e) =>
                      setDraftPatient({
                        ...draftPatient,
                        conditions: e.target.value.split(';').map((s) => s.trim()).filter(Boolean)
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                {/* Key Biomarkers */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Extracted Biomarkers
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(draftPatient.biomarkers || {}).map(([key, val]) => (
                      <div key={key} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{key}:</span>
                        <strong className="text-slate-900">{String(val)}</strong>
                      </div>
                    ))}
                    {Object.keys(draftPatient.biomarkers || {}).length === 0 && (
                      <span className="text-slate-400 italic col-span-4">No lab biomarkers detected in note</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between">
          <div>
            {previewData && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>

            {previewData && (
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={confirming}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Add to Cohort</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
