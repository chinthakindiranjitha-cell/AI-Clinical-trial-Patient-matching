import React, { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronDown,
  RotateCcw,
  Scale,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchDiversityAnalytics } from '../services/api';

const COLOR_PALETTE = [
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
  '#f43f5e'  // Rose
];

export default function DiversityAnalyticsView({
  trials = [],
  defaultTrialId,
  activeDataset = 'demo',
  selectedBatchId = null,
  onChangeDataset,
  batches = []
}) {
  const [selectedTrialId, setSelectedTrialId] = useState(defaultTrialId || trials[0]?.trial_id || '');
  const [activeCategory, setActiveCategory] = useState('race'); // 'race' | 'ethnicity' | 'gender' | 'age_groups'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trials.length > 0 && !selectedTrialId) {
      setSelectedTrialId(trials[0].trial_id);
    }
  }, [trials, selectedTrialId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchDiversityAnalytics(selectedTrialId, activeDataset, selectedBatchId)
      .then((data) => {
        if (isMounted) {
          setAnalyticsData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load diversity analytics.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTrialId, activeDataset, selectedBatchId]);

  const selectedTrial = trials.find((t) => t.trial_id === selectedTrialId) || null;

  // Active category comparison data
  const comparisonList = analyticsData?.comparison?.[activeCategory] || [];

  // Data formatted for Recharts comparison BarChart
  const chartData = comparisonList.map((item) => ({
    name: item.name,
    'Cohort Share (%)': item.cohort_pct,
    'Eligible Share (%)': item.eligible_pct,
    cohortCount: item.cohort_count,
    eligibleCount: item.eligible_count
  }));

  // Pie chart data for overall cohort distribution
  const pieData = comparisonList
    .filter((item) => item.cohort_count > 0)
    .map((item) => ({
      name: item.name,
      value: item.cohort_count
    }));

  const getCategoryTitle = (cat) => {
    switch (cat) {
      case 'race':
        return 'Racial Representation';
      case 'ethnicity':
        return 'Ethnicity Representation';
      case 'gender':
        return 'Gender Distribution';
      case 'age_groups':
        return 'Age Group Distribution';
      default:
        return 'Demographics';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Protocol Filter & Metric Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>Diversity & Demographic Representation Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare cohort demographics against trial-eligible candidates to identify potential recruitment gaps
            </p>
          </div>

          {/* Trial Selector */}
          <div className="relative min-w-[280px]">
            <select
              value={selectedTrialId}
              onChange={(e) => setSelectedTrialId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-sky-500 font-semibold"
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

        {/* Scientific & Synthetic Data Disclaimer */}
        <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block text-amber-900">Synthetic Dataset Context & Representation Scope</strong>
            <span>{analyticsData?.disclaimer || 'These analytics describe the available synthetic dataset and do not establish population-level epidemiological representativeness.'}</span>
          </div>
        </div>

        {/* Metrics Ribbon */}
        {analyticsData?.trial_summary && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Patient Cohort</span>
              <strong className="text-lg font-bold text-slate-900">{analyticsData.total_patients}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Evaluated for Protocol</span>
              <strong className="text-lg font-bold text-slate-900">{analyticsData.trial_summary.evaluated_count}</strong>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 block text-[11px]">Strictly Eligible</span>
              <strong className="text-lg font-bold text-emerald-700">
                {analyticsData.trial_summary.strictly_eligible_count}
              </strong>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="text-sky-700 block text-[11px]">Potential Candidates Pool</span>
              <strong className="text-lg font-bold text-sky-700">
                {analyticsData.trial_summary.potential_eligible_count}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({((analyticsData.trial_summary.potential_eligible_count / analyticsData.total_patients) * 100).toFixed(0)}%)
                </span>
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Category Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {[
          { key: 'race', label: 'Race Representation' },
          { key: 'ethnicity', label: 'Ethnicity' },
          { key: 'gender', label: 'Gender Distribution' },
          { key: 'age_groups', label: 'Age Brackets' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === tab.key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
          <RotateCcw className="w-6 h-6 animate-spin text-sky-600" />
          <span>Calculating demographic representation metrics...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Error loading diversity analytics: {error}</span>
        </div>
      )}

      {/* Analytics Content */}
      {!loading && !error && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Comparison Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <span>Cohort vs. Eligible Candidate Share ({getCategoryTitle(activeCategory)})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Compares cohort availability against {selectedTrialId} candidate yield
                  </p>
                </div>
              </div>

              <div className="h-72 w-full text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data recorded for this category.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        unit="%"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(val, name, item) => {
                          const count = name.includes('Cohort') ? item.payload.cohortCount : item.payload.eligibleCount;
                          return [`${val}% (N=${count})`, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Cohort Share (%)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Eligible Share (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Overall Cohort Donut Chart (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  <span>Cohort Distribution ({getCategoryTitle(activeCategory)})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Breakdown across {analyticsData.total_patients} synthetic patient records
                </p>
              </div>

              <div className="h-72 w-full text-xs">
                {pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No demographic distribution available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px'
                        }}
                        formatter={(value, name) => [
                          `${value} patients (${((value / analyticsData.total_patients) * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}
                        layout="horizontal"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Representation Gap Alerts Panel */}
          {analyticsData.representation_gaps?.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Protocol Representation Gaps Detected for {selectedTrialId}</span>
              </h4>
              <p className="text-xs text-amber-800">
                The following groups are present in your patient cohort, but 0 candidates qualified for this trial:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {analyticsData.representation_gaps.map((gap, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200/80 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{gap.group}</span>{' '}
                      <span className="text-slate-500">({gap.category})</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">{gap.note}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Cohort: {gap.cohort_count} ({gap.cohort_pct}%)</span>
                      <strong className="text-rose-600 font-bold">0 Eligible</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Granular Demographics Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Detailed Breakdown & Parity Table: {getCategoryTitle(activeCategory)}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Demographic Group</th>
                    <th className="py-2.5 px-3 text-right">Cohort Count</th>
                    <th className="py-2.5 px-3 text-right">Cohort Share (%)</th>
                    <th className="py-2.5 px-3 text-right">Eligible Candidates</th>
                    <th className="py-2.5 px-3 text-right">Eligible Share (%)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonList.map((row, idx) => {
                    const isZeroYield = row.cohort_count > 0 && row.eligible_count === 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {row.cohort_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {row.cohort_pct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {row.eligible_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {row.eligible_pct}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isZeroYield ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              0% Yield
                            </span>
                          ) : row.eligible_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Represented
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
