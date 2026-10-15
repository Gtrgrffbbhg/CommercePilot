// Hook coordinating isolated section data fetching for the executive dashboard

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHealth,
  getMeta,
  getMetricsSummary,
  getMetricsTimeseries,
  getMetricsOrderBreakdown,
  getRecentOrders,
  getTopCustomers,
} from '../lib/endpoints.js';

export function useSectionQuery(fetcher, deps = [], enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  const abortControllerRef = useRef(null);

  const refetch = useCallback(() => {
    setReloadCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount, enabled]);

  return { data, loading, error, refetch, reload: refetch };
}

export function useDashboardData({ from, to, interval, prevFrom, prevTo, compare }) {
  // 1. Health endpoint (not range-scoped; refreshes with the page)
  const health = useSectionQuery(useCallback((signal) => getHealth(signal), []), []);

  // 2. Meta query (cached across ranges)
  const meta = useSectionQuery(useCallback((signal) => getMeta(signal), []), []);

  // 3. Summary KPIs (range-scoped)
  const summary = useSectionQuery(
    useCallback((signal) => getMetricsSummary({ from, to }, signal), [from, to]),
    [from, to]
  );

  // 4. Timeseries for current period (range-scoped)
  const timeseries = useSectionQuery(
    useCallback((signal) => getMetricsTimeseries({ from, to, interval }, signal), [from, to, interval]),
    [from, to, interval]
  );

  // 5. Compare timeseries for previous period (only fetched when compare is enabled)
  const compareTimeseries = useSectionQuery(
    useCallback(
      (signal) => getMetricsTimeseries({ from: prevFrom, to: prevTo, interval }, signal),
      [prevFrom, prevTo, interval]
    ),
    [prevFrom, prevTo, interval],
    compare
  );

  // 6. Order status and category breakdown (range-scoped)
  const breakdown = useSectionQuery(
    useCallback((signal) => getMetricsOrderBreakdown({ from, to }, signal), [from, to]),
    [from, to]
  );

  // 7. Recent orders (8 newest in range)
  const recentOrders = useSectionQuery(
    useCallback((signal) => getRecentOrders({ from, to, pageSize: 8 }, signal), [from, to]),
    [from, to]
  );

  // 8. All-time top customers (not range-scoped)
  const topCustomers = useSectionQuery(
    useCallback((signal) => getTopCustomers({ pageSize: 5, sortBy: 'totalSpent' }, signal), []),
    []
  );

  return {
    health,
    meta,
    summary,
    timeseries,
    compareTimeseries,
    breakdown,
    recentOrders,
    topCustomers,
  };
}
