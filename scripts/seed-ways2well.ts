/**
 * scripts/seed-ways2well.ts
 * Seeds Ways2Well vendor record, transparency flags, and verdict.
 *
 * Ways2Well is a telehealth/clinical company, not a traditional research chemical vendor.
 * Peptides are prescription-only, compounded by Revive Rx Pharmacy (founder-owned).
 * Score will be low (~25) not due to fraud risk but because the clinical model doesn't
 * expose the metrics our scoring tracks (public COAs, pricing, batch numbers).
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-ways2well.ts
 * Then: npm run compute:scores
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-ways2well";

async function main() {
  log(SCRIPT, "Seeding Ways2Well…");

  // ── 1. Vendor record ──────────────────────────────────────────────────────
  const { data: upserted, error: ve } = await db
    .from("vendors")
    .upsert({
      name:    "Ways2Well",
      slug:    "ways2well",
      website: "https://ways2well.com",
      status:  "active",
      coa_url: null,
      has_coa: true,
      is_gated: false,
      fda_warning: false,
      finnrick_tests_count: 0,
    }, { onConflict: "slug" })
    .select("id, slug")
    .single();

  if (ve || !upserted) {
    log(SCRIPT, `✗ vendor upsert failed: ${ve?.message}`);
    process.exit(1);
  }
  log(SCRIPT, `✓ vendor upserted: ${upserted.slug} (id: ${upserted.id})`);

  const vendorId = upserted.id;

  // ── 2. Transparency flags ─────────────────────────────────────────────────
  // Ways2Well is unusually transparent for a telehealth company:
  //   - Founder named (Brigham Buhler), also owns Revive Rx Pharmacy (compounding source)
  //   - Clinical staff named and credentialed (Dr. Ian White PhD, Danese Rexroad FNP, Julie Grieco FNP)
  //   - Scientific Advisory Board with 6 named advisors published
  //   - Physical locations: Longevity Lab Austin TX + Houston TX clinic
  //   - Phone: (281) 742-0993
  //   - "Third-party tested" claim on peptides page but no lab named, no public COA page
  //   - No batch numbers accessible publicly
  //   - No testing methodology details published
  // domain_years = 3 (established company: Joe Rogan, Aaron Rodgers, mainstream press coverage)

  const { error: te } = await db
    .from("vendor_transparency")
    .upsert({
      vendor_id:                vendorId,
      has_contact_info:         true,   // phone (281) 742-0993, contact page
      has_business_address:     true,   // Austin TX Longevity Lab + Houston TX clinic
      has_ownership_disclosure: true,   // Brigham Buhler named as founder + full clinical team listed
      has_lab_disclosure:       false,  // "independent labs" claimed but no lab named publicly
      has_testing_methodology:  false,  // no testing method details published
      has_batch_numbers:        false,  // no public batch tracking
      domain_years:             3,
      fda_warning:              false,
      fraud_flags:              0,
    }, { onConflict: "vendor_id" });

  if (te) log(SCRIPT, `✗ transparency: ${te.message}`);
  else log(SCRIPT, `✓ transparency flags set`);

  // ── 3. Verdict ────────────────────────────────────────────────────────────
  const verdict = `Ways2Well is a telehealth and clinical wellness company, not a traditional research chemical vendor — and that distinction matters for how you read their score.

Their model: pay $99 for a consultation with a licensed clinician (FNP or MD), receive a personalized peptide prescription, and have compounds delivered from Revive Rx Pharmacy — a compounding pharmacy owned by Ways2Well founder Brigham Buhler. Peptides are prescribed, not sold over the counter. The company operates in 45 states, has physical clinics in Austin and Houston, and publishes its full clinical team and a scientific advisory board.

The clinical model has real advantages over typical research chemical vendors: licensed oversight, compounding pharmacy sourcing, HSA/FSA acceptance, and a framework that at least nominally requires FDA-regulated manufacturing. That said, it comes with real limitations for comparison purposes.

Their score is low on our platform not because they are unsafe, but because their model doesn't expose the metrics we measure. There is no public COA library, no named testing lab, no published batch numbers, and no public pricing — all standard features among the research vendors we score. Their peptide page claims "third-party tested" and "independent labs verify purity and potency," but these are unverifiable from public information. We cannot confirm which lab performs testing, what methods are used, or whether COA documents match actual patient batches.

One conflict of interest worth noting: Brigham Buhler owns both Ways2Well (the telehealth front end) and Revive Rx Pharmacy (the compounding source). This vertical integration is disclosed on the about page, but it means the company that prescribes your peptides also owns the pharmacy filling them — a structure that merits awareness.

Ways2Well is best suited for patients who want a medically supervised protocol and are comfortable with clinical pricing, not buyers who want to independently verify product quality before purchase. If public COA documentation matters to your decision, this vendor cannot currently satisfy that requirement.`;

  const { error: verdictError } = await db
    .from("vendors")
    .update({ verdict })
    .eq("slug", "ways2well");

  if (verdictError) log(SCRIPT, `✗ verdict: ${verdictError.message}`);
  else log(SCRIPT, `✓ verdict written`);

  log(SCRIPT, "\nDone. Run: npm run compute:scores");
}

main().catch(console.error);
