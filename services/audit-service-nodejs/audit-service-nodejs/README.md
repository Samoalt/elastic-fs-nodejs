# audit-service-nodejs

Audit events microservice (Express + Postgres + optional RabbitMQ).

## Endpoints
- `POST /api/v1/audit/events` – ingest an audit event
- `GET  /api/v1/audit/events` – list/search events (filters + pagination)
- `GET  /api/v1/audit/events/:id` – fetch one event

## Quick start
1) Create schema:
   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```
2) Configure env:
   ```bash
   cp .env.example .env
   # set DATABASE_URL; optionally RABBITMQ_URL + RABBITMQ_QUEUE to enable consumer
   ```
3) Install & run:
   ```bash
   npm install
   npm run dev
   # Health (from your existing server): /health
   ```

## RabbitMQ consumer
If `RABBITMQ_URL` is set, the service will consume JSON messages from `RABBITMQ_QUEUE`.
Each message should be a JSON object matching the POST /events payload.
