-- migration_013.sql
-- Add login_phone to vendors for account registrations that require phone
-- Apply in Supabase SQL Editor

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS login_phone text;
