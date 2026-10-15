import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CustomersPage } from '../src/pages/CustomersPage.jsx';
import * as endpoints from '../src/lib/endpoints.js';

describe('CustomersPage Component', () => {
  const mockCustomersResponse = {
    data: [
      {
        id: 'cus_00001',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice.smith@example.com',
        city: 'Austin',
        state: 'TX',
        country: 'US',
        isGuest: false,
        orderCount: 5,
        totalSpent: 450.75,
        lastOrderAt: '2026-10-10T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'cus_00002',
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob.jones@example.com',
        city: 'Denver',
        state: 'CO',
        country: 'US',
        isGuest: true,
        orderCount: 1,
        totalSpent: 89.99,
        lastOrderAt: '2026-09-15T00:00:00.000Z',
        createdAt: '2026-09-15T00:00:00.000Z',
      },
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    },
    summary: {
      totalCustomers: 500,
      repeatCustomers: 350,
      oneTimeCustomers: 150,
      totalRevenue: 125430.5,
      averageCustomerSpend: 250.86,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(endpoints, 'getMeta').mockResolvedValue({
      dataSource: 'demo',
      isDemo: true,
      seed: 42,
    });
    vi.spyOn(endpoints, 'getHealth').mockResolvedValue({
      status: 'ok',
      uptimeSeconds: 120,
    });
    vi.spyOn(endpoints, 'getCustomers').mockResolvedValue(mockCustomersResponse);
  });

  it('renders summary metrics, customer rows, and search input', async () => {
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <CustomersPage />
      </MemoryRouter>
    );

    // Verify page title
    expect(screen.getByText('Customer Directory')).toBeTruthy();

    // Verify customer data loaded
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
      expect(screen.getByText('alice.smith@example.com')).toBeTruthy();
      expect(screen.getByText('Bob Jones')).toBeTruthy();
    });

    // Check summary statistics rendered
    expect(screen.getByText('Total Customers')).toBeTruthy();
    expect(screen.getByText('Repeat Buyers')).toBeTruthy();
    expect(screen.getByText('One-Time Buyers')).toBeTruthy();
    expect(screen.getByText('Average Customer Spend')).toBeTruthy();
  });

  it('renders guest and repeat badges accurately', async () => {
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <CustomersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Guest')).toBeTruthy();
      expect(screen.getByText('Registered')).toBeTruthy();
      expect(screen.getByText('Repeat')).toBeTruthy();
      expect(screen.getByText('1-time')).toBeTruthy();
    });
  });

  it('renders empty search state when no records match', async () => {
    vi.spyOn(endpoints, 'getCustomers').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      summary: mockCustomersResponse.summary,
    });

    render(
      <MemoryRouter initialEntries={['/customers?search=nonexistent']}>
        <CustomersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No matching customers found/i)).toBeTruthy();
    });
  });

  it('renders error state with retry button on API failure', async () => {
    vi.spyOn(endpoints, 'getCustomers').mockRejectedValue(new Error('Network connection timeout'));

    render(
      <MemoryRouter initialEntries={['/customers']}>
        <CustomersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load customer directory')).toBeTruthy();
      expect(screen.getByText('Network connection timeout')).toBeTruthy();
      expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
    });
  });
});
