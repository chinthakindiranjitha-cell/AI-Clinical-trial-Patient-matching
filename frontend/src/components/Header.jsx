import React from 'react';
import { Activity, Database, RefreshCw, BarChart3, Users } from 'lucide-react';

export default function Header({
  backendConnected,
  onResetSeed,
  resetting,
  onOpenImport,
  activeTab = 'matching',
  onSelectTab
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-200">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">ClinMatch</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-200">

              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Deterministic Patient-to-Trial Eligibility & Explainability
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        {onSelectTab && (
          <nav className="flex items-center p-1 bg-slate-100 rounded-xl space-x-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onSelectTab('matching')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'matching'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Trial Matching</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Diversity Analytics</span>
            </button>
          </nav>
        )}

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50">
            {backendConnected ? (
              <>
                
              </>
            ) : (
              <>
              
              </>
            )}
          </div>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Data</span>
          </button>

          <button
            onClick={onResetSeed}
            disabled={resetting}
            title="Reset dataset to initial 25 synthetic patients and 5 trials"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
