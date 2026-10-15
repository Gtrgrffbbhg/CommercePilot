import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoRepository } from '../src/repositories/demoRepository.js';
import { createIntelligenceService } from '../src/services/intelligenceService.js';
import { customerIntelligenceSchema } from '../src/schemas/customer.js';

describe('Customer Intelligence & Retention Service', () => {
  const repo = createDemoRepository({ seed: 42 });
  const intelligenceService = createIntelligenceService(repo);

  it('evaluates a real demo customer and validates against Zod schema', async () => {
    const intelligence = await intelligenceService.getCustomerIntelligence('cus_00001');

    expect(intelligence).toBeTruthy();
    expect(intelligence.customerId).toBe('cus_00001');
    expect(typeof intelligence.metrics.orderCount).toBe('number');
    expect(['Low', 'Moderate', 'High']).toContain(intelligence.rfm.riskLevel);
    expect(['Champions', 'Loyal', 'Recent Buyer', 'At Risk', 'Hibernating', 'Inactive Prospect']).toContain(
      intelligence.rfm.segment
    );
    expect(intelligence.rfm.reasons.length).toBeGreaterThanOrEqual(1);
    expect(intelligence.recommendation.subject).toBeTruthy();
    expect(intelligence.recommendation.body).toBeTruthy();
    expect(intelligence.recommendation.disclaimer).toMatch(/Deterministic rule-based output/i);

    // Validate entire payload conforms strictly to Zod schema
    const parseResult = customerIntelligenceSchema.safeParse(intelligence);
    expect(parseResult.success).toBe(true);
  });

  it('classifies zero-order customer as Inactive Prospect with Low churn risk', async () => {
    const mockRepo = {
      async getCustomerById(id) {
        return {
          id,
          firstName: 'Sarah',
          lastName: 'Prospect',
          orderCount: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderAt: null,
        };
      },
      async listOrders() {
        return { data: [] };
      },
    };

    const service = createIntelligenceService(mockRepo);
    const result = await service.getCustomerIntelligence('cus_prospect');

    expect(result.rfm.segment).toBe('Inactive Prospect');
    expect(result.rfm.riskLevel).toBe('Low');
    expect(result.metrics.daysSinceLastOrder).toBeNull();
    expect(result.recommendation.action).toMatch(/Welcome onboarding/i);
    expect(result.recommendation.body).toContain('Hi Sarah');
  });

  it('classifies lapsed repeat customer as At Risk with High risk level and personalized email draft', async () => {
    const mockRepo = {
      async getCustomerById(id) {
        return {
          id,
          firstName: 'Marcus',
          lastName: 'Lapsed',
          orderCount: 4,
          totalSpent: 520.0,
          averageOrderValue: 130.0,
          lastOrderAt: '2026-05-01T00:00:00.000Z', // > 120 days ago
        };
      },
      async listOrders() {
        return {
          data: [
            {
              id: 'ord_99',
              lineItems: [{ name: 'Merino Wool Hoodie', quantity: 1, unitPrice: 130.0 }],
            },
          ],
        };
      },
    };

    const service = createIntelligenceService(mockRepo);
    const refDate = new Date('2026-10-15T00:00:00.000Z');
    const result = await service.getCustomerIntelligence('cus_at_risk', { referenceDate: refDate });

    expect(result.rfm.segment).toBe('At Risk');
    expect(result.rfm.riskLevel).toBe('High');
    expect(result.metrics.daysSinceLastOrder).toBeGreaterThan(90);
    expect(result.recommendation.subject).toContain('Marcus');
    expect(result.recommendation.body).toContain('Merino Wool Hoodie');
    expect(result.recommendation.suggestedOffer).toMatch(/COMEBACK15/i);
  });

  it('throws 404 AppError when customer ID does not exist', async () => {
    await expect(intelligenceService.getCustomerIntelligence('cus_nonexistent')).rejects.toThrow(
      /Customer with ID "cus_nonexistent" was not found/i
    );
  });
});

describe('GET /api/customers/:id/intelligence Endpoint', () => {
  const app = createApp({ config: { DATA_SOURCE: 'demo', DEMO_SEED: 42 } });

  it('returns 200 with structured intelligence and X-Data-Source header', async () => {
    const res = await request(app).get('/api/customers/cus_00001/intelligence');

    expect(res.status).toBe(200);
    expect(res.headers['x-data-source']).toBe('demo');
    expect(res.body.customerId).toBe('cus_00001');
    expect(res.body.rfm).toHaveProperty('segment');
    expect(res.body.rfm).toHaveProperty('riskLevel');
    expect(res.body.recommendation).toHaveProperty('subject');
    expect(res.body.recommendation).toHaveProperty('body');
  });

  it('returns 404 for a customer ID that does not exist', async () => {
    const res = await request(app).get('/api/customers/cus_unknown_999/intelligence');

    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'CUSTOMER_NOT_FOUND');
  });
});
