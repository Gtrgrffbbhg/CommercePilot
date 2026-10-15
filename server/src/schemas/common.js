import { z } from 'zod';
import { CUSTOMER_SORT_FIELDS, SORT_DIRECTIONS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'Page size must be at least 1')
    .max(MAX_PAGE_SIZE, `Page size cannot exceed ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),
  sortBy: z.enum(CUSTOMER_SORT_FIELDS).default('totalSpent'),
  sortDir: z.enum(SORT_DIRECTIONS).default('desc'),
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const dateRangeQuerySchema = z
  .object({
    from: z.string().datetime({ message: 'from must be an ISO-8601 UTC date string' }).optional(),
    to: z.string().datetime({ message: 'to must be an ISO-8601 UTC date string' }).optional(),
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

export const metaSchema = z.object({
  dataSource: z.enum(['demo', 'mongodb', 'woocommerce']),
  isDemo: z.boolean(),
  seed: z.number().nullable(),
  generatedAt: z.string(),
  currency: z.string().length(3),
  counts: z.object({
    customers: z.number().int().nonnegative(),
    orders: z.number().int().nonnegative(),
  }),
  dataRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});
