/**
 * scripts/verify-domains.ts
 * Sets verified_domain = true for vendors whose domain has been confirmed legitimate.
 *
 * Verification criteria used:
 *   - Vendor is listed on Finnrick (independent lab review requires real vendor identity)
 *   - OR domain was manually confirmed in this session
 *
 * Run AFTER: ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verified_domain boolean DEFAULT false;
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/verify-domains.ts
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "verify-domains";

// Vendors confirmed legitimate — Finnrick-listed or manually verified URL
const VERIFIED_SLUGS = [
  // Manually confirmed URLs this session
  "peptide-partners",       // peptide.partners — user confirmed
  "verified-peptides",      // verifiedpeptides.com — WooCommerce API confirmed
  "aavant-research",        // aavantacr.com — user confirmed

  // Finnrick-listed (Finnrick only reviews real vendors with real lab data)
  "nexaph",
  "orbitrex-peptides",
  "swiss-chems",
  "pure-rawz",
  "peptide-crafters",
  "loti-labs",
  "polaris-peptides",
  "ez-peptides",
  "skye-peptides",
  "bulk-peptide-supply",
  "astro-peptides",
  "paramount-peptides",
  "nuscience-peptides",
  "simple-peptide",
  "nextechlabs",

  // Flagged/closed but Finnrick-verified (still legitimate companies, just not recommended)
  "amino-asylum",
  "paradigm-peptides",
  "peptide-sciences",
  "science-bio",
  "prime-peptides",
];

async function main() {
  log(SCRIPT, `Marking ${VERIFIED_SLUGS.length} vendors as verified_domain = true…`);

  const { error } = await db
    .from("vendors")
    .update({ verified_domain: true })
    .in("slug", VERIFIED_SLUGS);

  if (error) {
    log(SCRIPT, `✗ Failed: ${error.message}`);
    process.exit(1);
  }

  log(SCRIPT, `✓ Done — ${VERIFIED_SLUGS.length} vendors marked as verified`);
}

main();
