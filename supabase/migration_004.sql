-- ============================================================
-- Watchtower Peptides — Migration 004
-- Run this in the Supabase SQL Editor (project: kirlzgiwyzwwkfxtpygg)
-- Safe to re-run: uses IF NOT EXISTS guards
-- ============================================================

-- Flat shipping fee (null = unknown/variable, 0 = free)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_flat_fee numeric(6,2);
