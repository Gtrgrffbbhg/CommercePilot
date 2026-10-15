import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createRepository } from './repositories/index.js';
import { createCustomerService } from './services/customerService.js';
import { createOrderService } from './services/orderService.js';
import { createMetricsService } from './services/metricsService.js';
import { createIntelligenceService } from './services/intelligenceService.js';
import { createInsightsService } from './services/insightsService.js';
import { createHealthRouter } from './routes/health.js';
import { createMetaRouter } from './routes/meta.js';
import { createCustomersRouter } from './routes/customers.js';
import { createOrdersRouter } from './routes/orders.js';
import { createMetricsRouter } from './routes/metrics.js';
import { createInsightsRouter } from './routes/insights.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ repository, config = {} } = {}) {
  const app = express();

  // Disable Express signature header for security
  app.disable('x-powered-by');

  // Hardened HTTP security headers
  app.use(helmet());

  // Restrict CORS to configured client origin
  const clientOrigin = config.CLIENT_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  // Strict JSON payload size limit to prevent Denial of Service (DoS) attacks
  app.use(express.json({ limit: '100kb' }));

  // Dependency injection: instantiates repository and services if not provided
  const activeRepo = repository ?? createRepository(config);
  const customerService = createCustomerService(activeRepo);
  const orderService = createOrderService(activeRepo);
  const metricsService = createMetricsService(activeRepo);
  const intelligenceService = createIntelligenceService(activeRepo);
  const insightsService = createInsightsService(activeRepo);

  // Attach X-Data-Source header to every API response
  const dataSource = config.DATA_SOURCE || 'demo';
  app.use('/api', (req, res, next) => {
    res.setHeader('X-Data-Source', dataSource);
    next();
  });

  // API Routes
  app.use('/api/health', createHealthRouter());
  app.use('/api/meta', createMetaRouter(activeRepo));
  app.use('/api/customers', createCustomersRouter(customerService, intelligenceService));
  app.use('/api/orders', createOrdersRouter(orderService));
  app.use('/api/metrics', createMetricsRouter(metricsService));
  app.use('/api/insights', createInsightsRouter(insightsService));

  // Catch-all 404 for unknown routes
  app.use(notFound);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
