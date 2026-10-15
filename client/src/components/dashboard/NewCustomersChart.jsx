import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../ui/ChartCard.jsx';
import { transformTimeseries } from '../../lib/chartData.js';
import { formatNumber, formatDate } from '../../lib/format.js';

export function NewCustomersChart({
  timeseries,
  loading = false,
  error = null,
  onRetry,
}) {
  const chartData = useMemo(() => {
    return transformTimeseries(timeseries?.points);
  }, [timeseries?.points]);

  const isEmpty = !loading && !error && (!chartData || chartData.length === 0);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const totalNew = useMemo(() => {
    return chartData.reduce((acc, p) => acc + (p.newCustomers || 0), 0);
  }, [chartData]);

  const ariaSummary = `New customer acquisition trend. Total new customers in period: ${formatNumber(totalNew)}.`;

  return (
    <ChartCard
      title="New Customer Acquisition"
      subtitle="First-time customers over time"
      ariaLabel={ariaSummary}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No new customer accounts recorded in this window."
      renderChart={() => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                    <p className="text-sky-400 font-mono font-medium">
                      New buyers: {formatNumber(data.newCustomers)}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="newCustomers"
              name="New Customers"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 2, fill: '#0ea5e9' }}
              activeDot={{ r: 4 }}
              isAnimationActive={!prefersReducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      renderTable={() => (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <caption className="sr-only">New customer acquisition timeseries data table</caption>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th scope="col" className="py-2 px-3">Date</th>
                <th scope="col" className="py-2 px-3 text-right">New Customers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {chartData.map((p) => (
                <tr key={p.date} className="hover:bg-slate-850">
                  <td className="py-1.5 px-3">{p.date}</td>
                  <td className="py-1.5 px-3 text-right text-sky-400 font-medium">{formatNumber(p.newCustomers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
