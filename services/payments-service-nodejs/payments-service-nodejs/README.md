# payments-service-nodejs

Orchestrates payment **intents** across methods (e.g., M-Pesa, wallet, card). Keeps a canonical ledger of payment intents and provider references. Optional integration with your `mpesa-service-nodejs` to initiate STK Push and handle callbacks.

## Endpoints (mounted under `/api/v1/payments`)
- `POST   /intents`                – create a payment intent
- `GET    /intents`                – list (filters: status, method, ref, customerId)
- `GET    /intents/:id`            – fetch one
- `POST   /intents/:id/confirm`    – start processing (e.g., trigger M-Pesa STK Push via mpesa-service)
- `POST   /intents/:id/cancel`     – cancel a pending intent
- `POST   /webhooks/mpesa`         – receive Daraja STK callback (or forward from mpesa-service)

## Quick start
```bash
psql "$DATABASE_URL" -f sql/schema.sql

cp .env.example .env
# set MPESA_SERVICE_URL if orchestrating via your mpesa-service
# set WEBHOOK_SECRET if you want signature verify on webhooks

npm install
npm run dev

# Health
curl http://localhost:5003/health
```
