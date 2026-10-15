import React from 'react';

export function DemoBanner({ meta }) {
  if (!meta || !meta.isDemo) return null;

  return (
    <div
      role="region"
      aria-label="Demo mode notice"
      className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-amber-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="font-semibold text-amber-300">Demo Simulation Active:</strong> Displaying deterministic synthetic eCommerce data (Seed: <code className="font-mono bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">{meta.seed}</code>). This workspace is not connected to a live WooCommerce store.
          </p>
        </div>
        <span className="text-[11px] font-mono text-amber-400/80 border border-amber-500/20 px-2 py-0.5 rounded bg-amber-950/40 shrink-0">
          X-Data-Source: demo
        </span>
      </div>
    </div>
  );
}
