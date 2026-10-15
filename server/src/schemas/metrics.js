import { z } from 'zod';

export const kpiSetSchema = z.object({
  revenue: z.number().nonnegative(),
  orders: z.number().int().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  newCustomers: z.number().int().nonnegative(),
  returningCustomerRate: z.number().min(0).max(100),
  refundRate: z.number().min(0).max(100),
});

export const deltaPctSchema = z.object({
  revenue: z.number().nullable(),
  orders: z.number().nullable(),
  averageOrderValue: z.number().nullable(),
  activeCustomers: z.number().nullable(),
  newCustomers: z.number().nullable(),
  returningCustomerRate: z.number().nullable(),
  refundRate: z.number().nullable(),
});

export const summaryMetricsSchema = z.object({
  range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  currency: z.string().length(3),
  kpis: kpiSetSchema,
  previous: kpiSetSchema,
  deltaPct: deltaPctSchema,
});

export const timeseriesPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  revenue: z.number().nonnegative(),
  orders: z.number().int().nonnegative(),
  newCustomers: z.number().int().nonnegative(),
});

export const timeseriesMetricsSchema = z.object({
  interval: z.enum(['day', 'week', 'month']),
  points: z.array(timeseriesPointSchema),
});

export const summaryQuerySchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    { message: 'from date cannot be later than to date', path: ['from'] }
  );

export const timeseriesQuerySchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    interval: z.enum(['day', 'week', 'month']).default('day'),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    { message: 'from date cannot be later than to date', path: ['from'] }
  );
