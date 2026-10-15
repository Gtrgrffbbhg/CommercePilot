import React from 'react';

export function DemoBadge({ isDemo = true, className = '', storeUrl = null }) {
  if (!isDemo) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase ${className}`}
        title={storeUrl ? `Connected to live WooCommerce store: ${storeUrl}` : 'Connected to live WooCommerce store'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live Store
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase ${className}`}
      title="This instance is currently running on simulated demo data"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Demo Data
    </span>
  );
}
