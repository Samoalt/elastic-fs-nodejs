# wallets-service-nodejs (v2)

Authoritative Wallets & Ledger façade for Elastic FS. Single writer to Formance (Open Ledger). Supports:
- Wallets: create, balances (available = ledger - holds)
- Holds: create / capture / release (ledger-backed via a `holds:{holdId}` account)
- Transfers: on-us wallet→wallet
- Topups: from M-Pesa clearing → wallet
- Payouts: wallet → bank settlement

## Endpoints (prefix: `/api/v1/wallets`)
- `POST /wallets` { userId, currency } → { id, account, currency }
- `GET /wallets/:id/balances` → { ledger, holds, available }
- `POST /wallets/:id/holds` { amount, currency } (Idempotency-Key required)
- `POST /holds/:id/capture` { toWalletId? , toAccount? , amount? } (defaults to full amount)
- `POST /holds/:id/release`
- `POST /transfers` { fromWalletId, toWalletId, amount, currency, metadata? }
- `POST /topups/mpesa` { walletId, amount, currency, providerRef }
- `POST /payouts/bank` { walletId, amount, currency, reference? }

## Quick start
```bash
psql "$DATABASE_URL" -f sql/schema.sql
cp .env.example .env
npm install
npm run dev

# Health
curl http://localhost:5002/health
```
