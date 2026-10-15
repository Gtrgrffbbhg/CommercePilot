import React from 'react';
import { Card } from '../ui/Card.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../lib/format.js';

export function RecentOrdersTable({
  recentOrders,
  loading = false,
  error = null,
  onRetry,
  currency = 'USD',
}) {
  return (
    <Card
      title="Recent Orders"
      subtitle="Newest customer orders placed within active date range"
    >
      <div className="min-h-[14rem] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-3 py-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height="h-9" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load recent orders"
            message={error.message}
            onRetry={onRetry}
          />
        ) : !recentOrders?.data || recentOrders.data.length === 0 ? (
          <EmptyState
            title="No orders found"
            message="No orders were placed during this date range. Try widening the range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <caption className="sr-only">Recent customer orders</caption>
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th scope="col" className="py-2.5 px-3">Order #</th>
                  <th scope="col" className="py-2.5 px-3">Date</th>
                  <th scope="col" className="py-2.5 px-3">Customer</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentOrders.data.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      #{order.number}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                          {order.customerEmail}
                        </span>
                        {order.isGuest && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            Guest
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-400">
                      {formatCurrency(order.total, order.currency || currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
