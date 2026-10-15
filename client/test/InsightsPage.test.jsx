import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InsightsPage } from '../src/pages/InsightsPage.jsx';
import * as endpoints from '../src/lib/endpoints.js';

const mockInsightsData = {
  evaluatedAt: '2026-04-15T00:00:00.000Z',
  range: {
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-04-15T00:00:00.000Z',
  },
  currency: 'USD',
  summary: {
    totalInsights: 2,
    bySeverity: {
      critical: 0,
      warning: 1,
      opportunity: 1,
      positive: 0,
    },
    businessHealthScore: 78,
    healthRating: 'Healthy',
  },
  insights: [
    {
      id: 'insight_rev_trajectory',
      title: 'Decelerating Revenue: Current Pace Down 12.4%',
      category: 'revenue_trend',
      severity: 'warning',
      summary: 'Revenue contracted by 12.4% compared to the previous period.',
      explanation: 'Detailed statistical explanation regarding recent deceleration.',
      supportingData: {
        currentPeriodRevenue: '$45,200',
        priorPeriodRevenue: '$51,600',
        revenueDeltaPct: -12.4,
      },
      recommendedAction: 'Trigger win-back incentives for recently active buyers.',
      impactEstimate: 'Moderate Revenue Defense',
    },
    {
      id: 'insight_basket_expansion',
      title: 'AOV Expansion: 62% of Orders Contain a Single Item',
      category: 'aov_growth',
      severity: 'opportunity',
      summary: 'High concentration of single-item orders indicates cross-sell headroom.',
      explanation: 'Evaluating cross-selling triggers across current order history.',
      supportingData: {
        singleItemOrderPct: 62.1,
        averageUnitsPerOrder: 1.4,
      },
      recommendedAction: 'Introduce Post-Purchase 1-Click Upsells.',
      impactEstimate: 'Estimated +8-15% AOV Lift',
    },
  ],
};

describe('InsightsPage component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton initially and displays insights upon successful fetch', async () => {
    vi.spyOn(endpoints, 'getInsights').mockResolvedValue(mockInsightsData);

    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    );

    // Initial loading skeleton should be present
    expect(screen.getByTestId('insights-loading')).toBeTruthy();

    // Wait for content to render
    await waitFor(() => {
      expect(screen.getByText('Store Health Index')).toBeTruthy();
      expect(screen.getByText('78')).toBeTruthy();
      expect(screen.getByText('Healthy')).toBeTruthy();
    });

    // Verify insight cards render
    expect(screen.getByText('Decelerating Revenue: Current Pace Down 12.4%')).toBeTruthy();
    expect(screen.getByText('AOV Expansion: 62% of Orders Contain a Single Item')).toBeTruthy();
    expect(screen.getByText('Trigger win-back incentives for recently active buyers.')).toBeTruthy();
  });

  it('handles severity tab filtering and triggers getInsights with selected filter', async () => {
    const spy = vi.spyOn(endpoints, 'getInsights').mockResolvedValue(mockInsightsData);

    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Insights')).toBeTruthy();
    });

    // Click on "Warnings" tab
    const warningTab = screen.getByRole('tab', { name: /Warnings/i });
    fireEvent.click(warningTab);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'warning' }),
        expect.anything()
      );
    });
  });

  it('renders error state and retries on button click', async () => {
    const spy = vi.spyOn(endpoints, 'getInsights')
      .mockRejectedValueOnce(new Error('Network connection failed'))
      .mockResolvedValueOnce(mockInsightsData);

    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Insights')).toBeTruthy();
      expect(screen.getByText('Network connection failed')).toBeTruthy();
    });

    // Click retry button
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Store Health Index')).toBeTruthy();
      expect(screen.getByText('78')).toBeTruthy();
    });
  });
});
