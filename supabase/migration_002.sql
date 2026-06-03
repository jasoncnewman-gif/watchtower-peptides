-- ============================================================
-- Watchtower Peptides — Migration 002
-- Run this in the Supabase SQL Editor (project: kirlzgiwyzwwkfxtpygg)
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards
-- ============================================================


-- ── 1. peptides: display & identity fields ───────────────────
-- full_name: spelled-out name (e.g. "Body Protection Compound-157")
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS full_name              text;

-- tagline: one-line summary shown on cards and page headers
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS tagline                text;

-- research_status: top-level research maturity label
--   suggested values: 'Strong', 'Moderate', 'Early', 'Limited'
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS research_status        text;

-- overview: long-form introductory text (replaces/supplements description)
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS overview               text;


-- ── 2. peptides: pharmacology fields ─────────────────────────
-- half_life: human-readable (e.g. "4–6 hours", "~24 hours")
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS half_life              text;

-- molecular_weight: human-readable (e.g. "1419.53 g/mol")
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS molecular_weight       text;

-- sequence: single-letter amino acid sequence string
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS sequence               text;


-- ── 3. peptides: structured profile data (JSONB) ─────────────

-- mechanism: array of { title: string, body: string }
--   each entry describes one mechanism of action
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS mechanism              jsonb DEFAULT '[]'::jsonb;

-- research_applications: array of { area: string, evidence: string, description: string }
--   evidence values: 'Strong' | 'Moderate' | 'Early' | 'Human' | 'Animal'
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS research_applications  jsonb DEFAULT '[]'::jsonb;

-- dosage: { disclaimer: string, ranges: [{ route, range, frequency, notes }] }
--   route examples: 'Subcutaneous', 'Intramuscular', 'Oral', 'Intranasal'
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS dosage                 jsonb DEFAULT '{}'::jsonb;

-- safety_profile: { rating: string, known_effects: string[], unknown_risks: string[] }
--   rating examples: 'Generally Well Tolerated', 'Moderate Caution', 'High Caution'
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS safety_profile         jsonb DEFAULT '{}'::jsonb;

-- studies: array of { title, authors, year, journal, pmid, url }
--   replaces the flat research_links text[] array going forward;
--   research_links is kept for backward compatibility
ALTER TABLE peptides ADD COLUMN IF NOT EXISTS studies                jsonb DEFAULT '[]'::jsonb;


-- ── 4. GIN indexes for JSONB columns ─────────────────────────
-- Enables fast containment queries (@>, ?) on these arrays
CREATE INDEX IF NOT EXISTS idx_peptides_mechanism     ON peptides USING GIN (mechanism);
CREATE INDEX IF NOT EXISTS idx_peptides_applications  ON peptides USING GIN (research_applications);
CREATE INDEX IF NOT EXISTS idx_peptides_studies       ON peptides USING GIN (studies);
