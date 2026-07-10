-- Migration 020: Public read policies for the 6 tables created in migration_019.
-- migration_019 enabled RLS with no policies, which locks all 6 tables to service-role
-- only. These are all public-facing (the /blood-tests page), so each gets the same
-- "Public read" SELECT policy used everywhere else in this project (see schema.sql).
-- No write policies -- inserts/updates stay service-role-only, matching every other
-- public table in this database.

CREATE POLICY "Public read biomarkers"
  ON biomarkers FOR SELECT USING (true);

CREATE POLICY "Public read peptide_biomarkers"
  ON peptide_biomarkers FOR SELECT USING (true);

CREATE POLICY "Public read peptide_blend_components"
  ON peptide_blend_components FOR SELECT USING (true);

CREATE POLICY "Public read lab_vendors"
  ON lab_vendors FOR SELECT USING (true);

CREATE POLICY "Public read vendor_tiers"
  ON vendor_tiers FOR SELECT USING (true);

CREATE POLICY "Public read vendor_biomarker_coverage"
  ON vendor_biomarker_coverage FOR SELECT USING (true);
