import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoRepository } from '../src/repositories/demoRepository.js';
import { createInsightsService } from '../src/services/insightsService.js';
import { insightsResponseSchema } from '../src/schemas/insights.js';

describe('Insights Service & API', () => {
  let app;
  let repo;
  let insightsService;

  beforeEach(() => {
    repo = createDemoRepository();
    insightsService = createInsightsService(repo);
    app = createApp({ repository: repo });
  });

  describe('insightsService unit tests', () => {
    it('computes insights for the default full date range with valid schema structure', async () => {
      const result = await insightsService.getBusinessInsights();

      expect(result).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.summary.businessHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.businessHealthScore).toBeLessThanOrEqual(100);
      expect(['Strong', 'Healthy', 'Needs Attention', 'Critical']).toContain(result.summary.healthRating);

      // Validate against strict Zod schema
      const parseResult = insightsResponseSchema.safeParse(result);
      expect(parseResult.success).toBe(true);

      // Verify severity counts sum up correctly
      const totalCount =
        result.summary.bySeverity.critical +
        result.summary.bySeverity.warning +
        result.summary.bySeverity.opportunity +
        result.summary.bySeverity.positive;
      expect(totalCount).toBe(result.insights.length);
    });

    it('filters insights when severity filter is applied', async () => {
      const allResults = await insightsService.getBusinessInsights();
      const warningResults = await insightsService.getBusinessInsights({ severity: 'warning' });

      expect(warningResults.insights.every((i) => i.severity === 'warning')).toBe(true);
      expect(warningResults.insights.length).toBe(allResults.summary.bySeverity.warning);
      // Health score and total severity counts remain reflective of full data
      expect(warningResults.summary.businessHealthScore).toBe(allResults.summary.businessHealthScore);
    });

    it('each insight has required explainability attributes: summary, explanation, supportingData, and recommendedAction', async () => {
      const result = await insightsService.getBusinessInsights();

      for (const item of result.insights) {
        expect(item.id).toBeDefined();
        expect(item.title.length).toBeGreaterThan(5);
        expect(item.category).toBeDefined();
        expect(item.severity).toBeDefined();
        expect(item.summary.length).toBeGreaterThan(10);
        expect(item.explanation.length).toBeGreaterThan(15);
        expect(typeof item.supportingData).toBe('object');
        expect(Object.keys(item.supportingData).length).toBeGreaterThanOrEqual(2);
        expect(item.recommendedAction.length).toBeGreaterThan(10);
      }
    });

    it('handles custom date ranges appropriately', async () => {
      const result = await insightsService.getBusinessInsights({
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-31T23:59:59.999Z',
      });

      expect(result).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.range.from).toBe('2026-03-01T00:00:00.000Z');
      expect(result.range.to).toBe('2026-03-31T23:59:59.999Z');
    });
  });

  describe('GET /api/insights HTTP endpoint', () => {
    it('returns 200 with X-Data-Source: demo and valid JSON schema', async () => {
      const res = await request(app).get('/api/insights');

      expect(res.status).toBe(200);
      expect(res.headers['x-data-source']).toBe('demo');
      expect(res.body.insights).toBeInstanceOf(Array);
      expect(res.body.summary.businessHealthScore).toBeDefined();
      expect(res.body.summary.healthRating).toBeDefined();

      const parseResult = insightsResponseSchema.safeParse(res.body);
      expect(parseResult.success).toBe(true);
    });

    it('supports severity filtering via query parameter', async () => {
      const res = await request(app).get('/api/insights?severity=opportunity');

      expect(res.status).toBe(200);
      expect(res.body.insights.every((i) => i.severity === 'opportunity')).toBe(true);
    });

    it('returns 400 when given an invalid severity parameter', async () => {
      const res = await request(app).get('/api/insights?severity=invalid_severity');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when given invalid date format', async () => {
      const res = await request(app).get('/api/insights?from=not-a-date');

      expect(res.status).toBe(400);
    });
  });
});
