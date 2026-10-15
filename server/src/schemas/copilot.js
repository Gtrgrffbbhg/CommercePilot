import { z } from 'zod';

// Validated incoming chat message
export const copilotChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be 500 characters or fewer'),
});

// A single cited data source used to build the answer
export const copilotCitationSchema = z.object({
  // Slug of the analysis step or API that produced this datum
  source: z.string(),
  // Short human-readable label shown in the UI
  label: z.string(),
  // Optional link to navigate to in the app
  href: z.string().optional(),
});

// A key metric or supporting figure shown under an answer
export const copilotMetricSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  context: z.string().optional(),
});

// The full structured copilot response
export const copilotChatResponseSchema = z.object({
  // Echo the original user question for context
  question: z.string(),
  // Identified intent category
  intent: z.enum([
    'revenue',
    'churn_risk',
    'top_customers',
    'retention',
    'business_problems',
    'customer_segments',
    'insights',
    'catalog',
    'unsupported',
  ]),
  // Short headline answer (1–2 sentences)
  answer: z.string(),
  // Full narrative explanation
  narrative: z.string(),
  // Supporting metrics displayed as key-value cards
  metrics: z.array(copilotMetricSchema),
  // Transparency: which data sources / analysis steps produced this answer
  citations: z.array(copilotCitationSchema),
  // Suggested follow-up questions to keep the conversation going
  suggestedFollowUps: z.array(z.string()),
  // Timestamp for display
  answeredAt: z.string().datetime(),
  // Whether the copilot is operating in rule-based (deterministic) mode vs. LLM
  mode: z.literal('rule-based'),
});
