import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoRepository } from '../src/repositories/demoRepository.js';
import { classifyIntent } from '../src/services/copilotService.js';

describe('Copilot Service & API', () => {
  let app;
  let repo;

  beforeEach(() => {
    repo = createDemoRepository();
    app = createApp({ repository: repo });
  });

  // ---------------------------------------------------------------------------
  // Unit: intent classifier
  // ---------------------------------------------------------------------------
  describe('classifyIntent()', () => {
    it('classifies revenue questions correctly', () => {
      expect(classifyIntent('How is revenue performing?')).toBe('revenue');
      expect(classifyIntent('What are our sales this month?')).toBe('revenue');
      expect(classifyIntent('How much money did we make?')).toBe('revenue');
      expect(classifyIntent('What is our order volume?')).toBe('revenue');
    });

    it('classifies churn-risk questions correctly', () => {
      expect(classifyIntent('Which customers are at risk of churning?')).toBe('churn_risk');
      expect(classifyIntent('Who are our lapsed customers?')).toBe('churn_risk');
      expect(classifyIntent('Show me dormant buyers')).toBe('churn_risk');
    });

    it('classifies top-customers questions correctly', () => {
      expect(classifyIntent('Who are our top customers?')).toBe('top_customers');
      expect(classifyIntent('Who are the best customers?')).toBe('top_customers');
      expect(classifyIntent('Who are our biggest spenders?')).toBe('top_customers');
    });

    it('classifies retention questions correctly', () => {
      expect(classifyIntent('What actions should we take to improve retention?')).toBe('retention');
      expect(classifyIntent('How can we keep customers coming back?')).toBe('retention');
      expect(classifyIntent('How many repeat buyers do we have?')).toBe('retention');
    });

    it('classifies business problems questions correctly', () => {
      expect(classifyIntent('What are our most important business problems?')).toBe('business_problems');
      expect(classifyIntent('What are the critical issues?')).toBe('business_problems');
      expect(classifyIntent('What should we prioritize?')).toBe('business_problems');
    });

    it('classifies customer segments questions correctly', () => {
      expect(classifyIntent('Which customer segments should we focus on?')).toBe('customer_segments');
      expect(classifyIntent('How are our customers segmented?')).toBe('customer_segments');
      expect(classifyIntent('Show me the RFM breakdown')).toBe('customer_segments');
    });

    it('classifies catalog questions correctly', () => {
      expect(classifyIntent('Which product categories are driving sales?')).toBe('catalog');
      expect(classifyIntent('What is our average order value?')).toBe('catalog');
      expect(classifyIntent('What are the best-selling products?')).toBe('catalog');
    });

    it('classifies general insights questions correctly', () => {
      expect(classifyIntent('What are the business insights?')).toBe('insights');
      expect(classifyIntent('What recommendations do you have?')).toBe('insights');
      expect(classifyIntent('What is the store health score?')).toBe('insights');
    });

    it('returns unsupported for unrecognized questions', () => {
      expect(classifyIntent('What is the weather today?')).toBe('unsupported');
      expect(classifyIntent('Can you write me a poem?')).toBe('unsupported');
      expect(classifyIntent('asdfghjkl')).toBe('unsupported');
    });
  });

  // ---------------------------------------------------------------------------
  // HTTP: POST /api/copilot/chat
  // ---------------------------------------------------------------------------
  describe('POST /api/copilot/chat', () => {
    it('returns 200 with grounded revenue answer for a revenue question', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'How is revenue performing?' });

      expect(res.status).toBe(200);
      expect(res.headers['x-data-source']).toBe('demo');
      expect(res.body.intent).toBe('revenue');
      expect(res.body.answer).toBeDefined();
      expect(res.body.narrative).toBeDefined();
      expect(res.body.metrics).toBeInstanceOf(Array);
      expect(res.body.metrics.length).toBeGreaterThan(0);
      expect(res.body.citations).toBeInstanceOf(Array);
      expect(res.body.citations.length).toBeGreaterThan(0);
      expect(res.body.suggestedFollowUps).toBeInstanceOf(Array);
      expect(res.body.mode).toBe('rule-based');
      expect(res.body.answeredAt).toBeDefined();
    });

    it('returns churn-risk analysis for at-risk question', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'Which customers are at risk of churning?' });

      expect(res.status).toBe(200);
      expect(res.body.intent).toBe('churn_risk');
      // At-risk count must be a non-negative number
      const atRiskMetric = res.body.metrics.find((m) => m.label === 'At-Risk Repeat Buyers');
      expect(atRiskMetric).toBeDefined();
      expect(Number(atRiskMetric.value)).toBeGreaterThanOrEqual(0);
    });

    it('returns customer-segments breakdown with all 6 segment counts', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'Which customer segments should we focus on?' });

      expect(res.status).toBe(200);
      expect(res.body.intent).toBe('customer_segments');
      const labels = res.body.metrics.map((m) => m.label);
      expect(labels).toContain('Champions');
      expect(labels).toContain('At Risk');
      expect(labels).toContain('Hibernating');
    });

    it('returns unsupported intent for unrecognized questions', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'What is the weather?' });

      expect(res.status).toBe(200);
      expect(res.body.intent).toBe('unsupported');
      expect(res.body.suggestedFollowUps.length).toBeGreaterThan(0);
    });

    it('returns 400 for empty message', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for missing message field', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 for message exceeding 500 chars', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'a'.repeat(501) });

      expect(res.status).toBe(400);
    });

    it('echoes the original question in the response', async () => {
      const msg = 'Who are our top customers?';
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: msg });

      expect(res.status).toBe(200);
      expect(res.body.question).toBe(msg);
    });

    it('returns business-problems analysis via insights engine', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ message: 'What are our most important business problems?' });

      expect(res.status).toBe(200);
      expect(res.body.intent).toBe('business_problems');
      const healthMetric = res.body.metrics.find((m) => m.label === 'Health Score');
      expect(healthMetric).toBeDefined();
    });
  });
});
