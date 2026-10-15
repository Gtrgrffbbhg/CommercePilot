import React from 'react';
import { NavLink } from 'react-router-dom';
import { DemoBadge } from '../ui/DemoBadge.jsx';

export function Header({ meta, health, healthError }) {
  const isHealthy = !healthError && health?.status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 text-sm">
            CP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">CommercePilot</span>
              <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                v0.2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">WooCommerce Customer Intelligence CRM</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main navigation" className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            Customers
          </NavLink>
          <NavLink
            to="/foundation-check"
            className={({ isActive }) =>
              `px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            Foundation Check
          </NavLink>
        </nav>

        {/* Server Status and Demo Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
              }`}
              aria-hidden="true"
            />
            <span className="text-slate-300 font-medium">
              {isHealthy ? `Server Online (${health.uptimeSeconds}s)` : 'Server Disconnected'}
            </span>
          </div>

          <DemoBadge isDemo={meta?.isDemo ?? true} />
        </div>
      </div>
    </header>
  );
}
