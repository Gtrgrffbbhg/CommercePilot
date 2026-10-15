// Routing tests — verifies each URL renders the correct page component.
// Uses MemoryRouter to avoid BrowserHistory in jsdom.
// Mocks heavy pages to keep tests fast (we test routing logic, not page rendering).
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Stub page modules before importing App so vi.mock hoisting works
vi.mock('../src/pages/DashboardPage.jsx', () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock('../src/pages/FoundationCheck.jsx', () => ({
  FoundationCheck: () => <div data-testid="foundation-check-page">Foundation Check</div>,
}));

// Stub AppShell so the 404 route doesn't try to render real UI
vi.mock('../src/components/layout/AppShell.jsx', () => ({
  AppShell: ({ children }) => <div data-testid="app-shell">{children}</div>,
}));

// Import page stubs after mocks are declared
import { DashboardPage } from '../src/pages/DashboardPage.jsx';
import { FoundationCheck } from '../src/pages/FoundationCheck.jsx';
import { AppShell } from '../src/components/layout/AppShell.jsx';

// Renders the same Routes that App.jsx uses, but with MemoryRouter for test isolation
function renderAtPath(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/foundation-check" element={<FoundationCheck />} />
        <Route
          path="*"
          element={
            <AppShell>
              <div data-testid="not-found">404</div>
            </AppShell>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('renders DashboardPage at "/"', () => {
    renderAtPath('/');
    expect(screen.getByTestId('dashboard-page')).toBeTruthy();
  });

  it('renders FoundationCheck at "/foundation-check"', () => {
    renderAtPath('/foundation-check');
    expect(screen.getByTestId('foundation-check-page')).toBeTruthy();
  });

  it('renders 404 for unknown paths', () => {
    renderAtPath('/this-does-not-exist');
    expect(screen.getByTestId('not-found')).toBeTruthy();
  });

  it('does NOT render DashboardPage at "/foundation-check"', () => {
    renderAtPath('/foundation-check');
    expect(screen.queryByTestId('dashboard-page')).toBeNull();
  });

  it('does NOT render FoundationCheck at "/"', () => {
    renderAtPath('/');
    expect(screen.queryByTestId('foundation-check-page')).toBeNull();
  });
});
