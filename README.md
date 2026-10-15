# CommercePilot

> **WooCommerce Customer Intelligence CRM**  
> Transform raw WooCommerce orders and customer accounts into actionable intelligence: RFM customer segmentation, Customer Lifetime Value (CLV), churn risk detection, and repeat purchase analytics.

---

> [!IMPORTANT]
> **DEMO DATA NOTICE:** This project currently runs in **Demo Mode** using a deterministic, simulated eCommerce dataset. All customers, emails, order histories, and financial figures are completely synthetic.

> [!CAUTION]
> **AUTHENTICATION WARNING:** User authentication and access control are **NOT YET IMPLEMENTED** in this foundation prompt. Do **NOT** deploy this application to a public server or configure live store credentials until an authentication layer is introduced.

---

## 1. Prerequisites

- **Node.js**: v20.0.0 or later (Tested with Node v22.18.0)
- **npm**: v10.0.0 or later (Tested with npm 10.9.3)
- **Git**: v2.40.0 or later

---

## 2. Setup & Installation

Clone the repository and install all dependencies across root, server, and client:

```powershell
# 1. Install all dependencies across root, server and client
npm run install:all

# 2. Configure environment files (pre-configured defaults provided)
cp server/.env.example server/.env

# 3. Start both development servers concurrently
npm run dev
```

The application will be accessible at:
- **Client Dashboard**: `http://localhost:5173`
- **Server API**: `http://localhost:4000`

---

## 3. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run install:all` | Installs dependencies for root, `server/`, and `client/` |
| `npm run dev` | Runs both client (Vite) and server (`node --watch`) concurrently |
| `npm test` | Runs the test suites for both server and client (Vitest) |
| `npm run build` | Compiles the production build for the client |

---

## 4. Environment Variables

### Server (`server/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port on which the Express server listens |
| `NODE_ENV` | `development` | Runtime environment (`development`, `test`, `production`) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for the React client |
| `DATA_SOURCE` | `demo` | Active repository implementation (`demo`, `mongodb`, `woocommerce`) |
| `DEMO_SEED` | `42` | Seed number for deterministic demo data generation |
| `MONGODB_URI` | *(empty)* | Future MongoDB database connection string (Milestone 5) |
| `WOOCOMMERCE_URL` | *(empty)* | Future WooCommerce store URL (Milestone 6) |
| `WOOCOMMERCE_CONSUMER_KEY` | *(empty)* | Future WooCommerce REST API consumer key (Milestone 6) |
| `WOOCOMMERCE_CONSUMER_SECRET` | *(empty)* | Future WooCommerce REST API consumer secret (Milestone 6) |

---

## 5. Project Directory Structure

```
kilowott/
├── AGENTS.md                  # Operating guidelines for AI agents and contributors
├── README.md                  # Project overview, setup, and study guide
├── package.json               # Root scripts and concurrently runner
├── .gitignore                 # Safe repository ignore rules
├── docs/
│   ├── ARCHITECTURE.md        # System architecture, lifecycle, and design decisions
│   └── DATA_CONTRACTS.md      # Data schemas, money/date rules, and WooCommerce mapping
├── server/
│   ├── .env.example           # Documented server environment variables
│   ├── package.json           # Express 5, Helmet, Cors, Zod, Vitest, Supertest
│   ├── src/
│   │   ├── index.js           # Server bootstrap and listener
│   │   ├── app.js             # Express app factory (injectable for testing)
│   │   ├── constants.js       # Statuses, revenue definitions, pagination constants
│   │   ├── config/env.js      # Zod-validated environment config
│   │   ├── schemas/           # Zod contracts (common, customer, order, metrics)
│   │   ├── demo/              # PRNG, catalogs, and deterministic demo generator
│   │   ├── repositories/      # Repository interface and DemoRepository implementation
│   │   ├── services/          # Business logic (customer, order, metrics)
│   │   ├── middleware/        # validate, notFound, errorHandler
│   │   ├── routes/            # health, meta, customers, orders, metrics
│   │   └── utils/             # AppError, money (integer cents), dates (UTC)
│   └── test/                  # Vitest test suites (generator, api)
└── client/
    ├── .env.example           # Client configuration notes
    ├── vite.config.js         # Vite configuration with proxy and Tailwind v4
    ├── package.json           # React 19, Tailwind CSS v4, Vitest
    ├── index.html             # HTML entry point
    ├── src/
    │   ├── main.jsx           # React DOM root mounting
    │   ├── App.jsx            # Top-level application component
    │   ├── index.css          # Tailwind CSS v4 entry point
    │   ├── lib/               # apiClient (fetch wrapper), formatters
    │   ├── hooks/             # useApi hook (AbortController-safe)
    │   ├── components/ui/     # Spinner, ErrorState, EmptyState, DemoBadge
    │   ├── components/layout/ # Header with live server indicator and demo badge
    │   └── pages/             # FoundationCheck proof page
    └── test/                  # Client unit tests (formatters)
```

---

## 6. REST API Reference & Example Commands

All responses are JSON and include the `X-Data-Source` header.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server health and uptime |
| `GET` | `/api/meta` | Returns system metadata, data source, and entity counts |
| `GET` | `/api/customers` | Searchable, filterable, sortable customer list + directory summary |
| `GET` | `/api/customers/:id` | Single customer profile with recent order drill-down |
| `GET` | `/api/customers/:id/intelligence` | Deterministic RFM segment, churn risk score, and tailored retention outreach draft |
| `GET` | `/api/orders` | Paginated order list (`page`, `pageSize`, `status`, `from`, `to`, `customerId`) |
| `GET` | `/api/orders/:id` | Single order details |
| `GET` | `/api/metrics/summary`| Revenue, orders, AOV, active/new customers, and delta % |
| `GET` | `/api/metrics/timeseries`| Continuous timeseries points (`interval=day\|week\|month`) |
| `GET` | `/api/metrics/order-breakdown`| Order counts & totals by all 7 statuses + item sales by category (`from`, `to`) |

