import React from 'react';

export function Card({ children, className = '', title, subtitle, headerAction }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-800/80">
          <div>
            {title && <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
