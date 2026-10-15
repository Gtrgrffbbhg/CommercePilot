import { REVENUE_STATUSES, DEFAULT_CURRENCY } from '../constants.js';
import { toCents, fromCents, sumMoney, roundMoney } from '../utils/money.js';
import { resolveEffectiveRange } from './metricsService.js';
import { getPreviousPeriod } from '../utils/dates.js';

/**
 * Creates the Business Insights & Recommendations Service.
 *
 * Evaluates verified historical customer records, orders, and category metrics
 * using transparent, explainable deterministic business rules.
 * Does NOT generate hallucinated facts or call external probabilistic LLMs.
 */
export function createInsightsService(repository) {
  const service = {
    async getBusinessInsights({ from, to, severity = 'all' } = {}) {
      const meta = await repository.getMeta();
      const { effectiveFrom, effectiveTo } = resolveEffectiveRange(meta.generatedAt, from, to);
      const prevPeriod = getPreviousPeriod(effectiveFrom, effectiveTo);

      // Fetch relevant order slices and customer cohort
      const currentOrders = await repository.getOrdersInRange(effectiveFrom, effectiveTo);
      const previousOrders = await repository.getOrdersInRange(prevPeriod.from, prevPeriod.to);
      const allCustomers = await repository.getAllCustomers();

      const evaluatedAt = new Date().toISOString();

      // Current period revenue orders
      const currentRevenueOrders = currentOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const currentRefundedOrders = currentOrders.filter((o) => o.status === 'refunded');
      const currentRevenue = sumMoney(...currentRevenueOrders.map((o) => o.total));
      const currentOrderCount = currentRevenueOrders.length;
      const currentAov = currentOrderCount > 0 ? roundMoney(currentRevenue / currentOrderCount) : 0;

      // Previous period revenue orders
      const prevRevenueOrders = previousOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
      const previousRevenue = sumMoney(...prevRevenueOrders.map((o) => o.total));
      const previousOrderCount = prevRevenueOrders.length;

      // Revenue and order deltas
      const revenueDeltaPct =
        previousRevenue > 0
          ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1))
          : null;
      const orderDeltaPct =
        previousOrderCount > 0
          ? Number((((currentOrderCount - previousOrderCount) / previousOrderCount) * 100).toFixed(1))
          : null;

      const insights = [];

      // -----------------------------------------------------------------------
      // 1. Revenue & Order Trajectory
      // -----------------------------------------------------------------------
      if (currentOrderCount > 0 || previousOrderCount > 0) {
        let revSeverity = 'opportunity';
        let revTitle = 'Steady Revenue Velocity';
        let revSummary = 'Sales volume is tracking steadily compared to the prior window.';
        let revAction = 'Maintain core marketing channels and monitor weekly order velocity.';

        if (revenueDeltaPct !== null) {
          if (revenueDeltaPct >= 5) {
            revSeverity = 'positive';
            revTitle = `Positive Revenue Trajectory (+${revenueDeltaPct}%)`;
            revSummary = `Gross revenue expanded by ${revenueDeltaPct}% compared to the prior period ($${currentRevenue.toLocaleString()} vs $${previousRevenue.toLocaleString()}).`;
            revAction = 'Capitalize on sales momentum by scaling top-performing acquisition campaigns and ensuring inventory depth.';
          } else if (revenueDeltaPct <= -5) {
            revSeverity = 'warning';
            revTitle = `Revenue Contraction Observed (${revenueDeltaPct}%)`;
            revSummary = `Sales dropped ${Math.abs(revenueDeltaPct)}% relative to the prior period ($${currentRevenue.toLocaleString()} vs $${previousRevenue.toLocaleString()}).`;
            revAction = 'Investigate potential traffic or conversion drop-offs; run a targeted re-engagement campaign to recent buyers.';
          }
        }

        insights.push({
          id: 'insight_rev_trajectory',
          title: revTitle,
          category: 'revenue_trend',
          severity: revSeverity,
          summary: revSummary,
          explanation: `During this evaluation window, the store generated $${currentRevenue.toLocaleString()} across ${currentOrderCount} revenue orders, compared to $${previousRevenue.toLocaleString()} across ${previousOrderCount} orders in the prior equal period.`,
          supportingData: {
            currentRevenue,
            previousRevenue,
            revenueDeltaPct,
            currentOrders: currentOrderCount,
            previousOrders: previousOrderCount,
            orderDeltaPct,
          },
          recommendedAction: revAction,
          impactEstimate: revenueDeltaPct !== null ? `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct}% top-line change` : 'Baseline established',
        });
      }

      // -----------------------------------------------------------------------
      // 2. Merchandise Category Performance & Concentration
      // -----------------------------------------------------------------------
      const categoryMap = new Map();
      for (const order of currentRevenueOrders) {
        for (const item of order.lineItems || []) {
          const entry = categoryMap.get(item.category) || { units: 0, salesCents: 0 };
          entry.units += item.quantity;
          entry.salesCents += toCents(item.total);
          categoryMap.set(item.category, entry);
        }
      }

      const totalMerchandiseCents = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.salesCents, 0);

      if (categoryMap.size > 0 && totalMerchandiseCents > 0) {
        const sortedCategories = Array.from(categoryMap.entries())
          .map(([name, data]) => ({
            name,
            units: data.units,
            sales: fromCents(data.salesCents),
            sharePct: Number(((data.salesCents / totalMerchandiseCents) * 100).toFixed(1)),
          }))
          .sort((a, b) => b.sales - a.sales);

        const topCat = sortedCategories[0];
        const isConcentrated = topCat.sharePct >= 35;

        insights.push({
          id: 'insight_category_concentration',
          title: isConcentrated
            ? `Category Anchor: ${topCat.name} Generates ${topCat.sharePct}% of Sales`
            : `Balanced Catalog: ${topCat.name} Leads at ${topCat.sharePct}%`,
          category: 'merchandise',
          severity: isConcentrated ? 'opportunity' : 'positive',
          summary: `${topCat.name} is the primary revenue driver, generating $${topCat.sales.toLocaleString()} (${topCat.sharePct}% of item sales).`,
          explanation: `Product sales are concentrated in ${topCat.name} with ${topCat.units} units sold. The catalog spans ${sortedCategories.length} active categories in this window.`,
          supportingData: {
            topCategory: topCat.name,
            topCategorySales: topCat.sales,
            topCategoryUnits: topCat.units,
            categorySharePct: topCat.sharePct,
            totalCategoriesTracked: sortedCategories.length,
          },
          recommendedAction: isConcentrated
            ? `Create product bundles pairing ${topCat.name} with secondary categories to cross-pollinate customer interest and lift average order volume.`
            : `Maintain merchandising balance while featuring seasonal bestsellers from ${topCat.name}.`,
          impactEstimate: isConcentrated ? 'Cross-sell opportunity to diversify revenue' : 'Low concentration risk',
        });
      }

      // -----------------------------------------------------------------------
      // 3. Customer Retention & Churn Risk Exposure
      // -----------------------------------------------------------------------
      const nowMs = new Date(effectiveTo).getTime();
      let atRiskRepeatCount = 0;
      let atRiskHistoricalSpend = 0;

      for (const cust of allCustomers) {
        if (cust.orderCount >= 2 && cust.lastOrderAt) {
          const daysElapsed = Math.floor((nowMs - new Date(cust.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24));
          if (daysElapsed > 90) {
            atRiskRepeatCount++;
            atRiskHistoricalSpend += cust.totalSpent || 0;
          }
        }
      }

      const totalRepeatCustomers = allCustomers.filter((c) => c.orderCount > 1).length;
      const atRiskSharePct = totalRepeatCustomers > 0 ? Number(((atRiskRepeatCount / totalRepeatCustomers) * 100).toFixed(1)) : 0;
      const atRiskSeverity = atRiskRepeatCount > 30 ? 'warning' : 'opportunity';

      insights.push({
        id: 'insight_retention_risk',
        title: `Retention Risk: ${atRiskRepeatCount} Repeat Buyers Inactive >90 Days`,
        category: 'retention',
        severity: atRiskSeverity,
        summary: `${atRiskRepeatCount} proven repeat customers (${atRiskSharePct}% of repeat buyers) have lapsed past the 90-day purchase threshold.`,
        explanation: `Historical repeat buyers who have not purchased in over 90 days represent $${roundMoney(atRiskHistoricalSpend).toLocaleString()} in lifetime realized spend. Lapsed repeat customers exhibit high churn probability without proactive intervention.`,
        supportingData: {
          totalCustomers: allCustomers.length,
          totalRepeatCustomers,
          atRiskRepeatCustomers: atRiskRepeatCount,
          atRiskRepeatSharePct: atRiskSharePct,
          atRiskHistoricalSpend: roundMoney(atRiskHistoricalSpend),
        },
        recommendedAction: 'Trigger the Customer Retention Win-Back playbook with tailored recommendations and bounceback incentives.',
        impactEstimate: `Safeguard up to $${roundMoney(atRiskHistoricalSpend).toLocaleString()} in customer lifetime value`,
      });

      // -----------------------------------------------------------------------
      // 4. Basket Size & Multi-Item Order Opportunity (AOV Expansion)
      // -----------------------------------------------------------------------
      if (currentRevenueOrders.length > 0) {
        let singleItemCount = 0;
        let multiItemCount = 0;
        let totalItemsSold = 0;

        for (const order of currentRevenueOrders) {
          const totalUnits = (order.lineItems || []).reduce((sum, item) => sum + item.quantity, 0);
          totalItemsSold += totalUnits;
          if (totalUnits <= 1) {
            singleItemCount++;
          } else {
            multiItemCount++;
          }
        }

        const singleItemPct = Number(((singleItemCount / currentRevenueOrders.length) * 100).toFixed(1));
        const multiItemPct = Number(((multiItemCount / currentRevenueOrders.length) * 100).toFixed(1));
        const avgUnitsPerOrder = Number((totalItemsSold / currentRevenueOrders.length).toFixed(1));
        const suggestedFreeShippingThreshold = Math.ceil((currentAov * 1.25) / 10) * 10;

        insights.push({
          id: 'insight_basket_expansion',
          title: `Basket Size Expansion: ${singleItemPct}% Single-Item Orders`,
          category: 'aov_growth',
          severity: 'opportunity',
          summary: `${singleItemPct}% of purchases contain only a single item, pointing to substantial cross-sell upside.`,
          explanation: `Average order value is currently $${currentAov.toFixed(2)} with an average of ${avgUnitsPerOrder} units per basket. Converting a portion of single-item orders into multi-item baskets would directly accelerate top-line revenue without increasing traffic costs.`,
          supportingData: {
            averageOrderValue: currentAov,
            singleItemOrderPct: singleItemPct,
            multiItemOrderPct: multiItemPct,
            averageUnitsPerOrder: avgUnitsPerOrder,
            totalRevenueOrders: currentRevenueOrders.length,
          },
          recommendedAction: `Test a free shipping threshold set at $${suggestedFreeShippingThreshold} (above current $${currentAov.toFixed(0)} AOV) and implement one-click accessory add-ons at checkout.`,
          impactEstimate: `Potential +10-15% lift in average order value`,
        });
      }

      // -----------------------------------------------------------------------
      // 5. Order Fulfillment Quality & Refund Ratio
      // -----------------------------------------------------------------------
      if (currentOrders.length > 0) {
        const totalPeriodOrders = currentOrders.length;
        const refundedCount = currentRefundedOrders.length;
        const refundRatePct = Number(((refundedCount / totalPeriodOrders) * 100).toFixed(1));
        const refundedTotal = sumMoney(...currentRefundedOrders.map((o) => o.total));

        let fulSeverity = 'positive';
        let fulTitle = `Operational Quality: Low Refund Rate (${refundRatePct}%)`;
        let fulSummary = `Order fulfillment and customer satisfaction remain strong with low refund ratios.`;
        let fulAction = 'Continue existing fulfillment protocols and quality control standards.';

        if (refundRatePct > 5.0) {
          fulSeverity = 'critical';
          fulTitle = `Elevated Refund Rate Detected (${refundRatePct}%)`;
          fulSummary = `${refundRatePct}% of orders in this window resulted in refunds, exceeding the 5.0% operational threshold.`;
          fulAction = 'Audit recent return reasons and check top refunded product SKUs for sizing descriptions or fulfillment issues.';
        } else if (refundRatePct > 2.5) {
          fulSeverity = 'warning';
          fulTitle = `Refund Ratio Notice (${refundRatePct}%)`;
          fulSummary = `Refund rate of ${refundRatePct}% warrants monitoring ($${refundedTotal.toLocaleString()} refunded).`;
          fulAction = 'Review delivery packaging and product page accuracy for frequently refunded items.';
        }

        insights.push({
          id: 'insight_fulfillment_health',
          title: fulTitle,
          category: 'fulfillment',
          severity: fulSeverity,
          summary: fulSummary,
          explanation: `Out of ${totalPeriodOrders} total orders processed during this period, ${refundedCount} resulted in refunds, representing $${refundedTotal.toLocaleString()} in returned funds.`,
          supportingData: {
            totalPeriodOrders,
            refundedCount,
            refundRatePct,
            refundedTotal,
            completedOrdersCount: currentRevenueOrders.length,
          },
          recommendedAction: fulAction,
          impactEstimate: refundRatePct > 5.0 ? 'Immediate customer satisfaction review advised' : 'Operational efficiency benchmark met',
        });
      }

      // -----------------------------------------------------------------------
      // Business Health Score Calculation (0 - 100)
      // -----------------------------------------------------------------------
      let score = 80;
      if (revenueDeltaPct !== null) {
        score += Math.max(-15, Math.min(15, Math.round(revenueDeltaPct / 2)));
      }
      if (atRiskSharePct > 40) score -= 8;
      else if (atRiskSharePct > 25) score -= 4;

      const refundCount = currentRefundedOrders.length;
      const refRate = currentOrders.length > 0 ? (refundCount / currentOrders.length) * 100 : 0;
      if (refRate > 5) score -= 12;
      else if (refRate > 3) score -= 6;
      else score += 4;

      const clampedScore = Math.max(10, Math.min(98, score));
      let healthRating = 'Healthy';
      if (clampedScore >= 85) healthRating = 'Strong';
      else if (clampedScore >= 70) healthRating = 'Healthy';
      else if (clampedScore >= 50) healthRating = 'Needs Attention';
      else healthRating = 'Critical';

      // Counts by severity
      const bySeverity = {
        critical: insights.filter((i) => i.severity === 'critical').length,
        warning: insights.filter((i) => i.severity === 'warning').length,
        opportunity: insights.filter((i) => i.severity === 'opportunity').length,
        positive: insights.filter((i) => i.severity === 'positive').length,
      };

      // Filter by requested severity parameter if not 'all'
      const filteredInsights = severity === 'all'
        ? insights
        : insights.filter((i) => i.severity === severity);

      return {
        evaluatedAt,
        range: {
          from: effectiveFrom,
          to: effectiveTo,
        },
        currency: DEFAULT_CURRENCY,
        summary: {
          totalInsights: filteredInsights.length,
          bySeverity,
          businessHealthScore: clampedScore,
          healthRating,
        },
        insights: filteredInsights,
      };
    },
  };

  service.getInsights = service.getBusinessInsights;
  return service;
}