### Example cURL Commands:
```bash
# 1. Check server health
curl http://localhost:4000/api/health

# 2. Inspect metadata and counts
curl http://localhost:4000/api/meta

# 3. Retrieve executive summary metrics
curl http://localhost:4000/api/metrics/summary

# 4. Retrieve top 5 customers by total spend
curl "http://localhost:4000/api/customers?page=1&pageSize=5&sortBy=totalSpent&sortDir=desc"

# 5. Retrieve processing orders
curl "http://localhost:4000/api/orders?status=processing&pageSize=10"

# 6. Retrieve order status breakdown and category sales (last 30 days)
curl "http://localhost:4000/api/metrics/order-breakdown"

# 7. Retrieve order breakdown for a specific date range
curl "http://localhost:4000/api/metrics/order-breakdown?from=2024-01-01T00:00:00.000Z&to=2024-03-31T23:59:59.999Z"
```

---

## 7. Customer Retention Intelligence Methodology

CommercePilot incorporates an explainable, deterministic **Customer Retention Intelligence Engine**:

### Deterministic RFM Heuristics
- **Recency ($R$)**: Days elapsed between the customer's `lastOrderAt` and the evaluation timestamp.
- **Frequency ($F$)**: Lifetime count of revenue-generating orders (`processing`, `completed`).
- **Monetary ($M$)**: Total lifetime realized spend (`totalSpent`).

### Segment & Churn Risk Classification Rules
| Segment | Criteria | Churn Risk | Recommended Strategy |
| :--- | :--- | :--- | :--- |
| **Champions** | $R \le 45\text{d}$, $F \ge 3$, $M \ge \$250$ | **Low** | VIP appreciation, exclusive collection early access |
| **Loyal** | $R \le 90\text{d}$, $F \ge 2$ | **Low** | Category cross-sell, loyalty reward credits |
| **Recent Buyer** | $R \le 45\text{d}$, $F = 1$ | **Moderate** | 2nd-order conversion bounceback sequence |
| **At Risk** | $R > 90\text{d}$, $F \ge 2$ | **High** | Proactive win-back sequence with retention incentive |
| **Hibernating** | $R > 90\text{d}$, $F = 1$ | **Moderate/High** | Re-engagement survey and catalog refresh |
| **Inactive Prospect** | $F = 0$ (no revenue orders) | **Low** | Welcome onboarding sequence |

### Retention Outreach Draft
For each evaluated profile, the engine generates an explainable action plan:
- Assessment factors explicitly listing supporting dates, order counts, and spending metrics.
- A personalized email draft referencing the customer's first name, purchase count, and most recently purchased line item.
- An illustrative suggested promotion (e.g., `COMEBACK15`, `VIPACCESS`).

> [!NOTE]
> **Deterministic vs. Agentic Distinction:** This engine is 100% deterministic, rule-based, and explainable. It does not invoke an external probabilistic LLM or make ungrounded claims. Suggested promotional codes are illustrative demo suggestions only, and no emails are dispatched automatically.

---

## 8. Testing

CommercePilot maintains 100% passing automated tests across server and client:

```powershell
# Run all server and client test suites (104 tests total)
npm test

# Run only server tests (33 tests: API, generator, and intelligence)
npm test --prefix server

# Run only client tests (71 tests: formatting, routing, cards, directory, details, intelligence)
npm test --prefix client
```

---

## 9. Where to Start Reading the Code

Follow this recommended study order to understand the codebase file-by-file:

1. [AGENTS.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/AGENTS.md) — The persistent operating rules governing all code in this repository.
2. [docs/ARCHITECTURE.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/docs/ARCHITECTURE.md) — High-level mental model and end-to-end request lifecycle.
3. [docs/DATA_CONTRACTS.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/docs/DATA_CONTRACTS.md) — The single source of truth for Customer, Order, and Metrics schemas.
4. [server/src/constants.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/constants.js) — Lifecycle statuses, revenue definitions, and pagination boundaries.
5. [server/src/services/intelligenceService.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/services/intelligenceService.js) — Deterministic RFM segmentation, churn risk scoring, and tailored retention outreach draft generator.
6. [server/src/routes/customers.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/routes/customers.js) — Customer endpoints: directory list, customer detail, and retention intelligence.
7. [client/src/pages/CustomersPage.jsx](file:///c:/Users/Kumar%20patil/Desktop/kilowott/client/src/pages/CustomersPage.jsx) — Customer directory with search, filter tabs, sorting, and summary metrics.
8. [client/src/pages/CustomerDetailPage.jsx](file:///c:/Users/Kumar%20patil/Desktop/kilowott/client/src/pages/CustomerDetailPage.jsx) — Customer profile, Customer Retention Intelligence Card, copy action, and order history table.

---

## 10. Known Limitations

- **Authentication:** User authentication and role-based access control are not yet implemented. Do not expose this instance to an untrusted public network.
- **Storage:** Data is currently served from deterministic in-memory demo simulation. MongoDB persistence is scheduled for future milestones.
- **WooCommerce Live Sync:** WooCommerce REST API integration is planned for future milestones; no live WordPress connection is currently active.
- **Outreach Automation:** The Customer Retention Intelligence feature produces structured drafts and recommendations; it does not connect to an SMTP server or auto-send promotional communications.
