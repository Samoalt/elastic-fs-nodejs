CREATE TABLE IF NOT EXISTS loan_products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  interest_rate NUMERIC(8,4) NOT NULL,      -- annual nominal rate e.g., 0.18 for 18%
  term_months INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly|weekly
  penalty_rate NUMERIC(8,4) DEFAULT 0,      -- optional late penalty rate per period
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES loan_products(id),
  borrower_id TEXT NOT NULL,
  principal NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',      -- draft|submitted|approved|rejected|disbursed|closed
  start_date DATE DEFAULT CURRENT_DATE,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  disbursed_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_schedules (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  period_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_due NUMERIC(18,2) NOT NULL,
  interest_due NUMERIC(18,2) NOT NULL,
  total_due NUMERIC(18,2) NOT NULL,
  principal_balance NUMERIC(18,2) NOT NULL,
  principal_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT uq_app_period UNIQUE(application_id, period_no)
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  amount NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_sched_app ON loan_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_loan_repay_app ON loan_repayments(application_id);
