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
| `GET` | `/api/customers` | Paginated customer list (`page`, `pageSize`, `sortBy`, `sortDir`) |
| `GET` | `/api/customers/:id` | Single customer details plus their 10 most recent orders |
| `GET` | `/api/orders` | Paginated order list (`page`, `pageSize`, `status`, `from`, `to`) |
| `GET` | `/api/orders/:id` | Single order details |
| `GET` | `/api/metrics/summary`| Revenue, orders, AOV, active/new customers, and delta % |
| `GET` | `/api/metrics/timeseries`| Continuous timeseries points (`interval=day\|week\|month`) |

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
```

---

## 7. Testing

CommercePilot maintains 100% passing automated tests:

```powershell
# Run all server and client test suites
npm test

# Run only server tests
npm test --prefix server

# Run only client tests
npm test --prefix client
```

---

## 8. Where to Start Reading the Code

Follow this recommended study order to understand the codebase file-by-file:

1. [AGENTS.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/AGENTS.md) — The persistent operating rules governing all code in this repository.
2. [docs/ARCHITECTURE.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/docs/ARCHITECTURE.md) — High-level mental model and end-to-end request lifecycle.
3. [docs/DATA_CONTRACTS.md](file:///c:/Users/Kumar%20patil/Desktop/kilowott/docs/DATA_CONTRACTS.md) — The single source of truth for Customer, Order, and Metrics schemas.
4. [server/src/constants.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/constants.js) — Lifecycle statuses, revenue definitions, and pagination boundaries.
5. [server/src/utils/money.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/utils/money.js) — Integer-cent arithmetic helpers that eliminate floating-point drift.
6. [server/src/schemas/common.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/schemas/common.js) — Reusable Zod schemas for pagination and metadata.
7. [server/src/schemas/customer.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/schemas/customer.js) — The unified customer contract.
8. [server/src/schemas/order.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/schemas/order.js) — The unified order contract.
9. [server/src/schemas/metrics.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/schemas/metrics.js) — KPI summary and timeseries schemas.
10. [server/src/demo/prng.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/demo/prng.js) — Mulberry32 pseudo-random number generator for deterministic demo data.
11. [server/src/demo/generator.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/demo/generator.js) — Pure function that generates ~500 customers and ~2,700 orders with realistic distributions.
12. [server/src/repositories/demoRepository.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/repositories/demoRepository.js) — In-memory repository implementing the data interface.
13. [server/src/services/metricsService.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/services/metricsService.js) — Revenue, AOV, returning customer rate, and delta calculations.
14. [server/src/middleware/validate.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/middleware/validate.js) — Zod-based request validation middleware for Express 5.
15. [server/src/app.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/server/src/app.js) — Express app factory with Helmet, CORS, and dependency injection.
16. [client/src/lib/apiClient.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/client/src/lib/apiClient.js) — Fetch wrapper with unified error normalization.
17. [client/src/hooks/useApi.js](file:///c:/Users/Kumar%20patil/Desktop/kilowott/client/src/hooks/useApi.js) — AbortController-safe React hook with retry capability.
18. [client/src/pages/FoundationCheck.jsx](file:///c:/Users/Kumar%20patil/Desktop/kilowott/client/src/pages/FoundationCheck.jsx) — The foundation verification page rendering the three real-time cards.

---

## 9. Known Limitations (Prompt 1)

- **Authentication:** No user authentication or role-based access control is implemented yet.
- **Storage:** Data is currently served from deterministic in-memory demo generation. MongoDB persistence will be added in Milestone 5.
- **Live Sync:** WooCommerce REST API integration is scheduled for Milestone 6; no live WordPress connection exists yet.
- **Visual Charts & Routing:** Interactive charts (Recharts) and client-side routing are deliberately excluded until Prompt 2.
