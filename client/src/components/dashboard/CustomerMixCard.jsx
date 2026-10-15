import React from 'react';
import { Card } from '../ui/Card.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { formatNumber } from '../../lib/format.js';

export function CustomerMixCard({ summary, loading = false, error = null, onRetry }) {
  if (error) {
    return (
      <Card title="Customer Insights" subtitle="Buyer activity & repeat purchasing">
        <ErrorState
          title="Failed to load customer metrics"
          message={error.message}
          onRetry={onRetry}
        />
      </Card>
    );
  }

  if (loading || !summary?.kpis) {
    return (
      <Card title="Customer Insights" subtitle="Buyer activity & repeat purchasing">
        <div className="space-y-4 py-2">
          <Skeleton height="h-12" />
          <Skeleton height="h-12" />
          <Skeleton height="h-12" />
        </div>
      </Card>
    );
  }

  const { activeCustomers, newCustomers, returningCustomerRate } = summary.kpis;

  return (
    <Card
      title="Customer Insights"
      subtitle="Buyer activity & repeat purchasing within range"
    >
      <div className="space-y-3.5 pt-1">
        {/* Active Buyers */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-200">Active Buyers</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Placed $\ge 1$ revenue-generating order in this period</p>
          </div>
          <span className="text-lg font-bold font-mono text-white pl-3">
            {formatNumber(activeCustomers)}
          </span>
        </div>

        {/* New Buyers */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-200">First-Time Buyers</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Customers whose first store order occurred in this window</p>
          </div>
          <span className="text-lg font-bold font-mono text-sky-400 pl-3">
            {formatNumber(newCustomers)}
          </span>
        </div>

        {/* Returning Customer Rate */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-200">Returning Customer Rate</p>
            <p className="text-[11px] text-slate-400 mt-0.5">% of active buyers with previous purchase history</p>
          </div>
          <span className="text-lg font-bold font-mono text-emerald-400 pl-3">
            {returningCustomerRate}%
          </span>
        </div>
      </div>
    </Card>
  );
}
