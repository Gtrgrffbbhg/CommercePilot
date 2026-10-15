// Pure data transformation functions for Recharts charts and accessibility tables

import { ORDER_STATUSES, STATUS_CONFIG } from './constants.js';
import { formatShortDate } from './format.js';

// Prepares timeseries data and index-aligns previous-period points when Compare mode is active
export function transformTimeseries(currentPoints = [], previousPoints = null) {
  if (!Array.isArray(currentPoints)) return [];

  return currentPoints.map((curr, idx) => {
    const point = {
      date: curr.date,
      shortDate: formatShortDate(curr.date),
      revenue: curr.revenue ?? 0,
      orders: curr.orders ?? 0,
      newCustomers: curr.newCustomers ?? 0,
    };

    if (previousPoints && Array.isArray(previousPoints)) {
      const prev = previousPoints[idx];
      point.hasCompare = !!prev;
      point.prevDate = prev ? prev.date : null;
      point.prevShortDate = prev ? formatShortDate(prev.date) : null;
      point.prevRevenue = prev ? prev.revenue ?? 0 : null;
      point.prevOrders = prev ? prev.orders ?? 0 : null;
      point.prevNewCustomers = prev ? prev.newCustomers ?? 0 : null;
    }

    return point;
  });
}

// Transforms order status breakdown, guaranteeing all 7 statuses and calculating percentage share
export function transformStatusBreakdown(byStatus = []) {
  const statusMap = new Map((byStatus || []).map((s) => [s.status, s]));
  const totalOrders = (byStatus || []).reduce((acc, s) => acc + (s.orders || 0), 0);

  return ORDER_STATUSES.map((status) => {
    const entry = statusMap.get(status);
    const orders = entry?.orders ?? 0;
    const total = entry?.total ?? 0;
    const sharePct = totalOrders > 0 ? Number(((orders / totalOrders) * 100).toFixed(1)) : 0;
    const config = STATUS_CONFIG[status] || {};

    return {
      status,
      label: config.label || status,
      orders,
      total,
      sharePct,
      color: config.text || 'text-slate-400',
      bg: config.bg || 'bg-slate-800',
    };
  });
}

// Transforms category sales array and calculates share of total realized product sales
export function transformCategorySales(byCategory = []) {
  if (!Array.isArray(byCategory) || byCategory.length === 0) return [];

  const totalSales = byCategory.reduce((acc, c) => acc + (c.itemSales || 0), 0);

  return byCategory.map((cat) => {
    const sharePct = totalSales > 0 ? Number(((cat.itemSales / totalSales) * 100).toFixed(1)) : 0;
    return {
      category: cat.category,
      units: cat.units ?? 0,
      itemSales: cat.itemSales ?? 0,
      sharePct,
    };
  });
}
