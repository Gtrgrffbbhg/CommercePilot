// Configuration metadata for the 7 executive KPI cards

export const KPI_CONFIG = {
  revenue: {
    key: 'revenue',
    label: 'Total Revenue',
    caption: 'Gross sales from completed and processing orders',
    type: 'currency',
    invertDelta: false,
  },
  orders: {
    key: 'orders',
    label: 'Orders',
    caption: 'Count of completed and processing orders',
    type: 'number',
    invertDelta: false,
  },
  averageOrderValue: {
    key: 'averageOrderValue',
    label: 'Average Order Value',
    caption: 'Average gross spend per realized order',
    type: 'currency',
    invertDelta: false,
  },
  activeCustomers: {
    key: 'activeCustomers',
    label: 'Active Customers',
    caption: 'Unique buyers with ≥ 1 revenue order in period',
    type: 'number',
    invertDelta: false,
  },
  newCustomers: {
    key: 'newCustomers',
    label: 'New Customers',
    caption: 'First-time buyers with their initial order in period',
    type: 'number',
    invertDelta: false,
  },
  returningCustomerRate: {
    key: 'returningCustomerRate',
    label: 'Returning Rate',
    caption: '% of active buyers who placed orders prior to period',
    type: 'rate',
    invertDelta: false,
  },
  refundRate: {
    key: 'refundRate',
    label: 'Refund Rate',
    caption: '% of all period orders marked as refunded',
    type: 'rate',
    invertDelta: true, // Higher refund rate is negative
  },
};

export const KPI_KEYS = [
  'revenue',
  'orders',
  'averageOrderValue',
  'activeCustomers',
  'newCustomers',
  'returningCustomerRate',
  'refundRate',
];
