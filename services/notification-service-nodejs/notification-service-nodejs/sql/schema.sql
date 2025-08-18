CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL,               -- 'email' | 'sms'
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  provider TEXT,                       -- 'smtp' | 'twilio' | etc.
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',  -- Pending|Sent|Failed|Delivered|Undelivered
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_provider_id ON notifications(provider_message_id);
