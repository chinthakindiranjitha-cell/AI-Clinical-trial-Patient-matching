import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle2, FileText, User, UploadCloud } from 'lucide-react';

export default function PatientExplorer({
  patients = [],
  selectedPatient,
  onSelectPatient,
  onViewDetails,
  onOpenImport,
  loading
}) {
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Extract unique conditions list for filter dropdown
  const uniqueConditions = useMemo(() => {
    const set = new Set();
    patients.forEach((p) => {
      p.conditions?.forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [patients]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.patient_id.toLowerCase().includes(q) ||
        (p.notes_summary && p.notes_summary.toLowerCase().includes(q)) ||
        p.conditions?.some((c) => c.toLowerCase().includes(q));

      const matchesCondition =
        selectedCondition === 'ALL' ||
        p.conditions?.some((c) => c === selectedCondition);

      return matchesSearch && matchesCondition;
    });
  }, [patients, search, selectedCondition]);

  const formatBiomarkers = (biomarkers = {}) => {
    const keys = Object.keys(biomarkers).filter(
      (k) => biomarkers[k] !== null && biomarkers[k] !== undefined
    );
    if (keys.length === 0) return <span className="text-slate-400 italic">None recorded</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {keys.slice(0, 3).map((k) => (
          <span
            key={k}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
          >
            {k}: <strong className="ml-1 text-slate-900">{String(biomarkers[k])}</strong>
          </span>
        ))}
        {keys.length > 3 && (
          <span className="text-[10px] text-slate-400 self-center">+{keys.length - 3}</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4 text-sky-600" />
            <span>Patient Cohort Explorer</span>
            <span className="text-xs font-normal text-slate-500 lowercase">
              ({filteredPatients.length} of {patients.length})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a specific patient to evaluate individual eligibility or view comprehensive health records
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Condition Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
            >
              <option value="ALL">All Conditions ({uniqueConditions.length})</option>
              {uniqueConditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Import Button */}
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap"
              title="Import from CSV, TXT, DOCX, or PDF"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
              <span>Import File</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading patient records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No patient records match the filter criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Demographics</th>
                <th className="py-2.5 px-3">Conditions</th>
                <th className="py-2.5 px-3">Key Biomarkers</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const isSelected = selectedPatient?.patient_id === patient.patient_id;
                return (
                  <tr
                    key={patient.patient_id}
                    onClick={() => onSelectPatient(patient)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50/80 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                        )}
                        <span>{patient.patient_id}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                      <div>
                        <strong className="text-slate-800">{patient.demographics.age}y</strong> / {patient.demographics.gender}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {patient.demographics.race || 'Race unspecified'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {patient.conditions?.map((c) => (
                          <span
                            key={c}
                            className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {formatBiomarkers(patient.biomarkers)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(patient);
                          }}
                          className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded"
                          title="View Full Health Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPatient(patient)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
