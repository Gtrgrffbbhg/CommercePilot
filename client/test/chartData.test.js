// Tests for chartData.js — pure transformation functions
import { describe, it, expect } from 'vitest';
import {
  transformTimeseries,
  transformStatusBreakdown,
  transformCategorySales,
} from '../src/lib/chartData.js';
import { ORDER_STATUSES } from '../src/lib/constants.js';

describe('transformTimeseries', () => {
  const points = [
    { date: '2024-01-01T00:00:00.000Z', revenue: 100, orders: 5, newCustomers: 2 },
    { date: '2024-01-02T00:00:00.000Z', revenue: 200, orders: 10, newCustomers: 3 },
  ];

  it('returns [] for null/undefined input', () => {
    expect(transformTimeseries(null)).toEqual([]);
    expect(transformTimeseries(undefined)).toEqual([]);
  });

  it('maps all required fields', () => {
    const result = transformTimeseries(points);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: points[0].date, revenue: 100, orders: 5, newCustomers: 2 });
  });

  it('adds prevRevenue/prevOrders/prevNewCustomers when compare data is provided', () => {
    const prev = [
      { date: '2023-12-31T00:00:00.000Z', revenue: 50, orders: 3, newCustomers: 1 },
      { date: '2024-01-01T00:00:00.000Z', revenue: 75, orders: 4, newCustomers: 2 },
    ];
    const result = transformTimeseries(points, prev);
    expect(result[0].prevRevenue).toBe(50);
    expect(result[0].hasCompare).toBe(true);
    expect(result[0].prevOrders).toBe(3);
  });

  it('sets prevRevenue to null when index exceeds compare length', () => {
    const prev = [{ date: '2023-12-31T00:00:00.000Z', revenue: 50, orders: 3, newCustomers: 1 }];
    const result = transformTimeseries(points, prev);
    expect(result[1].prevRevenue).toBeNull();
    expect(result[1].hasCompare).toBe(false);
  });
});

describe('transformStatusBreakdown', () => {
  it('returns all 7 statuses in ORDER_STATUSES order with zero-filled missing ones', () => {
    const partial = [
      { status: 'completed', orders: 100, total: 5000 },
      { status: 'processing', orders: 50, total: 2500 },
    ];
    const result = transformStatusBreakdown(partial);
    expect(result).toHaveLength(7);
    expect(result.map((r) => r.status)).toEqual(ORDER_STATUSES);
  });

  it('calculates sharePct correctly for each status', () => {
    const data = [
      { status: 'completed', orders: 75, total: 1000 },
      { status: 'processing', orders: 25, total: 500 },
    ];
    const result = transformStatusBreakdown(data);
    const completed = result.find((r) => r.status === 'completed');
    const processing = result.find((r) => r.status === 'processing');
    expect(completed.sharePct).toBe(75.0);
    expect(processing.sharePct).toBe(25.0);
  });

  it('zero-fills missing statuses', () => {
    const result = transformStatusBreakdown([{ status: 'completed', orders: 10, total: 100 }]);
    const failed = result.find((r) => r.status === 'failed');
    expect(failed.orders).toBe(0);
    expect(failed.total).toBe(0);
    expect(failed.sharePct).toBe(0);
  });

  it('handles empty input gracefully', () => {
    const result = transformStatusBreakdown([]);
    expect(result).toHaveLength(7);
    result.forEach((r) => {
      expect(r.orders).toBe(0);
      expect(r.sharePct).toBe(0);
    });
  });
});

describe('transformCategorySales', () => {
  it('returns [] for empty input', () => {
    expect(transformCategorySales([])).toEqual([]);
    expect(transformCategorySales(null)).toEqual([]);
  });

  it('calculates sharePct for each category', () => {
    const data = [
      { category: 'Apparel', units: 10, itemSales: 300 },
      { category: 'Electronics', units: 5, itemSales: 700 },
    ];
    const result = transformCategorySales(data);
    const apparel = result.find((r) => r.category === 'Apparel');
    const electronics = result.find((r) => r.category === 'Electronics');
    expect(apparel.sharePct).toBe(30.0);
    expect(electronics.sharePct).toBe(70.0);
  });

  it('handles zero-total gracefully (no division by zero)', () => {
    const data = [{ category: 'Test', units: 0, itemSales: 0 }];
    const result = transformCategorySales(data);
    expect(result[0].sharePct).toBe(0);
  });
});
