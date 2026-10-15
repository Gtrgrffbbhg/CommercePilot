import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  getCustomerIntelligence: vi.fn().mockResolvedValue({
    customerId: 'cus_00001',
    evaluatedAt: '2026-10-15T00:00:00.000Z',
    metrics: { daysSinceLastOrder: 14, orderCount: 3, totalSpent: 420.5, averageOrderValue: 140.17 },
    rfm: {
      segment: 'Champions',
      riskLevel: 'Low',
      reasons: ['Recent purchase placed 14 days ago', 'High purchase frequency (3 orders)', 'Top lifetime spend ($420.50)'],
    },
    recommendation: {
      action: 'VIP appreciation & early collection access',
      suggestedOffer: 'VIP early access preview (Code: VIPACCESS - illustrative suggestion)',
      subject: 'Emma, a special thank you from our team',
      body: 'Hi Emma,\n\nWe wanted to reach out and express our sincere appreciation for your ongoing support...',
      disclaimer: 'Deterministic rule-based output based on historical purchase data. Not an automated email dispatch; suggested offers are illustrative examples only.',
    },
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
  it('renders customer profile, spending metrics, retention intelligence card, and order history', async () => {
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
    expect(screen.getAllByText(/\$420\.50/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Average Order Value (AOV)')).toBeTruthy();

    // Customer Retention Intelligence Card
    await waitFor(() => {
      expect(screen.getByText('Customer Retention Intelligence')).toBeTruthy();
      expect(screen.getByText('Champions')).toBeTruthy();
      expect(screen.getByText('Low Risk')).toBeTruthy();
      expect(screen.getByText('VIP appreciation & early collection access')).toBeTruthy();
      expect(screen.getByText(/Recent purchase placed 14 days ago/)).toBeTruthy();
      expect(screen.getByText('Copy Draft')).toBeTruthy();
    });

    // Order history table
    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeTruthy();
      expect(screen.getByText('Classic Leather Sneakers')).toBeTruthy();
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('triggers copy action on retention draft button click', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/customers/cus_00001']}>
          <Routes>
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Copy Draft')).toBeTruthy();
    });

    const copyBtn = screen.getByRole('button', { name: /copy draft/i });
    await user.click(copyBtn);

    // Verify button transitions to 'Copied!'
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeTruthy();
    });
  });

  it('renders a friendly not-found view when customer ID does not exist', async () => {
    endpoints.getCustomerById.mockRejectedValueOnce(mockNotFoundError);
    endpoints.getOrdersByCustomer.mockResolvedValueOnce({ data: [], pagination: { total: 0 } });
    endpoints.getCustomerIntelligence.mockRejectedValueOnce(mockNotFoundError);

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
