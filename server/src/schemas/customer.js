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

export const customerListResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
