import React from 'react';

export function ErrorState({ title = 'Failed to load data', message, onRetry, className = '' }) {
  return (
    <div
      className={`rounded-lg border border-red-500/20 bg-red-950/20 p-4 text-red-200 ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-red-300">{title}</h4>
            <p className="text-xs text-red-400/90 mt-1">{message || 'An unknown error occurred.'}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 text-xs font-medium text-red-200 bg-red-900/40 hover:bg-red-800/50 border border-red-700/50 rounded transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
