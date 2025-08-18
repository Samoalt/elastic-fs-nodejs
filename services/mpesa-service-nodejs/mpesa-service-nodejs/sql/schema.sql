CREATE TABLE IF NOT EXISTS mpesa_payments (
  id BIGSERIAL PRIMARY KEY,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  phone TEXT,
  amount NUMERIC(18,2),
  status TEXT NOT NULL DEFAULT 'Pending',
  result_code INTEGER,
  result_desc TEXT,
  receipt_no TEXT,
  transaction_date TEXT,
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mpesa_status ON mpesa_payments(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_chk ON mpesa_payments(checkout_request_id);
