// Formatting helpers for currency, numbers, dates and percentages

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(val);
}

export function formatCompactNumber(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val);
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '—';
  }
}

export function formatShortDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '—';
  }
}

export function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}
