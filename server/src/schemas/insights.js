import { z } from 'zod';

export const insightCategoryEnum = z.enum([
  'revenue_trend',
  'merchandise',
  'retention',
  'aov_growth',
  'fulfillment',
]);

export const insightSeverityEnum = z.enum([
  'positive',
  'opportunity',
  'warning',
  'critical',
]);

export const insightItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: insightCategoryEnum,
  severity: insightSeverityEnum,
  summary: z.string(),
  explanation: z.string(),
  supportingData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  recommendedAction: z.string(),
  impactEstimate: z.string().optional(),
});

export const insightsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  severity: z.enum(['all', 'positive', 'opportunity', 'warning', 'critical']).default('all'),
});

export const insightsResponseSchema = z.object({
  evaluatedAt: z.string().datetime(),
  range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  currency: z.string(),
  summary: z.object({
    totalInsights: z.number().int().nonnegative(),
    bySeverity: z.object({
      critical: z.number().int().nonnegative(),
      warning: z.number().int().nonnegative(),
      opportunity: z.number().int().nonnegative(),
      positive: z.number().int().nonnegative(),
    }),
    businessHealthScore: z.number().min(0).max(100),
    healthRating: z.enum(['Strong', 'Healthy', 'Needs Attention', 'Critical']),
  }),
  insights: z.array(insightItemSchema),
});
