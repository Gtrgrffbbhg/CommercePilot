// Component tests for ChartCard — loading, error, empty and chart view states
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartCard } from '../src/components/ui/ChartCard.jsx';

describe('ChartCard', () => {
  const defaultProps = {
    title: 'Revenue Trend',
    ariaLabel: 'Revenue chart',
    renderChart: () => <div data-testid="chart-content">chart here</div>,
  };

  it('renders the card title', () => {
    render(<ChartCard {...defaultProps} />);
    expect(screen.getByText('Revenue Trend')).toBeTruthy();
  });

  it('shows chart content when not loading/error/empty', () => {
    render(<ChartCard {...defaultProps} />);
    expect(screen.getByTestId('chart-content')).toBeTruthy();
  });

  it('shows skeleton when loading=true and NOT the chart', () => {
    const { container } = render(<ChartCard {...defaultProps} loading={true} />);
    // Skeleton renders aria-hidden divs, chart-content should not be present
    expect(container.querySelector('[data-testid="chart-content"]')).toBeNull();
  });

  it('shows error message when error prop is set', () => {
    const err = new Error('Network failure');
    render(<ChartCard {...defaultProps} error={err} onRetry={() => {}} />);
    expect(screen.getByText(/Network failure/i)).toBeTruthy();
  });

  it('shows a Retry button in error state', () => {
    const err = new Error('Oops');
    render(<ChartCard {...defaultProps} error={err} onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy();
  });

  it('shows empty message when isEmpty=true', () => {
    render(
      <ChartCard
        {...defaultProps}
        isEmpty={true}
        emptyMessage="No data for this range"
      />
    );
    expect(screen.getByText(/No data for this range/i)).toBeTruthy();
  });

  it('shows "View as table" toggle when renderTable is provided', () => {
    render(
      <ChartCard
        {...defaultProps}
        renderTable={() => <table><tbody><tr><td>row</td></tr></tbody></table>}
      />
    );
    expect(screen.getByRole('button', { name: /View as table/i })).toBeTruthy();
  });

  it('switches to table view on toggle click', async () => {
    const user = userEvent.setup();
    render(
      <ChartCard
        {...defaultProps}
        renderTable={() => <table><tbody><tr><td data-testid="table-row">row</td></tr></tbody></table>}
      />
    );
    await user.click(screen.getByRole('button', { name: /View as table/i }));
    expect(screen.getByTestId('table-row')).toBeTruthy();
    // Chart should now be hidden
    expect(screen.queryByTestId('chart-content')).toBeNull();
  });

  it('does NOT show table toggle when loading=true', () => {
    render(
      <ChartCard
        {...defaultProps}
        loading={true}
        renderTable={() => <div>table</div>}
      />
    );
    expect(screen.queryByRole('button', { name: /View as table/i })).toBeNull();
  });
});
