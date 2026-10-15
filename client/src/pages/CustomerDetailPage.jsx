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
import { getCustomerById, getOrdersByCustomer, getHealth, getMeta } from '../lib/endpoints.js';

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
