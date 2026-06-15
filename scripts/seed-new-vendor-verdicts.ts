/**
 * scripts/seed-new-vendor-verdicts.ts
 * Sets transparency flags and verdicts for 6 new vendors (2026-06-09 research).
 * Certified Pep: Vanguard Laboratory confirmed via external sources (can't scrape Cloudflare).
 * Perfect Peptides: COA confirmed via external sources (Cloudflare blocked).
 * Maxx Research Supply: No data available (Cloudflare blocked, not indexed).
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-new-vendor-verdicts.ts
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-new-vendor-verdicts";

// ── Transparency updates for Cloudflare-blocked vendors ───────────────────
// Certified Pep: evidence from web search + review articles (certified-pep.com/lab-testing/)
//   - ISO 17025 accredited Vanguard Laboratory named explicitly in external reviews
//   - US GMP-compliant Texas facility
//   - HPLC, endotoxin, heavy metals, bacteria testing described
// Perfect Peptides: COA existence confirmed; no specific lab named in any accessible source
// Maxx Research Supply: no accessible data anywhere

type TransparencyUpdate = {
  slug: string;
  has_coa: boolean;
  has_contact_info: boolean;
  has_business_address: boolean;
  has_ownership_disclosure: boolean;
  has_lab_disclosure: boolean;
  has_testing_methodology: boolean;
  has_batch_numbers: boolean;
};

const TRANSPARENCY: TransparencyUpdate[] = [
  {
    slug: "certified-pep",
    has_coa:                  true,   // confirmed: every product tested, COA documented
    has_contact_info:         false,  // can't verify (Cloudflare blocked)
    has_business_address:     false,  // "Texas facility" mentioned but no specific address accessible
    has_ownership_disclosure: false,
    has_lab_disclosure:       true,   // Vanguard Laboratory named, ISO 17025, multiple sources confirm
    has_testing_methodology:  true,   // HPLC, endotoxin, heavy metals, bacteria — explicitly described
    has_batch_numbers:        false,  // can't verify without accessing COA documents
  },
  {
    slug: "perfect-peptides",
    has_coa:                  true,   // confirmed via search: "COAs provided"
    has_contact_info:         false,
    has_business_address:     false,
    has_ownership_disclosure: false,
    has_lab_disclosure:       false,  // no lab name found in any accessible source
    has_testing_methodology:  false,  // "third-party lab tested" claim only — no specifics
    has_batch_numbers:        false,
  },
  {
    slug: "maxx-research-supply",
    has_coa:                  false,  // no data accessible
    has_contact_info:         false,
    has_business_address:     false,
    has_ownership_disclosure: false,
    has_lab_disclosure:       false,
    has_testing_methodology:  false,
    has_batch_numbers:        false,
  },
];

const VERDICTS: Record<string, string> = {
  "ruo-science":
    "RUO Science has per-product COA pages with real purity data — BPC-157 at 99.12% and Tirzepatide at 99.74% from batch-specific documents. Testing methodology is described (HPLC, mass spec, endotoxin, sterility, heavy metals). The critical gap: no third-party lab is named anywhere on the site. Without knowing which lab performed the testing, the COAs cannot be independently verified. No business address or ownership disclosure. Score is limited by the unnamed lab — if they publish the lab name, this would climb to the Watchlist range. For now: COAs look real, but the source is unverifiable.",

  "true-research-labs":
    "True Research Labs has a business address (Sheridan, WY), a working COA page, and claims independent third-party testing with a ≥99% purity standard. However, no testing lab is named, no batch numbers appear on the COA overview, and no purity percentages are accessible without navigating individual product pages. No ownership disclosure. A newer vendor with the infrastructure started but the documentation not yet fully public. Not enough verifiable data for a recommendation; watch for improvements to their COA transparency.",

  "licensed-peptides":
    "Licensed Peptides has a confirmed physical address (Boca Raton, FL), a phone number, and describes a 6-point verification process (HPLC, mass spec, endotoxin, sterility checks). Lot numbers appear on purity reports. The problem: no third-party testing lab is ever named — the purity reports are branded as 'Licensed Peptides Reports,' which means we can't confirm the testing was done by an independent party. The product catalog is also sold exclusively in 10-vial packs, which inflates apparent pricing relative to per-vial vendors. Good operational transparency, weak lab independence. Score will rise significantly if they publish the lab name.",

  "certified-pep":
    "Certified Pep uses Vanguard Laboratory — ISO/IEC 17025:2017 accredited, with named testing for purity, endotoxins, heavy metals, and bacteria. That's one of the most specific lab disclosures in this tier. Site is Cloudflare-protected so products and pricing couldn't be directly verified; score reflects the transparency record rather than a full catalog review. If pricing and product breadth are competitive, this vendor would score in the 45–60 range once we can access the full data. The lab disclosure alone puts them above most vendors at a similar overall score.",

  "perfect-peptides":
    "Perfect Peptides advertises third-party lab testing and COAs but no testing lab is publicly named in any accessible source. The site is Cloudflare-protected and could not be directly scraped. Score of 5 reflects near-zero verifiable data — not a verdict on actual product quality. Once site access is possible, this will be updated. Do not treat the low score as confirmation of poor quality; it reflects a research gap, not a documented failure.",

  "maxx-research-supply":
    "Maxx Research Supply has no publicly verifiable information — no product catalog, pricing, lab testing, or company documentation is accessible through any source. The score of 5 reflects a data gap, not confirmed problems. We recommend waiting for more information before considering this vendor.",
};

async function main() {
  log(SCRIPT, "Updating transparency for Cloudflare-blocked new vendors…");

  const slugs = TRANSPARENCY.map(t => t.slug);
  const { data: vendors } = await db.from("vendors").select("id, slug").in("slug", slugs);
  const idMap: Record<string, string> = {};
  for (const v of vendors ?? []) idMap[v.slug] = v.id;

  // Update vendor has_coa and transparency flags
  for (const t of TRANSPARENCY) {
    const vendorId = idMap[t.slug];
    if (!vendorId) { log(SCRIPT, `  ✗ ${t.slug}: not in DB`); continue; }

    // Update vendors.has_coa
    await db.from("vendors").update({ has_coa: t.has_coa }).eq("slug", t.slug);

    // Update vendor_transparency
    const { error } = await db.from("vendor_transparency").update({
      has_contact_info:         t.has_contact_info,
      has_business_address:     t.has_business_address,
      has_ownership_disclosure: t.has_ownership_disclosure,
      has_lab_disclosure:       t.has_lab_disclosure,
      has_testing_methodology:  t.has_testing_methodology,
      has_batch_numbers:        t.has_batch_numbers,
      updated_at: new Date().toISOString(),
    }).eq("vendor_id", vendorId);

    if (error) log(SCRIPT, `  ✗ ${t.slug}: ${error.message}`);
    else log(SCRIPT, `  ✓ ${t.slug}: transparency updated`);
  }

  // Insert verdicts (skip if already set)
  log(SCRIPT, "\nInserting verdicts…");
  for (const [slug, verdict] of Object.entries(VERDICTS)) {
    const { data: v } = await db.from("vendors").select("id, verdict").eq("slug", slug).maybeSingle();
    if (!v) { log(SCRIPT, `  ✗ ${slug}: not found`); continue; }
    if (v.verdict) { log(SCRIPT, `  — ${slug}: already has verdict`); continue; }

    const { error } = await db.from("vendors").update({ verdict }).eq("slug", slug);
    if (error) log(SCRIPT, `  ✗ ${slug}: ${error.message}`);
    else log(SCRIPT, `  ✓ ${slug}: verdict set`);
  }

  log(SCRIPT, "\nDone.");
}

main();
