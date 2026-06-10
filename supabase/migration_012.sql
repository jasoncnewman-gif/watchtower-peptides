-- migration_012.sql
-- Add plain_english column to peptides table
-- A 2–3 sentence jargon-free description shown first in the Overview tab
-- Apply in Supabase SQL Editor

ALTER TABLE peptides
  ADD COLUMN IF NOT EXISTS plain_english text DEFAULT NULL;
