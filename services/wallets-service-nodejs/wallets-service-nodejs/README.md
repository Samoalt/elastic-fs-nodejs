# wallets-service-nodejs

Drop-in Wallets service for Elastic FS (Express + Postgres).

## Setup
1. Create DB schema (see `sql/wallets_schema.sql`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (and adjust `PORT` if needed).
3. Install & run:
   ```bash
   npm install
   npm run dev
   # Health-check:
   # curl http://localhost:${PORT:-7000}/health
   ```

## Wiring into your server
If this service lives in a larger app, add to your `src/server.js`:
```js
const walletsRouter = require('./routes/wallets');
app.use('/wallets', walletsRouter);
```

## Endpoints
- `POST /wallets` → create a wallet
- `GET /wallets/:id` → fetch a wallet
- `POST /wallets/:id/deposit` → deposit amount
- `POST /wallets/:id/withdraw` → withdraw amount
- `POST /wallets/transfer` → transfer between wallets

See inline `@openapi` docs in `src/routes/wallets.js` if you wire Swagger.
