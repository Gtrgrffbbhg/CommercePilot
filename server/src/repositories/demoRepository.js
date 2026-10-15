// In-memory implementation of the CRM repository interface using generated demo data

import { generateDemoData } from '../demo/generator.js';

export function createDemoRepository({ seed = 42, now = new Date() } = {}) {
  const { customers, orders, meta } = generateDemoData({ seed, now });

  // Map indexes for fast O(1) lookups
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const orderMap = new Map(orders.map((o) => [o.id, o]));

  return {
    async getMeta() {
      return meta;
    },

    async listCustomers({ page = 1, pageSize = 20, sortBy = 'totalSpent', sortDir = 'desc', search, status = 'all' } = {}) {
      let filtered = customers;

      // Filter by search query (firstName, lastName, or email)
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        filtered = filtered.filter((c) => {
          const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
          const email = (c.email || '').toLowerCase();
          return fullName.includes(query) || email.includes(query);
        });
      }

      // Filter by customer relationship status
      if (status && status !== 'all') {
        if (status === 'returning') {
          filtered = filtered.filter((c) => c.orderCount > 1);
        } else if (status === 'one_time') {
          filtered = filtered.filter((c) => c.orderCount === 1);
        } else if (status === 'zero_orders') {
          filtered = filtered.filter((c) => c.orderCount === 0);
        } else if (status === 'guest') {
          filtered = filtered.filter((c) => c.isGuest === true);
        } else if (status === 'registered') {
          filtered = filtered.filter((c) => c.isGuest === false);
        }
      }

      const sorted = [...filtered].sort((a, b) => {
        let valA;
        let valB;

        if (sortBy === 'name') {
          valA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valB = `${b.firstName} ${b.lastName}`.toLowerCase();
        } else if (sortBy === 'lastOrderAt' || sortBy === 'createdAt') {
          valA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
          valB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
        } else {
          valA = a[sortBy] ?? 0;
          valB = b[sortBy] ?? 0;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      const total = sorted.length;
      const startIndex = (page - 1) * pageSize;
      const paginated = sorted.slice(startIndex, startIndex + pageSize);

      return {
        data: paginated,
        total,
      };
    },

    async getCustomerById(id) {
      return customerMap.get(id) || null;
    },

    async listOrders({ page = 1, pageSize = 20, status, from, to, customerId, customerEmail } = {}) {
      let filtered = orders;

      if (customerId) {
        filtered = filtered.filter((o) => o.customerId === customerId);
      }

      if (customerEmail) {
        const emailLower = customerEmail.trim().toLowerCase();
        filtered = filtered.filter((o) => (o.customerEmail || '').toLowerCase() === emailLower);
      }

      if (status) {
        filtered = filtered.filter((o) => o.status === status);
      }

      if (from) {
        const fromMs = new Date(from).getTime();
        filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= fromMs);
      }

      if (to) {
        const toMs = new Date(to).getTime();
        filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= toMs);
      }

      const total = filtered.length;
      const startIndex = (page - 1) * pageSize;
      const paginated = filtered.slice(startIndex, startIndex + pageSize);

      return {
        data: paginated,
        total,
      };
    },

    async getOrderById(id) {
      return orderMap.get(id) || null;
    },

    // Used by metrics service to aggregate KPIs and timeseries points within time windows
    async getOrdersInRange(from, to) {
      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      return orders.filter((o) => {
        const time = new Date(o.createdAt).getTime();
        return time >= fromMs && time <= toMs;
      });
    },

    // Direct access to all customers for cohort / new customer calculations
    async getAllCustomers() {
      return customers;
    },
  };
}
