import React from 'react';
import PatientExplorer from '../components/PatientExplorer';
import { Users, UploadCloud, Database, ShieldCheck } from 'lucide-react';

export default function PatientsPage({
  patients = [],
  selectedPatient,
  onSelectPatient,
  onViewDetails,
  onOpenImport,
  loading,
  activeDataset = 'demo',
  onChangeDataset,
  selectedBatchId = '',
  onChangeBatchId,
  batches = [],
  demoCount = 25,
  importedCount = 0
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Patient Cohort Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and inspect Electronic Health Records (EHRs), lab biomarkers, documented diagnoses, and source healthcare organization details.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Patient Records</span>
          </button>
        </div>
      </div>

      {/* Explorer Component */}
      <PatientExplorer
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={onSelectPatient}
        onViewDetails={onViewDetails}
        onOpenImport={onOpenImport}
        loading={loading}
        activeDataset={activeDataset}
        onChangeDataset={onChangeDataset}
        selectedBatchId={selectedBatchId}
        onChangeBatchId={onChangeBatchId}
        batches={batches}
        demoCount={demoCount}
        importedCount={importedCount}
      />
    </div>
  );
}
