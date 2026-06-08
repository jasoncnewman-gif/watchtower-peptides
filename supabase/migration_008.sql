-- migration_008.sql
-- Adds price_per_mg to vendor_peptides and creates peptide_market_prices table.
-- Run in Supabase SQL Editor.

-- Per-product price per mg (populated by compute-prices.ts)
ALTER TABLE vendor_peptides
  ADD COLUMN IF NOT EXISTS price_per_mg numeric(10, 4);

CREATE INDEX IF NOT EXISTS idx_vendor_peptides_ppm ON vendor_peptides(price_per_mg)
  WHERE price_per_mg IS NOT NULL;

-- Market-wide average, min, max price per mg per peptide
-- Populated by compute-prices.ts; used by compute-scores.ts for CX sub-score
CREATE TABLE IF NOT EXISTS peptide_market_prices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_key      text UNIQUE NOT NULL,  -- normalized name used for grouping
  display_name     text NOT NULL,         -- most common raw name in the data
  avg_price_per_mg numeric(10, 4) NOT NULL,
  min_price_per_mg numeric(10, 4) NOT NULL,
  max_price_per_mg numeric(10, 4) NOT NULL,
  vendor_count     integer NOT NULL,      -- number of active vendors selling it
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE peptide_market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read peptide_market_prices"
  ON peptide_market_prices FOR SELECT USING (true);
