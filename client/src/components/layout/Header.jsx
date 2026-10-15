import React from 'react';
import { DemoBadge } from '../ui/DemoBadge.jsx';

export function Header({ meta, health, healthError }) {
  const isHealthy = !healthError && health?.status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            CP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">CommercePilot</h1>
              <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                v0.1.0-alpha
              </span>
            </div>
            <p className="text-xs text-slate-400">WooCommerce Customer Intelligence CRM</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Server Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isHealthy ? `Server Online (${health.uptimeSeconds}s)` : 'Server Disconnected'}
            </span>
          </div>

          {/* Persistent Demo Badge */}
          <DemoBadge isDemo={meta?.isDemo ?? true} />
        </div>
      </div>
    </header>
  );
}
