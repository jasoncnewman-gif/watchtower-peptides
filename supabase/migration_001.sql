-- ============================================================
-- Watchtower Peptides — Migration 001
-- Run this in the Supabase SQL Editor (project: kirlzgiwyzwwkfxtpygg)
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards
-- ============================================================


-- ── 1. vendors: widen overall_score to 0–100 scale ───────────
ALTER TABLE vendors
  ALTER COLUMN overall_score TYPE numeric(5,1);


-- ── 2. vendors: identity & scoring ───────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug                        text UNIQUE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verdict                     text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_reviewed               timestamptz;

-- Sub-scores (out of 30 / 25 / 20 / 15 / 10 — totalling 100)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lab_testing_score           numeric(5,1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS purity_accuracy_score       numeric(5,1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS transparency_score          numeric(5,1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS community_reputation_score  numeric(5,1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pricing_reliability_score   numeric(5,1);


-- ── 3. vendors: third-party ratings ──────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_rating             text;          -- e.g. 'A', 'B-', 'C'
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_score              numeric(4,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_tests_count        integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS finnrick_url                text;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS peptide_critic_rating       numeric(3,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS peptide_critic_reviews_count integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS peptide_critic_url          text;


-- ── 4. vendors: business details ─────────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS established_year            integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country                     text DEFAULT 'US';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state                       text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city                        text;


-- ── 5. vendors: shipping & payment ───────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_free_threshold     numeric(6,2);   -- e.g. 150.00
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ships_internationally       boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS credit_card_accepted        boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS crypto_accepted             boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS paypal_accepted             boolean DEFAULT false;


-- ── 6. vendors: product details ──────────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS average_price_per_unit      numeric(8,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_products              integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS specialization              text[];         -- e.g. '{peptides,sarms}'
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS formats_available           text[];         -- e.g. '{lyophilized,capsule}'


-- ── 7. vendors: compliance & gating ──────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_gated                    boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gated_notes                 text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fda_warning                 boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fda_warning_date            date;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fda_notes                   text;


-- ── 8. vendors: community & reviews ──────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reddit_sentiment            text;           -- 'positive','mixed','negative'
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS positive_review_summary     text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS negative_review_summary     text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_1                    text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_2                    text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_3                    text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS coupon_code                 text;


-- ── 9. lab_tests: add missing columns ────────────────────────
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS coa_url          text;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS peptide_name     text;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS batch_number     text;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS janoshik_tested  boolean DEFAULT false;


-- ── 10. peptides table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS peptides (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  slug                        text UNIQUE NOT NULL,
  aliases                     text[],
  description                 text,
  what_it_does                text,
  fda_status                  text CHECK (fda_status IN ('approved', 'not-approved', 'research-only')),
  typical_dosage              text,
  reconstitution_instructions text,
  research_links              text[],
  category                    text,           -- e.g. 'healing','weight-loss','performance','sexual-health'
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);


-- ── 11. vendor_peptides junction table ───────────────────────
CREATE TABLE IF NOT EXISTS vendor_peptides (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid REFERENCES vendors(id) ON DELETE CASCADE,
  peptide_name          text NOT NULL,
  size_mg               numeric(8,2),
  list_price            numeric(8,2),
  sale_price            numeric(8,2),
  bulk_discount_details text,
  in_stock              boolean DEFAULT true,
  coa_available         boolean DEFAULT false,
  coa_url               text,
  last_checked          timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);


-- ── 12. updated_at triggers for new tables ───────────────────
-- Re-uses the update_updated_at() function already created in the initial schema

CREATE OR REPLACE TRIGGER peptides_updated_at
  BEFORE UPDATE ON peptides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE OR REPLACE TRIGGER vendor_peptides_updated_at
  BEFORE UPDATE ON vendor_peptides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


-- ── 13. RLS for new tables ────────────────────────────────────
ALTER TABLE peptides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_peptides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'peptides' AND policyname = 'Public read peptides'
  ) THEN
    CREATE POLICY "Public read peptides" ON peptides FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_peptides' AND policyname = 'Public read vendor_peptides'
  ) THEN
    CREATE POLICY "Public read vendor_peptides" ON vendor_peptides FOR SELECT USING (true);
  END IF;
END $$;


-- ── 14. Useful indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendors_slug         ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status       ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_score        ON vendors(overall_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_lab_tests_vendor     ON lab_tests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_peptide    ON lab_tests(peptide_name);
CREATE INDEX IF NOT EXISTS idx_alerts_vendor        ON alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved      ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_peptides_slug        ON peptides(slug);
CREATE INDEX IF NOT EXISTS idx_vendor_peptides_vid  ON vendor_peptides(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_peptides_name ON vendor_peptides(peptide_name);
