// Date range presets, intervals, URL parsing/serialization, and validation

export const PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '365d', label: '12 months', days: 365 },
];

export const VALID_PRESET_IDS = PRESETS.map((p) => p.id);

// Computes the timeseries interval according to prompt specification
export function getInterval(from, to) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const diffDays = Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));

  if (diffDays <= 45) return 'day';
  if (diffDays <= 180) return 'week';
  return 'month';
}

// Calculates an equal-duration prior window directly preceding the requested range
export function getPreviousRange(from, to) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const duration = toMs - fromMs;
  return {
    from: new Date(fromMs - duration).toISOString(),
    to: new Date(fromMs).toISOString(),
  };
}

// Converts date specifier into concrete ISO UTC strings
export function resolveRange(spec, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);

  if (spec.type === 'custom') {
    const fromStr = spec.from.includes('T') ? spec.from : `${spec.from}T00:00:00.000Z`;
    const toStr = spec.to.includes('T') ? spec.to : `${spec.to}T23:59:59.999Z`;
    return {
      from: fromStr,
      to: toStr,
    };
  }

  // Preset resolution (default 30d)
  const presetConfig = PRESETS.find((p) => p.id === spec.preset) || PRESETS[1];
  const toDate = nowDate;
  const fromDate = new Date(nowDate.getTime() - presetConfig.days * 24 * 60 * 60 * 1000);

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

// Parses URL search parameters into a validated date range specifier
export function parseUrlRange(searchParams) {
  const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);

  const fromParam = params.get('from');
  const toParam = params.get('to');

  if (fromParam && toParam) {
    const fromDate = new Date(fromParam);
    const toDate = new Date(toParam);

    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && fromDate <= toDate) {
      // Normalize to YYYY-MM-DD for form inputs
      const fromYmd = fromParam.split('T')[0];
      const toYmd = toParam.split('T')[0];
      return {
        type: 'custom',
        from: fromYmd,
        to: toYmd,
      };
    }
  }

  const rangeParam = params.get('range');
  if (rangeParam && VALID_PRESET_IDS.includes(rangeParam)) {
    return {
      type: 'preset',
      preset: rangeParam,
    };
  }

  // Fallback default
  return {
    type: 'preset',
    preset: '30d',
  };
}

// Serializes a date range specifier into URL search params string
export function serializeUrlRange(spec) {
  if (spec.type === 'custom' && spec.from && spec.to) {
    return `from=${encodeURIComponent(spec.from)}&to=${encodeURIComponent(spec.to)}`;
  }
  const preset = spec.preset && VALID_PRESET_IDS.includes(spec.preset) ? spec.preset : '30d';
  return `range=${preset}`;
}

// Validates custom user-input date values
export function validateCustomRange(from, to, minDate, maxDate) {
  if (!from || !to) {
    return { valid: false, error: 'Both start and end dates are required.' };
  }

  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  if (isNaN(fromTime) || isNaN(toTime)) {
    return { valid: false, error: 'Please enter valid calendar dates.' };
  }

  if (fromTime > toTime) {
    return { valid: false, error: 'Start date cannot be after end date.' };
  }

  if (minDate && fromTime < new Date(minDate).getTime()) {
    return { valid: false, error: `Start date cannot precede ${minDate.split('T')[0]}.` };
  }

  if (maxDate && toTime > new Date(maxDate).getTime()) {
    return { valid: false, error: `End date cannot exceed ${maxDate.split('T')[0]}.` };
  }

  return { valid: true, error: null };
}
