import { z } from 'zod';
import { ORDER_STATUSES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

export const lineItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const billingAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
});

export const orderSchema = z.object({
  id: z.string().regex(/^ord_[a-zA-Z0-9_-]+$/, 'Order ID must start with ord_'),
  number: z.string(),
  externalId: z.number().int().nullable(),
  source: z.enum(['demo', 'woocommerce', 'mongodb']),
  status: z.enum(ORDER_STATUSES),
  currency: z.string().length(3),
  subtotal: z.number().nonnegative(),
  discountTotal: z.number().nonnegative(),
  shippingTotal: z.number().nonnegative(),
  taxTotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  customerId: z.string().nullable(),
  customerEmail: z.string().email(),
  isGuest: z.boolean(),
  billing: billingAddressSchema,
  lineItems: z.array(lineItemSchema).min(1),
  paymentMethod: z.string(),
  couponCodes: z.array(z.string()),
  createdAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
});

export const orderQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    status: z.enum(ORDER_STATUSES).optional(),
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

export const orderListResponseSchema = z.object({
  data: z.array(orderSchema),
  pagination: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
