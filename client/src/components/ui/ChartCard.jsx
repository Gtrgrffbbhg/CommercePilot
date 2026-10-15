import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { ChartSkeleton } from './Skeleton.jsx';
import { ErrorState } from './ErrorState.jsx';
import { EmptyState } from './EmptyState.jsx';

export function ChartCard({
  title,
  subtitle,
  ariaLabel,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyMessage = 'No orders found in this range. Try selecting a wider date range.',
  renderChart,
  renderTable,
  headerAction,
  className = '',
  height = 'h-72',
}) {
  const [viewTable, setViewTable] = useState(false);

  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={className}
      headerAction={
        <div className="flex items-center gap-2">
          {headerAction}
          {!loading && !error && !isEmpty && renderTable && (
            <button
              type="button"
              onClick={() => setViewTable((prev) => !prev)}
              aria-pressed={viewTable}
              className="text-xs px-2.5 py-1 font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {viewTable ? 'View as chart' : 'View as table'}
            </button>
          )}
        </div>
      }
    >
      <div className={`w-full min-h-[18rem] ${height} flex flex-col justify-center`}>
        {loading ? (
          <ChartSkeleton height={height} />
        ) : error ? (
          <ErrorState
            title={`Failed to load ${title.toLowerCase()}`}
            message={error.message}
            onRetry={onRetry}
          />
        ) : isEmpty ? (
          <EmptyState title="No data available" message={emptyMessage} />
        ) : viewTable && renderTable ? (
          <div className="w-full h-full overflow-y-auto">{renderTable()}</div>
        ) : (
          <div
            role="img"
            aria-label={ariaLabel || `${title} visualization`}
            className="w-full h-full"
          >
            {renderChart()}
          </div>
        )}
      </div>
    </Card>
  );
}
