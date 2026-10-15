import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { summaryQuerySchema, timeseriesQuerySchema } from '../schemas/metrics.js';

export function createMetricsRouter(metricsService) {
  const router = Router();

  router.get('/summary', validate({ query: summaryQuerySchema }), async (req, res, next) => {
    try {
      const summary = await metricsService.getSummary(req.query);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get('/timeseries', validate({ query: timeseriesQuerySchema }), async (req, res, next) => {
    try {
      const timeseries = await metricsService.getTimeseries(req.query);
      res.json(timeseries);
    } catch (err) {
      next(err);
    }
  });

  router.get('/order-breakdown', validate({ query: summaryQuerySchema }), async (req, res, next) => {
    try {
      const breakdown = await metricsService.getOrderBreakdown(req.query);
      res.json(breakdown);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
