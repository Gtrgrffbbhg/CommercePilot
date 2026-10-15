import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '../ui/ChartCard.jsx';
import { transformTimeseries } from '../../lib/chartData.js';
import { formatCurrency, formatCompactCurrency, formatDate } from '../../lib/format.js';

export function RevenueTrendChart({
  timeseries,
  compareTimeseries,
  compare = false,
  loading = false,
  error = null,
  onRetry,
  currency = 'USD',
}) {
  const chartData = useMemo(() => {
    return transformTimeseries(timeseries?.points, compare ? compareTimeseries?.points : null);
  }, [timeseries?.points, compareTimeseries?.points, compare]);

  const isEmpty = !loading && !error && (!chartData || chartData.length === 0);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const totalRevenue = useMemo(() => {
    return chartData.reduce((acc, p) => acc + (p.revenue || 0), 0);
  }, [chartData]);

  const ariaSummary = `Revenue trend over ${chartData.length} periods. Total revenue is ${formatCurrency(totalRevenue, currency)}.`;

  return (
    <ChartCard
      title="Revenue Trend"
      subtitle={compare ? 'Overlaying current vs previous period (aligned by timeline index)' : 'Gross sales volume over time'}
      ariaLabel={ariaSummary}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No revenue recorded in this time window."
      renderChart={() => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => formatCompactCurrency(v, currency)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-200">{formatDate(data.date)}</p>
                    <p className="text-indigo-400 font-mono font-medium">
                      Current: {formatCurrency(data.revenue, currency)}
                    </p>
                    {compare && data.hasCompare && (
                      <p className="text-slate-400 font-mono text-[11px]">
                        Prior ({formatDate(data.prevDate)}): {formatCurrency(data.prevRevenue, currency)}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {compare && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />}
            <Area
              type="monotone"
              dataKey="revenue"
              name="Current Period"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              isAnimationActive={!prefersReducedMotion}
            />
            {compare && (
              <Area
                type="monotone"
                dataKey="prevRevenue"
                name="Previous Period"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
                isAnimationActive={!prefersReducedMotion}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
      renderTable={() => (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <caption className="sr-only">Revenue timeseries data table</caption>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th scope="col" className="py-2 px-3">Date</th>
                <th scope="col" className="py-2 px-3 text-right">Revenue</th>
                {compare && <th scope="col" className="py-2 px-3 text-right">Prior Date</th>}
                {compare && <th scope="col" className="py-2 px-3 text-right">Prior Revenue</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {chartData.map((p) => (
                <tr key={p.date} className="hover:bg-slate-850">
                  <td className="py-1.5 px-3">{p.date}</td>
                  <td className="py-1.5 px-3 text-right text-indigo-300 font-medium">{formatCurrency(p.revenue, currency)}</td>
                  {compare && <td className="py-1.5 px-3 text-right text-slate-400">{p.prevDate || '—'}</td>}
                  {compare && <td className="py-1.5 px-3 text-right text-slate-400">{p.prevRevenue !== null ? formatCurrency(p.prevRevenue, currency) : '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
