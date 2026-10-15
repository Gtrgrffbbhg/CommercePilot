import React from 'react';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  ariaLabel = 'Options',
  className = '',
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
            className={`min-h-[38px] sm:min-h-[32px] px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
