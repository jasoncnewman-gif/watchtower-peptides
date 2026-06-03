-- ============================================================
-- Watchtower Peptides — Migration 003
-- Run this in the Supabase SQL Editor (project: kirlzgiwyzwwkfxtpygg)
-- Safe to re-run: uses IF NOT EXISTS guards
-- ============================================================


-- ── 1. peptides: blend component data ────────────────────────
-- blend_components: array of { name, slug, dose_mg, contribution }
--   name         — display name of the ingredient (e.g. "BPC-157")
--   slug         — peptide slug for internal linking (e.g. "bpc-157")
--   dose_mg      — dose per vial in mg (null if variable/unknown)
--   contribution — one-line description of what this ingredient contributes
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS blend_components jsonb DEFAULT '[]'::jsonb;


-- ── 2. GIN index for JSONB queries ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_peptides_blend_components ON peptides USING GIN (blend_components);
