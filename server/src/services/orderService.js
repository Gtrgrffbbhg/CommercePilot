import { AppError } from '../utils/AppError.js';

export function createOrderService(repository) {
  return {
    async listOrders({ page = 1, pageSize = 20, status, from, to, customerId, customerEmail } = {}) {
      const { data, total } = await repository.listOrders({ page, pageSize, status, from, to, customerId, customerEmail });
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

    async getOrderById(id) {
      const order = await repository.getOrderById(id);
      if (!order) {
        throw new AppError(`Order with ID "${id}" was not found`, 404, 'ORDER_NOT_FOUND');
      }
      return order;
    },
  };
}
