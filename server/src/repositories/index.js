// Repository factory returning the appropriate data repository based on DATA_SOURCE

import { createDemoRepository } from './demoRepository.js';
import { AppError } from '../utils/AppError.js';

export function createRepository(config = {}) {
  const dataSource = config.DATA_SOURCE || 'demo';

  switch (dataSource) {
    case 'demo':
      return createDemoRepository({
        seed: config.DEMO_SEED ?? 42,
        now: config.now ?? new Date(),
      });

    case 'mongodb':
      throw new AppError('MongoDB repository is not yet implemented (scheduled for Milestone 5)', 501, 'NOT_IMPLEMENTED');

    case 'woocommerce':
      throw new AppError('WooCommerce repository is not yet implemented (scheduled for Milestone 6)', 501, 'NOT_IMPLEMENTED');

    default:
      throw new AppError(`Unknown DATA_SOURCE: "${dataSource}"`, 500, 'INVALID_CONFIG');
  }
}
