CREATE TABLE IF NOT EXISTS payment_intents (
  id BIGSERIAL PRIMARY KEY,
  method TEXT NOT NULL,                   -- 'mpesa' | 'wallet' | 'card' | ...
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'requires_confirmation', -- requires_confirmation|processing|succeeded|failed|canceled|refunded|partially_refunded
  reference TEXT,                         -- external reference (order id, invoice no.)
  description TEXT,
  customer_id TEXT,
  provider TEXT,                          -- mpesa|wallet|card_gateway
  provider_ref TEXT,                      -- e.g., CheckoutRequestID
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  intent_id BIGINT NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                     -- 'created' | 'confirmed' | 'succeeded' | 'failed' | 'canceled' | 'webhook.received' | ...
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pi_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_pi_method ON payment_intents(method);
CREATE INDEX IF NOT EXISTS idx_pi_ref ON payment_intents(reference);
