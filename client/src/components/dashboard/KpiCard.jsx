import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';
import { KPI_CONFIG } from '../../lib/kpiConfig.js';

export function KpiCard({ metricKey, value, delta, currency = 'USD', className = '' }) {
  const config = KPI_CONFIG[metricKey] || {
    label: metricKey,
    caption: '',
    type: 'number',
    invertDelta: false,
  };

  // Format value safely
  let formattedValue = '—';
  if (value !== null && value !== undefined && !isNaN(value)) {
    if (config.type === 'currency') {
      formattedValue = formatCurrency(value, currency);
    } else if (config.type === 'rate') {
      formattedValue = `${value.toFixed(1)}%`;
    } else {
      formattedValue = formatNumber(value);
    }
  }

  // Delta rendering logic
  const hasDelta = delta !== null && delta !== undefined && !isNaN(delta);
  const isZero = hasDelta && Math.abs(delta) < 0.001;
  const isPositive = hasDelta && delta > 0;

  // Tone determination (inverted for refundRate)
  let isGood = isPositive;
  if (config.invertDelta) {
    isGood = !isPositive;
  }

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium text-slate-400 tracking-wide">{config.label}</h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5 font-mono">
          {formattedValue}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {hasDelta ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center font-medium font-mono px-1.5 py-0.5 rounded text-[11px] ${
                isZero
                  ? 'bg-slate-800 text-slate-400'
                  : isGood
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
              }`}
            >
              <span aria-hidden="true" className="mr-0.5">
                {isZero ? '•' : isPositive ? '↑' : '↓'}
              </span>
              <span className="sr-only">
                {isZero ? 'Unchanged' : isPositive ? 'Increased by' : 'Decreased by'}
              </span>
              {formatPercent(delta)}
            </span>
            <span className="text-[11px] text-slate-500">vs previous period</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 italic">No prior data</span>
        )}

        {config.caption && (
          <p className="w-full text-[11px] text-slate-500 mt-1 leading-snug">{config.caption}</p>
        )}
      </div>
    </div>
  );
}
