-- ============================================================
-- Watchtower Peptides — Migration 005
-- Run this in the Supabase SQL Editor (project: kirlzgiwyzwwkfxtpygg)
-- Safe to re-run: uses IF NOT EXISTS guards
-- ============================================================

-- Gated vendor login credentials (stored per-vendor so scrapers can look them up)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS login_username  text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS login_email     text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS login_password  text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS login_path      text;        -- e.g. "/my-account/"
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS catalog_paths   text[];      -- e.g. ARRAY['/shop/', '/peptides/']
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS login_platform  text;        -- "woocommerce" | "shopify" | "custom"

-- COA page URL (centralises config that was previously only in scrape-vendor-coas.ts)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS coa_url         text;
