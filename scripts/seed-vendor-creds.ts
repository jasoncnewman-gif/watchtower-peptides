/**
 * scripts/seed-vendor-creds.ts
 * Populates login credentials, catalog paths, and COA URLs in the vendors table.
 * Safe to re-run — uses upsert-style updates (only sets non-null values).
 *
 * Run: npm run seed:creds
 *
 * NOTE: requires migration_005.sql to have been applied first.
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-creds";

type VendorCreds = {
  slug: string;
  login_username?: string;
  login_email?: string;
  login_password?: string;
  login_path?: string;           // path to login page, e.g. "/my-account/"
  catalog_paths?: string[];      // paths to try for product catalog
  login_platform?: string;       // "woocommerce" | "shopify" | "custom"
  coa_url?: string;
};

// ── Credential registry ───────────────────────────────────────────────────
// All gated vendors that require login for scraping, plus COA URLs for all vendors.
// Credentials are the shared Watchtower Peptides account used for research access.

const VENDOR_DATA: VendorCreds[] = [
  // ── Gated vendors (login required) ───────────────────────────────────────
  {
    slug: "felix-chemical-supply",
    login_username: "watchtower",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/my-account/",
    catalog_paths: ["/felix-chemical-supply/shop/", "/shop/", "/products/"],
    login_platform: "woocommerce",
    coa_url: "https://felixchem.is/felix-chemical-supply/coas/",
  },
  {
    slug: "loti-labs",
    login_username: "watchtower",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/my-account/",
    catalog_paths: ["/peptides/", "/catalog/", "/capsules/"],
    login_platform: "woocommerce",
    coa_url: "https://lotilabs.com/coas-updated/",
  },
  {
    slug: "mile-high-compounds",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/my-account/",
    catalog_paths: ["/shop/", "/products/", "/peptides/"],
    login_platform: "woocommerce",
    coa_url: "https://milehighcompounds.is/pages/coa",
  },
  {
    slug: "omegamino",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/my-account/",
    catalog_paths: ["/shop/", "/products/", "/peptides/"],
    login_platform: "woocommerce",
    coa_url: "https://omegamino.net/pages/coa",
  },
  {
    slug: "ascension-peptides",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/login/",
    catalog_paths: ["/collections/all", "/shop/", "/products/"],
    login_platform: "woocommerce",
    coa_url: "https://ascensionpeptides.com/certificates-of-analysis/",
  },
  {
    slug: "ion-peptide",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/my-account/",
    catalog_paths: ["/shop/", "/products/", "/collections/all"],
    login_platform: "custom",
    coa_url: "https://ionpeptide.com/lab-results/",
  },
  {
    slug: "peptidology",
    login_email: "info@watchtowerpeptides.com",
    login_password: "jikHip-6dewje-xytgih",
    login_path: "/login/",
    catalog_paths: ["/products/", "/shop/", "/collections/all"],
    login_platform: "custom",
    coa_url: "https://peptidology.co/certificates/",
  },

  // ── COA URLs for non-gated vendors (no login needed) ─────────────────────
  { slug: "peptide-partners",       coa_url: "https://peptidepartners.com/pages/lab-results" },
  { slug: "core-peptides",          coa_url: "https://www.corepeptides.com/coas/" },
  { slug: "limitless-biotech",      coa_url: "https://limitlessbiotech.us/pages/lab-testing" },
  { slug: "nexaph",                 coa_url: "https://nexaph.coa.swiftcs.ai/" },
  { slug: "crush-research",         coa_url: "https://crushresearch.shop/testing" },
  { slug: "orbitrex-peptides",      coa_url: "https://orbitrexpeptide.is/coas/" },
  { slug: "swiss-chems",            coa_url: "https://swisschems.is/pages/certificates" },
  { slug: "pure-rawz",              coa_url: "https://purerawz.co/pages/coa" },
  { slug: "biotech-peptides",       coa_url: "https://biotechpeptides.com/coas/" },
  { slug: "sports-technology-labs", coa_url: "https://sportstechnologylabs.com/coas/" },
  { slug: "polaris-peptides",       coa_url: "https://polarispeptides.com/pages/coa" },
  { slug: "pivot-labs",             coa_url: "https://pivotlabs.com/pages/testing" },
  { slug: "ez-peptides",            coa_url: "https://ezpeptides.com/coa/" },
  { slug: "skye-peptides",          coa_url: "https://skyepeptides.com/pages/coa" },
  { slug: "bulk-peptide-supply",    coa_url: "https://bulkpeptidesupply.com/coa-library/" },
  { slug: "astro-peptides",         coa_url: "https://astropeptides.com/pages/certificates" },
  { slug: "dynamic-peptide",        coa_url: "https://dynamicpeptide.com/pages/coa" },
  { slug: "glacier-aminos",         coa_url: "https://glaciersaminos.com/coas" },
  { slug: "penguin-peptides",       coa_url: "https://penguinpeptides.com/pages/lab-testing" },
  { slug: "paramount-peptides",     coa_url: "https://paramountpeptides.com/coa/" },
  { slug: "nuscience-peptides",     coa_url: "https://nusciencepeptides.com/nuscience-lab-test-results/" },
  { slug: "southern-peptides",      coa_url: "https://southern-peptides-llc.myshopify.com/pages/coa" },
  { slug: "simple-peptide",         coa_url: "https://simplepeptide.com/coa/" },
  { slug: "verified-peptides",      coa_url: "https://verifiedpeptides.com/lab-reports/" },
  { slug: "aavant-research",        coa_url: "https://aavantacr.com/test-result-coas/" },
  { slug: "nextechlabs",            coa_url: "https://nextechlaboratories.com/pages/coa" },
  { slug: "cernum-biosciences",     coa_url: "https://cernumbiosciences.com/pages/analyses/" },
  { slug: "peptide-crafters",       coa_url: "https://peptidecrafters.com/lab-test-reports/" },
  { slug: "lvlup-health",           coa_url: "https://lvluphealth.com/pages/lab-results" },
  { slug: "healthgevity",           coa_url: "https://healthgev.com/pages/testing" },
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  log(SCRIPT, `Seeding credentials and COA URLs for ${VENDOR_DATA.length} vendors…`);

  let ok = 0;
  let failed = 0;

  for (const v of VENDOR_DATA) {
    // Build update payload — only include defined fields
    const payload: Record<string, any> = {};
    if (v.login_username !== undefined) payload.login_username = v.login_username;
    if (v.login_email    !== undefined) payload.login_email    = v.login_email;
    if (v.login_password !== undefined) payload.login_password = v.login_password;
    if (v.login_path     !== undefined) payload.login_path     = v.login_path;
    if (v.catalog_paths  !== undefined) payload.catalog_paths  = v.catalog_paths;
    if (v.login_platform !== undefined) payload.login_platform = v.login_platform;
    if (v.coa_url        !== undefined) payload.coa_url        = v.coa_url;

    const { error } = await db.from("vendors").update(payload).eq("slug", v.slug);
    if (error) {
      log(SCRIPT, `  ✗ ${v.slug}: ${error.message}`);
      failed++;
    } else {
      log(SCRIPT, `  ✓ ${v.slug}`);
      ok++;
    }
  }

  log(SCRIPT, `Done. ${ok} updated, ${failed} failed.`);
  if (failed > 0) {
    log(SCRIPT, `\nIf columns are missing, run migration_005.sql in the Supabase SQL Editor first.`);
  }
}

main();
