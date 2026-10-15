import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { DemoBanner } from '../components/dashboard/DemoBanner.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { formatCurrency, formatNumber, formatDate } from '../lib/format.js';
import { getCustomerById, getOrdersByCustomer, getCustomerIntelligence, getHealth, getMeta } from '../lib/endpoints.js';

export function CustomerDetailPage() {
  const { id } = useParams();

  // AppShell header state
  const [meta, setMeta] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);

  // Customer & order history data
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Customer retention intelligence state
  const [intelligence, setIntelligence] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Load system meta & health
  useEffect(() => {
    const controller = new AbortController();
    getMeta(controller.signal).then((res) => setMeta(res)).catch(() => {});
    getHealth(controller.signal)
      .then((res) => setHealth(res))
      .catch((err) => {
        if (err.name !== 'AbortError') setHealthError(err);
      });
    return () => controller.abort();
  }, []);

  // Fetch customer details
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getCustomerById(id, controller.signal)
      .then((res) => {
        setCustomer(res);
        setError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => {
        // Always clear loading spinner — abort guard on setCustomer/setError
        // in .then()/.catch() prevents stale writes; we must clear loading
        // unconditionally or the page stays stuck on the skeleton forever.
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadTrigger]);

  // Fetch customer orders (full history, optional status filter)
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setOrdersLoading(true);

    getOrdersByCustomer(
      {
        customerId: id,
        page: 1,
        pageSize: 100, // Show full order history for individual customer profile
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
      controller.signal
    )
      .then((res) => {
        setOrders(res.data || []);
        setOrdersTotal(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
      })
      .finally(() => {
        // Always clear loading — abort guard on setOrders() is sufficient
        // to prevent stale-data writes. Leaving ordersLoading=true forever
        // would hide the order table behind the skeleton permanently.
        setOrdersLoading(false);
      });

    return () => controller.abort();
  }, [id, statusFilter, reloadTrigger]);

  // Fetch customer retention intelligence (deterministic RFM & outreach draft)
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setIntelligenceLoading(true);
    setIntelligenceError(null);

    getCustomerIntelligence(id, controller.signal)
      .then((res) => {
        setIntelligence(res);
        setIntelligenceError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setIntelligenceError(err);
      })
      .finally(() => {
        setIntelligenceLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadTrigger]);

  const handleCopy = async () => {
    if (!intelligence?.recommendation) return;
    const fullText = `Subject: ${intelligence.recommendation.subject}\n\n${intelligence.recommendation.body}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppShell meta={meta} health={health} healthError={healthError}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Demo Banner */}
        <DemoBanner meta={meta} />

        {/* Breadcrumb Back Link */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/customers" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-1">
            &larr; Back to Customer Directory
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-mono truncate">{id}</span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton height="h-8" width="w-64" />
              <Skeleton height="h-4" width="w-48" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height="h-20" />
                ))}
              </div>
            </Card>
            <Card className="p-6 space-y-4">
              <Skeleton height="h-6" width="w-40" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </Card>
          </div>
        ) : error ? (
          <Card className="p-8">
            {error.status === 404 || error.message?.includes('not found') || error.code === 'CUSTOMER_NOT_FOUND' ? (
              <EmptyState
                title={`Customer Not Found (${id})`}
                message="We could not find any customer account with this identifier. It may have been removed or never existed."
              />
            ) : (
              <ErrorState
                title="Failed to load customer profile"
                message={error.message}
                onRetry={() => setReloadTrigger((r) => r + 1)}
              />
            )}
            <div className="mt-6 text-center">
              <Link
                to="/customers"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Return to Directory
              </Link>
            </div>
          </Card>
        ) : customer ? (
          <>
            {/* Customer Header & Core Profile Card */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-xl font-bold font-mono shadow-lg shrink-0">
                    {customer.firstName?.[0] || 'C'}
                    {customer.lastName?.[0] || 'P'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {customer.firstName} {customer.lastName}
                      </h1>
                      {customer.isGuest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800/40">
                          Guest Checkout
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                          Registered Account
                        </span>
                      )}
                      {customer.orderCount > 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Repeat Buyer ({customer.orderCount} orders)
                        </span>
                      ) : customer.orderCount === 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                          First-Time Buyer
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-slate-500">ID:</span>
                        <span className="text-slate-300">{customer.id}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-slate-500">Email:</span>
                        <a href={`mailto:${customer.email}`} className="text-indigo-400 hover:underline">
                          {customer.email}
                        </a>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-500">Phone:</span>
                          <span className="text-slate-300">{customer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-slate-300">
                          {customer.city ? `${customer.city}, ${customer.state}, ${customer.country}` : 'United States'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Member Since:</span>
                        <span className="text-slate-300">{formatDate(customer.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                    Source: <strong className="text-slate-200 capitalize">{customer.source}</strong>
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="text-xs font-medium text-slate-400">Lifetime Realized Spend</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Across processing & completed orders</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="text-xs font-medium text-slate-400">Revenue Orders</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                    {formatNumber(customer.orderCount)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Valid qualifying purchases</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="text-xs font-medium text-slate-400">Average Order Value (AOV)</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 mt-1">
                    {formatCurrency(customer.averageOrderValue)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Spend per revenue order</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="text-xs font-medium text-slate-400">Most Recent Purchase</p>
                  <p className="text-base sm:text-lg font-bold font-sans text-slate-200 mt-1 truncate">
                    {formatDate(customer.lastOrderAt)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">First order: {formatDate(customer.firstOrderAt)}</p>
                </div>
              </div>
            </Card>

            {/* Customer Retention Intelligence Card */}
            <Card className="p-6 border-indigo-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-white tracking-tight">Customer Retention Intelligence</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                        Deterministic RFM Engine
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Explainable retention analysis and tailored outreach draft derived from verified customer purchase patterns
                    </p>
                  </div>
                </div>
              </div>

              {intelligenceLoading ? (
                <div className="py-6 space-y-3">
                  <Skeleton height="h-6" width="w-48" />
                  <Skeleton height="h-16" />
                  <Skeleton height="h-24" />
                </div>
              ) : intelligenceError ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-rose-400">Unable to load retention intelligence: {intelligenceError.message}</p>
                </div>
              ) : intelligence ? (
                <div className="pt-5 space-y-5">
                  {/* Segment & Risk Classification Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <p className="text-[11px] font-medium text-slate-400">Classified Segment</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          intelligence.rfm?.segment === 'Champions'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50'
                            : intelligence.rfm?.segment === 'Loyal'
                            ? 'bg-indigo-950/70 text-indigo-400 border-indigo-800/50'
                            : intelligence.rfm?.segment === 'Recent Buyer'
                            ? 'bg-cyan-950/70 text-cyan-400 border-cyan-800/50'
                            : intelligence.rfm?.segment === 'At Risk'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800/50'
                            : intelligence.rfm?.segment === 'Hibernating'
                            ? 'bg-amber-950/70 text-amber-400 border-amber-800/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {intelligence.rfm?.segment}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <p className="text-[11px] font-medium text-slate-400">Churn Risk Level</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          intelligence.rfm?.riskLevel === 'Low'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50'
                            : intelligence.rfm?.riskLevel === 'High'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800/50'
                            : 'bg-amber-950/70 text-amber-400 border-amber-800/50'
                        }`}>
                          {intelligence.rfm?.riskLevel} Risk
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({intelligence.metrics?.daysSinceLastOrder !== null ? `${intelligence.metrics.daysSinceLastOrder}d elapsed` : 'No orders'})
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <p className="text-[11px] font-medium text-slate-400">Recommended Next Action</p>
                      <p className="text-xs font-medium text-indigo-300 mt-1.5">
                        {intelligence.recommendation?.action}
                      </p>
                    </div>
                  </div>

                  {/* Explainable Rationale */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-200 mb-2">Supporting Assessment Factors</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                      {intelligence.rfm?.reasons?.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Personalized Outreach Draft */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Personalized Retention Draft</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono truncate max-w-xs">
                          {intelligence.recommendation?.subject}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 border-b border-slate-900">
                      {intelligence.recommendation?.body}
                    </div>
                    <div className="px-4 py-2.5 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{intelligence.recommendation?.disclaimer}</span>
                      <span className="text-amber-400/90 font-medium font-sans">Simulated recommendation — not an authorized email</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>

            {/* Order History Section */}
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Order History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showing {orders.length} order{orders.length === 1 ? '' : 's'} placed by this customer account
                  </p>
                </div>

                {/* Status filter tabs for orders */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label htmlFor="order-status-filter" className="text-xs text-slate-400 font-medium mr-1">
                    Filter by Status:
                  </label>
                  <select
                    id="order-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Statuses ({ordersTotal})</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="on-hold">On Hold</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {ordersLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} height="h-14" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No orders found"
                    message={statusFilter !== 'all' ? `No orders found with status "${statusFilter}".` : 'This customer has not placed any orders yet.'}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <caption className="sr-only">Customer order history</caption>
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-medium">
                        <th scope="col" className="py-3 px-4">Order #</th>
                        <th scope="col" className="py-3 px-4">Date</th>
                        <th scope="col" className="py-3 px-4">Status</th>
                        <th scope="col" className="py-3 px-4">Items Summary</th>
                        <th scope="col" className="py-3 px-4">Payment</th>
                        <th scope="col" className="py-3 px-4 text-right">Order Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-200">
                            #{order.number}
                            <span className="block text-[10px] text-slate-500">{order.id}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div className="space-y-0.5 max-w-sm">
                              {order.lineItems?.map((item, idx) => (
                                <p key={idx} className="truncate text-[11px]">
                                  <strong className="text-slate-200 font-mono">{item.quantity}x</strong> {item.name}{' '}
                                  <span className="text-slate-500">({formatCurrency(item.total)})</span>
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 capitalize text-[11px]">
                            {order.paymentMethod?.replace(/_/g, ' ') || 'Standard'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-200 text-sm whitespace-nowrap">
                            {formatCurrency(order.total, order.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
