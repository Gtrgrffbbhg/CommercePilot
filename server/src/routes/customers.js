import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../schemas/common.js';

export function createCustomersRouter(customerService) {
  const router = Router();

  const customerParamsSchema = z.object({
    id: z.string().min(1, 'Customer ID is required'),
  });

  router.get('/', validate({ query: paginationQuerySchema }), async (req, res, next) => {
    try {
      const result = await customerService.listCustomers(req.query);
      res.json(result);
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
