import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { customerQuerySchema } from '../schemas/customer.js';

export function createCustomersRouter(customerService, intelligenceService) {
  const router = Router();

  const customerParamsSchema = z.object({
    id: z.string().min(1, 'Customer ID is required'),
  });

  router.get('/', validate({ query: customerQuerySchema }), async (req, res, next) => {
    try {
      const result = await customerService.listCustomers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/intelligence', validate({ params: customerParamsSchema }), async (req, res, next) => {
    try {
      if (!intelligenceService) {
        return res.status(501).json({ error: 'Intelligence service not configured' });
      }
      const intelligence = await intelligenceService.getCustomerIntelligence(req.params.id);
      res.json(intelligence);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', validate({ params: customerParamsSchema }), async (req, res, next) => {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.json(customer);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
