import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { insightsQuerySchema } from '../schemas/insights.js';

export function createInsightsRouter(insightsService) {
  const router = Router();

  router.get('/', validate({ query: insightsQuerySchema }), async (req, res, next) => {
    try {
      const result = await insightsService.getBusinessInsights(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
