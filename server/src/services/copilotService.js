import { resolveEffectiveRange } from './metricsService.js';
import { REVENUE_STATUSES } from '../constants.js';
import { sumMoney, roundMoney } from '../utils/money.js';
import { getPreviousPeriod } from '../utils/dates.js';

// ---------------------------------------------------------------------------
// Intent classifier — maps a natural-language question to one of our known
// intent buckets using keyword/phrase matching. No external API required.
// ---------------------------------------------------------------------------

const INTENT_PATTERNS = [
  // Catalog / products / categories — checked BEFORE revenue to avoid "sales" overlap
  {
    intent: 'catalog',
    patterns: [
      /product/i,
      /categor/i,
      /catalog/i,
      /merchandise/i,
      /what.*sell/i,
      /top (product|item|category)/i,
      /best.?selling/i,
      /aov/i,
      /average order/i,
      /basket/i,
      /upsell/i,
    ],
  },
  // Revenue / sales performance
  {
    intent: 'revenue',
    patterns: [
      /revenue/i,
      /\bsales\b/i,
      /money/i,
      /earnings/i,
      /income/i,
      /profit/i,
      /how (is|are) (we|the store|things) doing/i,
      /business performance/i,
      /how (much|many) (did we|have we) (earn|sell|make)/i,
      /order volume/i,
      /gmv/i,
    ],
  },
  // Churn / at-risk customers
  {
    intent: 'churn_risk',
    patterns: [
      /churn/i,
      /at.?risk/i,
      /losing customers/i,
      /lapse/i,
      /dormant/i,
      /inactive/i,
      /not (bought|ordered|purchased)/i,
      /win.?back/i,
      /lapsed/i,
      /who haven.?t (bought|ordered)/i,
    ],
  },
  // Top / best customers
  {
    intent: 'top_customers',
    patterns: [
      /top customer/i,
      /best customer/i,
      /biggest (buyer|spender|purchaser)/i,
      /highest (spend|value|ltv)/i,
      /most valuable/i,
      /vip/i,
      /champions/i,
    ],
  },
  // Retention strategies
  {
    intent: 'retention',
    patterns: [
      /retent/i,
      /keep customers/i,
      /repeat (buyer|purchase|order)/i,
      /loyalty/i,
      /how (to|can we|should we) (keep|retain|improve)/i,
      /bring.*back/i,
      /re-engage/i,
      /reengage/i,
      /second order/i,
      /one.?time buyer/i,
    ],
  },
  // Business problems / priorities
  {
    intent: 'business_problems',
    patterns: [
      /problem/i,
      /issue/i,
      /concern/i,
      /risk/i,
      /warn/i,
      /critical/i,
      /important.*problem/i,
      /most urgent/i,
      /biggest challenge/i,
      /what (should|do) (we|i) (prioritize|focus|fix|address)/i,
      /top priorit/i,
    ],
  },
  // Customer segments
  {
    intent: 'customer_segments',
    patterns: [
      /segment/i,
      /cohort/i,
      /group/i,
      /category of customer/i,
      /type of customer/i,
      /rfm/i,
      /who (are|is) (our|the) (loyal|returning|new|one.?time)/i,
      /breakdown.*customer/i,
    ],
  },
  // General insights / recommendations
  {
    intent: 'insights',
    patterns: [
      /insight/i,
      /recommend/i,
      /action/i,
      /suggestion/i,
      /what.*improve/i,
      /how.*grow/i,
      /opportunit/i,
      /health/i,
      /score/i,
      /overall/i,
    ],
  },
];

/**
 * Classifies a user message into one of the known intent buckets.
 * Returns 'unsupported' if no pattern matches.
 */
export function classifyIntent(message) {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(message))) {
      return intent;
    }
  }
  return 'unsupported';
}

// ---------------------------------------------------------------------------
// Copilot Service — orchestrates existing services to produce grounded answers
// ---------------------------------------------------------------------------

