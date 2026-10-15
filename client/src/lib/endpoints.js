// Typed endpoint client helpers with AbortSignal support

import { apiClient } from './apiClient.js';

export function getHealth(signal) {
  return apiClient('/api/health', { signal });
}

export function getMeta(signal) {
  return apiClient('/api/meta', { signal });
}

export function getMetricsSummary({ from, to } = {}, signal) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiClient(`/api/metrics/summary${query ? `?${query}` : ''}`, { signal });
}

export function getMetricsTimeseries({ from, to, interval = 'day' } = {}, signal) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (interval) params.set('interval', interval);
  const query = params.toString();
  return apiClient(`/api/metrics/timeseries${query ? `?${query}` : ''}`, { signal });
}

export function getMetricsOrderBreakdown({ from, to } = {}, signal) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiClient(`/api/metrics/order-breakdown${query ? `?${query}` : ''}`, { signal });
}

export function getRecentOrders({ from, to, pageSize = 8 } = {}, signal) {
  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('pageSize', String(pageSize));
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiClient(`/api/orders?${params.toString()}`, { signal });
}

export function getTopCustomers({ pageSize = 5, sortBy = 'totalSpent', sortDir = 'desc' } = {}, signal) {
  const params = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    sortBy,
    sortDir,
  });
  return apiClient(`/api/customers?${params.toString()}`, { signal });
}

export function getCustomers({ page = 1, pageSize = 20, sortBy = 'totalSpent', sortDir = 'desc', search = '', status = 'all' } = {}, signal) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (sortBy) params.set('sortBy', sortBy);
  if (sortDir) params.set('sortDir', sortDir);
  if (search && search.trim()) params.set('search', search.trim());
  if (status && status !== 'all') params.set('status', status);

  return apiClient(`/api/customers?${params.toString()}`, { signal });
}

export function getCustomerById(id, signal) {
  return apiClient(`/api/customers/${encodeURIComponent(id)}`, { signal });
}

export function getOrdersByCustomer({ customerId, page = 1, pageSize = 20, status } = {}, signal) {
  const params = new URLSearchParams();
  params.set('customerId', customerId);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (status) params.set('status', status);

  return apiClient(`/api/orders?${params.toString()}`, { signal });
}

export function getCustomerIntelligence(id, signal) {
  return apiClient(`/api/customers/${encodeURIComponent(id)}/intelligence`, { signal });
}

