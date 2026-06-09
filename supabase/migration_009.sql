-- migration_009.sql
-- Adds header_photo to vendors table for per-vendor banner images.
-- Once applied, update VENDOR_PHOTOS in app/vendors/[slug]/page.tsx
-- to read from the DB column instead of the hardcoded map.

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS header_photo text;
