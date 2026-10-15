import React from 'react';

export function Skeleton({ className = '', height = 'h-4', width = 'w-full' }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/80 ${height} ${width} ${className}`}
      aria-hidden="true"
    />
  );
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`w-full ${height} flex flex-col justify-end gap-3 p-4 animate-pulse bg-slate-900/40 rounded-lg`} aria-hidden="true">
      <div className="flex items-end gap-2 h-full">
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[40%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[65%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[55%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[80%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[70%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[90%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[60%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[75%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[85%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[50%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[95%]" />
        <div className="w-1/12 bg-slate-800/60 rounded-t h-[80%]" />
      </div>
      <div className="h-2 w-full bg-slate-800/50 rounded" />
    </div>
  );
}
