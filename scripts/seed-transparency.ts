/**
 * scripts/seed-transparency.ts
 * Seeds vendor_transparency rows for all non-closed vendors.
 * Auto-populates: fda_warning, fraud_flags, domain_years.
 * All boolean research fields default false — fill them in via Supabase Table Editor.
 *
 * Safe to re-run: uses UPSERT (on_conflict vendor_id) so existing manual edits are preserved.
 *
 * Run: npm run seed:transparency
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-transparency";
const CURRENT_YEAR = new Date().getFullYear();

async function main() {
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, slug, name, fda_warning, established_year, status")
    .neq("status", "closed")
    .order("name");

  if (error) {
    log(SCRIPT, `DB error: ${error.message}`);
    process.exit(1);
  }

  if (!vendors || vendors.length === 0) {
    log(SCRIPT, "No vendors found.");
    process.exit(0);
  }

  log(SCRIPT, `Seeding ${vendors.length} vendor transparency rows…`);

  const rows = vendors.map((v) => ({
    vendor_id: v.id,
    fda_warning: v.fda_warning ?? false,
    fraud_flags: v.status === "flagged",
    domain_years:
      v.established_year ? CURRENT_YEAR - v.established_year : null,
    updated_at: new Date().toISOString(),
  }));

  // UPSERT: insert new rows, update auto-populated fields on conflict
  // Preserves manually set boolean fields (has_contact_info etc.)
  const { error: upsertError } = await db
    .from("vendor_transparency")
    .upsert(rows, {
      onConflict: "vendor_id",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    log(SCRIPT, `Upsert error: ${upsertError.message}`);
    process.exit(1);
  }

  log(SCRIPT, `Done. ${rows.length} rows upserted.`);
  log(SCRIPT, "");
  log(SCRIPT, "Next step: open Supabase Table Editor → vendor_transparency");
  log(SCRIPT, "Research each vendor and check the manual fields:");
  log(SCRIPT, "  has_contact_info, has_business_address, has_ownership_disclosure,");
  log(SCRIPT, "  has_lab_disclosure, has_testing_methodology, has_batch_numbers");
}

main();
