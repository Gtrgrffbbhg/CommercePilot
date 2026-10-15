import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { copilotChatRequestSchema } from '../schemas/copilot.js';

export function createCopilotRouter(copilotService, insightsService) {
  const router = Router();

  /**
   * POST /api/copilot/chat
   *
   * Accepts a plain-text question about the store and returns a grounded,
   * cited answer built from the existing analytics services.
   *
   * This is a rule-based orchestration layer — it does NOT call an external
   * LLM or probabilistic model. All answers are computed deterministically
   * from verified demo data.
   */
  router.post(
    '/chat',
    validate({ body: copilotChatRequestSchema }),
    async (req, res, next) => {
      try {
        const { message } = req.body;
        const result = await copilotService.chat(message, insightsService);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
