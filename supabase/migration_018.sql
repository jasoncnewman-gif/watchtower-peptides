-- migration_018: add sub_scores JSONB to vendor_audit_log
-- Stores individual LV/PQ/TR/CX sub-scores alongside overall score proposal
-- so audit-action/route.ts can write all sub-scores to vendors on approve.
ALTER TABLE vendor_audit_log
  ADD COLUMN IF NOT EXISTS sub_scores JSONB;
