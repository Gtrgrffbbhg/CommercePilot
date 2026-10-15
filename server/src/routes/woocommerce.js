import { Router } from 'express';

/**
 * Creates the WooCommerce router exposing:
 * - GET /api/woocommerce/health (connection status check)
 * - GET /api/woocommerce/products (fetches real products when connected)
 * - GET /api/woocommerce/orders (fetches real orders when connected)
 * - GET /api/woocommerce/customers (fetches real customers where supported)
 *
 * Never exposes credentials to responses.
 * Provides transparent fallback and status disclosures.
 */
export function createWooCommerceRouter(wcClient) {
  const router = Router();

  /**
   * Health & Connection Status Endpoint
   */
  router.get('/health', async (req, res, next) => {
    try {
      const status = await wcClient.checkConnection();
      res.json({
        ...status,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Real WooCommerce Products
   */
  router.get('/products', async (req, res, next) => {
    try {
      const { page, per_page, status } = req.query;
      const result = await wcClient.getProducts({ page, perPage: per_page, status });
      res.setHeader('X-Data-Source', 'woocommerce');
      res.json({
        data: result.data,
        total: result.headers.total ? Number(result.headers.total) : (Array.isArray(result.data) ? result.data.length : 0),
        totalPages: result.headers.totalPages ? Number(result.headers.totalPages) : 1,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Real WooCommerce Orders
   */
  router.get('/orders', async (req, res, next) => {
    try {
      const { page, per_page, status, customer, after, before } = req.query;
      const result = await wcClient.getOrders({ page, perPage: per_page, status, customer, after, before });
      res.setHeader('X-Data-Source', 'woocommerce');
      res.json({
        data: result.data,
        total: result.headers.total ? Number(result.headers.total) : (Array.isArray(result.data) ? result.data.length : 0),
        totalPages: result.headers.totalPages ? Number(result.headers.totalPages) : 1,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Real WooCommerce Customers (where supported/authorized)
   */
  router.get('/customers', async (req, res, next) => {
    try {
      const { page, per_page, search } = req.query;
      const result = await wcClient.getCustomers({ page, perPage: per_page, search });
      res.setHeader('X-Data-Source', 'woocommerce');
      res.json({
        data: result.data,
        total: result.headers.total ? Number(result.headers.total) : (Array.isArray(result.data) ? result.data.length : 0),
        totalPages: result.headers.totalPages ? Number(result.headers.totalPages) : 1,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
