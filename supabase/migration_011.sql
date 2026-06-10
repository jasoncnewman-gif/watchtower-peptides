-- migration_011.sql
-- COA Integrity Audit tracking columns
-- Apply in Supabase SQL Editor

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS coa_audit_status  text        DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS coa_audit_tier    integer     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coa_audit_notes   text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coa_audited_at    timestamptz DEFAULT NULL;

-- coa_audit_status values:
--   'pending'  — not yet reviewed
--   'complete' — reviewed, tier confirmed or corrected
--   'flagged'  — reviewed, something suspicious found (score may need adjustment)
--   'skip'     — T0 (no COA) or T4 (Finnrick, chain-of-custody), no audit needed

-- Pre-mark T4 (Finnrick) vendors as skip — nothing to audit there
UPDATE vendors
SET coa_audit_status = 'skip',
    coa_audit_notes  = 'T4 — Finnrick chain-of-custody, no audit required'
WHERE finnrick_tests_count > 0
  AND status IN ('active', 'flagged');

-- Pre-mark T0 (no COA at all) vendors as skip
UPDATE vendors
SET coa_audit_status = 'skip',
    coa_audit_notes  = 'T0 — no COA exists, nothing to verify'
WHERE has_coa = false
  AND (finnrick_tests_count IS NULL OR finnrick_tests_count = 0)
  AND status IN ('active', 'flagged');