export function createCopilotService(repository) {
  // ---------------------------------------------------------------------------
  // Shared helper: get full-period metrics (all available data)
  // ---------------------------------------------------------------------------
  async function getFullPeriodData() {
    const meta = await repository.getMeta();
    const { effectiveFrom, effectiveTo } = resolveEffectiveRange(meta.generatedAt, undefined, undefined);
    const prevPeriod = getPreviousPeriod(effectiveFrom, effectiveTo);

    const currentOrders = await repository.getOrdersInRange(effectiveFrom, effectiveTo);
    const previousOrders = await repository.getOrdersInRange(prevPeriod.from, prevPeriod.to);
    const allCustomers = await repository.getAllCustomers();

    const currentRevOrders = currentOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
    const prevRevOrders = previousOrders.filter((o) => REVENUE_STATUSES.includes(o.status));

    const currentRevenue = sumMoney(...currentRevOrders.map((o) => o.total));
    const previousRevenue = sumMoney(...prevRevOrders.map((o) => o.total));
    const currentOrderCount = currentRevOrders.length;
    const previousOrderCount = prevRevOrders.length;
    const currentAov = currentOrderCount > 0 ? roundMoney(currentRevenue / currentOrderCount) : 0;

    const revDeltaPct =
      previousRevenue > 0
        ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1))
        : null;

    return {
      meta,
      effectiveFrom,
      effectiveTo,
      allCustomers,
      currentRevOrders,
      currentRevenue,
      previousRevenue,
      currentOrderCount,
      previousOrderCount,
      currentAov,
      revDeltaPct,
    };
  }

  // ---------------------------------------------------------------------------
  // Intent handlers — each returns { answer, narrative, metrics, citations,
  //                                  suggestedFollowUps }
  // ---------------------------------------------------------------------------

  async function handleRevenue() {
    const d = await getFullPeriodData();
    const trend =
      d.revDeltaPct === null
        ? 'baseline'
        : d.revDeltaPct >= 5
        ? 'growing'
        : d.revDeltaPct <= -5
        ? 'contracting'
        : 'stable';

    const trendText =
      trend === 'growing'
        ? `up ${d.revDeltaPct}% vs the prior period`
        : trend === 'contracting'
        ? `down ${Math.abs(d.revDeltaPct)}% vs the prior period`
        : 'roughly stable compared to the prior period';

    return {
      answer: `Revenue is ${trendText}. The store generated $${d.currentRevenue.toLocaleString()} across ${d.currentOrderCount} orders in the current window.`,
      narrative:
        `In the last 30 days the store earned $${d.currentRevenue.toLocaleString()} across ${d.currentOrderCount} revenue-generating orders, ` +
        `with an average order value of $${d.currentAov.toLocaleString()}. ` +
        (d.revDeltaPct !== null
          ? `Compared to the preceding 30-day period ($${d.previousRevenue.toLocaleString()}, ${d.previousOrderCount} orders), revenue has ${trend === 'contracting' ? 'declined by' : 'changed by'} ${d.revDeltaPct > 0 ? '+' : ''}${d.revDeltaPct}%.`
          : 'No prior-period data is available to compute a trend.') +
        ' All figures are from verified demo order records.',
      metrics: [
        { label: 'Current Revenue', value: `$${d.currentRevenue.toLocaleString()}`, context: 'Last 30 days' },
        { label: 'Orders Placed', value: d.currentOrderCount, context: 'Revenue-generating orders' },
        { label: 'Avg Order Value', value: `$${d.currentAov.toLocaleString()}`, context: 'Current period' },
        { label: 'Revenue vs Prior Period', value: d.revDeltaPct !== null ? `${d.revDeltaPct >= 0 ? '+' : ''}${d.revDeltaPct}%` : 'N/A', context: 'Period-over-period change' },
        { label: 'Prior Period Revenue', value: `$${d.previousRevenue.toLocaleString()}`, context: 'Previous 30-day window' },
      ],
      citations: [
        { source: 'metricsService', label: 'Revenue & order metrics (last 30 days)', href: '/' },
        { source: 'insightsService', label: 'Revenue trajectory analysis', href: '/insights' },
      ],
      suggestedFollowUps: [
        'Which customers are at risk of churning?',
        'What are our most important business problems?',
        'Which product categories are driving sales?',
        'What should we do to improve retention?',
      ],
    };
  }

  async function handleChurnRisk() {
    const d = await getFullPeriodData();
    const now = new Date(d.meta.generatedAt);

    // At-risk: repeat buyers (orderCount >= 2) who haven't ordered in > 90 days
    const atRisk = d.allCustomers.filter((c) => {
      if ((c.orderCount || 0) < 2) return false;
      if (!c.lastOrderAt) return true;
      const daysSince = Math.floor((now.getTime() - new Date(c.lastOrderAt).getTime()) / 86400000);
      return daysSince > 90;
    });

    // Hibernating: one-time buyers, last order > 90 days ago
    const hibernating = d.allCustomers.filter((c) => {
      if ((c.orderCount || 0) !== 1) return false;
      if (!c.lastOrderAt) return true;
      const daysSince = Math.floor((now.getTime() - new Date(c.lastOrderAt).getTime()) / 86400000);
      return daysSince > 90;
    });

    const atRiskRevAtStake = Math.round(atRisk.reduce((s, c) => s + (c.averageOrderValue || 0), 0));
    const topAtRisk = atRisk.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5);

    return {
      answer: `${atRisk.length} repeat buyers and ${hibernating.length} one-time buyers are at churn risk (inactive > 90 days). Top at-risk customers represent ~$${atRiskRevAtStake.toLocaleString()} in potential next-order revenue.`,
      narrative:
        `Based on RFM (Recency–Frequency–Monetary) heuristics, ${atRisk.length} customers who have placed 2+ orders have not purchased in over 90 days. ` +
        `These are classified as "At Risk" and require a win-back campaign. ` +
        `Additionally, ${hibernating.length} one-time buyers are dormant for 90+ days ("Hibernating" segment). ` +
        `The top ${topAtRisk.length} at-risk customers by lifetime spend are: ${topAtRisk.map((c) => `${c.firstName} ${c.lastName} ($${(c.totalSpent || 0).toFixed(0)})`).join(', ')}.`,
      metrics: [
        { label: 'At-Risk Repeat Buyers', value: atRisk.length, context: 'Inactive > 90 days, 2+ orders' },
        { label: 'Hibernating (1-time buyers)', value: hibernating.length, context: 'Inactive > 90 days, 1 order' },
        { label: 'Potential Next-Order Value at Risk', value: `$${atRiskRevAtStake.toLocaleString()}`, context: 'Sum of avg order values' },
        { label: 'Total Customers', value: d.allCustomers.length, context: 'All records' },
      ],
      citations: [
        { source: 'intelligenceService', label: 'RFM segmentation engine (At Risk, Hibernating)', href: '/customers' },
        { source: 'insightsService', label: 'Customer retention risk insight', href: '/insights' },
        { source: 'repository.getAllCustomers', label: 'Full customer cohort analysis' },
      ],
      suggestedFollowUps: [
        'What actions should we take to improve retention?',
        'What are our most important business problems?',
        'Which customer segments should we focus on?',
        'How is revenue performing?',
      ],
    };
  }

  async function handleTopCustomers() {
    const { allCustomers } = await getFullPeriodData();

    const top10 = [...allCustomers]
      .filter((c) => (c.orderCount || 0) > 0)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10);

    const top3Names = top10.slice(0, 3).map((c) => `${c.firstName} ${c.lastName} ($${(c.totalSpent || 0).toFixed(0)})`).join(', ');

    return {
      answer: `Your top 3 customers by lifetime spend are ${top3Names}. Your top 10 customers account for a significant share of total revenue.`,
      narrative:
        `Top customers are ranked by lifetime spend across all revenue-generating orders. ` +
        `The top 10 are: ${top10.map((c, i) => `#${i + 1} ${c.firstName} ${c.lastName} — $${(c.totalSpent || 0).toFixed(2)} across ${c.orderCount} orders`).join('; ')}. ` +
        `These customers merit a VIP or Champions loyalty tier to preserve their long-term value.`,
      metrics: top10.slice(0, 5).map((c, i) => ({
        label: `#${i + 1} ${c.firstName} ${c.lastName}`,
        value: `$${(c.totalSpent || 0).toFixed(2)}`,
        context: `${c.orderCount} orders`,
      })),
      citations: [
        { source: 'repository.getAllCustomers', label: 'Customer directory, ranked by lifetime spend', href: '/customers?sortBy=totalSpent&sortDir=desc' },
        { source: 'intelligenceService', label: 'Champions segment criteria (RFM)' },
      ],
      suggestedFollowUps: [
        'Which customers are at risk of churning?',
        'What actions should we take to improve retention?',
        'Which customer segments should we focus on?',
      ],
    };
  }

  async function handleRetention() {
    const d = await getFullPeriodData();
    const now = new Date(d.meta.generatedAt);

    const repeatBuyers = d.allCustomers.filter((c) => (c.orderCount || 0) >= 2).length;
    const oneTimeBuyers = d.allCustomers.filter((c) => (c.orderCount || 0) === 1).length;
    const repeatRate = d.allCustomers.length > 0
      ? Number(((repeatBuyers / d.allCustomers.length) * 100).toFixed(1))
      : 0;

    // Customers who placed exactly 1 order in last 60 days (prime for 2nd-order conversion)
    const recentOneTimers = d.allCustomers.filter((c) => {
      if ((c.orderCount || 0) !== 1 || !c.lastOrderAt) return false;
      const daysSince = Math.floor((now.getTime() - new Date(c.lastOrderAt).getTime()) / 86400000);
      return daysSince <= 60;
    });

    return {
      answer: `${repeatRate}% of customers are repeat buyers. ${recentOneTimers.length} recent one-time buyers are in the prime window for a 2nd-order conversion campaign.`,
      narrative:
        `The store has ${repeatBuyers} repeat buyers (${repeatRate}% of all customers) and ${oneTimeBuyers} one-time buyers. ` +
        `${recentOneTimers.length} one-time buyers made their first purchase within the last 60 days — these are ideal candidates for a targeted bounceback email with a limited-time incentive. ` +
        `Key retention levers: (1) Win-back campaign for 90+ day dormant repeat buyers. ` +
        `(2) Second-order conversion for recent first-time buyers. ` +
        `(3) VIP early access or loyalty credits for Champions and Loyal segments.`,
      metrics: [
        { label: 'Repeat Buyer Rate', value: `${repeatRate}%`, context: 'Customers with 2+ orders' },
        { label: 'Repeat Buyers', value: repeatBuyers, context: '2+ orders placed' },
        { label: 'One-Time Buyers', value: oneTimeBuyers, context: 'Exactly 1 order' },
        { label: 'Recent 1st-Timers (2nd-Order Targets)', value: recentOneTimers.length, context: 'First order within 60 days' },
      ],
      citations: [
        { source: 'intelligenceService', label: 'RFM segment classification engine', href: '/customers' },
        { source: 'repository.getAllCustomers', label: 'Cohort composition analysis' },
        { source: 'insightsService', label: 'Retention risk insight', href: '/insights' },
      ],
      suggestedFollowUps: [
        'Which customers are at risk of churning?',
        'What are our most important business problems?',
        'How is revenue performing?',
        'Which customer segments should we focus on?',
      ],
    };
  }

  async function handleBusinessProblems(insightsService) {
    const insightsData = await insightsService.getBusinessInsights();
    const criticalOrWarning = insightsData.insights.filter((i) =>
      i.severity === 'critical' || i.severity === 'warning'
    );

    const topProblems = criticalOrWarning.slice(0, 3);
    const problemSummary = topProblems
      .map((p) => `• **${p.title}** (${p.severity}): ${p.summary}`)
      .join('\n');

    return {
      answer:
        topProblems.length > 0
          ? `The top ${topProblems.length} business issue${topProblems.length > 1 ? 's' : ''} detected: ${topProblems.map((p) => p.title).join('; ')}.`
          : `No critical or warning-level issues detected. The store is operating within healthy parameters.`,
      narrative:
        topProblems.length > 0
          ? `The Business Insights engine identified ${criticalOrWarning.length} concern${criticalOrWarning.length !== 1 ? 's' : ''} across ${insightsData.insights.length} analysis dimensions. ` +
            `The most pressing issues are:\n${problemSummary}\n\nStore Health Index: ${insightsData.summary.businessHealthScore}/100 (${insightsData.summary.healthRating}).`
          : `The Business Insights engine analyzed ${insightsData.insights.length} dimensions and found no critical or warning-level issues. ` +
            `Store Health Index: ${insightsData.summary.businessHealthScore}/100 (${insightsData.summary.healthRating}).`,
      metrics: [
        { label: 'Health Score', value: `${insightsData.summary.businessHealthScore}/100`, context: insightsData.summary.healthRating },
        { label: 'Critical Issues', value: insightsData.summary.bySeverity.critical, context: 'Require immediate action' },
        { label: 'Warnings', value: insightsData.summary.bySeverity.warning, context: 'Monitor closely' },
        { label: 'Opportunities', value: insightsData.summary.bySeverity.opportunity, context: 'Growth levers available' },
      ],
      citations: [
        { source: 'insightsService', label: 'Business Insights engine (5-dimension analysis)', href: '/insights' },
      ],
      suggestedFollowUps: [
        'Which customers are at risk of churning?',
        'What actions should we take to improve retention?',
        'How is revenue performing?',
        'Which product categories are driving sales?',
      ],
    };
  }

  async function handleCustomerSegments() {
    const { allCustomers, meta } = await getFullPeriodData();
    const now = new Date(meta.generatedAt);

    const daysSince = (c) =>
      c.lastOrderAt
        ? Math.floor((now.getTime() - new Date(c.lastOrderAt).getTime()) / 86400000)
        : Infinity;

    const champions = allCustomers.filter(
      (c) => daysSince(c) <= 45 && (c.orderCount || 0) >= 3 && (c.totalSpent || 0) >= 250
    );
    const loyal = allCustomers.filter(
      (c) =>
        !champions.includes(c) && daysSince(c) <= 90 && (c.orderCount || 0) >= 2
    );
    const recentBuyers = allCustomers.filter(
      (c) => daysSince(c) <= 45 && (c.orderCount || 0) === 1
    );
    const atRisk = allCustomers.filter(
      (c) => daysSince(c) > 90 && (c.orderCount || 0) >= 2
    );
    const hibernating = allCustomers.filter(
      (c) => daysSince(c) > 90 && (c.orderCount || 0) === 1
    );
    const inactive = allCustomers.filter((c) => (c.orderCount || 0) === 0);

    return {
      answer: `The customer base breaks into 6 RFM segments: ${champions.length} Champions, ${loyal.length} Loyal, ${recentBuyers.length} Recent Buyers, ${atRisk.length} At Risk, ${hibernating.length} Hibernating, and ${inactive.length} Inactive Prospects.`,
      narrative:
        `Using Recency–Frequency–Monetary (RFM) heuristics, the store's ${allCustomers.length} customers are grouped as follows:\n` +
        `• Champions (${champions.length}): Purchased recently, frequently, with high spend — the VIP core.\n` +
        `• Loyal (${loyal.length}): Regular buyers who remain active within 90 days.\n` +
        `• Recent Buyers (${recentBuyers.length}): First-time buyers within the last 45 days — prime for 2nd-order conversion.\n` +
        `• At Risk (${atRisk.length}): Repeat buyers who haven't ordered in 90+ days — win-back urgency.\n` +
        `• Hibernating (${hibernating.length}): One-time buyers dormant for 90+ days — re-engagement candidates.\n` +
        `• Inactive Prospects (${inactive.length}): Registered accounts with zero orders.`,
      metrics: [
        { label: 'Champions', value: champions.length, context: 'High-value, recently active' },
        { label: 'Loyal', value: loyal.length, context: 'Consistent repeat buyers' },
        { label: 'Recent Buyers', value: recentBuyers.length, context: '2nd-order conversion targets' },
        { label: 'At Risk', value: atRisk.length, context: 'Win-back urgency > 90 days' },
        { label: 'Hibernating', value: hibernating.length, context: 'One-time, dormant > 90 days' },
        { label: 'Inactive Prospects', value: inactive.length, context: 'Zero orders placed' },
      ],
      citations: [
        { source: 'intelligenceService', label: 'RFM segmentation rules (Champions, Loyal, At Risk, etc.)' },
        { source: 'repository.getAllCustomers', label: 'Full customer cohort', href: '/customers' },
      ],
      suggestedFollowUps: [
        'Which customers are at risk of churning?',
        'What actions should we take to improve retention?',
        'Who are our top customers?',
        'What are our most important business problems?',
      ],
    };
  }

  async function handleCatalog() {
    const d = await getFullPeriodData();
    const categoryMap = new Map();

    for (const order of d.currentRevOrders) {
      for (const item of order.lineItems || []) {
        const entry = categoryMap.get(item.category) || { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += item.total;
        categoryMap.set(item.category, entry);
      }
    }

    const sorted = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue * 100) / 100,
        units: data.units,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalCatRevenue = sorted.reduce((s, c) => s + c.revenue, 0);
    const topCat = sorted[0];
    const topShare = topCat && totalCatRevenue > 0
      ? Number(((topCat.revenue / totalCatRevenue) * 100).toFixed(1))
      : 0;

    return {
      answer:
        sorted.length > 0
          ? `Top category: ${topCat.name} generating $${topCat.revenue.toLocaleString()} (${topShare}% of category sales). Average order value: $${d.currentAov.toLocaleString()}.`
          : 'No category data available for the current period.',
      narrative:
        `In the current 30-day window, the store's product catalog contributed across ${sorted.length} categories. ` +
        (topCat
          ? `${topCat.name} is the leading category with $${topCat.revenue.toLocaleString()} in sales (${topShare}% share). ` +
            `Average order value is $${d.currentAov.toLocaleString()}.`
          : 'No category data available.') +
        ` ${sorted.length > 1 ? `Other categories: ${sorted.slice(1, 4).map((c) => `${c.name} ($${c.revenue.toLocaleString()})`).join(', ')}.` : ''}`,
      metrics: sorted.slice(0, 5).map((c) => ({
        label: c.name,
        value: `$${c.revenue.toLocaleString()}`,
        context: `${c.units} units sold`,
      })),
      citations: [
        { source: 'insightsService', label: 'Category concentration analysis', href: '/insights' },
        { source: 'metricsService', label: 'Order-level line-item aggregation', href: '/' },
      ],
      suggestedFollowUps: [
        'How is revenue performing?',
        'What are our most important business problems?',
        'Which customer segments should we focus on?',
        'What should we do to improve retention?',
      ],
    };
  }

  async function handleInsights(insightsService) {
    const insightsData = await insightsService.getBusinessInsights();
    const opportunities = insightsData.insights.filter((i) => i.severity === 'opportunity');
    const positives = insightsData.insights.filter((i) => i.severity === 'positive');

    return {
      answer: `Store Health Index: ${insightsData.summary.businessHealthScore}/100 (${insightsData.summary.healthRating}). The engine found ${opportunities.length} growth opportunities and ${positives.length} positive trend${positives.length !== 1 ? 's' : ''}.`,
      narrative:
        `The Business Insights engine evaluated 5 strategic dimensions: revenue trajectory, catalog concentration, ` +
        `customer retention risk, basket size / AOV, and operational/refund health. ` +
        `Overall store health score: ${insightsData.summary.businessHealthScore}/100 (${insightsData.summary.healthRating}). ` +
        `Breakdown — Critical: ${insightsData.summary.bySeverity.critical}, Warnings: ${insightsData.summary.bySeverity.warning}, ` +
        `Opportunities: ${insightsData.summary.bySeverity.opportunity}, Positive: ${insightsData.summary.bySeverity.positive}. ` +
        `Top insights: ${insightsData.insights.slice(0, 3).map((i) => i.title).join('; ')}.`,
      metrics: [
        { label: 'Health Score', value: `${insightsData.summary.businessHealthScore}/100`, context: insightsData.summary.healthRating },
        { label: 'Critical Issues', value: insightsData.summary.bySeverity.critical },
        { label: 'Warnings', value: insightsData.summary.bySeverity.warning },
        { label: 'Opportunities', value: insightsData.summary.bySeverity.opportunity },
        { label: 'Positive Trends', value: insightsData.summary.bySeverity.positive },
      ],
      citations: [
        { source: 'insightsService', label: 'Full Business Insights analysis (5 dimensions)', href: '/insights' },
      ],
      suggestedFollowUps: [
        'What are our most important business problems?',
        'Which customers are at risk of churning?',
        'How is revenue performing?',
        'What actions should we take to improve retention?',
      ],
    };
  }

  function handleUnsupported(message) {
    return {
      answer: "I don't have enough information to answer that question from available store data.",
      narrative:
        `This Copilot is a rule-based business assistant that can answer questions about store performance ` +
        `using verified demo data — it does not connect to a live WooCommerce store or use a generative AI model. ` +
        `The question "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}" does not match any of the ` +
        `supported question categories.`,
      metrics: [],
      citations: [],
      suggestedFollowUps: [
        'How is revenue performing?',
        'Which customers are at risk of churning?',
        'What are our most important business problems?',
        'Which customer segments should we focus on?',
        'Who are our top customers?',
        'What actions should we take to improve retention?',
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    async chat(message, insightsService) {
      const intent = classifyIntent(message);
      let handlerResult;

      switch (intent) {
        case 'revenue':
          handlerResult = await handleRevenue();
          break;
        case 'churn_risk':
          handlerResult = await handleChurnRisk();
          break;
        case 'top_customers':
          handlerResult = await handleTopCustomers();
          break;
        case 'retention':
          handlerResult = await handleRetention();
          break;
        case 'business_problems':
          handlerResult = await handleBusinessProblems(insightsService);
          break;
        case 'customer_segments':
          handlerResult = await handleCustomerSegments();
          break;
        case 'catalog':
          handlerResult = await handleCatalog();
          break;
        case 'insights':
          handlerResult = await handleInsights(insightsService);
          break;
        default:
          handlerResult = handleUnsupported(message);
      }

      return {
        question: message,
        intent,
        ...handlerResult,
        answeredAt: new Date().toISOString(),
        mode: 'rule-based',
      };
    },
  };
}
