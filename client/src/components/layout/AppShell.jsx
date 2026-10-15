import React from 'react';
import { Header } from './Header.jsx';

export function AppShell({ children, meta, health, healthError }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* WCAG Skip to Main Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-lg outline-none ring-2 ring-white"
      >
        Skip to main content
      </a>

      <Header meta={meta} health={health} healthError={healthError} />

      <main id="main-content" tabIndex="-1" className="flex-1 w-full outline-none">
        {children}
      </main>
    </div>
  );
}
