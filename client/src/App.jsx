import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { FoundationCheck } from './pages/FoundationCheck.jsx';
import { AppShell } from './components/layout/AppShell.jsx';

// 404 catch-all: not yet full shell but shows friendly message
function NotFound() {
  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <p className="text-6xl font-bold font-mono text-slate-700">404</p>
          <p className="text-slate-400 text-sm">Page not found.</p>
          <a href="/" className="text-indigo-400 hover:underline text-sm">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    // BrowserRouter wraps everything so useDateRange's useSearchParams works
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/foundation-check" element={<FoundationCheck />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
