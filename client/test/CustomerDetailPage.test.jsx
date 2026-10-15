import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ---------------------------------------------------------------------------
// vi.mock factory — all data must be defined INSIDE (hoisting constraint).
// ---------------------------------------------------------------------------
vi.mock('../src/lib/endpoints.js', () => ({
  getMeta: vi.fn().mockResolvedValue({ dataSource: 'demo', isDemo: true, seed: 42 }),
  getHealth: vi.fn().mockResolvedValue({ status: 'ok', uptimeSeconds: 120 }),
  getCustomerById: vi.fn().mockResolvedValue({
    id: 'cus_00001', firstName: 'Emma', lastName: 'Watson',
    email: 'emma.watson@example.com', phone: '555-0199',
    city: 'Seattle', state: 'WA', country: 'US', isGuest: false, source: 'demo',
    createdAt: '2025-11-01T00:00:00.000Z', firstOrderAt: '2025-11-15T00:00:00.000Z',
    lastOrderAt: '2026-10-01T00:00:00.000Z', orderCount: 3, totalSpent: 420.5,
    averageOrderValue: 140.17, refundedTotal: 0, rfm: null,
  }),
  getOrdersByCustomer: vi.fn().mockResolvedValue({
    data: [{
      id: 'ord_1001', number: '1001', status: 'completed', currency: 'USD',
      total: 150.0, createdAt: '2026-10-01T00:00:00.000Z', paymentMethod: 'credit_card',
      lineItems: [{ name: 'Classic Leather Sneakers', quantity: 1, unitPrice: 150.0, total: 150.0 }],
    }],
    pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
  getCustomers: vi.fn(),
  getMetrics: vi.fn(),
  getOrderBreakdown: vi.fn(),
}));

import { CustomerDetailPage } from '../src/pages/CustomerDetailPage.jsx';

// ---------------------------------------------------------------------------
// Test data — safe to define at module level (used after factory evaluates)
// ---------------------------------------------------------------------------
const mockNotFoundError = Object.assign(
  new Error('Customer with ID "cus_invalid_999" was not found'),
  { status: 404, code: 'CUSTOMER_NOT_FOUND' }
);

import * as endpoints from '../src/lib/endpoints.js';

describe('CustomerDetailPage Component', () => {
  it('renders customer profile information, metrics, and order history', async () => {
    // No beforeEach — factory implementations are used as-is.
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/customers/cus_00001']}>
          <Routes>
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Profile header
    await waitFor(() => {
      expect(screen.getByText(/Back to Customer Directory/)).toBeTruthy();
      expect(screen.getByText(/Emma Watson/)).toBeTruthy();
      expect(screen.getByText('emma.watson@example.com')).toBeTruthy();
      expect(screen.getByText('Seattle, WA, US')).toBeTruthy();
    });

    // Spending metrics
    expect(screen.getByText('Lifetime Realized Spend')).toBeTruthy();
    expect(screen.getByText(/\$420\.50/)).toBeTruthy();
    expect(screen.getByText('Average Order Value (AOV)')).toBeTruthy();

    // Order history table
    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeTruthy();
      expect(screen.getByText('Classic Leather Sneakers')).toBeTruthy();
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('renders a friendly not-found view when customer ID does not exist', async () => {
    // Override only for this test
    endpoints.getCustomerById.mockRejectedValueOnce(mockNotFoundError);
    endpoints.getOrdersByCustomer.mockResolvedValueOnce({ data: [], pagination: { total: 0 } });

    render(
      <MemoryRouter initialEntries={['/customers/cus_invalid_999']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Customer Not Found/i)).toBeTruthy();
      expect(screen.getByText(/Return to Directory/i)).toBeTruthy();
    });
  });
});
