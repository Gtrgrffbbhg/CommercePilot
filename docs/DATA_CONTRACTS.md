# Data Contracts Specification

This document details the unified data models, calculation invariants, and planned external schema mappings for CommercePilot.

---

## 1. Core Operating Rules & Invariants

### 1.1 Revenue-Status Rule
Only orders whose `status` is included in `REVENUE_STATUSES` (`['processing', 'completed']`) are counted towards business revenue and customer spend aggregates.
- `orderCount`: The count of a customer's `processing` and `completed` orders.
- `totalSpent`: The sum of `order.total` across a customer's `processing` and `completed` orders.
- `averageOrderValue`: `totalSpent / orderCount` (or `0.00` if `orderCount === 0`).
- `refundedTotal`: Summed separately from orders with `status === 'refunded'`. Orders with status `pending`, `on-hold`, `cancelled`, or `failed` do not contribute to revenue.

### 1.2 Customer Identity Rule
A customer's primary identity key is their unique, normalized lowercase email address (`billing.email`).
- Guest checkouts are retained in the customer directory with `isGuest: true`.
- If an existing registered customer later checks out as a guest using their registered email, the order is associated with their existing customer ID.

### 1.3 Money Rule
All monetary values in API contracts are exposed as floating numbers in major currency units with 2 decimal places (e.g., `124.50`).
- To prevent floating-point drift, all server-side arithmetic is executed in integer cents using dedicated helpers (`toCents`, `fromCents`, `sumMoney`, `roundMoney`).
- Currency is represented as an ISO 4217 three-letter code (`USD`).
- Arithmetic balance invariant: `order.total === order.subtotal - order.discountTotal + order.shippingTotal + order.taxTotal` (+- $0.01).

### 1.4 Date & Time Rule
All dates are serialized as ISO-8601 UTC strings (e.g., `2026-10-15T00:00:00.000Z`).
- Timeseries intervals bucket records strictly according to UTC calendar boundaries.
- Daily intervals use `YYYY-MM-DD`. Weekly intervals use Monday as the start of the week. Monthly intervals use `YYYY-MM-01`.

---

## 2. Customer Contract (`Customer`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `cus_` (e.g., `cus_00001`) |
| `externalId` | `number \| null` | Upstream WooCommerce customer ID (`null` in demo mode) |
| `source` | `enum` | `'demo' \| 'woocommerce' \| 'mongodb'` |
| `email` | `string` | Lowercase valid email address (e.g., `emma.smith10@example.com`) |
| `firstName` | `string` | Customer's first name |
| `lastName` | `string` | Customer's last name |
| `phone` | `string \| null` | Contact phone number or `null` |
| `city` | `string` | Primary billing city |
| `state` | `string` | Primary billing state or province |
| `country` | `string` | Primary billing country (e.g., `'US'`) |
| `isGuest` | `boolean` | `true` if account was created via guest checkout |
| `createdAt` | `string (ISO)` | Account or initial guest checkout creation timestamp |
| `firstOrderAt`| `string (ISO) \| null` | Timestamp of earliest placed order |
| `lastOrderAt` | `string (ISO) \| null` | Timestamp of most recent placed order |
| `orderCount` | `number` | Count of revenue-generating orders (`processing`, `completed`) |
| `totalSpent` | `number` | Lifetime spend across revenue orders in major units |
| `averageOrderValue` | `number` | Average order spend (`totalSpent / orderCount`) |
| `refundedTotal` | `number` | Lifetime value of refunded orders |
| `rfm` | `null` | Reserved for Milestone 5 RFM segmentation engine |

### 2.1 Customer Directory List & Summary (`GET /api/customers`)
Query parameters:
- `page`: Page index (default `1`, integer $\ge 1$)
- `pageSize`: Items per page (default `20`, integer $1-100$)
- `sortBy`: Field to sort by (`'totalSpent' | 'orderCount' | 'createdAt' | 'lastOrderAt' | 'name'`, default `'totalSpent'`)
- `sortDir`: Sort direction (`'asc' | 'desc'`, default `'desc'`)
- `search`: Optional search query matching case-insensitively against `firstName`, `lastName`, or `email`
- `status`: Optional lifecycle filter (`'all' | 'returning' | 'one_time' | 'zero_orders' | 'guest' | 'registered'`, default `'all'`)

