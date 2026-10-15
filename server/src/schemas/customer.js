import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string().regex(/^cus_[a-zA-Z0-9_-]+$/, 'Customer ID must start with cus_'),
  externalId: z.number().int().nullable(),
  source: z.enum(['demo', 'woocommerce', 'mongodb']),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  isGuest: z.boolean(),
  createdAt: z.string().datetime(),
  firstOrderAt: z.string().datetime().nullable(),
  lastOrderAt: z.string().datetime().nullable(),
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  refundedTotal: z.number().nonnegative(),
  rfm: z.null(), // Reserved for Milestone 5 RFM segmentation
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(20),
  sortBy: z.enum(['name', 'totalSpent', 'orderCount', 'lastOrderAt', 'createdAt']).default('totalSpent'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'returning', 'one_time', 'zero_orders', 'guest', 'registered']).default('all'),
});

export const customerSummarySchema = z.object({
  totalCustomers: z.number().int().nonnegative(),
  repeatCustomers: z.number().int().nonnegative(),
  oneTimeCustomers: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  averageCustomerSpend: z.number().nonnegative(),
});

export const customerListResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  summary: customerSummarySchema.optional(),
});

export const customerIntelligenceSchema = z.object({
  customerId: z.string(),
  evaluatedAt: z.string().datetime(),
  metrics: z.object({
    daysSinceLastOrder: z.number().int().nonnegative().nullable(),
    orderCount: z.number().int().nonnegative(),
    totalSpent: z.number().nonnegative(),
    averageOrderValue: z.number().nonnegative(),
  }),
  rfm: z.object({
    segment: z.enum(['Champions', 'Loyal', 'Recent Buyer', 'At Risk', 'Hibernating', 'Inactive Prospect']),
    riskLevel: z.enum(['Low', 'Moderate', 'High']),
    reasons: z.array(z.string()),
  }),
  recommendation: z.object({
    action: z.string(),
    suggestedOffer: z.string(),
    subject: z.string(),
    body: z.string(),
    disclaimer: z.string(),
  }),
});

