CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,                 -- event type, e.g., USER_LOGIN, PAYMENT_INITIATED
  source TEXT,                        -- originating service
  entity_type TEXT,                   -- e.g., user, wallet, payment
  entity_id TEXT,
  actor_id TEXT,
  actor_type TEXT,                    -- e.g., user, system
  request_id TEXT,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  data JSONB,                         -- extra context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at   ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_type         ON audit_events(type);