Response object:
- `data`: Array of `Customer` objects matching the filters and pagination.
- `pagination`: `{ page, pageSize, total, totalPages }`
- `summary`: Directory-wide aggregate metrics calculated across the entire customer base:
  - `totalCustomers`: Count of all customers in database (500 in demo dataset).
  - `repeatCustomers`: Count of customers with $\ge 2$ revenue orders.
  - `oneTimeCustomers`: Count of customers with exactly 1 revenue order.
  - `totalRevenue`: Sum of `totalSpent` across all customers.
  - `averageCustomerSpend`: Average spend per customer across the full base.

---

## 3. Order Contract (`Order`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique order identifier prefixed with `ord_` (e.g., `ord_1001`) |
| `number` | `string` | Human-facing order reference number (e.g., `'1001'`) |
| `externalId` | `number \| null` | Upstream WooCommerce order ID (`null` in demo mode) |
| `source` | `enum` | `'demo' \| 'woocommerce' \| 'mongodb'` |
| `status` | `enum` | `'pending' \| 'processing' \| 'on-hold' \| 'completed' \| 'cancelled' \| 'refunded' \| 'failed'` |
| `currency` | `string` | 3-letter currency code (e.g., `'USD'`) |
| `subtotal` | `number` | Sum of item totals before discounts, taxes and shipping |
| `discountTotal`| `number` | Total coupon and promotional discounts |
| `shippingTotal`| `number` | Shipping fee charged to customer |
| `taxTotal` | `number` | Applicable sales tax |
| `total` | `number` | Final charged total (`subtotal - discountTotal + shippingTotal + taxTotal`) |
| `customerId` | `string \| null` | Reference to customer ID (`cus_...`) |
| `customerEmail`| `string` | Lowercase email associated with order |
| `isGuest` | `boolean` | Flag indicating whether order was placed as a guest |
| `billing` | `object` | `{ firstName, lastName, city, state, country }` |
| `lineItems` | `array` | Array of purchased line items (see schema below) |
| `paymentMethod`| `string` | Identifier of payment gateway (e.g., `'credit_card'`, `'paypal'`) |
| `couponCodes` | `string[]` | List of applied coupon codes (e.g., `['WELCOME10']`) |
| `createdAt` | `string (ISO)` | Order placement timestamp |
| `paidAt` | `string (ISO) \| null` | Payment completion timestamp |
| `completedAt` | `string (ISO) \| null` | Order fulfillment/completion timestamp |

### 3.1 Line Item Sub-schema (`LineItem`)
- `productId` (`string`): Unique product identifier.
- `name` (`string`): Product display title.
- `sku` (`string`): Stock Keeping Unit identifier.
- `category` (`string`): Product taxonomy category.
- `quantity` (`number`): Integer quantity purchased ($\ge 1$).
- `unitPrice` (`number`): Unit price at time of purchase.
- `total` (`number`): `roundMoney(quantity * unitPrice)`.

---

## 4. Metrics Contracts (`Metrics`)

### 4.1 Summary Metrics (`GET /api/metrics/summary`)
- `range`: `{ from: ISOString, to: ISOString }`
- `currency`: 3-letter currency code (`USD`)
- `kpis`:
  - `revenue`: Realized gross sales in period.
  - `orders`: Realized revenue order count in period.
  - `averageOrderValue`: Average basket spend in period.
  - `activeCustomers`: Unique customers who placed a revenue order in period.
  - `newCustomers`: Customers whose initial purchase occurred in period.
  - `returningCustomerRate`: % of active buyers with prior purchase history ($0.0-100.0\%$).
  - `refundRate`: % of orders refunded during this period ($0.0-100.0\%$).
- `previous`: Equal-duration window directly preceding the requested range with identical KPI keys.
- `deltaPct`: Percentage change for each metric (`null` if previous period value is `0`).

### 4.2 Timeseries Metrics (`GET /api/metrics/timeseries`)
- `interval`: `'day' \| 'week' \| 'month'`
- `points`: Continuous zero-filled array of `{ date, revenue, orders, newCustomers }`.
- Invariant: `sum(points.revenue) === summary.kpis.revenue` for identical date windows.

### 4.3 Order Breakdown Metrics (`GET /api/metrics/order-breakdown`)
- `range`: `{ from: ISOString, to: ISOString }`
- `currency`: 3-letter currency code (`USD`)
- `byStatus`: Array of status breakdown entries covering all 7 lifecycle statuses:
  - `status`: `'pending' \| 'processing' \| 'on-hold' \| 'completed' \| 'cancelled' \| 'refunded' \| 'failed'` (in exact `ORDER_STATUSES` order, zero-filled for missing statuses)
  - `orders`: Total count of orders with this status in the date range.
  - `total`: Total dollar value of orders with this status in the date range.
