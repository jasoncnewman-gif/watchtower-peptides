-- Migration 010: verification_flags table
-- Purpose: Store COA validation findings and fraud flags per vendor.
-- Notification wiring (email on OPEN flag) is deferred — table is ready when needed.
-- Apply manually in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS verification_flags (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id        uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  flag_type        text        NOT NULL CHECK (flag_type IN (
                                 'COA_SUSPECTED_FAKE',
                                 'LAB_UNVERIFIABLE',
                                 'CROSS_VENDOR_MATCH',
                                 'RESULT_ANOMALY',
                                 'VENDOR_PROFILE_CONCERN',
                                 'ACQUISITION_BLOCKED',
                                 'TRUSTPILOT_CONCERN'
                               )),
  severity         text        NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  finding_summary  text        NOT NULL,
  evidence_urls    text[]      DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'OPEN' CHECK (status IN (
                                 'OPEN',
                                 'IN_REVIEW',
                                 'RESOLVED',
                                 'DISMISSED'
                               )),
  resolution_notes text,
  resolved_at      timestamptz,
  resolved_by      text,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

-- Indexes for common queries: open flags per vendor, severity triage
CREATE INDEX IF NOT EXISTS idx_verification_flags_vendor_id ON verification_flags(vendor_id);
CREATE INDEX IF NOT EXISTS idx_verification_flags_status    ON verification_flags(status);
CREATE INDEX IF NOT EXISTS idx_verification_flags_severity  ON verification_flags(severity);

-- Re-uses update_updated_at() already defined in schema
CREATE OR REPLACE TRIGGER verification_flags_updated_at
  BEFORE UPDATE ON verification_flags
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- RLS: anon key cannot read or write flags (internal use only)
ALTER TABLE verification_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only"
  ON verification_flags
  USING (false)
  WITH CHECK (false);

-- ── FUTURE WIRING (do not apply yet) ────────────────────────────
-- When ready to add email notifications, add a Supabase Database Webhook
-- or pg_net call here triggered on INSERT WHERE status = 'OPEN'.
-- Target: jason.c.newman@gmail.com
-- Payload: vendor_id, flag_type, severity, finding_summary
