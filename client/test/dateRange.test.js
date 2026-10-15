// Tests for dateRange.js — pure utility functions (no React needed)
import { describe, it, expect } from 'vitest';
import {
  getInterval,
  getPreviousRange,
  resolveRange,
  parseUrlRange,
  serializeUrlRange,
  validateCustomRange,
  PRESETS,
} from '../src/lib/dateRange.js';

describe('getInterval', () => {
  it('returns day for ranges <= 45 days', () => {
    const from = '2024-01-01T00:00:00.000Z';
    const to = '2024-01-31T00:00:00.000Z';
    expect(getInterval(from, to)).toBe('day');
  });

  it('returns week for ranges 46–180 days', () => {
    const from = '2024-01-01T00:00:00.000Z';
    const to = '2024-04-01T00:00:00.000Z'; // ~91 days
    expect(getInterval(from, to)).toBe('week');
  });

  it('returns month for ranges > 180 days', () => {
    const from = '2024-01-01T00:00:00.000Z';
    const to = '2024-12-01T00:00:00.000Z'; // ~335 days
    expect(getInterval(from, to)).toBe('month');
  });
});

describe('getPreviousRange', () => {
  it('returns a prior window of equal duration', () => {
    const from = '2024-02-01T00:00:00.000Z';
    const to = '2024-03-01T00:00:00.000Z';
    const prev = getPreviousRange(from, to);
    const currMs = new Date(to).getTime() - new Date(from).getTime();
    const prevMs = new Date(from).getTime() - new Date(prev.from).getTime();
    expect(prevMs).toBe(currMs);
    expect(prev.to).toBe(from);
  });
});

describe('resolveRange', () => {
  const now = new Date('2024-06-01T12:00:00.000Z');

  it('resolves a preset to concrete ISO dates', () => {
    const spec = { type: 'preset', preset: '30d' };
    const { from, to } = resolveRange(spec, now);
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
    const diffDays = (new Date(to) - new Date(from)) / (24 * 60 * 60 * 1000);
    expect(Math.round(diffDays)).toBe(30);
  });

  it('resolves custom type directly using provided dates', () => {
    const spec = { type: 'custom', from: '2024-01-01', to: '2024-01-31' };
    const { from, to } = resolveRange(spec, now);
    expect(from).toContain('2024-01-01');
    expect(to).toContain('2024-01-31');
  });

  it('uses the default 30d preset for unknown presets', () => {
    const spec = { type: 'preset', preset: 'unknown_preset' };
    const { from } = resolveRange(spec, now);
    expect(from).toBeTruthy();
  });
});

describe('parseUrlRange', () => {
  it('returns default 30d preset when params are empty', () => {
    const result = parseUrlRange(new URLSearchParams());
    expect(result).toEqual({ type: 'preset', preset: '30d' });
  });

  it('parses a valid preset param', () => {
    const params = new URLSearchParams({ range: '7d' });
    expect(parseUrlRange(params)).toEqual({ type: 'preset', preset: '7d' });
  });

  it('ignores invalid preset ids and returns default', () => {
    const params = new URLSearchParams({ range: 'invalid' });
    expect(parseUrlRange(params).preset).toBe('30d');
  });

  it('parses valid from/to params as custom type', () => {
    const params = new URLSearchParams({ from: '2024-01-01', to: '2024-01-31' });
    const result = parseUrlRange(params);
    expect(result.type).toBe('custom');
    expect(result.from).toContain('2024-01-01');
    expect(result.to).toContain('2024-01-31');
  });

  it('falls back to default if from > to', () => {
    const params = new URLSearchParams({ from: '2024-03-01', to: '2024-01-01' });
    const result = parseUrlRange(params);
    expect(result.type).toBe('preset');
  });
});

describe('serializeUrlRange', () => {
  it('serializes a preset spec to a range= query string', () => {
    const spec = { type: 'preset', preset: '90d' };
    expect(serializeUrlRange(spec)).toBe('range=90d');
  });

  it('serializes a custom spec to from= and to= params', () => {
    const spec = { type: 'custom', from: '2024-01-01', to: '2024-01-31' };
    const result = serializeUrlRange(spec);
    expect(result).toContain('from=');
    expect(result).toContain('to=');
  });

  it('uses 30d as fallback for unknown preset', () => {
    expect(serializeUrlRange({ type: 'preset', preset: 'bad' })).toBe('range=30d');
  });
});

describe('validateCustomRange', () => {
  it('returns valid when from < to', () => {
    expect(validateCustomRange('2024-01-01', '2024-01-31').valid).toBe(true);
  });

  it('returns invalid when from > to', () => {
    const result = validateCustomRange('2024-02-01', '2024-01-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid when either field is missing', () => {
    expect(validateCustomRange('', '2024-01-31').valid).toBe(false);
    expect(validateCustomRange('2024-01-01', '').valid).toBe(false);
  });

  it('respects minDate constraint', () => {
    const result = validateCustomRange('2023-01-01', '2024-01-31', '2024-01-01');
    expect(result.valid).toBe(false);
  });

  it('respects maxDate constraint', () => {
    const result = validateCustomRange('2024-01-01', '2025-12-31', undefined, '2024-12-31');
    expect(result.valid).toBe(false);
  });
});

describe('PRESETS', () => {
  it('contains exactly 4 presets with expected ids', () => {
    expect(PRESETS).toHaveLength(4);
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toEqual(['7d', '30d', '90d', '365d']);
  });
});
