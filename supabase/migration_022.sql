-- Migration 022: vendor test products + product-marker junction
--
-- Why this exists: vendor_biomarker_coverage models each (vendor, marker) pair in
-- isolation -- one status, one price. That can't represent a real vendor catalog
-- where markers only come together as purchasable bundles (Goodlabs' "Comprehensive
-- Men's" panel is $195 for a fixed set of 76 markers; you cannot buy 3 of those 76
-- markers at the panel's per-marker rate). This adds a proper products model:
-- one row per purchasable product (panel or a la carte item), and a junction table
-- mapping each product to the markers it actually contains -- both our tracked
-- biomarkers and, for full fidelity, markers we don't track (biomarker_id NULL).
--
-- This is additive. vendor_biomarker_coverage is untouched and keeps powering the
-- existing cross-vendor Protocol Builder ranking for vendors not yet rebuilt on
-- this model. Goodlabs is the first vendor being migrated to it.

CREATE TABLE vendor_test_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES lab_vendors(id) ON DELETE CASCADE,
  vendor_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('panel', 'ala-carte')),
  price_cents INTEGER NOT NULL,
  raw_marker_count INTEGER NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, vendor_slug)
);

CREATE TABLE vendor_test_product_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES vendor_test_products(id) ON DELETE CASCADE,
  raw_marker_name TEXT NOT NULL,
  biomarker_id UUID REFERENCES biomarkers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vtpm_product ON vendor_test_product_markers(product_id);
CREATE INDEX idx_vtpm_biomarker ON vendor_test_product_markers(biomarker_id) WHERE biomarker_id IS NOT NULL;
CREATE INDEX idx_vtp_vendor ON vendor_test_products(vendor_id);

ALTER TABLE vendor_test_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_test_product_markers ENABLE ROW LEVEL SECURITY;
