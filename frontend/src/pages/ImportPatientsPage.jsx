import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Info,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileCode,
  Tag
} from 'lucide-react';
import { uploadPatientFile, confirmPatientImport } from '../services/api';

export default function ImportPatientsPage({
  onImportSuccess,
  batches = [],
  activeDataset = 'demo',
  selectedBatchId = '',
  onSelectBatch
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [duplicateResolution, setDuplicateResolution] = useState('assign_new_id');
  const [isDragOver, setIsDragOver] = useState(false);
  const [draftPatient, setDraftPatient] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const fileInputRef = useRef(null);

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

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExts = ['csv', 'txt', 'docx', 'pdf'];
    if (!validExts.includes(ext)) {
      setError(`Unsupported file extension '.${ext}'. Allowed formats: .csv, .txt, .docx, .pdf (Max 10MB).`);
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setError(null);
    setSuccessBanner(null);

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

      const res = await confirmPatientImport(recordsToSave, duplicateResolution, {
        batch_name: `Import: ${previewData.filename}`,
        filename: previewData.filename,
        format: previewData.format
      });

      setSuccessBanner({
        batch_id: res.import_batch_id,
        count: res.imported_count || recordsToSave.length,
        filename: previewData.filename
      });

      if (onImportSuccess) {
        onImportSuccess(res);
      }

      handleReset();
    } catch (err) {
      setError(err.message || 'Error saving confirmed patient records.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Multi-Format Patient Data Import
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bulk CSV records or unstructured clinical progress notes (.txt, .docx, .pdf) with automatic entity extraction.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Database className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-700">Isolated Import Batches</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between shadow-xs animate-in fade-in">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-950">
              <h4 className="font-bold text-sm">
                Import Succeeded · Dataset Switched to Active Batch
              </h4>
              <p className="mt-1">
                Successfully imported <strong className="font-bold">{successBanner.count} patient records</strong> from <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{successBanner.filename}</code>.
              </p>
              <p className="mt-1">
                Assigned Import Batch ID: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{successBanner.batch_id}</code>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <strong className="font-bold block text-rose-950">Import Processing Error</strong>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Import Workstation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {!previewData && (
          <>
            {/* Drag and Drop Zone Styled after reference image */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragOver
                  ? 'border-sky-500 bg-sky-50/50 scale-[1.005]'
                  : 'border-sky-300 hover:border-sky-400 bg-slate-50/30 hover:bg-slate-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Drop your file here, or click to browse
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Accepts structured records or unstructured clinical progress notes
                </p>
              </div>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>.CSV (Bulk)</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>.TXT (Notes)</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>.DOCX (Word)</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>.PDF (Digital)</span>
                </span>
                <span className="text-slate-400 text-xs font-medium pl-1">Max 10 MB</span>
              </div>

              {uploading && (
                <div className="flex items-center space-x-2 text-sky-600 text-xs font-semibold pt-2">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Uploading & analyzing document facts...</span>
                </div>
              )}
            </div>

            {/* Validation Rules Card styled after reference image */}
            <div className="p-4 bg-sky-50/50 border border-sky-200/70 rounded-xl text-xs text-slate-700 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sky-950">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Format Specifications & Validation Rules:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                <li>
                  <strong className="text-slate-800">CSV:</strong> Must include headers for <code className="bg-sky-100 text-sky-900 px-1 py-0.5 rounded font-mono">age</code> and <code className="bg-sky-100 text-sky-900 px-1 py-0.5 rounded font-mono">gender</code>. Optional: conditions, biomarkers, medications, allergies, organization details.
                </li>
                <li>
                  <strong className="text-slate-800">TXT, DOCX, & PDF:</strong> Narrative text is automatically processed using our deterministic clinical fact extractor (diagnoses, labs, medications, vitals).
                </li>
                <li>
                  <strong className="text-slate-800">Scanned PDFs:</strong> Scanned images without selectable digital text are rejected (OCR not supported).
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Preview State & Confirmation */}
        {previewData && (
          <div className="space-y-5 animate-in fade-in">
            {/* File Overview Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{previewData.filename}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                    {previewData.format}
                  </span>
                </div>
                <p className="text-slate-500">
                  {previewData.format === 'CSV'
                    ? `${previewData.summary?.valid_count} valid records parsed (${previewData.summary?.rejected_count} rejected)`
                    : '1 clinical progress note parsed and extracted'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 text-xs transition-colors"
                >
                  Cancel / Upload Another
                </button>
              </div>
            </div>

            {/* Duplicate Resolution Strategy */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <label className="block font-bold text-slate-800">
                Duplicate Patient ID Handling Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-3 rounded-lg border cursor-pointer flex items-center space-x-2 ${
                  duplicateResolution === 'assign_new_id'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="dupResolution"
                    value="assign_new_id"
                    checked={duplicateResolution === 'assign_new_id'}
                    onChange={(e) => setDuplicateResolution(e.target.value)}
                    className="text-sky-600"
                  />
                  <span>Assign new synthetic ID</span>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer flex items-center space-x-2 ${
                  duplicateResolution === 'update_existing'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="dupResolution"
                    value="update_existing"
                    checked={duplicateResolution === 'update_existing'}
                    onChange={(e) => setDuplicateResolution(e.target.value)}
                    className="text-sky-600"
                  />
                  <span>Update existing record</span>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer flex items-center space-x-2 ${
                  duplicateResolution === 'skip_duplicate'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="dupResolution"
                    value="skip_duplicate"
                    checked={duplicateResolution === 'skip_duplicate'}
                    onChange={(e) => setDuplicateResolution(e.target.value)}
                    className="text-sky-600"
                  />
                  <span>Skip duplicate rows</span>
                </label>
              </div>
            </div>

            {/* CSV Valid Records Table Preview */}
            {previewData.format === 'CSV' && previewData.valid_records && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                    Parsed Records Sample ({previewData.valid_records.length} total)
                  </h4>
                  <span className="text-slate-500 text-[11px]">Previewing first 5 rows</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5">Patient ID</th>
                        <th className="p-2.5">Demographics</th>
                        <th className="p-2.5">Conditions</th>
                        <th className="p-2.5">Biomarkers</th>
                        <th className="p-2.5">Organization</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.valid_records.slice(0, 5).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-900">{rec.patient_id || 'Auto-assigned'}</td>
                          <td className="p-2.5 text-slate-600">{rec.demographics?.age}y, {rec.demographics?.gender}</td>
                          <td className="p-2.5 text-slate-600 max-w-xs truncate">{rec.conditions?.join(', ')}</td>
                          <td className="p-2.5 font-mono text-slate-700 max-w-xs truncate">
                            {JSON.stringify(rec.biomarkers || {})}
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-[140px]">
                            {rec.organization?.name || 'Not available'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Note Clinical Draft Preview */}
            {draftPatient && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  Extracted Clinical Candidate Draft
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient ID</span>
                    <strong className="text-slate-900">{draftPatient.patient_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Age</span>
                    <strong className="text-slate-900">{draftPatient.demographics?.age ?? 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender</span>
                    <strong className="text-slate-900 capitalize">{draftPatient.demographics?.gender ?? 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Organization</span>
                    <strong className="text-slate-900">{draftPatient.organization?.name || 'Not available'}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] mb-1 font-semibold uppercase">Extracted Diagnoses</span>
                  <div className="flex flex-wrap gap-1">
                    {draftPatient.conditions?.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] mb-1 font-semibold uppercase">Extracted Biomarkers & Vitals</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(draftPatient.biomarkers || {}).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                        {k}: <strong>{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Save Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={confirming}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={confirming}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Importing & Isolating Batch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Import to Isolated Dataset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import History & Registered Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-600" />
              <span>Registered Import Batches ({batches.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each import creates an isolated batch identifier so custom cohorts never mix with seeded demo data.
            </p>
          </div>
        </div>

        {batches.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Batch ID</th>
                  <th className="p-3">Batch Name / File</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Record Count</th>
                  <th className="p-3">Imported At</th>
                  <th className="p-3 text-right">View Cohort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const isCurrent = selectedBatchId === b.batch_id;
                  return (
                    <tr key={b.batch_id} className={`hover:bg-slate-50/70 ${isCurrent ? 'bg-sky-50/40' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-800">{b.batch_id}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block">{b.batch_name}</span>
                        <span className="text-[11px] text-slate-500">{b.filename}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {b.format}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{b.record_count} records</td>
                      <td className="p-3 text-slate-500 text-[11px]">{new Date(b.imported_at).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectBatch && onSelectBatch(b.batch_id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-sky-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isCurrent ? 'Active View' : 'Select Batch'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No custom batches imported yet. Upload a file above to create an isolated cohort batch.
          </div>
        )}
      </div>
    </div>
  );
}
