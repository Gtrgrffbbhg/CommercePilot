import { AppError } from '../utils/AppError.js';

export function createCustomerService(repository) {
  return {
    async listCustomers({ page = 1, pageSize = 20, sortBy = 'totalSpent', sortDir = 'desc', search, status } = {}) {
      const { data, total } = await repository.listCustomers({ page, pageSize, sortBy, sortDir, search, status });
      const totalPages = Math.ceil(total / pageSize) || 1;

      // Calculate aggregate directory summary across all customers
      const allCustomers = await repository.getAllCustomers();
      const totalCustomers = allCustomers.length;
      const repeatCustomers = allCustomers.filter((c) => c.orderCount > 1).length;
      const oneTimeCustomers = allCustomers.filter((c) => c.orderCount === 1).length;
      const totalRevenue = Math.round(allCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) * 100) / 100;
      const averageCustomerSpend = totalCustomers > 0 ? Math.round((totalRevenue / totalCustomers) * 100) / 100 : 0;

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
        summary: {
          totalCustomers,
          repeatCustomers,
          oneTimeCustomers,
          totalRevenue,
          averageCustomerSpend,
        },
      };
    },

    async getCustomerById(id) {
      const customer = await repository.getCustomerById(id);
      if (!customer) {
        throw new AppError(`Customer with ID "${id}" was not found`, 404, 'CUSTOMER_NOT_FOUND');
      }

      // Fetch customer's 10 most recent orders for profile drill-down
      const { data: recentOrders } = await repository.listOrders({
        customerId: id,
        page: 1,
        pageSize: 10,
      });

      return {
        ...customer,
        recentOrders,
      };
    },
  };
}
