-- migration_017.sql
-- Add 'neutral' to sentiment check constraints
-- Apply in Supabase SQL Editor

ALTER TABLE vendor_sentiment_log
  DROP CONSTRAINT IF EXISTS vendor_sentiment_log_sentiment_check;

ALTER TABLE vendor_sentiment_log
  ADD CONSTRAINT vendor_sentiment_log_sentiment_check
  CHECK (sentiment IN ('positive', 'neutral', 'mixed', 'negative', 'insufficient_data'));
