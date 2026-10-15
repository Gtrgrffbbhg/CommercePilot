import { ORDER_STATUSES, REVENUE_STATUSES, DEFAULT_CURRENCY } from '../constants.js';
import { toCents, fromCents, sumMoney, roundMoney } from '../utils/money.js';
import {
  toIsoUtc,
  startOfUtcDay,
  endOfUtcDay,
  addDaysUtc,
  formatDayKey,
  formatWeekKey,
  formatMonthKey,
  getPreviousPeriod,
  generateBuckets,
} from '../utils/dates.js';

// Shared range resolver providing consistent default (last 30 days) and UTC semantics across summary, timeseries and breakdown
export function resolveEffectiveRange(metaGeneratedAt, from, to) {
  const now = new Date(metaGeneratedAt);
  const effectiveTo = to ? toIsoUtc(to) : now.toISOString();
  const effectiveFrom = from ? toIsoUtc(from) : addDaysUtc(new Date(effectiveTo), -30).toISOString();
  return { effectiveFrom, effectiveTo };
}

export function createMetricsService(repository) {
  function computeKpis(orders, allCustomers, from, to) {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();

    // Only orders within [from, to]
    const periodOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromMs && t <= toMs;
    });

    const revenueOrders = periodOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
    const refundedOrders = periodOrders.filter((o) => o.status === 'refunded');

    const revenue = sumMoney(...revenueOrders.map((o) => o.total));
    const orderCount = revenueOrders.length;
    const averageOrderValue = orderCount > 0 ? roundMoney(revenue / orderCount) : 0;

    // Active customers: unique customers who placed a revenue order in this period
    const activeCustomerIds = new Set(revenueOrders.map((o) => o.customerId).filter(Boolean));
    const activeCustomers = activeCustomerIds.size;

    // New customers: customers whose firstOrderAt falls in [from, to]
    const newCustomersList = allCustomers.filter((c) => {
      if (!c.firstOrderAt) return false;
      const t = new Date(c.firstOrderAt).getTime();
      return t >= fromMs && t <= toMs;
    });
    const newCustomers = newCustomersList.length;

    // Returning customer rate: % of active customers in this period who had prior orders
    const returningCustomersCount = [...activeCustomerIds].filter((id) => {
      const cust = allCustomers.find((c) => c.id === id);
      if (!cust || !cust.firstOrderAt) return false;
      return new Date(cust.firstOrderAt).getTime() < fromMs;
    }).length;

    const returningCustomerRate =
      activeCustomers > 0 ? Number(((returningCustomersCount / activeCustomers) * 100).toFixed(1)) : 0;

    // Refund rate: % of total period orders that are refunded
    const refundRate =
      periodOrders.length > 0 ? Number(((refundedOrders.length / periodOrders.length) * 100).toFixed(1)) : 0;

    return {
      revenue,
      orders: orderCount,
      averageOrderValue,
      activeCustomers,
      newCustomers,
      returningCustomerRate,
      refundRate,
    };
  }

  function computeDelta(curr, prev) {
    const result = {};
    for (const key of Object.keys(curr)) {
      const c = curr[key];
      const p = prev[key];
      if (p === 0 || p === null || p === undefined) {
        result[key] = null;
      } else {
        result[key] = Number((((c - p) / p) * 100).toFixed(1));
      }
    }
    return result;
  }

  return {
    async getSummary({ from, to } = {}) {
      const meta = await repository.getMeta();
      const { effectiveFrom, effectiveTo } = resolveEffectiveRange(meta.generatedAt, from, to);

      const { from: prevFrom, to: prevTo } = getPreviousPeriod(effectiveFrom, effectiveTo);

      // Fetch relevant orders and customer pool
      const orders = await repository.getOrdersInRange(prevFrom, effectiveTo);
      const allCustomers = await repository.getAllCustomers();

      const currentKpis = computeKpis(orders, allCustomers, effectiveFrom, effectiveTo);
      const previousKpis = computeKpis(orders, allCustomers, prevFrom, prevTo);
      const deltaPct = computeDelta(currentKpis, previousKpis);

      return {
        range: {
          from: effectiveFrom,
          to: effectiveTo,
        },
        currency: DEFAULT_CURRENCY,
        kpis: currentKpis,
        previous: previousKpis,
        deltaPct,
      };
    },

    async getTimeseries({ from, to, interval = 'day' } = {}) {
      const meta = await repository.getMeta();
      const { effectiveFrom, effectiveTo } = resolveEffectiveRange(meta.generatedAt, from, to);

      const orders = await repository.getOrdersInRange(effectiveFrom, effectiveTo);
      const allCustomers = await repository.getAllCustomers();

      // Zero-filled buckets to guarantee continuous timeline with no gaps
      const buckets = generateBuckets(effectiveFrom, effectiveTo, interval);
      const bucketMap = new Map();

      for (const bucket of buckets) {
        bucketMap.set(bucket, {
          date: bucket,
          revenueCents: 0,
          orders: 0,
          newCustomers: 0,
        });
      }

      // Group revenue orders into their respective interval buckets
      const fromMs = new Date(effectiveFrom).getTime();
      const toMs = new Date(effectiveTo).getTime();

      for (const order of orders) {
        const orderTime = new Date(order.createdAt).getTime();
        if (orderTime < fromMs || orderTime > toMs) continue;

        if (REVENUE_STATUSES.includes(order.status)) {
          let key;
          if (interval === 'month') key = formatMonthKey(order.createdAt);
          else if (interval === 'week') key = formatWeekKey(order.createdAt);
          else key = formatDayKey(order.createdAt);

          const entry = bucketMap.get(key);
          if (entry) {
            entry.revenueCents += Math.round(order.total * 100);
            entry.orders += 1;
          }
        }
      }

      // Group new customers into their first-order bucket
      for (const customer of allCustomers) {
        if (!customer.firstOrderAt) continue;
        const firstTime = new Date(customer.firstOrderAt).getTime();
        if (firstTime >= fromMs && firstTime <= toMs) {
          let key;
          if (interval === 'month') key = formatMonthKey(customer.firstOrderAt);
          else if (interval === 'week') key = formatWeekKey(customer.firstOrderAt);
          else key = formatDayKey(customer.firstOrderAt);

          const entry = bucketMap.get(key);
          if (entry) {
            entry.newCustomers += 1;
          }
        }
      }

      const points = buckets.map((bucket) => {
        const entry = bucketMap.get(bucket);
        return {
          date: bucket,
          revenue: Number((entry.revenueCents / 100).toFixed(2)),
          orders: entry.orders,
          newCustomers: entry.newCustomers,
        };
      });

      return {
        interval,
        points,
      };
    },

    async getOrderBreakdown({ from, to } = {}) {
      const meta = await repository.getMeta();
      const { effectiveFrom, effectiveTo } = resolveEffectiveRange(meta.generatedAt, from, to);

      const orders = await repository.getOrdersInRange(effectiveFrom, effectiveTo);

      // All 7 statuses in strict ORDER_STATUSES sequence, zero-filled for all orders in range
      const byStatus = ORDER_STATUSES.map((status) => {
        const matchingOrders = orders.filter((o) => o.status === status);
        return {
          status,
          orders: matchingOrders.length,
          total: sumMoney(...matchingOrders.map((o) => o.total)),
        };
      });

      // Group line items by category for REVENUE_STATUSES orders only
      const revenueOrders = orders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const categoryMap = new Map();

      for (const order of revenueOrders) {
        for (const item of order.lineItems) {
          const entry = categoryMap.get(item.category) || { units: 0, itemSalesCents: 0 };
          entry.units += item.quantity;
          entry.itemSalesCents += toCents(item.total);
          categoryMap.set(item.category, entry);
        }
      }

      const byCategory = Array.from(categoryMap.entries()).map(([category, { units, itemSalesCents }]) => ({
        category,
        units,
        itemSales: fromCents(itemSalesCents),
      }));

      // Sort by itemSales descending, then category ascending
      byCategory.sort((a, b) => {
        if (b.itemSales !== a.itemSales) {
          return b.itemSales - a.itemSales;
        }
        return a.category.localeCompare(b.category);
      });

      return {
        range: {
          from: effectiveFrom,
          to: effectiveTo,
        },
        currency: DEFAULT_CURRENCY,
        byStatus,
        byCategory,
      };
    },
  };
}
