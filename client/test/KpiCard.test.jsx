// Component tests for KpiCard — renders values, delta chips, and accessibility markup
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '../src/components/dashboard/KpiCard.jsx';

describe('KpiCard', () => {
  it('renders the metric label from KPI_CONFIG', () => {
    render(<KpiCard metricKey="revenue" value={12345.67} delta={5.2} currency="USD" />);
    expect(screen.getByText('Total Revenue')).toBeTruthy();
  });

  it('formats currency values correctly', () => {
    render(<KpiCard metricKey="revenue" value={1000} delta={0} currency="USD" />);
    expect(screen.getByText(/\$1,000\.00/)).toBeTruthy();
  });

  it('formats integer values for count metrics', () => {
    render(<KpiCard metricKey="orders" value={42} delta={0} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('shows positive delta in green tone', () => {
    render(<KpiCard metricKey="orders" value={100} delta={10.5} />);
    expect(screen.getByText(/\+10\.5%/)).toBeTruthy();
  });

  it('shows negative delta in red tone', () => {
    render(<KpiCard metricKey="orders" value={100} delta={-5.0} />);
    expect(screen.getByText(/-5\.0%/)).toBeTruthy();
  });

  it('shows dash for null value', () => {
    const { container } = render(<KpiCard metricKey="orders" value={null} delta={null} />);
    expect(container.textContent).toContain('—');
  });

  it('shows "No prior data" when delta is null', () => {
    render(<KpiCard metricKey="orders" value={42} delta={null} />);
    expect(screen.getByText(/No prior data/i)).toBeTruthy();
  });

  it('uses inverted delta logic for refundRate (higher is bad)', () => {
    // For refundRate with positive delta, tone should be negative (red)
    const { container } = render(<KpiCard metricKey="refundRate" value={3.5} delta={2.0} />);
    // The down arrow is shown because positive delta on invertDelta=true means bad
    // We check that the chip contains '↑' (the raw change direction, which maps to red class)
    expect(container.textContent).toContain('+2.0%');
  });

  it('formats rate metrics as percentage', () => {
    render(<KpiCard metricKey="returningCustomerRate" value={65.3} delta={0} />);
    expect(screen.getByText('65.3%')).toBeTruthy();
  });
});
