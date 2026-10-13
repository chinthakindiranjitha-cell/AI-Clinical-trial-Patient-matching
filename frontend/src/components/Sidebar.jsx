import React from 'react';
import {
  LayoutDashboard,
  Users,
  Scale,
  BarChart3,
  UploadCloud,
  Download,
  RotateCcw,
  Sparkles,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function Sidebar({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  backendConnected,
  onResetSeed,
  resetting,
  activeDataset = 'demo',
  demoCount = 25,
  importedCount = 0
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      badge: activeDataset === 'demo' ? demoCount : activeDataset === 'imported' ? importedCount : demoCount + importedCount
    },
    {
      id: 'matching',
      label: 'Trial Matching / Eligibility Check',
      icon: Scale,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Diversity Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'import',
      label: 'Import Patients',
      icon: UploadCloud,
      badge: 'Multi-Format'
    },
    {
      id: 'export',
      label: 'Export Results',
      icon: Download,
      badge: null
    }
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 flex flex-col transition-all duration-300 border-r border-slate-800 flex-shrink-0 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div
          onClick={() => onSelectPage('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">ClinMatch</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Clinical Trial Matching</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Dataset Pill (when not collapsed) */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Database className="w-3 h-3 text-sky-400" />
              <span>Active Cohort:</span>
            </span>
            <span className="font-bold text-sky-400 capitalize text-[11px]">
              {activeDataset === 'demo' ? 'Demo Seed' : activeDataset === 'imported' ? 'Imported' : 'Combined'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {activeDataset === 'demo' ? `${demoCount} seeded patients` : `${importedCount} custom records`}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group ${
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3 text-left'
              } ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-sky-700/80 text-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-800 space-y-2.5 bg-slate-950/60 text-xs">
        {/* Backend Online Status */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-2'}`}>
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          {!collapsed && (
            <span className="text-[11px] text-slate-400 font-medium">
              API: {backendConnected ? 'Connected (5000)' : 'Offline'}
            </span>
          )}
        </div>

        {/* Reset Demo Seed Button */}
        <button
          type="button"
          onClick={onResetSeed}
          disabled={resetting}
          title={collapsed ? 'Reset Demo Seed Data' : undefined}
          className={`w-full flex items-center rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-[11px] font-medium ${
            collapsed ? 'justify-center p-2' : 'px-3 py-1.5 space-x-2'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${resetting ? 'animate-spin' : ''}`} />
          {!collapsed && <span>{resetting ? 'Resetting...' : 'Reset Demo Seed'}</span>}
        </button>

        {!collapsed && (
          <div className="pt-1 text-[10px] text-slate-500 text-center">
            ClinMatch · Hackathon MVP
          </div>
        )}
      </div>
    </aside>
  );
}
