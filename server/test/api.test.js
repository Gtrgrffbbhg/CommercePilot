import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoRepository } from '../src/repositories/demoRepository.js';
import { orderBreakdownSchema } from '../src/schemas/metrics.js';
import { ORDER_STATUSES, REVENUE_STATUSES } from '../src/constants.js';

describe('Server API Endpoints', () => {
  let app;
  let repository;
  const fixedNow = new Date('2026-10-15T00:00:00.000Z');

  beforeAll(() => {
    repository = createDemoRepository({ seed: 42, now: fixedNow });
    app = createApp({
      repository,
      config: {
        DATA_SOURCE: 'demo',
        CLIENT_ORIGIN: 'http://localhost:5173',
      },
    });
  });

  it('GET /api/health -> returns ok and uptime with X-Data-Source header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.headers['x-data-source']).toBe('demo');
  });

  it('GET /api/meta -> returns meta object with isDemo === true', async () => {
    const res = await request(app).get('/api/meta');
    expect(res.status).toBe(200);
    expect(res.body.isDemo).toBe(true);
    expect(res.body.dataSource).toBe('demo');
    expect(res.body.counts.customers).toBeGreaterThan(0);
    expect(res.body.counts.orders).toBeGreaterThan(0);
  });

  describe('Customers Endpoints', () => {
    it('paginates customers and page 2 differs from page 1', async () => {
      const page1Res = await request(app).get('/api/customers?page=1&pageSize=5');
      const page2Res = await request(app).get('/api/customers?page=2&pageSize=5');

      expect(page1Res.status).toBe(200);
      expect(page2Res.status).toBe(200);
      expect(page1Res.body.data.length).toBe(5);
      expect(page2Res.body.data.length).toBe(5);

      const page1Ids = page1Res.body.data.map((c) => c.id);
      const page2Ids = page2Res.body.data.map((c) => c.id);
      expect(page1Ids).not.toEqual(page2Ids);
    });

    it('rejects pageSize > 100 with HTTP 400', async () => {
      const res = await request(app).get('/api/customers?pageSize=101');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unknown sortBy whitelist field with HTTP 400', async () => {
      const res = await request(app).get('/api/customers?sortBy=maliciousColumn');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns customer details plus their 10 most recent orders for valid ID', async () => {
      // First get a valid customer id
      const listRes = await request(app).get('/api/customers?pageSize=1');
      const validCustomer = listRes.body.data[0];

      const res = await request(app).get(`/api/customers/${validCustomer.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(validCustomer.id);
      expect(Array.isArray(res.body.recentOrders)).toBe(true);
      expect(res.body.recentOrders.length).toBeLessThanOrEqual(10);
    });

    it('returns HTTP 404 for unknown customer ID', async () => {
      const res = await request(app).get('/api/customers/cus_nonexistent_99999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CUSTOMER_NOT_FOUND');
    });
  });

  describe('Orders Endpoints', () => {
    it('filters orders by lifecycle status', async () => {
      const res = await request(app).get('/api/orders?status=processing&pageSize=10');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const order of res.body.data) {
        expect(order.status).toBe('processing');
      }
    });

    it('returns single order by ID', async () => {
      const listRes = await request(app).get('/api/orders?pageSize=1');
      const validOrder = listRes.body.data[0];

      const res = await request(app).get(`/api/orders/${validOrder.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(validOrder.id);
      expect(res.body.total).toBe(validOrder.total);
    });

    it('returns HTTP 404 for unknown order ID', async () => {
      const res = await request(app).get('/api/orders/ord_nonexistent_99999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('Metrics Endpoints', () => {
    it('returns summary with default range and delta calculations', async () => {
      const res = await request(app).get('/api/metrics/summary');
      expect(res.status).toBe(200);
      expect(res.body.range).toBeDefined();
      expect(res.body.kpis).toBeDefined();
      expect(res.body.previous).toBeDefined();
      expect(res.body.deltaPct).toBeDefined();
      expect(res.body.kpis.revenue).toBeGreaterThan(0);
    });

    it('rejects from > to with HTTP 400', async () => {
      const res = await request(app).get(
        '/api/metrics/summary?from=2026-10-15T00:00:00.000Z&to=2026-10-01T00:00:00.000Z'
      );
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('verifies that the sum of timeseries revenue equals summary revenue for the exact same range', async () => {
      const from = '2026-09-01T00:00:00.000Z';
      const to = '2026-10-01T00:00:00.000Z';

      const summaryRes = await request(app).get(`/api/metrics/summary?from=${from}&to=${to}`);
      const timeseriesRes = await request(app).get(`/api/metrics/timeseries?from=${from}&to=${to}&interval=day`);

      expect(summaryRes.status).toBe(200);
      expect(timeseriesRes.status).toBe(200);

      const summaryRevenue = summaryRes.body.kpis.revenue;
      const timeseriesRevenueSum = timeseriesRes.body.points.reduce((sum, p) => sum + Math.round(p.revenue * 100), 0) / 100;

      expect(Number(timeseriesRevenueSum.toFixed(2))).toBe(summaryRevenue);
    });

    it('GET /api/metrics/order-breakdown reconciles with orders, summary and catalog sales', async () => {
      const from = '2026-09-01T00:00:00.000Z';
      const to = '2026-10-01T00:00:00.000Z';

      const breakdownRes = await request(app).get(`/api/metrics/order-breakdown?from=${from}&to=${to}`);
      expect(breakdownRes.status).toBe(200);
      expect(breakdownRes.headers['x-data-source']).toBe('demo');

      // Validates against orderBreakdownSchema
      const parseResult = orderBreakdownSchema.safeParse(breakdownRes.body);
      expect(parseResult.success).toBe(true);

      // All 7 statuses present in exact ORDER_STATUSES order
      expect(breakdownRes.body.byStatus.length).toBe(7);
      expect(breakdownRes.body.byStatus.map((s) => s.status)).toEqual(ORDER_STATUSES);

      // Sum of byStatus.orders equals count of orders in range from /api/orders
      const ordersRes = await request(app).get(`/api/orders?from=${from}&to=${to}&pageSize=1`);
      const totalStatusOrders = breakdownRes.body.byStatus.reduce((sum, s) => sum + s.orders, 0);
      expect(totalStatusOrders).toBe(ordersRes.body.pagination.total);

      // Sum of byStatus.orders over REVENUE_STATUSES equals summary.kpis.orders
      const summaryRes = await request(app).get(`/api/metrics/summary?from=${from}&to=${to}`);
      const revenueStatusOrders = breakdownRes.body.byStatus
        .filter((s) => REVENUE_STATUSES.includes(s.status))
        .reduce((sum, s) => sum + s.orders, 0);
      expect(revenueStatusOrders).toBe(summaryRes.body.kpis.orders);

      // Sum of byCategory.itemSales equals the sum of subtotal across revenue-status orders in range (+-0.01)
      const rangeOrders = await repository.getOrdersInRange(from, to);
      const revenueOrders = rangeOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const expectedSubtotalSum = revenueOrders.reduce((sum, o) => sum + Math.round(o.subtotal * 100), 0) / 100;
      const actualItemSalesSum = breakdownRes.body.byCategory.reduce((sum, c) => sum + Math.round(c.itemSales * 100), 0) / 100;
      expect(Math.abs(actualItemSalesSum - expectedSubtotalSum)).toBeLessThanOrEqual(0.01);
    });

    it('GET /api/metrics/order-breakdown returns zero-filled statuses and empty categories for empty range', async () => {
      const from = '2020-01-01T00:00:00.000Z';
      const to = '2020-01-02T00:00:00.000Z';

      const res = await request(app).get(`/api/metrics/order-breakdown?from=${from}&to=${to}`);
      expect(res.status).toBe(200);
      expect(res.body.byStatus.length).toBe(7);
      for (const item of res.body.byStatus) {
        expect(item.orders).toBe(0);
        expect(item.total).toBe(0);
      }
      expect(res.body.byCategory).toEqual([]);
    });

    it('GET /api/metrics/order-breakdown rejects from > to with HTTP 400', async () => {
      const res = await request(app).get(
        '/api/metrics/order-breakdown?from=2026-10-15T00:00:00.000Z&to=2026-10-01T00:00:00.000Z'
      );
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('returns uniform JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Cannot GET /api/nonexistent-route-xyz');
  });
});
