import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate, formatPercent } from '../src/lib/format.js';

describe('client/src/lib/format.js', () => {
  describe('formatCurrency', () => {
    it('formats positive and negative amounts to USD by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles null, undefined and invalid numbers safely', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency('abc')).toBe('$0.00');
    });
  });

  describe('formatNumber', () => {
    it('formats integer counts with thousands separators', () => {
      expect(formatNumber(1500)).toBe('1,500');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(null)).toBe('0');
    });
  });

  describe('formatDate', () => {
    it('formats ISO-8601 strings into readable UTC dates', () => {
      expect(formatDate('2026-10-15T00:00:00.000Z')).toBe('Oct 15, 2026');
    });

    it('handles null and invalid strings with dash fallback', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });
  });

  describe('formatPercent', () => {
    it('adds plus sign for positive percentages', () => {
      expect(formatPercent(12.34)).toBe('+12.3%');
      expect(formatPercent(-5.67)).toBe('-5.7%');
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('returns N/A for null or undefined', () => {
      expect(formatPercent(null)).toBe('N/A');
      expect(formatPercent(undefined)).toBe('N/A');
    });
  });
});
