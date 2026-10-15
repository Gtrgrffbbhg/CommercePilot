import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '../ui/ChartCard.jsx';
import { transformTimeseries } from '../../lib/chartData.js';
import { formatNumber, formatDate } from '../../lib/format.js';

export function OrdersChart({
  timeseries,
  compareTimeseries,
  compare = false,
  loading = false,
  error = null,
  onRetry,
}) {
  const chartData = useMemo(() => {
    return transformTimeseries(timeseries?.points, compare ? compareTimeseries?.points : null);
  }, [timeseries?.points, compareTimeseries?.points, compare]);

  const isEmpty = !loading && !error && (!chartData || chartData.length === 0);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const totalOrders = useMemo(() => {
    return chartData.reduce((acc, p) => acc + (p.orders || 0), 0);
  }, [chartData]);

  const ariaSummary = `Orders volume chart over ${chartData.length} intervals. Total order volume: ${formatNumber(totalOrders)}.`;

  return (
    <ChartCard
      title="Orders Volume"
      subtitle={compare ? 'Order counts vs prior period' : 'Realized revenue orders over time'}
      ariaLabel={ariaSummary}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No orders placed in this time window."
      renderChart={() => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="shortDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-200">{formatDate(data.date)}</p>
                    <p className="text-sky-400 font-mono font-medium">Orders: {formatNumber(data.orders)}</p>
                    {compare && data.hasCompare && (
                      <p className="text-slate-400 font-mono text-[11px]">
                        Prior: {formatNumber(data.prevOrders)}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {compare && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />}
            <Bar
              dataKey="orders"
              name="Current Orders"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!prefersReducedMotion}
            />
            {compare && (
              <Bar
                dataKey="prevOrders"
                name="Prior Orders"
                fill="#64748b"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!prefersReducedMotion}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
      renderTable={() => (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <caption className="sr-only">Orders over time data table</caption>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th scope="col" className="py-2 px-3">Date</th>
                <th scope="col" className="py-2 px-3 text-right">Orders</th>
                {compare && <th scope="col" className="py-2 px-3 text-right">Prior Orders</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {chartData.map((p) => (
                <tr key={p.date} className="hover:bg-slate-850">
                  <td className="py-1.5 px-3">{p.date}</td>
                  <td className="py-1.5 px-3 text-right text-sky-300 font-medium">{formatNumber(p.orders)}</td>
                  {compare && <td className="py-1.5 px-3 text-right text-slate-400">{formatNumber(p.prevOrders)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
