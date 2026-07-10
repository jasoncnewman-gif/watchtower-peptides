-- Migration 021: Phase 3 RPC functions for /blood-tests
-- get_protocol_biomarkers: peptide slugs -> ranked biomarker monitoring list
-- get_vendor_coverage: biomarker ids + budget -> ranked vendor coverage
--
-- Two corrections vs. the original 8-phase spec draft, both flagged in the earlier review:
--   1. get_protocol_biomarkers no longer hardcodes "universal Tier 1 safety markers" by name.
--      It derives them dynamically from biomarkers.tier = 1. The original hardcoded list
--      predates two of those markers (Fasting Glucose, Lipid Panel) existing as real rows --
--      they were only added to the schema this session, so the dynamic version is now both
--      more correct and simpler.
--   2. get_vendor_coverage's return column list no longer has true_annual_cost_cents twice
--      (a literal duplicate in the original spec).
--
-- Design note: blend peptides (glow-blend, klow-blend, etc.) do NOT need blend-expansion
-- logic in get_protocol_biomarkers. Their peptide_biomarkers rows were pre-computed as the
-- union of their components' own tiers during Phase 1 seeding, so querying a blend's
-- peptide_id directly already returns the correct combined biomarker set. The original
-- spec assumed blends would stay unresolved and need runtime expansion via
-- peptide_blend_components -- that assumption no longer holds now that all 7 blends are
-- resolved and seeded directly.
--
-- Known gap carried into this migration, not fixed here: get_vendor_coverage's
-- ala_carte_options.addon_cost_cents will often be NULL for à la carte vendors (Goodlabs,
-- Marek Diagnostics). Their per-item prices exist in vendor_biomarker_coverage.notes as
-- free text (e.g. "à la carte/$27") but were never parsed into the structured
-- tier_price_cents/addon_cost_cents columns during seeding -- the price-extraction regex
-- didn't match "à la carte" (non-ASCII "à") or price-only annotations without a tier name.
-- vendor_name and biomarker_name will still populate correctly; only the dollar figure is
-- missing for those two vendors. Worth a follow-up backfill pass if exact à la carte
-- pricing matters for the UI.

