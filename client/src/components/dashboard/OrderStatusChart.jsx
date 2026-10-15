import React, { useMemo } from 'react';
import { ChartCard } from '../ui/ChartCard.jsx';
import { transformStatusBreakdown } from '../../lib/chartData.js';
import { formatNumber, formatCurrency } from '../../lib/format.js';

export function OrderStatusChart({
  breakdown,
  loading = false,
  error = null,
  onRetry,
  currency = 'USD',
}) {
  const statusData = useMemo(() => {
    return transformStatusBreakdown(breakdown?.byStatus);
  }, [breakdown?.byStatus]);

  const isEmpty = !loading && !error && (!breakdown?.byStatus || breakdown.byStatus.length === 0);

  const totalOrders = useMemo(() => {
    return statusData.reduce((acc, s) => acc + s.orders, 0);
  }, [statusData]);

  const ariaSummary = `Order status breakdown across all 7 lifecycle statuses. Total orders in range: ${formatNumber(totalOrders)}.`;

  return (
    <ChartCard
      title="Order Status Mix"
      subtitle="Distribution across all 7 order lifecycle states"
      ariaLabel={ariaSummary}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No orders found for status analysis."
      renderChart={() => (
        <div className="flex flex-col justify-center space-y-3 p-1">
          {/* Stacked Visual Bar */}
          <div className="h-4 w-full rounded-full bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
            {statusData.map((s) => {
              if (s.orders === 0) return null;
              return (
                <div
                  key={s.status}
                  style={{ width: `${s.sharePct}%` }}
                  className={`h-full first:rounded-l-full last:rounded-r-full ${
                    s.status === 'completed'
                      ? 'bg-emerald-500'
                      : s.status === 'processing'
                      ? 'bg-sky-500'
                      : s.status === 'on-hold'
                      ? 'bg-amber-500'
                      : s.status === 'refunded'
                      ? 'bg-purple-500'
                      : s.status === 'cancelled'
                      ? 'bg-zinc-500'
                      : s.status === 'pending'
                      ? 'bg-slate-500'
                      : 'bg-rose-500'
                  }`}
                  title={`${s.label}: ${s.orders} (${s.sharePct}%)`}
                />
              );
            })}
          </div>

          {/* Detailed Legend and Metrics List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
            {statusData.map((s) => (
              <div
                key={s.status}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      s.status === 'completed'
                        ? 'bg-emerald-400'
                        : s.status === 'processing'
                        ? 'bg-sky-400'
                        : s.status === 'on-hold'
                        ? 'bg-amber-400'
                        : s.status === 'refunded'
                        ? 'bg-purple-400'
                        : s.status === 'cancelled'
                        ? 'bg-zinc-400'
                        : s.status === 'pending'
                        ? 'bg-slate-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-slate-300 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-200">{formatNumber(s.orders)}</span>
                  <span className="text-slate-500 text-[11px]">({s.sharePct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      renderTable={() => (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <caption className="sr-only">Order statuses data table</caption>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th scope="col" className="py-2 px-3">Status</th>
                <th scope="col" className="py-2 px-3 text-right">Orders</th>
                <th scope="col" className="py-2 px-3 text-right">Share</th>
                <th scope="col" className="py-2 px-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {statusData.map((s) => (
                <tr key={s.status} className="hover:bg-slate-850">
                  <td className="py-1.5 px-3 font-sans text-slate-200">{s.label}</td>
                  <td className="py-1.5 px-3 text-right">{formatNumber(s.orders)}</td>
                  <td className="py-1.5 px-3 text-right">{s.sharePct}%</td>
                  <td className="py-1.5 px-3 text-right text-indigo-300">{formatCurrency(s.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
