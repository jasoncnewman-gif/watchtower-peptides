-- Migration 019: /blood-tests feature — biomarker + lab vendor schema
-- 6 new tables. Incorporates two corrections found during the Phase 0 dry-run:
--   1. biomarkers.category — expanded from 11 to 13 values (added hematology, electrolyte)
--   2. vendor_biomarker_coverage — added specimen_type column (blood/urine/stool)
-- Full design history: platform/outputs/phase0-blood-tests-planning/PHASE_0_FINAL_STATUS.md

CREATE TABLE IF NOT EXISTS biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  -- category values: liver | kidney | metabolic | hormones | inflammation | immune |
  --   cardiac | neurological | copper-status | thyroid | longevity | hematology | electrolyte
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  -- 1 = universal safety (every protocol)
  -- 2 = efficacy/mechanism-specific
  -- 3 = advanced/longevity
  peptide_relevance_rank INTEGER,
  -- frequency count from biomarker audit; null if never referenced by a peptide protocol (e.g. NAD+)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (category IN (
    'liver', 'kidney', 'metabolic', 'hormones', 'inflammation', 'immune',
    'cardiac', 'neurological', 'copper-status', 'thyroid', 'longevity',
    'hematology', 'electrolyte'
  ))
);

CREATE INDEX IF NOT EXISTS idx_biomarkers_tier ON biomarkers(tier);
CREATE INDEX IF NOT EXISTS idx_biomarkers_category ON biomarkers(category);

CREATE TABLE IF NOT EXISTS peptide_biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_id UUID NOT NULL REFERENCES peptides(id) ON DELETE CASCADE,
  biomarker_id UUID NOT NULL REFERENCES biomarkers(id) ON DELETE CASCADE,
  monitoring_tier TEXT NOT NULL CHECK (
    monitoring_tier IN ('safety', 'efficacy', 'advanced')
  ),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  -- 1 = highest priority for this peptide
  clinical_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(peptide_id, biomarker_id)
);

CREATE INDEX IF NOT EXISTS idx_peptide_biomarkers_peptide
  ON peptide_biomarkers(peptide_id);
CREATE INDEX IF NOT EXISTS idx_peptide_biomarkers_biomarker
  ON peptide_biomarkers(biomarker_id);

CREATE TABLE IF NOT EXISTS peptide_blend_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blend_id UUID NOT NULL REFERENCES peptides(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES peptides(id) ON DELETE CASCADE,
  quantity_mcg INTEGER,
  -- null if unknown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blend_id, component_id),
  CHECK (blend_id != component_id)
);

CREATE INDEX IF NOT EXISTS idx_blend_components_blend
  ON peptide_blend_components(blend_id);

CREATE TABLE IF NOT EXISTS lab_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  business_model TEXT NOT NULL CHECK (business_model IN (
    'subscription', 'panel', 'ala-carte', 'hybrid', 'clinic'
  )),
  section TEXT NOT NULL CHECK (section IN (
    'membership',       -- subscription/annual plans
    'panel-package',    -- one-time purchase fixed panels
    'build-your-own',   -- pure à la carte
    'special',          -- Lifeforce — managed care callout
    'excluded'
  )),
  entry_price_cents INTEGER,
  true_annual_cost_cents INTEGER,
  billing_cycle TEXT,
  collection_method TEXT CHECK (collection_method IN (
    'venous-draw', 'fingerstick', 'arm-device',
    'at-home-kit', 'mobile-phlebotomist', 'clinic-draw', 'multiple'
  )),
  lab_partner TEXT,
  clia_certified BOOLEAN,
  peptide_rx_offered BOOLEAN DEFAULT FALSE,
  affiliate_program BOOLEAN,
  affiliate_url TEXT,
  affiliate_commission TEXT,
  affiliate_network TEXT,
  audience_fit_score INTEGER CHECK (audience_fit_score BETWEEN 1 AND 10),
  eligibility TEXT NOT NULL CHECK (eligibility IN (
    'INCLUDE', 'INCLUDE-NICHE', 'EXCLUDE'
  )),
  exclusion_reason TEXT,
  ny_nj_surcharge BOOLEAN,
  ny_nj_surcharge_amount_cents INTEGER,
  state_restrictions TEXT,
  hsa_fsa_eligible BOOLEAN,
  accuracy_flags TEXT,
  audience_overlap_notes TEXT,
  is_gated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_vendors_section ON lab_vendors(section);
CREATE INDEX IF NOT EXISTS idx_lab_vendors_eligibility ON lab_vendors(eligibility);
CREATE INDEX IF NOT EXISTS idx_lab_vendors_slug ON lab_vendors(slug);

-- NOTE: biomarker_count, hsa_fsa_eligible, and ny_nj_surcharge are TEXT here, not the
-- INTEGER/BOOLEAN types from the original 8-phase spec draft. The actual research data has
-- values like "120+ (also stated as 133)" and "unconfirmed" that don't coerce into those
-- types -- using them as-drafted would reject real rows on insert. Flagging this as a third
-- correction, same class as the category enum and specimen_type fixes.
CREATE TABLE IF NOT EXISTS vendor_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES lab_vendors(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  price_cents INTEGER,
  billing_cycle TEXT,
  biomarker_count TEXT,
  tests_included TEXT,
  hsa_fsa_eligible TEXT,
  state_restrictions TEXT,
  ny_nj_surcharge TEXT,
  is_entry_tier BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, tier_name)
);

CREATE INDEX IF NOT EXISTS idx_vendor_tiers_vendor ON vendor_tiers(vendor_id);

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
  -- which vendor tier unlocks this marker; null if included in all tiers
  tier_price_cents INTEGER,
  addon_cost_cents INTEGER,
  specimen_type TEXT NOT NULL DEFAULT 'blood' CHECK (specimen_type IN (
    'blood', 'urine', 'stool'
  )),
  accuracy_flag TEXT CHECK (accuracy_flag IN (
    'CAP',    -- capillary collection accuracy caveat
    'FST',    -- requires fasting, not always enforced
    'TMG'     -- timing-sensitive (e.g. AM cortisol)
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, biomarker_id)
);

CREATE INDEX IF NOT EXISTS idx_coverage_vendor ON vendor_biomarker_coverage(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coverage_biomarker ON vendor_biomarker_coverage(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_coverage_status ON vendor_biomarker_coverage(status);
