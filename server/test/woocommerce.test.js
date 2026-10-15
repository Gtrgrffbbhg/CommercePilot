import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoRepository } from '../src/repositories/demoRepository.js';
import { createWooCommerceClient } from '../src/woocommerce/client.js';

describe('WooCommerce REST API Client & Endpoints', () => {
  describe('createWooCommerceClient Unit Tests', () => {
    it('reports not configured when credentials or store URL are missing', () => {
      const client = createWooCommerceClient();
      expect(client.isConfigured()).toBe(false);
      expect(client.getStoreUrl()).toBe('');
    });

    it('reports not configured and provides reason on checkConnection without credentials', async () => {
      const client = createWooCommerceClient({ storeUrl: 'http://commercepilot-store.local' });
      const health = await client.checkConnection();
      expect(health.connected).toBe(false);
      expect(health.configured).toBe(false);
      expect(health.reason).toContain('credentials');
    });

    it('handles successful checkConnection — uses OAuth 1.0a auth for HTTP stores', async () => {
      let capturedUrl = '';
      const mockFetch = vi.fn().mockImplementation((url, _opts) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [{ id: 10, name: 'Sample Hoodie' }],
        });
      });

      const client = createWooCommerceClient({
        storeUrl: 'http://commercepilot-store.local',
        consumerKey: 'ck_test_123',
        consumerSecret: 'cs_test_456',
        fetchFn: mockFetch,
      });

      expect(client.isConfigured()).toBe(true);
      const health = await client.checkConnection();
      expect(health.connected).toBe(true);
      expect(health.configured).toBe(true);
      expect(health.status).toBe(200);

      // For HTTP stores: OAuth 1.0a signing is used, no Authorization header.
      // Verify the fetch was called with oauth_consumer_key and signature in the URL.
      expect(capturedUrl).toContain('oauth_consumer_key=ck_test_123');
      expect(capturedUrl).toContain('oauth_signature=');
      expect(capturedUrl).toContain('per_page=1');

      // No Authorization header should be present for HTTP stores.
      const [, callOptions] = mockFetch.mock.calls[0];
      expect(callOptions.headers).not.toHaveProperty('Authorization');
    });

    it('handles successful checkConnection — uses Basic Auth headers for HTTPS stores', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [{ id: 10, name: 'Sample Hoodie' }],
      });

      const client = createWooCommerceClient({
        storeUrl: 'https://myshop.example.com',
        consumerKey: 'ck_test_123',
        consumerSecret: 'cs_test_456',
        fetchFn: mockFetch,
      });

      const health = await client.checkConnection();
      expect(health.connected).toBe(true);

      // For HTTPS stores: Basic Auth headers should be used.
      const [, callOptions] = mockFetch.mock.calls[0];
      expect(callOptions.headers).toHaveProperty('Authorization');
      expect(callOptions.headers.Authorization).toMatch(/^Basic /);
    });

    it('handles connection failure / 401 unauthorized gracefully without throwing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'woocommerce_rest_cannot_view', message: 'Sorry, you cannot list resources.' }),
      });

      const client = createWooCommerceClient({
        storeUrl: 'http://commercepilot-store.local',
        consumerKey: 'ck_invalid',
        consumerSecret: 'cs_invalid',
        fetchFn: mockFetch,
      });

      const health = await client.checkConnection();
      expect(health.connected).toBe(false);
      expect(health.configured).toBe(true);
      expect(health.statusCode).toBe(401);
      expect(health.reason).toContain('Sorry, you cannot list resources');
    });

    it('fetches products, orders, and customers with parameters — OAuth 1.0a auth for HTTP', async () => {
      let capturedUrl = '';
      const mockFetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
            'x-wp-total': '42',
            'x-wp-totalpages': '3',
          }),
          json: async () => [{ id: 1, name: 'Product 1' }],
        });
      });

      const client = createWooCommerceClient({
        storeUrl: 'http://commercepilot-store.local',
        consumerKey: 'ck_123',
        consumerSecret: 'cs_456',
        fetchFn: mockFetch,
      });

      const products = await client.getProducts({ page: 2, perPage: 10 });
      expect(products.data).toEqual([{ id: 1, name: 'Product 1' }]);
      expect(products.headers.total).toBe('42');
      // URL should contain product path params AND OAuth 1.0a parameters for HTTP
      expect(capturedUrl).toContain('page=2');
      expect(capturedUrl).toContain('per_page=10');
      expect(capturedUrl).toContain('oauth_consumer_key=ck_123');
      expect(capturedUrl).toContain('oauth_signature=');
    });
  });

  describe('GET /api/woocommerce/health Endpoint', () => {
    it('returns health status JSON without exposing consumer keys or secrets', async () => {
      const repo = createDemoRepository();
      const mockWcClient = {
        checkConnection: vi.fn().mockResolvedValue({
          connected: false,
          configured: false,
          storeUrl: 'http://commercepilot-store.local',
          reason: 'WooCommerce API credentials are not configured',
        }),
      };

      const app = createApp({ repository: repo, wcClient: mockWcClient });
      const res = await request(app).get('/api/woocommerce/health');

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.storeUrl).toBe('http://commercepilot-store.local');
      expect(res.body.timestamp).toBeDefined();

      // Ensure no secrets leaked in body
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('ck_');
      expect(serialized).not.toContain('cs_');
    });

    it('returns live status when WooCommerce connection succeeds', async () => {
      const repo = createDemoRepository();
      const mockWcClient = {
        checkConnection: vi.fn().mockResolvedValue({
          connected: true,
          configured: true,
          storeUrl: 'http://commercepilot-store.local',
          status: 200,
        }),
      };

      const app = createApp({ repository: repo, wcClient: mockWcClient });
      const res = await request(app).get('/api/woocommerce/health');

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(true);
      expect(res.body.configured).toBe(true);
    });
  });

  describe('GET /api/woocommerce/products and /orders', () => {
    it('returns products list with X-Data-Source: woocommerce header', async () => {
      const repo = createDemoRepository();
      const mockWcClient = {
        getProducts: vi.fn().mockResolvedValue({
          data: [{ id: 101, name: 'Premium Tee', price: '29.99' }],
          headers: { total: '1', totalPages: '1' },
        }),
      };

      const app = createApp({ repository: repo, wcClient: mockWcClient });
      const res = await request(app).get('/api/woocommerce/products');

      expect(res.status).toBe(200);
      expect(res.headers['x-data-source']).toBe('woocommerce');
      expect(res.body.data).toEqual([{ id: 101, name: 'Premium Tee', price: '29.99' }]);
      expect(res.body.total).toBe(1);
    });

    it('returns orders list with X-Data-Source: woocommerce header', async () => {
      const repo = createDemoRepository();
      const mockWcClient = {
        getOrders: vi.fn().mockResolvedValue({
          data: [{ id: 501, status: 'processing', total: '89.50' }],
          headers: { total: '1', totalPages: '1' },
        }),
      };

      const app = createApp({ repository: repo, wcClient: mockWcClient });
      const res = await request(app).get('/api/woocommerce/orders');

      expect(res.status).toBe(200);
      expect(res.headers['x-data-source']).toBe('woocommerce');
      expect(res.body.data[0].id).toBe(501);
    });

    it('handles upstream 401 error gracefully when credentials are unauthorized', async () => {
      const { AppError } = await import('../src/utils/AppError.js');
      const repo = createDemoRepository();
      const mockWcClient = {
        getProducts: vi.fn().mockRejectedValue(
          new AppError('Sorry, you cannot list resources.', 401, 'woocommerce_rest_cannot_view')
        ),
      };

      const app = createApp({ repository: repo, wcClient: mockWcClient });
      const res = await request(app).get('/api/woocommerce/products');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });
  });
});
