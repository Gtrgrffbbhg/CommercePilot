import React from 'react';

export function EmptyState({ title = 'No records found', message = 'There is no data to display for this view.', className = '' }) {
  return (
    <div className={`p-8 text-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30 ${className}`}>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{message}</p>
    </div>
  );
}
