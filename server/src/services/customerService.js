import { AppError } from '../utils/AppError.js';

export function createCustomerService(repository) {
  return {
    async listCustomers({ page = 1, pageSize = 20, sortBy = 'totalSpent', sortDir = 'desc' } = {}) {
      const { data, total } = await repository.listCustomers({ page, pageSize, sortBy, sortDir });
      const totalPages = Math.ceil(total / pageSize) || 1;

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
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
