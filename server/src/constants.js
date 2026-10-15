// All valid lifecycle statuses for orders in CommercePilot
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

// Orders with these statuses are considered realized revenue and contribute to customer LTV and sales metrics
export const REVENUE_STATUSES = ['processing', 'completed'];

// Allowed sort fields for customer listings to prevent unauthorized or inefficient database queries
export const CUSTOMER_SORT_FIELDS = [
  'name',
  'totalSpent',
  'orderCount',
  'lastOrderAt',
  'createdAt',
];

export const SORT_DIRECTIONS = ['asc', 'desc'];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_CURRENCY = 'USD';
