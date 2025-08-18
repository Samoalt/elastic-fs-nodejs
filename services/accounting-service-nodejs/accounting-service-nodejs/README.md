# accounting-service-nodejs

Double-entry accounting microservice (Express + Postgres).

## Features
- Chart of Accounts (create + list, fetch by code)
- Post balanced Journal Entries (debits == credits)
- Ledger for a specific account
- Trial Balance report

## Setup
1) Create schema (see `sql/accounting_schema.sql`).
2) Copy `.env.example` to `.env` and set `DATABASE_URL` (and adjust `PORT` if needed).
3) Install & run:
   ```bash
   npm install
   npm run dev
   # Health-check:
   # curl http://localhost:${PORT:-5000}/health
   ```

## Endpoints
- `GET    /accounts`            → list accounts
- `POST   /accounts`            → create account
- `GET    /accounts/:code`      → fetch account by code
- `POST   /journals`            → post balanced journal entry
- `GET    /journals/ledger/:id` → ledger for account (by id)
- `GET    /reports/trial-balance` → trial balance
