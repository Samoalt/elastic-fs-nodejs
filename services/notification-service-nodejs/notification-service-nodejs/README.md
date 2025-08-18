# notification-service-nodejs

Notification microservice for Elastic FS (Express + Postgres) with **email (SMTP/Nodemailer)**, **SMS (Twilio)**, optional **RabbitMQ** consumer, and simple **webhooks**.

## Endpoints (mounted under `/api/v1/notifications`)
- `POST /email`   — send email `{ to, subject, html?, text? }`
- `POST /sms`     — send SMS `{ to, message }`
- `GET  /`        — list notifications (filters: `status`, `channel`, `to`, `limit`, `offset`)
- `GET  /:id`     — fetch one
- `POST /webhooks/twilio` — Twilio delivery status webhook

## Quick start
```bash
psql "$DATABASE_URL" -f sql/schema.sql

cp .env.example .env
# set SMTP_* and TWILIO_* (or only what you use)

npm install
npm run dev

# Health:
curl http://localhost:5006/health
```
