import { Router } from 'express';

export function createMetaRouter(repository) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const meta = await repository.getMeta();
      res.json(meta);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