- `byCategory`: Array of item sales by product category for orders in `REVENUE_STATUSES` (`processing`, `completed`), sorted by `itemSales` descending:
  - `category`: Product taxonomy category name.
  - `units`: Total units sold in period across revenue-generating orders.
  - `itemSales`: Line item gross total before order-level discounts and taxes.

---

---

## 5. Business Insights Contract (`GET /api/insights`)

Query Parameters:
- `from`: ISO 8601 UTC timestamp string (optional)
- `to`: ISO 8601 UTC timestamp string (optional)
- `severity`: `'all' | 'positive' | 'opportunity' | 'warning' | 'critical'` (default: `'all'`)

Response Schema:
```typescript
interface InsightsResponse {
  evaluatedAt: string; // ISO UTC
  range: {
    from: string; // ISO UTC
    to: string; // ISO UTC
  };
  currency: string; // e.g. "USD"
  summary: {
    totalInsights: number;
    bySeverity: {
      critical: number;
      warning: number;
      opportunity: number;
      positive: number;
    };
    businessHealthScore: number; // 0 - 100
    healthRating: 'Strong' | 'Healthy' | 'Needs Attention' | 'Critical';
  };
  insights: Array<{
    id: string;
    title: string;
    category: 'revenue_trend' | 'merchandise' | 'retention' | 'aov_growth' | 'fulfillment';
    severity: 'positive' | 'opportunity' | 'warning' | 'critical';
    summary: string;
    explanation: string;
    supportingData: Record<string, string | number | boolean | null>;
    recommendedAction: string;
    impactEstimate?: string;
  }>;
}
```

---

## Planned WooCommerce mapping (NOT YET VERIFIED against a real API)

> [!WARNING]
> This mapping is an architectural plan for Milestone 6 and has not yet been verified against a live WooCommerce instance.

### Customer Entity Mapping
| WooCommerce REST API v3 Field | CommercePilot Customer Field | Transformation / Notes |
| :--- | :--- | :--- |
| `id` | `externalId` | Preserved as upstream identifier |
| Generated | `id` | Synthesized as `cus_wc_${id}` |
| `'woocommerce'` | `source` | Tagged as live WooCommerce source |
| `email` | `email` | Normalized to lowercase trim |
| `first_name` | `firstName` | Direct mapping |
| `last_name` | `lastName` | Direct mapping |
| `billing.phone` | `phone` | Direct mapping or null if blank |
| `billing.city` | `city` | Fallback to shipping address if blank |
| `billing.state` | `state` | Direct mapping |
| `billing.country` | `country` | Direct mapping |
| `date_created_gmt` | `createdAt` | Converted to ISO UTC string |
| Computed | `orderCount` | Count of store orders with status in `REVENUE_STATUSES` |
| Computed | `totalSpent` | Sum of realized order totals in integer cents |
| Computed | `averageOrderValue` | Calculated aggregate |

### Order Entity Mapping
| WooCommerce REST API v3 Field | CommercePilot Order Field | Transformation / Notes |
| :--- | :--- | :--- |
| `id` | `externalId` | Preserved as upstream WooCommerce order id |
| Generated | `id` | Synthesized as `ord_wc_${id}` |
| `number` | `number` | Order display string |
| `status` | `status` | Normalized against `ORDER_STATUSES` |
| `currency` | `currency` | Direct mapping (e.g., `'USD'`) |
| `total` | `total` | Converted to float via `parseFloat()` |
| `discount_total` | `discountTotal` | Converted to float |
| `shipping_total` | `shippingTotal` | Converted to float |
| `total_tax` | `taxTotal` | Converted to float |
| `customer_id` | `customerId` | Linked to customer record or null for guest |
| `billing.email` | `customerEmail` | Normalized lowercase email |
| `line_items[]` | `lineItems[]` | Mapped to `{ productId, name, sku, category, quantity, unitPrice, total }` |
| `payment_method` | `paymentMethod` | Gateway slug |
| `coupon_lines[].code` | `couponCodes` | Array of coupon string codes |
| `date_created_gmt` | `createdAt` | ISO UTC timestamp |
| `date_paid_gmt` | `paidAt` | ISO UTC timestamp or null |
| `date_completed_gmt` | `completedAt` | ISO UTC timestamp or null |
