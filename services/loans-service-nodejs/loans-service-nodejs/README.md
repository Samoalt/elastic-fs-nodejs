# loans-service-nodejs

Loans microservice (Express + Postgres) with products, applications, schedules, disbursements and repayments.

## Endpoints (prefix: none by default; mount under /api/v1/loans in your server)
- `GET    /products`
- `POST   /products`               { name, interestRate, termMonths, frequency, penaltyRate? }
- `GET    /products/:id`
- `PUT    /products/:id`
- `POST   /applications`           { productId, borrowerId, principal, startDate? }
- `GET    /applications/:id`
- `POST   /applications/:id/submit`
- `POST   /applications/:id/approve`
- `POST   /applications/:id/reject`
- `POST   /applications/:id/disburse` { disbursedAt? }
- `GET    /applications/:id/schedule`
- `GET    /applications/:id/repayments`
- `POST   /repayments`             { applicationId, amount, paidAt? }

## Setup
1) Create schema:
   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```
2) Configure env:
   ```bash
   cp .env.example .env
   ```
3) Run:
   ```bash
   npm install
   npm run dev
   ```
