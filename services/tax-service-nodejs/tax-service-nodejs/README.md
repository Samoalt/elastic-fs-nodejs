# tax-service-nodejs

Tax microservice (Express + Postgres) for calculating taxes (e.g., VAT) per line and per document, with effective-date tax rates and CRUD for rates.

## Endpoints (mounted under `/api/v1/tax`)
- `POST /calculate` — compute taxes for line items
- `GET  /rates` — list rates
- `POST /rates` — create a rate
- `PUT  /rates/:id` — update a rate
- `GET  /rates/:id` — fetch one
- `DELETE /rates/:id` — (soft) delete

## Quick start
```bash
psql "$DATABASE_URL" -f sql/schema.sql

cp .env.example .env
npm install
npm run dev

# Health:
curl http://localhost:8004/health
```
