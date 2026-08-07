-- CORRECTED from the original 8-phase spec's Table 1.
-- Change: category CHECK constraint expanded from 11 to 13 values.
-- Reason: the watchtower_biomarker_audit.xlsx normalization pass surfaced 44 markers
-- with no clean home in the original enum -- specifically Sodium/Osmolality (electrolyte/
-- fluid-balance) and Ferritin/Fibrinogen/ESR/Immunoglobulins/Lymphocyte Subsets (hematology-
-- adjacent, not cleanly "immune" or "inflammation"). Forcing these into existing categories
-- would misclassify them for any future category-based filtering UI.

CREATE TABLE IF NOT EXISTS biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'liver', 'kidney', 'metabolic', 'hormones', 'inflammation', 'immune',
    'cardiac', 'neurological', 'copper-status', 'thyroid', 'longevity',
    'hematology', 'electrolyte'          -- ADDED
  )),
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  peptide_relevance_rank INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biomarkers_tier ON biomarkers(tier);
CREATE INDEX idx_biomarkers_category ON biomarkers(category);

-- No other tables in the original 6-table Phase 1 schema need structural changes.
-- peptide_biomarkers, peptide_blend_components, lab_vendors, vendor_tiers, and
-- vendor_biomarker_coverage are unchanged from the original spec.
