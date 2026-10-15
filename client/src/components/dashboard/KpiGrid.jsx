import React from 'react';
import { KpiCard } from './KpiCard.jsx';
import { KPI_KEYS } from '../../lib/kpiConfig.js';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

export function KpiGrid({ summary, loading = false, error = null, onRetry }) {
  if (error) {
    return (
      <ErrorState
        title="Failed to load executive KPI metrics"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (loading || !summary?.kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <Skeleton height="h-4" width="w-24" />
          <Skeleton height="h-8" width="w-40" />
          <Skeleton height="h-3" width="w-48" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <Skeleton height="h-4" width="w-20" />
            <Skeleton height="h-8" width="w-32" />
            <Skeleton height="h-3" width="w-36" />
          </div>
        ))}
      </div>
    );
  }

  const { kpis, deltaPct, currency } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue spans 2 columns on sm+ displays */}
      <KpiCard
        metricKey="revenue"
        value={kpis.revenue}
        delta={deltaPct?.revenue}
        currency={currency}
        className="sm:col-span-2"
      />

      {KPI_KEYS.filter((k) => k !== 'revenue').map((key) => (
        <KpiCard
          key={key}
          metricKey={key}
          value={kpis[key]}
          delta={deltaPct?.[key]}
          currency={currency}
        />
      ))}
    </div>
  );
}
