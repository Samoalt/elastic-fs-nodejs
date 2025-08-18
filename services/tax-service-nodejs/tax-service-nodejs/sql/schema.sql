CREATE TABLE IF NOT EXISTS tax_rates (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,             -- e.g., 'VAT_STANDARD', 'VAT_ZERO'
  name TEXT NOT NULL,
  rate NUMERIC(8,4) NOT NULL,     -- 0.16 => 16% (example)
  inclusive BOOLEAN NOT NULL DEFAULT FALSE,
  country TEXT,                   -- e.g., 'KE'
  region TEXT,                    -- optional
  effective_from DATE NOT NULL,
  effective_to DATE,              -- NULL => open-ended
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_code ON tax_rates(code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_window ON tax_rates(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_tax_rates_country ON tax_rates(country);

-- OPTIONAL demo seed values (adjust to your jurisdiction; these are placeholders)
INSERT INTO tax_rates (code, name, rate, inclusive, country, region, effective_from)
SELECT 'VAT_STANDARD','VAT standard (sample)',0.16,FALSE,'KE',NULL,DATE '2025-01-01'
WHERE NOT EXISTS (SELECT 1 FROM tax_rates WHERE code='VAT_STANDARD');

INSERT INTO tax_rates (code, name, rate, inclusive, country, region, effective_from)
SELECT 'VAT_ZERO','VAT zero (sample)',0.00,FALSE,'KE',NULL,DATE '2025-01-01'
WHERE NOT EXISTS (SELECT 1 FROM tax_rates WHERE code='VAT_ZERO');
