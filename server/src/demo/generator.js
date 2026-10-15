// Pure, deterministic demo data generator for CommercePilot
// Produces ~500 customers and 2,500-3,000 orders with realistic eCommerce distributions

import { createPrng } from './prng.js';
import {
  PRODUCTS,
  FIRST_NAMES,
  LAST_NAMES,
  CITIES_AND_STATES,
  PAYMENT_METHODS,
  COUPONS,
} from './catalogs.js';
import { REVENUE_STATUSES, DEFAULT_CURRENCY } from '../constants.js';
import { toCents, fromCents, sumMoney, roundMoney } from '../utils/money.js';

export function generateDemoData({ seed = 42, now = new Date() } = {}) {
  const prng = createPrng(seed);
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowMs = nowDate.getTime();

  // 12-month generation window (365 days prior to `now`)
  const windowDays = 365;
  const windowStartMs = nowMs - windowDays * 24 * 60 * 60 * 1000;
  const windowStart = new Date(windowStartMs);

  // Customer archetypes to ensure realistic RFM spread in Milestone 5
  // Total customers = 50 + 100 + 70 + 70 + 60 + 70 + 40 + 40 = 500 customers
  const archetypeConfigs = [
    { type: 'champion', count: 50, minOrders: 16, maxOrders: 22, minDaysAgo: 1, maxDaysAgo: 60, guest: false },
    { type: 'loyal', count: 100, minOrders: 7, maxOrders: 10, minDaysAgo: 2, maxDaysAgo: 300, guest: false },
    { type: 'promising', count: 70, minOrders: 3, maxOrders: 5, minDaysAgo: 2, maxDaysAgo: 90, guest: false },
    { type: 'at_risk', count: 70, minOrders: 4, maxOrders: 6, minDaysAgo: 91, maxDaysAgo: 240, guest: false },
    { type: 'hibernating', count: 60, minOrders: 3, maxOrders: 4, minDaysAgo: 181, maxDaysAgo: 360, guest: false },
    { type: 'new', count: 70, minOrders: 1, maxOrders: 2, minDaysAgo: 1, maxDaysAgo: 45, guest: false },
    { type: 'one_time', count: 40, minOrders: 1, maxOrders: 1, minDaysAgo: 10, maxDaysAgo: 350, guest: false },
    { type: 'guest', count: 40, minOrders: 1, maxOrders: 1, minDaysAgo: 5, maxDaysAgo: 350, guest: true },
  ];

  const customers = [];
  const orders = [];
  const usedEmails = new Set();
  let customerCounter = 1;
  let orderCounter = 1001;

  for (const config of archetypeConfigs) {
    for (let i = 0; i < config.count; i++) {
      const firstName = prng.pick(FIRST_NAMES);
      const lastName = prng.pick(LAST_NAMES);
      const location = prng.pick(CITIES_AND_STATES);

      // Generate strictly unique lowercase email: first.last##@example.com
      let emailNum = prng.int(10, 99);
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailNum}@example.com`;
      while (usedEmails.has(email)) {
        emailNum += 1;
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailNum}@example.com`;
      }
      usedEmails.add(email);

      const customerId = `cus_${String(customerCounter).padStart(5, '0')}`;
      customerCounter += 1;

      // Determine order count for this customer
      const targetOrders = prng.int(config.minOrders, config.maxOrders);
      const customerOrderTimes = [];

      for (let o = 0; o < targetOrders; o++) {
        const daysAgo = prng.float(config.minDaysAgo, config.maxDaysAgo);
        const orderTimeMs = Math.max(windowStartMs, Math.min(nowMs, Math.floor(nowMs - daysAgo * 24 * 60 * 60 * 1000)));
        customerOrderTimes.push(orderTimeMs);
      }

      // Sort chronological order timestamps
      customerOrderTimes.sort((a, b) => a - b);

      const customerOrders = [];

      for (const orderTimeMs of customerOrderTimes) {
        const orderDate = new Date(orderTimeMs);
        const orderId = `ord_${orderCounter}`;
        const orderNumber = String(orderCounter);
        orderCounter += 1;

        const daysAgo = (nowMs - orderTimeMs) / (24 * 60 * 60 * 1000);

        // Lifecycle status weighting: recent orders may be processing/pending; older orders mostly completed
        let status;
        if (daysAgo <= 2) {
          status = prng.weightedPick([
            ['processing', 45],
            ['pending', 25],
            ['on-hold', 15],
            ['completed', 10],
            ['failed', 5],
          ]);
        } else {
          status = prng.weightedPick([
            ['completed', 74],
            ['refunded', 6],
            ['cancelled', 5],
            ['processing', 7],
            ['on-hold', 3],
            ['pending', 3],
            ['failed', 2],
          ]);
        }

        // Line items generation (1 to 4 distinct items)
        const numItems = prng.int(1, 4);
        const shuffledProducts = [...PRODUCTS].sort(() => prng.float(-1, 1));
        const lineItems = [];

        for (let li = 0; li < numItems; li++) {
          const product = shuffledProducts[li % shuffledProducts.length];
          const quantity = prng.int(1, 3);
          const unitPrice = roundMoney(product.unitPrice);
          const itemTotal = roundMoney(unitPrice * quantity);

          lineItems.push({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            quantity,
            unitPrice,
            total: itemTotal,
          });
        }

        const subtotal = sumMoney(...lineItems.map((li) => li.total));

        // Coupons applied to ~15% of orders
        let couponCodes = [];
        let discountTotal = 0;
        if (prng.chance(0.15)) {
          const coupon = prng.pick(COUPONS);
          couponCodes = [coupon.code];
          discountTotal = roundMoney(subtotal * coupon.discountPercent);
        }

        // Shipping rule: orders >= $100 get free shipping; otherwise flat $9.00
        const shippingTotal = subtotal >= 100 ? 0 : 9.0;

        // Consistent 7% tax applied on net taxable amount
        const taxableAmount = fromCents(Math.max(0, toCents(subtotal) - toCents(discountTotal)));
        const taxTotal = roundMoney(taxableAmount * 0.07);

        // Strict integer-cent arithmetic for exact balance
        const total = fromCents(
          toCents(subtotal) - toCents(discountTotal) + toCents(shippingTotal) + toCents(taxTotal)
        );

        // Payment timing
        const createdAtIso = orderDate.toISOString();
        let paidAt = null;
        let completedAt = null;

        if (status === 'completed') {
          paidAt = new Date(Math.min(nowMs, orderTimeMs + 5 * 60 * 1000)).toISOString();
          completedAt = new Date(Math.min(nowMs, orderTimeMs + 24 * 60 * 60 * 1000)).toISOString();
        } else if (status === 'processing') {
          paidAt = new Date(Math.min(nowMs, orderTimeMs + 5 * 60 * 1000)).toISOString();
        } else if (status === 'refunded') {
          paidAt = new Date(Math.min(nowMs, orderTimeMs + 5 * 60 * 1000)).toISOString();
          completedAt = new Date(Math.min(nowMs, orderTimeMs + 24 * 60 * 60 * 1000)).toISOString();
        }

        const order = {
          id: orderId,
          number: orderNumber,
          externalId: null,
          source: 'demo',
          status,
          currency: DEFAULT_CURRENCY,
          subtotal,
          discountTotal,
          shippingTotal,
          taxTotal,
          total,
          customerId,
          customerEmail: email,
          isGuest: config.guest,
          billing: {
            firstName,
            lastName,
            city: location.city,
            state: location.state,
            country: 'US',
          },
          lineItems,
          paymentMethod: prng.pick(PAYMENT_METHODS),
          couponCodes,
          createdAt: createdAtIso,
          paidAt,
          completedAt,
        };

        orders.push(order);
        customerOrders.push(order);
      }

      // Aggregate customer totals strictly from their realized REVENUE_STATUSES orders
      const revenueOrders = customerOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const refundedOrders = customerOrders.filter((o) => o.status === 'refunded');

      const orderCount = revenueOrders.length;
      const totalSpent = sumMoney(...revenueOrders.map((o) => o.total));
      const refundedTotal = sumMoney(...refundedOrders.map((o) => o.total));
      const averageOrderValue = orderCount > 0 ? roundMoney(totalSpent / orderCount) : 0;

      // Customer account creation timestamp is placed before or at first order
      const firstOrderTime = customerOrders[0]?.createdAt ?? nowDate.toISOString();
      const lastOrderTime = customerOrders[customerOrders.length - 1]?.createdAt ?? nowDate.toISOString();
      const customerCreatedAtMs = Math.max(windowStartMs, new Date(firstOrderTime).getTime() - 24 * 60 * 60 * 1000);

      const customer = {
        id: customerId,
        externalId: null,
        source: 'demo',
        email,
        firstName,
        lastName,
        phone: null,
        city: location.city,
        state: location.state,
        country: 'US',
        isGuest: config.guest,
        createdAt: new Date(customerCreatedAtMs).toISOString(),
        firstOrderAt: customerOrders[0]?.createdAt ?? null,
        lastOrderAt: customerOrders[customerOrders.length - 1]?.createdAt ?? null,
        orderCount,
        totalSpent,
        averageOrderValue,
        refundedTotal,
        rfm: null,
      };

      customers.push(customer);
    }
  }

  // Sort orders descending by createdAt (newest first)
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const meta = {
    dataSource: 'demo',
    isDemo: true,
    seed,
    generatedAt: nowDate.toISOString(),
    currency: DEFAULT_CURRENCY,
    counts: {
      customers: customers.length,
      orders: orders.length,
    },
    dataRange: {
      from: windowStart.toISOString(),
      to: nowDate.toISOString(),
    },
  };

  return { customers, orders, meta };
}
