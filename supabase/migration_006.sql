-- migration_006.sql
-- Extends lab_tests for Finnrick per-test granularity
-- Run in Supabase SQL Editor

ALTER TABLE lab_tests
  ADD COLUMN IF NOT EXISTS label_claim_mg   numeric(8,2),
  ADD COLUMN IF NOT EXISTS tested_amount_mg numeric(8,2),
  ADD COLUMN IF NOT EXISTS difference_pct   numeric(6,2),
  ADD COLUMN IF NOT EXISTS endotoxin_result text,          -- 'low', 'high', 'n/a'
  ADD COLUMN IF NOT EXISTS finnrick_score   numeric(4,2),  -- Finnrick's 0–10 weighted score
  ADD COLUMN IF NOT EXISTS test_source      text,          -- 'finnrick', 'coa', 'manual'
  ADD COLUMN IF NOT EXISTS container_desc   text;          -- Finnrick container description

-- Index for fast vendor+source lookups (used when re-scraping a vendor)
CREATE INDEX IF NOT EXISTS idx_lab_tests_source ON lab_tests(test_source);
