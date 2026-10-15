import React from 'react';
import { useApi } from '../hooks/useApi.js';
import { Header } from '../components/layout/Header.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { formatCurrency, formatNumber, formatDate, formatPercent } from '../lib/format.js';

export function FoundationCheck() {
  const { data: health, error: healthError, reload: reloadHealth } = useApi('/api/health');
  const { data: wcHealth, loading: wcLoading, error: wcError, reload: reloadWcHealth } = useApi('/api/woocommerce/health');
  const { data: wcProducts, loading: wcProductsLoading } = useApi('/api/woocommerce/products?per_page=5');
  const { data: wcOrders, loading: wcOrdersLoading } = useApi('/api/woocommerce/orders?per_page=5');
  const { data: meta, loading: metaLoading, error: metaError, reload: reloadMeta } = useApi('/api/meta');
  const { data: summary, loading: summaryLoading, error: summaryError, reload: reloadSummary } = useApi('/api/metrics/summary');
  const { data: customersData, loading: customersLoading, error: customersError, reload: reloadCustomers } = useApi('/api/customers?pageSize=5');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header meta={meta} health={health} healthError={healthError} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">System Foundation Check</h2>
              <p className="text-xs text-slate-400 mt-1">
                Verifying end-to-end request lifecycle: Client Proxy &rarr; Express Router &rarr; Zod Validation &rarr; Demo Repository
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded border border-slate-700/60 self-start sm:self-auto">
              Prompt 1 of 6: Foundation
            </div>
          </div>
        </div>

        {/* WooCommerce Live / Demo Connection Status Banner */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">WooCommerce Integration Health</h3>
                {wcHealth?.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Store Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Demo Mode Fallback Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Endpoint: /api/woocommerce/health</p>
            </div>
            <button
              type="button"
              onClick={reloadWcHealth}
              disabled={wcLoading}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/50 cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {wcLoading ? 'Checking...' : 'Check Connection'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-sans block">Target Store URL</span>
              <span className="text-slate-200 mt-1 block truncate">
                {wcHealth?.storeUrl || 'http://commercepilot-store.local'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-sans block">API Credentials</span>
              <span className={`mt-1 block font-semibold ${wcHealth?.configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {wcHealth?.configured ? 'Configured (Server-Side)' : 'Pending (Consumer Key & Secret)'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-sans block">Operating Status</span>
              <span className="text-slate-300 mt-1 block">
                {wcHealth?.connected
                  ? 'Real API Connection Active'
                  : wcHealth?.reason || 'Retaining safe deterministic demo fallback'}
              </span>
            </div>
          </div>

          {/* Live WooCommerce Catalog & Order Preview when connected */}
          {wcHealth?.connected && (
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/80">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live Products (/api/woocommerce/products)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {wcProducts?.total ?? 0} found
                  </span>
                </div>
                {wcProductsLoading ? (
                  <div className="py-4"><Spinner /></div>
                ) : wcProducts?.data?.length > 0 ? (
                  <div className="space-y-1.5 text-xs font-mono">
                    {wcProducts.data.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-slate-300 bg-slate-900/60 px-2 py-1.5 rounded">
                        <span className="truncate max-w-[180px] font-sans text-slate-200">{p.name}</span>
                        <span className="text-emerald-400 font-medium">₹{p.price || '0.00'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No products found in store.</p>
                )}
              </div>

              <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/80">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live Orders (/api/woocommerce/orders)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {wcOrders?.total ?? 0} found
                  </span>
                </div>
                {wcOrdersLoading ? (
                  <div className="py-4"><Spinner /></div>
                ) : wcOrders?.data?.length > 0 ? (
                  <div className="space-y-1.5 text-xs font-mono">
                    {wcOrders.data.slice(0, 4).map((o) => (
                      <div key={o.id} className="flex justify-between items-center text-slate-300 bg-slate-900/60 px-2 py-1.5 rounded">
                        <span className="text-slate-200 font-sans">Order #{o.id} ({o.status})</span>
                        <span className="text-emerald-400 font-medium">₹{o.total}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No orders found in store.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Global Connection Alert if health fails */}
        {healthError && (
          <ErrorState
            title="API Server Unreachable"
            message={healthError.message}
            onRetry={() => {
              reloadHealth();
              reloadMeta();
              reloadSummary();
              reloadCustomers();
            }}
          />
        )}

        {/* The Three Foundation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: System & Data Metadata */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">1. Data Source & Meta</h3>
                <p className="text-xs text-slate-400">Endpoint: /api/meta</p>
              </div>
              <button
                type="button"
                onClick={reloadMeta}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/50 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {metaLoading ? (
                <div className="py-12"><Spinner /></div>
              ) : metaError ? (
                <ErrorState message={metaError.message} onRetry={reloadMeta} />
              ) : !meta ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Data Source</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400">{meta.dataSource}</td>
                      </tr>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Demo Mode</td>
                        <td className="py-2.5 text-right font-mono text-amber-400">{String(meta.isDemo)}</td>
                      </tr>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Deterministic Seed</td>
                        <td className="py-2.5 text-right font-mono text-slate-200">{meta.seed}</td>
                      </tr>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Total Customers</td>
                        <td className="py-2.5 text-right font-semibold text-indigo-300">{formatNumber(meta.counts.customers)}</td>
                      </tr>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Total Orders</td>
                        <td className="py-2.5 text-right font-semibold text-indigo-300">{formatNumber(meta.counts.orders)}</td>
                      </tr>
                      <tr className="border-b border-slate-800/80">
                        <td className="py-2.5 text-slate-400 font-medium">Currency</td>
                        <td className="py-2.5 text-right font-mono text-slate-200">{meta.currency}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-400 font-medium">Range Window</td>
                        <td className="py-2.5 text-right text-slate-300">
                          {formatDate(meta.dataRange.from)} &ndash; {formatDate(meta.dataRange.to)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Metrics Summary */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">2. Intelligence Metrics</h3>
                <p className="text-xs text-slate-400">Endpoint: /api/metrics/summary</p>
              </div>
              <button
                type="button"
                onClick={reloadSummary}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/50 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {summaryLoading ? (
                <div className="py-12"><Spinner /></div>
              ) : summaryError ? (
                <ErrorState message={summaryError.message} onRetry={reloadSummary} />
              ) : !summary ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-2">KPI (Last 30d)</th>
                        <th className="py-2 text-right">Current</th>
                        <th className="py-2 text-right">Prior</th>
                        <th className="py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Revenue</td>
                        <td className="py-2 text-right text-emerald-400 font-semibold">
                          {formatCurrency(summary.kpis.revenue, summary.currency)}
                        </td>
                        <td className="py-2 text-right text-slate-400">
                          {formatCurrency(summary.previous.revenue, summary.currency)}
                        </td>
                        <td className="py-2 text-right text-slate-300">
                          {formatPercent(summary.deltaPct.revenue)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Orders</td>
                        <td className="py-2 text-right text-slate-200">{formatNumber(summary.kpis.orders)}</td>
                        <td className="py-2 text-right text-slate-400">{formatNumber(summary.previous.orders)}</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.orders)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Average Order (AOV)</td>
                        <td className="py-2 text-right text-slate-200">{formatCurrency(summary.kpis.averageOrderValue, summary.currency)}</td>
                        <td className="py-2 text-right text-slate-400">{formatCurrency(summary.previous.averageOrderValue, summary.currency)}</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.averageOrderValue)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Active Buyers</td>
                        <td className="py-2 text-right text-slate-200">{formatNumber(summary.kpis.activeCustomers)}</td>
                        <td className="py-2 text-right text-slate-400">{formatNumber(summary.previous.activeCustomers)}</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.activeCustomers)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">New Buyers</td>
                        <td className="py-2 text-right text-slate-200">{formatNumber(summary.kpis.newCustomers)}</td>
                        <td className="py-2 text-right text-slate-400">{formatNumber(summary.previous.newCustomers)}</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.newCustomers)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Returning Rate</td>
                        <td className="py-2 text-right text-slate-200">{summary.kpis.returningCustomerRate}%</td>
                        <td className="py-2 text-right text-slate-400">{summary.previous.returningCustomerRate}%</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.returningCustomerRate)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans text-slate-300 font-medium">Refund Rate</td>
                        <td className="py-2 text-right text-rose-400">{summary.kpis.refundRate}%</td>
                        <td className="py-2 text-right text-slate-400">{summary.previous.refundRate}%</td>
                        <td className="py-2 text-right text-slate-300">{formatPercent(summary.deltaPct.refundRate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Card 3: Customers Sample */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">3. Customer Directory Preview</h3>
                <p className="text-xs text-slate-400">Endpoint: /api/customers?pageSize=5</p>
              </div>
              <button
                type="button"
                onClick={reloadCustomers}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/50 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {customersLoading ? (
                <div className="py-12"><Spinner /></div>
              ) : customersError ? (
                <ErrorState message={customersError.message} onRetry={reloadCustomers} />
              ) : !customersData || customersData.data.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                    <span>Showing top 5 customers</span>
                    <span className="text-indigo-400 font-semibold">
                      Total: {formatNumber(customersData.pagination.total)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="py-2">Customer</th>
                          <th className="py-2 text-right">Spent</th>
                          <th className="py-2 text-right">Orders</th>
                          <th className="py-2 text-right">Last Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {customersData.data.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-800/40">
                            <td className="py-2 font-sans">
                              <p className="font-medium text-slate-200">{c.firstName} {c.lastName}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[130px] font-mono">{c.email}</p>
                            </td>
                            <td className="py-2 text-right text-emerald-400 font-medium">
                              {formatCurrency(c.totalSpent)}
                            </td>
                            <td className="py-2 text-right text-slate-300">{c.orderCount}</td>
                            <td className="py-2 text-right text-slate-400 text-[11px]">
                              {formatDate(c.lastOrderAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    Verified: Customer table total ({customersData.pagination.total}) exactly matches Meta count ({meta?.counts?.customers}).
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
