import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell.jsx';
import { DemoBanner } from '../components/dashboard/DemoBanner.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getInsights } from '../lib/endpoints.js';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical Alert',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotClass: 'bg-red-500',
    borderClass: 'border-red-500/30 hover:border-red-500/50',
    accentClass: 'text-red-400',
  },
  warning: {
    label: 'Warning',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30 hover:border-amber-500/50',
    accentClass: 'text-amber-400',
  },
  opportunity: {
    label: 'Growth Opportunity',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-500',
    borderClass: 'border-indigo-500/30 hover:border-indigo-500/50',
    accentClass: 'text-indigo-400',
  },
  positive: {
    label: 'Positive Trend',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/50',
    accentClass: 'text-emerald-400',
  },
};

const CATEGORY_LABELS = {
  revenue_trend: 'Revenue & Velocity',
  merchandise: 'Catalog & Merchandising',
  retention: 'Customer Retention',
  aov_growth: 'Basket Size & AOV',
  fulfillment: 'Operational Health',
};

const HEALTH_CONFIG = {
  Strong: {
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'High store stability with balanced merchandising and strong customer retention.',
  },
  Healthy: {
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10 border-indigo-500/30',
    description: 'Stable performance with clear growth levers available in basket size and retention.',
  },
  'Needs Attention': {
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    description: 'Noticeable velocity deceleration, retention gaps, or elevated refund rates present.',
  },
  Critical: {
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/30',
    description: 'Urgent risk factors identified across customer churn or operational fulfillment.',
  },
};

export function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchInsights = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInsights({ severity: severityFilter }, signal);
      setData(res);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load business insights');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchInsights(controller.signal);
    return () => controller.abort();
  }, [severityFilter]);

  const summary = data?.summary;
  const insights = data?.insights || [];
  const healthRating = summary?.healthRating || 'Healthy';
  const healthInfo = HEALTH_CONFIG[healthRating] || HEALTH_CONFIG.Healthy;

  return (
    <AppShell>
      <div className="space-y-6">
        <DemoBanner />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Business Insights & Actions</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explainable, deterministic business analysis and actionable playbook generated from verified order data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchInsights()}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/60 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Refresh Insights'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-900/50 bg-red-950/20 text-center py-8">
            <div className="text-red-400 text-sm font-semibold mb-2">Error Loading Insights</div>
            <p className="text-slate-400 text-xs max-w-md mx-auto mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchInsights()}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
            >
              Try Again
            </button>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="space-y-6" data-testid="insights-loading">
            <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-900 border border-slate-800 rounded-xl animate-pulse w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
              <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>
        )}

        {/* Content View */}
        {data && (
          <>
            {/* Store Health Overview Banner */}
            <Card className="border-slate-800 bg-slate-900/60 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Score Dial */}
                <div className="flex items-center gap-5">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                    <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                      {summary?.businessHealthScore}
                    </span>
                    <span className="absolute -bottom-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      / 100
                    </span>
                  </div>
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Store Health Index</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${healthInfo.textClass}`}>
                        {summary?.healthRating}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${healthInfo.bgClass} ${healthInfo.textClass} font-medium`}>
                        Verified Model
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">{healthInfo.description}</p>
                  </div>
                </div>

                {/* Severity Breakdown Badges */}
                <div className="lg:col-span-2 flex flex-wrap items-center justify-start lg:justify-end gap-3">
                  <div className="px-4 py-3 rounded-xl bg-slate-950/80 border border-red-500/20 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div>
                      <div className="text-xs text-slate-400">Critical</div>
                      <div className="text-base font-bold text-red-400 font-mono">
                        {summary?.bySeverity?.critical ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <div className="text-xs text-slate-400">Warnings</div>
                      <div className="text-base font-bold text-amber-400 font-mono">
                        {summary?.bySeverity?.warning ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-xs text-slate-400">Opportunities</div>
                      <div className="text-base font-bold text-indigo-400 font-mono">
                        {summary?.bySeverity?.opportunity ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs text-slate-400">Positive</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {summary?.bySeverity?.positive ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Severity Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3" role="tablist">
              {[
                { id: 'all', label: 'All Insights', count: (summary?.bySeverity?.critical ?? 0) + (summary?.bySeverity?.warning ?? 0) + (summary?.bySeverity?.opportunity ?? 0) + (summary?.bySeverity?.positive ?? 0) },
                { id: 'critical', label: 'Critical', count: summary?.bySeverity?.critical ?? 0 },
                { id: 'warning', label: 'Warnings', count: summary?.bySeverity?.warning ?? 0 },
                { id: 'opportunity', label: 'Opportunities', count: summary?.bySeverity?.opportunity ?? 0 },
                { id: 'positive', label: 'Positive Trends', count: summary?.bySeverity?.positive ?? 0 },
              ].map((tab) => {
                const isActive = severityFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSeverityFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-indigo-900/60 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Empty State */}
            {insights.length === 0 && (
              <Card className="text-center py-12 border-slate-800 bg-slate-900/40">
                <div className="text-slate-400 text-sm font-medium">No insights match the selected filter.</div>
                <p className="text-slate-500 text-xs mt-1">Switch to 'All Insights' to review overall store health.</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('all')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
                  >
                    Show All Insights
                  </button>
                </div>
              </Card>
            )}

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="insights-grid">
              {insights.map((item) => {
                const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.opportunity;
                const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

                return (
                  <Card
                    key={item.id}
                    className={`border ${config.borderClass} bg-slate-900/70 p-5 flex flex-col justify-between transition-all`}
                    data-testid={`insight-card-${item.id}`}
                  >
                    <div className="space-y-4">
                      {/* Card Header: Category & Severity Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                          {categoryLabel}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${config.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                          {config.label}
                        </span>
                      </div>

                      {/* Title & Summary */}
                      <div>
                        <h2 className="text-base font-bold text-white tracking-tight">{item.title}</h2>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.summary}</p>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        {item.explanation}
                      </p>

                      {/* Supporting Data Grid */}
                      {item.supportingData && Object.keys(item.supportingData).length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">
                            Observed Metrics
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(item.supportingData).map(([key, val]) => {
                              const formattedKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, (str) => str.toUpperCase());
                              const displayVal =
                                typeof val === 'number'
                                  ? val % 1 === 0
                                    ? val.toLocaleString()
                                    : val.toFixed(1)
                                  : String(val);

                              return (
                                <div
                                  key={key}
                                  className="p-2 rounded bg-slate-950/60 border border-slate-800/80"
                                >
                                  <div className="text-[10px] text-slate-400 truncate" title={formattedKey}>
                                    {formattedKey}
                                  </div>
                                  <div className="text-xs font-semibold font-mono text-slate-200 mt-0.5 truncate">
                                    {displayVal}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Playbook Box */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-400 flex items-center gap-1">
                          <span>⚡</span> Recommended Action
                        </span>
                        {item.impactEstimate && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                            {item.impactEstimate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-lg">
                        {item.recommendedAction}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
