import React from 'react';
import { Card } from '../ui/Card.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { formatCurrency, formatNumber, formatDate } from '../../lib/format.js';

export function TopCustomersTable({
  topCustomers,
  loading = false,
  error = null,
  onRetry,
  currency = 'USD',
}) {
  return (
    <Card
      title="Top Customers"
      subtitle="Highest lifetime spenders across all store activity"
      headerAction={
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
          All-time, not affected by the date range
        </span>
      }
    >
      <div className="min-h-[14rem] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-3 py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height="h-9" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load top customers"
            message={error.message}
            onRetry={onRetry}
          />
        ) : !topCustomers?.data || topCustomers.data.length === 0 ? (
          <EmptyState title="No customers found" message="No customer accounts exist in the database." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <caption className="sr-only">Top customers by lifetime spend</caption>
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th scope="col" className="py-2.5 px-3">Customer</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Orders</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Total Spent</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {topCustomers.data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-sans">
                      <p className="font-medium text-slate-200">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                        {c.email}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatNumber(c.orderCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-400">
                      {formatCurrency(c.totalSpent, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-sans text-[11px]">
                      {formatDate(c.lastOrderAt)}
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
