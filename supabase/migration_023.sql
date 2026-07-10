-- Migration 023: public read policies for migration_022's tables
-- Matches the existing "Public read <table>" pattern used across all other tables.

CREATE POLICY "Public read vendor_test_products" ON vendor_test_products FOR SELECT USING (true);
CREATE POLICY "Public read vendor_test_product_markers" ON vendor_test_product_markers FOR SELECT USING (true);