CREATE OR REPLACE FUNCTION get_protocol_biomarkers(peptide_slugs TEXT[])
RETURNS TABLE (
  biomarker_id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  tier INTEGER,
  monitoring_tier TEXT,
  appearance_count INTEGER,
  combined_priority INTEGER,
  peptides_requiring TEXT[],
  clinical_notes TEXT[],
  peptide_relevance_rank INTEGER
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH selected_peptides AS (
    SELECT p.id, p.name
    FROM peptides p
    WHERE p.slug = ANY(peptide_slugs)
  ),
  selected_markers AS (
    SELECT
      pb.biomarker_id,
      pb.priority,
      pb.clinical_note,
      sp.name AS peptide_name,
      CASE pb.monitoring_tier WHEN 'safety' THEN 1 WHEN 'efficacy' THEN 2 ELSE 3 END AS tier_rank
    FROM peptide_biomarkers pb
    JOIN selected_peptides sp ON sp.id = pb.peptide_id
  ),
  aggregated AS (
    SELECT
      sm.biomarker_id,
      COUNT(DISTINCT sm.peptide_name)::INTEGER AS appearance_count,
      MIN(sm.priority) AS combined_priority,
      MIN(sm.tier_rank) AS tier_rank,
      ARRAY_AGG(DISTINCT sm.peptide_name) AS peptides_requiring,
      ARRAY_AGG(DISTINCT sm.clinical_note) FILTER (WHERE sm.clinical_note IS NOT NULL) AS clinical_notes
    FROM selected_markers sm
    GROUP BY sm.biomarker_id
  ),
  -- universal Tier 1 safety markers, always included regardless of peptide selection
  universal_safety AS (
    SELECT b.id AS biomarker_id FROM biomarkers b WHERE b.tier = 1
  ),
  combined AS (
    SELECT
      COALESCE(a.biomarker_id, u.biomarker_id) AS biomarker_id,
      COALESCE(a.appearance_count, 0) AS appearance_count,
      COALESCE(a.combined_priority, 5) AS combined_priority,
      -- a universal marker always sorts as safety-tier, even if some selected peptide's
      -- own pairing calls it efficacy/advanced for that specific peptide
      CASE WHEN u.biomarker_id IS NOT NULL THEN 1 ELSE a.tier_rank END AS tier_rank,
      COALESCE(a.peptides_requiring, ARRAY[]::TEXT[]) AS peptides_requiring,
      COALESCE(a.clinical_notes, ARRAY[]::TEXT[]) AS clinical_notes
    FROM aggregated a
    FULL OUTER JOIN universal_safety u ON u.biomarker_id = a.biomarker_id
  )
  SELECT
    b.id AS biomarker_id,
    b.name,
    b.slug,
    b.category,
    b.tier,
    CASE c.tier_rank WHEN 1 THEN 'safety' WHEN 2 THEN 'efficacy' ELSE 'advanced' END AS monitoring_tier,
    c.appearance_count,
    c.combined_priority,
    c.peptides_requiring,
    c.clinical_notes,
    b.peptide_relevance_rank
  FROM combined c
  JOIN biomarkers b ON b.id = c.biomarker_id
  ORDER BY c.tier_rank ASC, c.appearance_count DESC, c.combined_priority ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_protocol_biomarkers(TEXT[]) TO anon, authenticated;


CREATE OR REPLACE FUNCTION get_vendor_coverage(
  biomarker_ids UUID[],
  budget_tier TEXT DEFAULT 'any'
)
RETURNS TABLE (
  vendor_id UUID,
  name TEXT,
  slug TEXT,
  section TEXT,
  business_model TEXT,
  entry_price_cents INTEGER,
  true_annual_cost_cents INTEGER,
  collection_method TEXT,
  clia_certified BOOLEAN,
  peptide_rx_offered BOOLEAN,
  audience_fit_score INTEGER,
  markers_covered INTEGER,
  safety_markers_covered INTEGER,
  efficacy_markers_covered INTEGER,
  coverage_pct NUMERIC,
  weighted_score NUMERIC,
  missing_markers TEXT[],
  ala_carte_options JSONB,
  over_budget BOOLEAN,
  affiliate_url TEXT,
  affiliate_program BOOLEAN
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  budget_ceiling INTEGER := CASE budget_tier
    WHEN 'low' THEN 20000    -- under $200/yr
    WHEN 'mid' THEN 50000    -- $200-$500/yr
    ELSE 999999              -- 'high' or 'any' -- no real cap
  END;
BEGIN
  RETURN QUERY
  WITH target_markers AS (
    SELECT b.id, b.name, b.tier FROM biomarkers b WHERE b.id = ANY(biomarker_ids)
  ),
  -- one row per (vendor, target marker): covered-in-budget or not, and why
  per_marker AS (
    SELECT
      lv.id AS v_id,
      tm.id AS marker_id,
      tm.name AS marker_name,
      tm.tier AS marker_tier,
      (
        vbc.status = 'included'
        AND (vbc.tier_price_cents IS NULL OR vbc.tier_price_cents <= budget_ceiling)
      ) AS is_covered
    FROM lab_vendors lv
    CROSS JOIN target_markers tm
    LEFT JOIN vendor_biomarker_coverage vbc
      ON vbc.vendor_id = lv.id AND vbc.biomarker_id = tm.id
    WHERE lv.eligibility != 'EXCLUDE'
  ),
  vendor_agg AS (
    SELECT
      v_id,
      COUNT(*) FILTER (WHERE is_covered) AS covered,
      COUNT(*) FILTER (WHERE is_covered AND marker_tier = 1) AS safety_covered,
      COUNT(*) FILTER (WHERE is_covered AND marker_tier = 2) AS efficacy_covered,
      ARRAY_AGG(marker_name) FILTER (WHERE NOT is_covered) AS missing_names,
      ARRAY_AGG(marker_id) FILTER (WHERE NOT is_covered) AS missing_ids
    FROM per_marker
    GROUP BY v_id
  ),
  -- for each vendor's missing markers, find the cheapest à la carte / addon alternative
  -- at any OTHER non-excluded vendor
  ala_carte_agg AS (
    SELECT
      va.v_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'vendor_name', alt.vendor_name,
          'biomarker_name', alt.biomarker_name,
          'addon_cost_cents', alt.addon_cost_cents
        )
      ) AS options
    FROM vendor_agg va
    CROSS JOIN LATERAL UNNEST(va.missing_ids) AS missing_id
    JOIN LATERAL (
      SELECT alt_lv.name AS vendor_name, b.name AS biomarker_name, vbc.addon_cost_cents
      FROM vendor_biomarker_coverage vbc
      JOIN lab_vendors alt_lv ON alt_lv.id = vbc.vendor_id
      JOIN biomarkers b ON b.id = vbc.biomarker_id
      WHERE vbc.biomarker_id = missing_id
        AND alt_lv.eligibility != 'EXCLUDE'
        AND (
          vbc.status = 'addon'
          OR (vbc.status = 'included' AND alt_lv.section = 'build-your-own')
        )
      ORDER BY vbc.addon_cost_cents NULLS LAST
      LIMIT 1
    ) AS alt ON true
    GROUP BY va.v_id
  )
  SELECT
    lv.id AS vendor_id,
    lv.name,
    lv.slug,
    lv.section,
    lv.business_model,
    lv.entry_price_cents,
    lv.true_annual_cost_cents,
    lv.collection_method,
    lv.clia_certified,
    lv.peptide_rx_offered,
    lv.audience_fit_score,
    va.covered::INTEGER AS markers_covered,
    va.safety_covered::INTEGER AS safety_markers_covered,
    va.efficacy_covered::INTEGER AS efficacy_markers_covered,
    ROUND(100.0 * va.covered / NULLIF(array_length(biomarker_ids, 1), 0), 1) AS coverage_pct,
    (va.safety_covered * 1.5 + va.efficacy_covered * 1.0) AS weighted_score,
    COALESCE(va.missing_names, ARRAY[]::TEXT[]) AS missing_markers,
    COALESCE(ac.options, '[]'::JSONB) AS ala_carte_options,
    (lv.true_annual_cost_cents IS NOT NULL AND lv.true_annual_cost_cents > budget_ceiling) AS over_budget,
    lv.affiliate_url,
    lv.affiliate_program
  FROM lab_vendors lv
  JOIN vendor_agg va ON va.v_id = lv.id
  LEFT JOIN ala_carte_agg ac ON ac.v_id = lv.id
  WHERE lv.eligibility != 'EXCLUDE'
  ORDER BY weighted_score DESC, coverage_pct DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_vendor_coverage(UUID[], TEXT) TO anon, authenticated;
