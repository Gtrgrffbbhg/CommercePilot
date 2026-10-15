import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { orderQuerySchema } from '../schemas/order.js';

export function createOrdersRouter(orderService) {
  const router = Router();

  const orderParamsSchema = z.object({
    id: z.string().min(1, 'Order ID is required'),
  });

  router.get('/', validate({ query: orderQuerySchema }), async (req, res, next) => {
    try {
      const result = await orderService.listOrders(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', validate({ params: orderParamsSchema }), async (req, res, next) => {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
