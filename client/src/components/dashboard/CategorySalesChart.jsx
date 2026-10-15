import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../ui/ChartCard.jsx';
import { transformCategorySales } from '../../lib/chartData.js';
import { formatCurrency, formatCompactCurrency, formatNumber } from '../../lib/format.js';

export function CategorySalesChart({
  breakdown,
  loading = false,
  error = null,
  onRetry,
  currency = 'USD',
}) {
  const categoryData = useMemo(() => {
    return transformCategorySales(breakdown?.byCategory);
  }, [breakdown?.byCategory]);

  const isEmpty = !loading && !error && (!categoryData || categoryData.length === 0);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const totalSales = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.itemSales, 0);
  }, [categoryData]);

  const ariaSummary = `Item sales by category. Total categorized sales: ${formatCurrency(totalSales, currency)}.`;

  return (
    <ChartCard
      title="Product Category Sales"
      subtitle="Item sales before order-level discounts"
      ariaLabel={ariaSummary}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No category item sales in this range."
      renderChart={() => (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex-1 min-h-[14rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 10, right: 20, left: 25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(v) => formatCompactCurrency(v, currency)}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{data.category}</p>
                        <p className="text-emerald-400 font-mono font-medium">
                          Sales: {formatCurrency(data.itemSales, currency)} ({data.sharePct}%)
                        </p>
                        <p className="text-slate-400 font-mono text-[11px]">
                          Units sold: {formatNumber(data.units)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="itemSales"
                  name="Item Sales"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!prefersReducedMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 italic text-center pt-2">
            * Note: Item sales reflect line item totals before order-level discounts and taxes.
          </p>
        </div>
      )}
      renderTable={() => (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <caption className="sr-only">Product category sales data table</caption>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th scope="col" className="py-2 px-3">Category</th>
                <th scope="col" className="py-2 px-3 text-right">Units</th>
                <th scope="col" className="py-2 px-3 text-right">Item Sales</th>
                <th scope="col" className="py-2 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {categoryData.map((c) => (
                <tr key={c.category} className="hover:bg-slate-850">
                  <td className="py-1.5 px-3 font-sans text-slate-200">{c.category}</td>
                  <td className="py-1.5 px-3 text-right">{formatNumber(c.units)}</td>
                  <td className="py-1.5 px-3 text-right text-emerald-400 font-medium">{formatCurrency(c.itemSales, currency)}</td>
                  <td className="py-1.5 px-3 text-right text-slate-400">{c.sharePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
