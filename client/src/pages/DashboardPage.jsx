import React from 'react';
import { AppShell } from '../components/layout/AppShell.jsx';
import { DateRangePicker } from '../components/dashboard/DateRangePicker.jsx';
import { DemoBanner } from '../components/dashboard/DemoBanner.jsx';
import { KpiGrid } from '../components/dashboard/KpiGrid.jsx';
import { RevenueTrendChart } from '../components/dashboard/RevenueTrendChart.jsx';
import { OrdersChart } from '../components/dashboard/OrdersChart.jsx';
import { NewCustomersChart } from '../components/dashboard/NewCustomersChart.jsx';
import { OrderStatusChart } from '../components/dashboard/OrderStatusChart.jsx';
import { CategorySalesChart } from '../components/dashboard/CategorySalesChart.jsx';
import { CustomerMixCard } from '../components/dashboard/CustomerMixCard.jsx';
import { TopCustomersTable } from '../components/dashboard/TopCustomersTable.jsx';
import { RecentOrdersTable } from '../components/dashboard/RecentOrdersTable.jsx';
import { useDateRange } from '../hooks/useDateRange.js';
import { useDashboardData } from '../hooks/useDashboardData.js';

// Derives currency from the first available data source; defaults to USD
function extractCurrency(summary) {
  return summary?.data?.currency ?? 'USD';
}

export function DashboardPage() {
  const { rangeSpec, from, to, interval, prevFrom, prevTo, compare, setRange, setCompare } =
    useDateRange();

  const { health, meta, summary, timeseries, compareTimeseries, breakdown, recentOrders, topCustomers } =
    useDashboardData({ from, to, interval, prevFrom, prevTo, compare });

  const currency = extractCurrency(summary);

  return (
    <AppShell
      meta={meta.data}
      health={health.data}
      healthError={health.error}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Demo Banner — only visible when running in demo mode */}
        <DemoBanner meta={meta.data} />

        {/* Date Range Controls */}
        <section aria-label="Date range filter">
          <DateRangePicker
            rangeSpec={rangeSpec}
            onChangeRange={setRange}
            compare={compare}
            onToggleCompare={setCompare}
            meta={meta.data}
          />
        </section>

        {/* KPI Cards Row */}
        <section aria-label="Key performance indicators">
          <KpiGrid
            summary={summary.data}
            loading={summary.loading}
            error={summary.error}
            onRetry={summary.refetch}
          />
        </section>

        {/* Revenue and Orders charts in 2-col layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section aria-label="Revenue trend">
            <RevenueTrendChart
              timeseries={timeseries.data}
              compareTimeseries={compareTimeseries.data}
              compare={compare}
              loading={timeseries.loading || (compare && compareTimeseries.loading)}
              error={timeseries.error || (compare ? compareTimeseries.error : null)}
              onRetry={timeseries.refetch}
              currency={currency}
            />
          </section>

          <section aria-label="Orders volume">
            <OrdersChart
              timeseries={timeseries.data}
              compareTimeseries={compareTimeseries.data}
              compare={compare}
              loading={timeseries.loading || (compare && compareTimeseries.loading)}
              error={timeseries.error || (compare ? compareTimeseries.error : null)}
              onRetry={timeseries.refetch}
            />
          </section>
        </div>

        {/* Order Status and Category Sales in 2-col layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section aria-label="Order status breakdown">
            <OrderStatusChart
              breakdown={breakdown.data}
              loading={breakdown.loading}
              error={breakdown.error}
              onRetry={breakdown.refetch}
              currency={currency}
            />
          </section>

          <section aria-label="Category sales">
            <CategorySalesChart
              breakdown={breakdown.data}
              loading={breakdown.loading}
              error={breakdown.error}
              onRetry={breakdown.refetch}
              currency={currency}
            />
          </section>
        </div>

        {/* New Customers and Customer Mix in 2-col layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section aria-label="New customer acquisition">
            <NewCustomersChart
              timeseries={timeseries.data}
              loading={timeseries.loading}
              error={timeseries.error}
              onRetry={timeseries.refetch}
            />
          </section>

          <section aria-label="Customer insights">
            <CustomerMixCard
              summary={summary.data}
              loading={summary.loading}
              error={summary.error}
              onRetry={summary.refetch}
            />
          </section>
        </div>

        {/* Top Customers and Recent Orders in 2-col layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section aria-label="Top customers">
            <TopCustomersTable
              topCustomers={topCustomers.data}
              loading={topCustomers.loading}
              error={topCustomers.error}
              onRetry={topCustomers.refetch}
              currency={currency}
            />
          </section>

          <section aria-label="Recent orders">
            <RecentOrdersTable
              recentOrders={recentOrders.data}
              loading={recentOrders.loading}
              error={recentOrders.error}
              onRetry={recentOrders.refetch}
              currency={currency}
            />
          </section>
        </div>

      </div>
    </AppShell>
  );
}
