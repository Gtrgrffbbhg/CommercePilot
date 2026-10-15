// Regression test: verify useDateRange stability across re-renders
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDateRange } from '../src/hooks/useDateRange.js';

describe('useDateRange stability regression test', () => {
  it('preserves from and to timestamps across component re-renders when query params do not change', () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/?range=7d']}>{children}</MemoryRouter>
    );

    const { result, rerender } = renderHook(() => useDateRange(), { wrapper });

    const firstFrom = result.current.from;
    const firstTo = result.current.to;

    // Simulate parent re-render
    rerender();

    expect(result.current.from).toBe(firstFrom);
    expect(result.current.to).toBe(firstTo);
  });
});
