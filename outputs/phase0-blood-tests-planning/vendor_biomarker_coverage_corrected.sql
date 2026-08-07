-- CORRECTED from the original 8-phase spec's Table 6.
-- Change: added specimen_type column.
-- Reason: the dry-run seed script surfaced 9 cells (8 vendors' Ketones offerings + Everlywell's
-- Melatonin) where the marker is offered via urine, not blood -- clinically distinct from what
-- the marker name implies. The original accuracy_flag enum (CAP/FST/TMG) has no slot for this,
-- so without this column the distinction has no structured home and would be silently lost by
-- any seed script that doesn't specifically grep raw_annotation text for "(urine)"/"(stool)".

CREATE TABLE IF NOT EXISTS vendor_biomarker_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES lab_vendors(id) ON DELETE CASCADE,
  biomarker_id UUID NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'included',     -- in base/entry plan
    'addon',        -- available but costs extra
    'unavailable',  -- confirmed not offered
    'unconfirmed'   -- could not verify
  )),
  tier_id UUID REFERENCES vendor_tiers(id),
  tier_price_cents INTEGER,
  addon_cost_cents INTEGER,
  specimen_type TEXT NOT NULL DEFAULT 'blood' CHECK (specimen_type IN (
    'blood',   -- venous or capillary blood draw (default -- true for the overwhelming majority)
    'urine',
    'stool'
  )),                                                              -- ADDED
  accuracy_flag TEXT CHECK (accuracy_flag IN (
    'CAP',    -- capillary collection accuracy caveat
    'FST',    -- requires fasting, not always enforced
    'TMG',    -- timing-sensitive (e.g. AM cortisol)
    NULL
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, biomarker_id)
);

CREATE INDEX idx_coverage_vendor ON vendor_biomarker_coverage(vendor_id);
CREATE INDEX idx_coverage_biomarker ON vendor_biomarker_coverage(biomarker_id);
CREATE INDEX idx_coverage_status ON vendor_biomarker_coverage(status);
