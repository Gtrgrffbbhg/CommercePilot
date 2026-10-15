import { AppError } from '../utils/AppError.js';

/**
 * Creates the deterministic Customer Intelligence Service.
 *
 * Implements transparent, explainable RFM segmentation and churn risk heuristics
 * calculated from verified historical customer records and order data.
 * Does NOT invoke an external LLM or probabilistic model; output is 100% deterministic,
 * testable, and reliable without requiring external API keys.
 */
export function createIntelligenceService(repository) {
  return {
    async getCustomerIntelligence(customerId, { referenceDate } = {}) {
      const customer = await repository.getCustomerById(customerId);
      if (!customer) {
        throw new AppError(`Customer with ID "${customerId}" was not found`, 404, 'CUSTOMER_NOT_FOUND');
      }

      // Retrieve customer orders to inspect line item purchase history
      const { data: customerOrders } = await repository.listOrders({
        customerId,
        page: 1,
        pageSize: 50,
      });

      const now = referenceDate instanceof Date ? referenceDate : new Date();
      const lastOrderTime = customer.lastOrderAt ? new Date(customer.lastOrderAt).getTime() : null;
      const daysSinceLastOrder = lastOrderTime !== null
        ? Math.max(0, Math.floor((now.getTime() - lastOrderTime) / (1000 * 60 * 60 * 24)))
        : null;

      const orderCount = customer.orderCount || 0;
      const totalSpent = customer.totalSpent || 0;
      const averageOrderValue = customer.averageOrderValue || 0;

      // -------------------------------------------------------------------------
      // Deterministic Segment & Churn Risk Classification
      // -------------------------------------------------------------------------
      let segment = 'Hibernating';
      let riskLevel = 'Moderate';
      const reasons = [];
      let action = '';
      let suggestedOffer = '';

      if (orderCount === 0) {
        segment = 'Inactive Prospect';
        riskLevel = 'Low';
        reasons.push('No revenue orders placed yet');
        reasons.push('Account registered with zero completed transactions');
        action = 'Welcome onboarding nurture';
        suggestedOffer = 'Welcome 10% discount example (Code: WELCOME10 - illustrative suggestion)';
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder <= 45 && orderCount >= 3 && totalSpent >= 250) {
        segment = 'Champions';
        riskLevel = 'Low';
        reasons.push(`Recent purchase placed ${daysSinceLastOrder} days ago (within 45-day window)`);
        reasons.push(`High purchase frequency (${orderCount} revenue orders)`);
        reasons.push(`Top lifetime spend ($${totalSpent.toFixed(2)})`);
        action = 'VIP appreciation & early collection access';
        suggestedOffer = 'VIP early access preview (Code: VIPACCESS - illustrative suggestion)';
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder <= 90 && orderCount >= 2) {
        segment = 'Loyal';
        riskLevel = 'Low';
        reasons.push(`Active repeat buyer with ${orderCount} orders`);
        reasons.push(`Recent order placed ${daysSinceLastOrder} days ago`);
        action = 'Category cross-sell & loyalty rewards';
        suggestedOffer = 'Complementary items bundle credit (Code: REWARD10 - illustrative suggestion)';
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder <= 45 && orderCount === 1) {
        segment = 'Recent Buyer';
        riskLevel = 'Moderate';
        reasons.push(`First order placed ${daysSinceLastOrder} days ago`);
        reasons.push('Single purchase to date — critical 45-day window for second-order conversion');
        action = 'Second-order bounceback campaign';
        suggestedOffer = 'Free shipping on next order (Code: SHIPFREE - illustrative suggestion)';
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 90 && orderCount >= 2) {
        segment = 'At Risk';
        riskLevel = 'High';
        reasons.push(`Lapsed repeat buyer: ${daysSinceLastOrder} days since last order (>90 days threshold)`);
        reasons.push(`High potential revenue loss (${orderCount} historical orders totaling $${totalSpent.toFixed(2)})`);
        action = 'Proactive win-back sequence with retention incentive';
        suggestedOffer = 'Win-back 15% discount example (Code: COMEBACK15 - illustrative suggestion)';
      } else {
        segment = 'Hibernating';
        riskLevel = daysSinceLastOrder !== null && daysSinceLastOrder > 150 ? 'High' : 'Moderate';
        reasons.push(`Prolonged inactivity: ${daysSinceLastOrder !== null ? `${daysSinceLastOrder} days` : 'unknown interval'} since last order`);
        reasons.push(`Low-frequency purchase history (${orderCount} orders)`);
        action = 'Re-engagement survey & seasonal announcement';
        suggestedOffer = 'Seasonal catalog refresh (Code: HELLOAGAIN - illustrative suggestion)';
      }

      // -------------------------------------------------------------------------
      // Personalized Outreach Draft Generation
      // -------------------------------------------------------------------------
      const recentLineItems = customerOrders.flatMap((o) => o.lineItems || []);
      const referencedProduct = recentLineItems[0]?.name || 'recent items';
      const firstName = customer.firstName || 'Valued Customer';
      let subject = '';
      let body = '';

      if (segment === 'Champions') {
        subject = `${firstName}, a special thank you from our team`;
        body = `Hi ${firstName},\n\nWe wanted to reach out and express our sincere appreciation for your ongoing support. With ${orderCount} orders placed—including your recent purchase of ${referencedProduct}—you are one of our most valued customers.\n\nWe would love to invite you to exclusive early access for our upcoming product drops.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      } else if (segment === 'Loyal') {
        subject = `${firstName}, here is a reward for your next order`;
        body = `Hi ${firstName},\n\nThank you for being a loyal customer with ${orderCount} purchases to date! We noticed you recently ordered ${referencedProduct} and thought you might love some of our new complementary arrivals.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      } else if (segment === 'Recent Buyer') {
        subject = `How are you enjoying your ${referencedProduct}?`;
        body = `Hi ${firstName},\n\nWe hope you are loving your purchase of ${referencedProduct}! As a welcome to our community, we'd love to offer you a special perk on your second order whenever you're ready.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      } else if (segment === 'At Risk') {
        subject = `We miss you, ${firstName} — a special welcome back`;
        body = `Hi ${firstName},\n\nIt has been a little while since your last order (${referencedProduct}), and we wanted to check in. We have added many new items to our catalog that we think you'll love.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      } else if (segment === 'Inactive Prospect') {
        subject = `Welcome to our store, ${firstName}`;
        body = `Hi ${firstName},\n\nThanks for creating an account with us! When you are ready to make your first purchase, here is a suggested welcome incentive to help you get started.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      } else {
        subject = `${firstName}, see what is new at our store`;
        body = `Hi ${firstName},\n\nIt has been some time since you visited us. We've introduced fresh additions and seasonal favorites across our store.\n\nSuggested Incentive: ${suggestedOffer}\n\nWarm regards,\nThe Store Team`;
      }

      return {
        customerId,
        evaluatedAt: now.toISOString(),
        metrics: {
          daysSinceLastOrder,
          orderCount,
          totalSpent,
          averageOrderValue,
        },
        rfm: {
          segment,
          riskLevel,
          reasons,
        },
        recommendation: {
          action,
          suggestedOffer,
          subject,
          body,
          disclaimer: 'Deterministic rule-based output based on historical purchase data. Not an automated email dispatch; suggested offers are illustrative examples only.',
        },
      };
    },
  };
}
