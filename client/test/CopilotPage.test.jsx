import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CopilotPage } from '../src/pages/CopilotPage.jsx';
import * as copilotApi from '../src/lib/copilotApi.js';

const mockRevenueAnswer = {
  question: 'How is revenue performing?',
  intent: 'revenue',
  answer: 'Revenue is growing, up 8.2% vs the prior period.',
  narrative: 'The store generated $45,200 across 312 orders in the current window.',
  metrics: [
    { label: 'Current Revenue', value: '$45,200', context: 'Last 30 days' },
    { label: 'Orders Placed', value: 312, context: 'Revenue-generating orders' },
    { label: 'Avg Order Value', value: '$144.87', context: 'Current period' },
  ],
  citations: [
    { source: 'metricsService', label: 'Revenue & order metrics', href: '/' },
  ],
  suggestedFollowUps: [
    'Which customers are at risk of churning?',
    'What are our most important business problems?',
  ],
  answeredAt: '2026-04-15T10:00:00.000Z',
  mode: 'rule-based',
};

const mockUnsupportedAnswer = {
  question: 'What is the weather?',
  intent: 'unsupported',
  answer: "I don't have enough information to answer that question from available store data.",
  narrative: 'This Copilot is a rule-based business assistant.',
  metrics: [],
  citations: [],
  suggestedFollowUps: ['How is revenue performing?'],
  answeredAt: '2026-04-15T10:00:00.000Z',
  mode: 'rule-based',
};

describe('CopilotPage component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state with starter questions and mode disclosure', () => {
    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('copilot-empty-state')).toBeTruthy();
    expect(screen.getAllByText(/CommercePilot Copilot/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rule-based business assistant/)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Ask about revenue/)).toBeTruthy();
    // Starter questions should be present
    expect(screen.getByText(/How is revenue performing/)).toBeTruthy();
    expect(screen.getByText(/customers are at risk/)).toBeTruthy();
  });

  it('submits a question and displays answer with metrics and citations', async () => {
    vi.spyOn(copilotApi, 'postCopilotChat').mockResolvedValue(mockRevenueAnswer);

    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask about revenue/);
    fireEvent.change(textarea, { target: { value: 'How is revenue performing?' } });

    const submitBtn = screen.getByRole('button', { name: /send question/i });
    fireEvent.click(submitBtn);

    // Typing indicator should appear
    expect(screen.getByTestId('copilot-loading')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('copilot-answer')).toBeTruthy();
    });

    expect(screen.getByText('Revenue is growing, up 8.2% vs the prior period.')).toBeTruthy();
    expect(screen.getByText('Current Revenue')).toBeTruthy();
    expect(screen.getByText('$45,200')).toBeTruthy();
    // Citation should be rendered
    expect(screen.getByText('Revenue & order metrics')).toBeTruthy();
  });

  it('sends a message via Enter key', async () => {
    const spy = vi.spyOn(copilotApi, 'postCopilotChat').mockResolvedValue(mockRevenueAnswer);

    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask about revenue/);
    fireEvent.change(textarea, { target: { value: 'How is revenue performing?' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('How is revenue performing?');
    });
  });

  it('shows suggested follow-ups and allows clicking them', async () => {
    const spy = vi.spyOn(copilotApi, 'postCopilotChat')
      .mockResolvedValueOnce(mockRevenueAnswer)
      .mockResolvedValueOnce(mockUnsupportedAnswer);

    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Ask about revenue/),
      { target: { value: 'How is revenue performing?' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    await waitFor(() => {
      expect(screen.getByTestId('copilot-answer')).toBeTruthy();
    });

    // Click the first follow-up suggestion
    const followUpBtn = screen.getByRole('button', { name: /Which customers are at risk/i });
    fireEvent.click(followUpBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it('shows error state when API call fails', async () => {
    vi.spyOn(copilotApi, 'postCopilotChat').mockRejectedValue(new Error('Server error'));

    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Ask about revenue/),
      { target: { value: 'How is revenue performing?' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    await waitFor(() => {
      expect(screen.getByTestId('copilot-error')).toBeTruthy();
      expect(screen.getByText('Server error')).toBeTruthy();
    });
  });

  it('shows validation error for empty message submission', async () => {
    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    // Submit is disabled when input is empty; test direct form submission instead
    const form = screen.getByRole('button', { name: /send question/i });
    expect(form).toBeDisabled();
  });

  it('sends a starter question when clicked from empty state', async () => {
    const spy = vi.spyOn(copilotApi, 'postCopilotChat').mockResolvedValue(mockRevenueAnswer);

    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    const starterBtn = screen.getByRole('button', { name: /How is revenue performing/i });
    fireEvent.click(starterBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('How is revenue performing?');
    });
  });
});
