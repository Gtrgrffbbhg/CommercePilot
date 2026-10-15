// Handles UTC date operations, period calculations, and continuous timeseries bucketing

export function toIsoUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}

export function startOfUtcDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function endOfUtcDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function addDaysUtc(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function formatDayKey(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatWeekKey(date) {
  // Use Monday as start of UTC week
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return formatDayKey(monday);
}

export function formatMonthKey(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// Calculates an equal-duration prior window directly preceding the requested range
export function getPreviousPeriod(from, to) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const duration = toMs - fromMs;
  return {
    from: new Date(fromMs - duration).toISOString(),
    to: new Date(fromMs).toISOString(),
  };
}

// Generates an unbroken array of zero-filled bucket dates between from and to
export function generateBuckets(from, to, interval = 'day') {
  const start = new Date(from);
  const end = new Date(to);
  const buckets = [];
  const seen = new Set();

  let curr = new Date(start);
  while (curr <= end) {
    let key;
    if (interval === 'month') {
      key = formatMonthKey(curr);
      // Advance by 1 month
      curr.setUTCMonth(curr.getUTCMonth() + 1);
      curr.setUTCDate(1);
    } else if (interval === 'week') {
      key = formatWeekKey(curr);
      // Advance by 1 day to step through weeks safely
      curr = addDaysUtc(curr, 7);
    } else {
      key = formatDayKey(curr);
      curr = addDaysUtc(curr, 1);
    }

    if (!seen.has(key)) {
      seen.add(key);
      buckets.push(key);
    }
  }

  return buckets;
}
