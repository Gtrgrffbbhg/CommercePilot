import { describe, it, expect } from 'vitest';
import { generateDemoData } from '../src/demo/generator.js';
import { customerSchema } from '../src/schemas/customer.js';
import { orderSchema } from '../src/schemas/order.js';
import { metaSchema } from '../src/schemas/common.js';
import { REVENUE_STATUSES } from '../src/constants.js';
import { toCents, fromCents, sumMoney, roundMoney } from '../src/utils/money.js';

describe('Demo Data Engine & Generator Integrity', () => {
  const fixedNow = new Date('2026-10-15T00:00:00.000Z');

  it('produces identical output for identical seed and now (pure and deterministic)', () => {
    const run1 = generateDemoData({ seed: 42, now: fixedNow });
    const run2 = generateDemoData({ seed: 42, now: fixedNow });

    expect(run1).toEqual(run2);
  });

  it('produces different output when seed changes', () => {
    const runA = generateDemoData({ seed: 42, now: fixedNow });
    const runB = generateDemoData({ seed: 99, now: fixedNow });

    expect(runA.customers[0].email).not.toEqual(runB.customers[0].email);
    expect(runA.orders[0].total).not.toEqual(runB.orders[0].total);
    expect(runA.meta.seed).not.toEqual(runB.meta.seed);
  });

  it('validates every generated record against its respective Zod schema', () => {
    const { customers, orders, meta } = generateDemoData({ seed: 42, now: fixedNow });

    // Validate meta contract
    const metaValidation = metaSchema.safeParse(meta);
    expect(metaValidation.success).toBe(true);

    // Validate every customer contract
    for (const customer of customers) {
      const res = customerSchema.safeParse(customer);
      if (!res.success) {
        throw new Error(`Customer validation failed for ${customer.id}: ${JSON.stringify(res.error.issues)}`);
      }
      expect(res.success).toBe(true);
    }

    // Validate every order contract
    for (const order of orders) {
      const res = orderSchema.safeParse(order);
      if (!res.success) {
        throw new Error(`Order validation failed for ${order.id}: ${JSON.stringify(res.error.issues)}`);
      }
      expect(res.success).toBe(true);
    }
  });

  it('verifies referential and mathematical integrity across customers and orders', () => {
    const { customers, orders } = generateDemoData({ seed: 42, now: fixedNow });
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    // 1. Every order.customerId exists in customers
    for (const order of orders) {
      expect(order.customerId).not.toBeNull();
      expect(customerMap.has(order.customerId)).toBe(true);
    }

    // 2. Order arithmetic integrity: line item sum = subtotal; total = subtotal - discount + shipping + tax (+- 0.01)
    for (const order of orders) {
      const lineItemSum = sumMoney(...order.lineItems.map((li) => li.total));
      expect(lineItemSum).toBe(order.subtotal);

      const calculatedTotal = fromCents(
        toCents(order.subtotal) - toCents(order.discountTotal) + toCents(order.shippingTotal) + toCents(order.taxTotal)
      );
      expect(Math.abs(order.total - calculatedTotal)).toBeLessThanOrEqual(0.01);
    }

    // 3. Customer aggregates equal sums of their REVENUE_STATUSES orders
    for (const customer of customers) {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const revenueOrders = customerOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const refundedOrders = customerOrders.filter((o) => o.status === 'refunded');

      expect(customer.orderCount).toBe(revenueOrders.length);

      const expectedTotalSpent = sumMoney(...revenueOrders.map((o) => o.total));
      expect(customer.totalSpent).toBe(expectedTotalSpent);

      const expectedRefunded = sumMoney(...refundedOrders.map((o) => o.total));
      expect(customer.refundedTotal).toBe(expectedRefunded);

      const expectedAov = customer.orderCount > 0 ? roundMoney(customer.totalSpent / customer.orderCount) : 0;
      expect(customer.averageOrderValue).toBe(expectedAov);
    }

    // 4. Temporal bounds: no order createdAt after `now` or older than 365 days window
    const nowMs = fixedNow.getTime();
    const windowStartMs = nowMs - 365 * 24 * 60 * 60 * 1000;

    for (const order of orders) {
      const orderMs = new Date(order.createdAt).getTime();
      expect(orderMs).toBeLessThanOrEqual(nowMs);
      expect(orderMs).toBeGreaterThanOrEqual(windowStartMs);
    }

    // 5. Completed is the largest status bucket
    const statusCounts = {};
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    const completedCount = statusCounts.completed || 0;
    for (const [status, count] of Object.entries(statusCounts)) {
      if (status !== 'completed') {
        expect(completedCount).toBeGreaterThan(count);
      }
    }

    // 6. Emails all end in @example.com and are unique per customer
    const seenEmails = new Set();
    for (const customer of customers) {
      expect(customer.email.endsWith('@example.com')).toBe(true);
      expect(seenEmails.has(customer.email)).toBe(false);
      seenEmails.add(customer.email);
    }
  });
});
