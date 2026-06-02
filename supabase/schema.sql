-- ============================================================
-- Watchtower Peptides — Full Reference Schema (post-migration-001)
-- This file reflects the complete intended schema.
-- To apply to an existing DB, run migration_001.sql instead.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── vendors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  -- identity
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        text NOT NULL,
  slug                        text UNIQUE,
  website                     text,

  -- scoring (0–100 total; sub-scores sum to 100)
  overall_score               numeric(5,1),
  lab_testing_score           numeric(5,1),   -- max 30
  purity_accuracy_score       numeric(5,1),   -- max 25
  transparency_score          numeric(5,1),   -- max 20
  community_reputation_score  numeric(5,1),   -- max 15
  pricing_reliability_score   numeric(5,1),   -- max 10

  -- status & verdict
  status                      text DEFAULT 'active'
                                CHECK (status IN ('active','inactive','closed','flagged')),
  verdict                     text,
  last_reviewed               timestamptz,

  -- third-party ratings
  finnrick_rating             text,
  finnrick_score              numeric(4,2),
  finnrick_tests_count        integer,
  finnrick_url                text,
  peptide_critic_rating       numeric(3,2),
  peptide_critic_reviews_count integer,
  peptide_critic_url          text,

  -- location
  country                     text DEFAULT 'US',
  state                       text,
  city                        text,
  location                    text,           -- legacy display field

  -- shipping & payment
  shipping_free_threshold     numeric(6,2),
  ships_internationally       boolean DEFAULT false,
  credit_card_accepted        boolean DEFAULT false,
  crypto_accepted             boolean DEFAULT false,
  paypal_accepted             boolean DEFAULT false,

  -- product details
  average_price_per_unit      numeric(8,2),
  total_products              integer,
  specialization              text[],         -- e.g. '{peptides,sarms}'
  formats_available           text[],         -- e.g. '{lyophilized,capsule,nasal}'

  -- compliance & gating
  has_coa                     boolean DEFAULT false,
  is_gated                    boolean DEFAULT false,
  gated_notes                 text,
  fda_warning                 boolean DEFAULT false,
  fda_warning_date            date,
  fda_notes                   text,

  -- community & reviews
  reddit_sentiment            text,           -- 'positive','mixed','negative'
  positive_review_summary     text,
  negative_review_summary     text,
  review_1                    text,
  review_2                    text,
  review_3                    text,
  coupon_code                 text,

  -- meta
  established_year            integer,
  notes                       text,
  date_added                  timestamptz DEFAULT now(),
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);


-- ── peptides ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS peptides (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  slug                        text UNIQUE NOT NULL,
  aliases                     text[],
  description                 text,
  what_it_does                text,
  fda_status                  text CHECK (fda_status IN ('approved','not-approved','research-only')),
  typical_dosage              text,
  reconstitution_instructions text,
  research_links              text[],
  category                    text,           -- 'healing','weight-loss','performance','sexual-health'
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);


-- ── vendor_peptides ───────────────────────────────────────────
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


-- ── lab_tests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_tests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       uuid REFERENCES vendors(id) ON DELETE CASCADE,
  peptide_name    text,
  lab_name        text,
  test_type       text,           -- 'HPLC','LC-MS','NMR','GC-MS','Endotoxin'
  purity_result   numeric(5,2),   -- percentage
  batch_number    text,
  test_date       date,
  verified        boolean DEFAULT false,
  janoshik_tested boolean DEFAULT false,
  coa_url         text,
  created_at      timestamptz DEFAULT now()
);


-- ── ads ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   uuid REFERENCES vendors(id) ON DELETE CASCADE,
  ad_text     text,
  platform    text,               -- 'Facebook','Instagram','Google','Reddit'
  first_seen  date,
  last_seen   date,
  red_flags   text[],
  created_at  timestamptz DEFAULT now()
);


-- ── alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id     uuid REFERENCES vendors(id) ON DELETE CASCADE,
  alert_type    text,             -- 'failed_test','scam_report','closed','fda_warning'
  message       text,
  created_date  timestamptz DEFAULT now(),
  resolved      boolean DEFAULT false,
  resolved_date timestamptz
);


-- ── score_history ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS score_history (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       uuid REFERENCES vendors(id) ON DELETE CASCADE,
  previous_score  numeric(5,1),
  new_score       numeric(5,1),
  reason          text,
  changed_date    timestamptz DEFAULT now()
);


-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE OR REPLACE TRIGGER peptides_updated_at
  BEFORE UPDATE ON peptides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE OR REPLACE TRIGGER vendor_peptides_updated_at
  BEFORE UPDATE ON vendor_peptides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


-- ── Indexes ───────────────────────────────────────────────────
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


-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE vendors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE peptides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_peptides ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read vendors"         ON vendors         FOR SELECT USING (true);
CREATE POLICY "Public read peptides"        ON peptides        FOR SELECT USING (true);
CREATE POLICY "Public read vendor_peptides" ON vendor_peptides FOR SELECT USING (true);
CREATE POLICY "Public read lab_tests"       ON lab_tests       FOR SELECT USING (true);
CREATE POLICY "Public read ads"             ON ads             FOR SELECT USING (true);
CREATE POLICY "Public read score_history"   ON score_history   FOR SELECT USING (true);
CREATE POLICY "Public read alerts"          ON alerts          FOR SELECT USING (true);
