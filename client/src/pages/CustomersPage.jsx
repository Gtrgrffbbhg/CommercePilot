import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { DemoBanner } from '../components/dashboard/DemoBanner.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { formatCurrency, formatNumber, formatDate } from '../lib/format.js';
import { getCustomers, getHealth, getMeta } from '../lib/endpoints.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Customers' },
  { value: 'returning', label: 'Returning Buyers (> 1 order)' },
  { value: 'one_time', label: 'One-Time Buyers (1 order)' },
  { value: 'zero_orders', label: 'Zero Orders' },
  { value: 'registered', label: 'Registered Accounts' },
  { value: 'guest', label: 'Guest Checkouts' },
];

const SORT_OPTIONS = [
  { value: 'totalSpent', label: 'Total Spend' },
  { value: 'orderCount', label: 'Order Count' },
  { value: 'lastOrderAt', label: 'Most Recent Order' },
  { value: 'createdAt', label: 'Customer Since' },
  { value: 'name', label: 'Name' },
];

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params with defaults
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const sortBy = searchParams.get('sortBy') || 'totalSpent';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(search);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Data states
  const [customersData, setCustomersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // AppShell header metadata
  const [meta, setMeta] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);

  // Load system meta & health once on mount
  useEffect(() => {
    const controller = new AbortController();
    getMeta(controller.signal)
      .then((res) => setMeta(res))
      .catch(() => {});
    getHealth(controller.signal)
      .then((res) => setHealth(res))
      .catch((err) => {
        if (err.name !== 'AbortError') setHealthError(err);
      });

    return () => controller.abort();
  }, []);

  // Fetch customers on param changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getCustomers(
      { page, pageSize, sortBy, sortDir, search, status },
      controller.signal
    )
      .then((res) => {
        setCustomersData(res);
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

    return () => controller.abort();
  }, [page, pageSize, sortBy, sortDir, search, status, reloadTrigger]);

  // Update query params helper
  const updateParams = useCallback(
    (updates, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '' || val === 'all') {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      if (resetPage) {
        next.delete('page');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput }, true);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    updateParams({ search: '' }, true);
  };

  // Status filter change
  const handleStatusChange = (newStatus) => {
    updateParams({ status: newStatus }, true);
  };

  // Sort toggle on table column header
  const handleSortToggle = (field) => {
    if (sortBy === field) {
      const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
      updateParams({ sortBy: field, sortDir: nextDir }, false);
    } else {
      updateParams({ sortBy: field, sortDir: 'desc' }, false);
    }
  };

  // Pagination navigation
  const handlePageChange = (newPage) => {
    updateParams({ page: newPage }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const summary = customersData?.summary;
  const customers = customersData?.data || [];
  const pagination = customersData?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <AppShell meta={meta} health={health} healthError={healthError}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Demo banner indicator */}
        <DemoBanner meta={meta} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                {formatNumber(pagination.total)} customers
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore customer profiles, lifetime order history, repeat purchase rates, and spending behaviors.
            </p>
          </div>
        </div>

        {/* Directory Summary Metrics Cards */}
        {summary && (
          <section aria-label="Customer directory summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-400">Total Customers</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {formatNumber(summary.totalCustomers)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across all account types</p>
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-400">Repeat Buyers</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatNumber(summary.repeatCustomers)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.totalCustomers > 0
                  ? `${((summary.repeatCustomers / summary.totalCustomers) * 100).toFixed(1)}% repeat rate`
                  : '0%'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-400">One-Time Buyers</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1">
                {formatNumber(summary.oneTimeCustomers)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.totalCustomers > 0
                  ? `${((summary.oneTimeCustomers / summary.totalCustomers) * 100).toFixed(1)}% of base`
                  : '0%'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-400">Average Customer Spend</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 mt-1">
                {formatCurrency(summary.averageCustomerSpend)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Lifetime realized revenue</p>
            </Card>
          </section>
        )}

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search input form */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by customer name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans"
                />
                <svg
                  className="w-4 h-4 text-slate-500 absolute left-3 top-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search query"
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            {/* Status Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="status-filter" className="text-xs text-slate-400 font-medium shrink-0">
                Status:
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Sort By Dropdown for Mobile / Compact */}
              <label htmlFor="sort-select" className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                Sort:
              </label>
              <select
                id="sort-select"
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  updateParams({ sortBy: field, sortDir: dir }, false);
                }}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <React.Fragment key={opt.value}>
                    <option value={`${opt.value}-desc`}>{opt.label} (High &rarr; Low)</option>
                    <option value={`${opt.value}-asc`}>{opt.label} (Low &rarr; High)</option>
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {(search || status !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                  Search: "{search}"
                  <button type="button" onClick={handleClearSearch} className="hover:text-white cursor-pointer">
                    ✕
                  </button>
                </span>
              )}
              {status !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                  Status: {STATUS_FILTERS.find((f) => f.value === status)?.label}
                  <button type="button" onClick={() => handleStatusChange('all')} className="hover:text-white cursor-pointer">
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline ml-1 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}
        </Card>

        {/* Customer Directory Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton height="h-8" width="w-48" />
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load customer directory"
                message={error.message}
                onRetry={() => setReloadTrigger((r) => r + 1)}
              />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8">
              {search || status !== 'all' ? (
                <EmptyState
                  title="No matching customers found"
                  message={`No customers match "${search || ''}" with status "${status}". Try clearing your filters or broadening your search.`}
                />
              ) : (
                <EmptyState
                  title="Customer directory is empty"
                  message="There are no customer accounts in the database."
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <caption className="sr-only">Customer directory list</caption>
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-medium">
                    <th scope="col" className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('name')}
                        className="inline-flex items-center gap-1 hover:text-white font-medium cursor-pointer"
                      >
                        Customer Name
                        <span aria-hidden="true" className="text-[10px]">
                          {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-4 hidden md:table-cell">
                      Location
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Account Type
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('orderCount')}
                        className="inline-flex items-center gap-1 hover:text-white font-medium ml-auto cursor-pointer"
                      >
                        Orders
                        <span aria-hidden="true" className="text-[10px]">
                          {sortBy === 'orderCount' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('totalSpent')}
                        className="inline-flex items-center gap-1 hover:text-white font-medium ml-auto cursor-pointer"
                      >
                        Total Spend
                        <span aria-hidden="true" className="text-[10px]">
                          {sortBy === 'totalSpent' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-4 text-right hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('lastOrderAt')}
                        className="inline-flex items-center gap-1 hover:text-white font-medium ml-auto cursor-pointer"
                      >
                        Last Order
                        <span aria-hidden="true" className="text-[10px]">
                          {sortBy === 'lastOrderAt' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-medium text-slate-200 hover:text-indigo-400 focus:outline-none focus:underline"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                          {c.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell">
                        {c.city ? `${c.city}, ${c.state}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {c.isGuest ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              Guest
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                              Registered
                            </span>
                          )}
                          {c.orderCount > 1 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              Repeat
                            </span>
                          ) : c.orderCount === 1 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                              1-time
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                              No orders
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatNumber(c.orderCount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] hidden sm:table-cell">
                        {formatDate(c.lastOrderAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/customers/${c.id}`}
                          className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700/80 font-medium text-xs transition-colors"
                        >
                          View Profile &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && customers.length > 0 && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Showing page <strong className="text-slate-200">{pagination.page}</strong> of{' '}
                <strong className="text-slate-200">{pagination.totalPages}</strong> (
                {formatNumber(pagination.total)} total records)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  &larr; Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
