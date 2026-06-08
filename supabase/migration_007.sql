-- migration_007.sql
-- vendor_transparency: checklist table for the Transparency/Legitimacy sub-score
-- One row per vendor. Manually researched per vendor; auto-filled fields noted below.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS vendor_transparency (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id                uuid UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Manually researched fields (false = unknown/not verified, not necessarily absent)
  has_contact_info         boolean NOT NULL DEFAULT false,  -- phone + email publicly listed
  has_business_address     boolean NOT NULL DEFAULT false,  -- verifiable physical address
  has_ownership_disclosure boolean NOT NULL DEFAULT false,  -- named owner or parent company
  has_lab_disclosure       boolean NOT NULL DEFAULT false,  -- lab name appears on COAs
  has_testing_methodology  boolean NOT NULL DEFAULT false,  -- how they test is explained publicly
  has_batch_numbers        boolean NOT NULL DEFAULT false,  -- batch IDs on COAs

  -- Auto-populated fields (populated by seed-transparency.ts, refresh periodically)
  domain_years             integer,                         -- years since established_year; null = unknown
  fda_warning              boolean NOT NULL DEFAULT false,  -- FDA warning letter on record
  fraud_flags              boolean NOT NULL DEFAULT false,  -- known scam/fraud reports

  -- Metadata
  last_reviewed            date,                            -- date of last manual verification
  notes                    text,                            -- reviewer notes
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_transparency_vendor ON vendor_transparency(vendor_id);

ALTER TABLE vendor_transparency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vendor_transparency"
  ON vendor_transparency FOR SELECT USING (true);
