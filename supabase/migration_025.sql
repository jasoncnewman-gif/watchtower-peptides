-- migration_025.sql
-- Finnrick paywall change (found 2026-08-10): as of this writing, Finnrick gates
-- per-test purity/dosage/lab-name behind a $9.99/mo membership site-wide (confirmed
-- on multiple vendor pages, not vendor-specific). Per-test purity numbers scraped
-- before this change remain in lab_tests and are left untouched by this migration.
--
-- Still free and previously never captured: pass/fail per test, and a vendor-level
-- summary block (overall rating %, rank out of all Finnrick-tracked vendors,
-- claimed location, pass/fail counts). The rank/location fields already caught a
-- real USA-vs-Singapore mislabeling on Zen Peptides — this is a genuinely new
-- verification signal, not just a workaround for the paywall.
--
-- Apply manually in Supabase SQL Editor.

-- Per-test pass/fail — still free, was previously discarded entirely.
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS finnrick_result text
  CHECK (finnrick_result IN ('pass', 'fail'));

-- Stable per-test identifier from the Finnrick test-detail URL
-- (e.g. "20260720-g-degzrry" from /testing-certificate/retatrutide/zen-peptides/20260720-g-degzrry).
-- Used for non-destructive sync — upsert by this key instead of delete-all-then-reinsert,
-- so re-scraping never erases real historical purity numbers with a null-purity row for
-- the same test.
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS finnrick_test_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_tests_finnrick_test_id
  ON lab_tests(finnrick_test_id) WHERE finnrick_test_id IS NOT NULL;

-- Vendor-level Finnrick summary (all freely visible on the vendor's Finnrick page,
-- never scraped before this migration).
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_overall_rating numeric;   -- e.g. 70 (%)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_rank integer;            -- e.g. 189
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_rank_of integer;         -- e.g. 301
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_pass_count integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_fail_count integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_location text;           -- "Reported location:" — cross-check against vendors.country/location
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_ownership_status text;   -- "Ownership/control:" e.g. "Not established" or "United States (documented)"
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_last_scraped timestamptz;

-- Note: vendors.finnrick_rating (text) and vendors.finnrick_score (numeric) already
-- exist from an earlier migration but were never written to by any script and are not
-- read anywhere in the app — left as-is, not reused, to avoid ambiguity with the new
-- finnrick_overall_rating column above.
