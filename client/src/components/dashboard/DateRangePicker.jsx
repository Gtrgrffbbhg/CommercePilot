import React, { useState, useEffect } from 'react';
import { PRESETS, validateCustomRange } from '../../lib/dateRange.js';
import { SegmentedControl } from '../ui/SegmentedControl.jsx';

export function DateRangePicker({
  rangeSpec,
  onChangeRange,
  compare,
  onToggleCompare,
  meta,
}) {
  const isCustom = rangeSpec.type === 'custom';
  const currentPreset = isCustom ? null : rangeSpec.preset || '30d';

  // Local state for custom date inputs
  const [customFrom, setCustomFrom] = useState(isCustom ? rangeSpec.from : '');
  const [customTo, setCustomTo] = useState(isCustom ? rangeSpec.to : '');
  const [showCustomInputs, setShowCustomInputs] = useState(isCustom);
  const [validationError, setValidationError] = useState(null);

  // Sync inputs when rangeSpec changes externally
  useEffect(() => {
    if (rangeSpec.type === 'custom') {
      setCustomFrom(rangeSpec.from || '');
      setCustomTo(rangeSpec.to || '');
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      setValidationError(null);
    }
  }, [rangeSpec]);

  const minAllowed = meta?.dataRange?.from ? meta.dataRange.from.split('T')[0] : undefined;
  const maxAllowed = meta?.dataRange?.to ? meta.dataRange.to.split('T')[0] : undefined;

  const handlePresetSelect = (presetId) => {
    setValidationError(null);
    setShowCustomInputs(false);
    onChangeRange({ type: 'preset', preset: presetId });
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    const result = validateCustomRange(customFrom, customTo, minAllowed, maxAllowed);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }
    setValidationError(null);
    onChangeRange({
      type: 'custom',
      from: customFrom,
      to: customTo,
    });
  };

  const presetOptions = PRESETS.map((p) => ({ value: p.id, label: p.label }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={presetOptions}
            value={currentPreset}
            onChange={handlePresetSelect}
            ariaLabel="Date range preset"
          />

          <button
            type="button"
            onClick={() => setShowCustomInputs((prev) => !prev)}
            aria-expanded={showCustomInputs}
            className={`min-h-[38px] sm:min-h-[32px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              showCustomInputs
                ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Custom...
          </button>
        </div>

        {/* Compare to Previous Period toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => onToggleCompare(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
          />
          <span>Compare to previous period</span>
        </label>
      </div>

      {/* Expandable Custom Range Form */}
      {showCustomInputs && (
        <form
          onSubmit={handleApplyCustom}
          className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/90 flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="custom-from-date" className="text-slate-400 font-medium">
              Start Date (UTC)
            </label>
            <input
              id="custom-from-date"
              type="date"
              value={customFrom}
              min={minAllowed}
              max={maxAllowed}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setValidationError(null);
              }}
              className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="custom-to-date" className="text-slate-400 font-medium">
              End Date (UTC)
            </label>
            <input
              id="custom-to-date"
              type="date"
              value={customTo}
              min={minAllowed}
              max={maxAllowed}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setValidationError(null);
              }}
              className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Apply
          </button>

          {validationError && (
            <p className="w-full text-xs text-rose-400 font-medium mt-1" role="alert">
              {validationError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
