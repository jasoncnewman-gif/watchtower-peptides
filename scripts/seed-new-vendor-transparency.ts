/**
 * scripts/seed-new-vendor-transparency.ts
 * Sets transparency flags and COA purity data for new vendors researched 2026-06-09.
 * Safe to re-run — uses UPDATE for transparency and INSERT for lab_tests.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-new-vendor-transparency.ts
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-new-vendor-transparency";

// ── Transparency flags ─────────────────────────────────────────────────────
// Research basis:
//  True Research Labs  — address in footer (30 N Gould St, Sheridan WY), email/contact available,
//                        no named lab, no batch numbers on COA overview, no ownership disclosure
//  RUO Science         — email only (research@ruoscience.com), no address, no named lab,
//                        batch numbers on individual COA pages, HPLC/MS/endotoxin methodology described
//  Licensed Peptides   — FL address + phone + email on contact page, no named lab,
//                        lot numbers on purity reports, GMP/HPLC methodology described

type TransparencyUpdate = {
  slug: string;
  has_contact_info: boolean;
  has_business_address: boolean;
  has_ownership_disclosure: boolean;
  has_lab_disclosure: boolean;
  has_testing_methodology: boolean;
  has_batch_numbers: boolean;
};

const TRANSPARENCY: TransparencyUpdate[] = [
  {
    slug: "true-research-labs",
    has_contact_info:         true,   // address and info in site footer
    has_business_address:     true,   // "30 N Gould St Ste R, Sheridan, WY 82801"
    has_ownership_disclosure: false,  // no team/founder named
    has_lab_disclosure:       false,  // "independent third-party" — lab not named
    has_testing_methodology:  false,  // only broad claims, no specific method details
    has_batch_numbers:        false,  // not visible on COA overview or product pages
  },
  {
    slug: "ruo-science",
    has_contact_info:         true,   // research@ruoscience.com + contact form
    has_business_address:     false,  // no physical address disclosed
    has_ownership_disclosure: false,
    has_lab_disclosure:       false,  // "independent, accredited laboratories" — unnamed
    has_testing_methodology:  true,   // HPLC, MS, endotoxin, sterility, heavy metals described
    has_batch_numbers:        true,   // batch numbers on individual COA pages (e.g. BPC15-042026-7)
  },
  {
    slug: "licensed-peptides",
    has_contact_info:         true,   // phone +1(855)322-2214, email, Boca Raton FL
    has_business_address:     true,   // "1489 W Palmetto Park Rd, Boca Raton, FL 33486"
    has_ownership_disclosure: false,  // no team/founder named
    has_lab_disclosure:       false,  // "Licensed Peptides Report" — no 3rd-party lab named
    has_testing_methodology:  true,   // GMP-certified, 6-point verification: HPLC, MS, endotoxin, sterility
    has_batch_numbers:        true,   // lot numbers shown on purity reports (e.g. "Lot 26053003")
  },
];

// ── COA purity data ────────────────────────────────────────────────────────
// Only adding RUO Science data from COA pages with readable purity values.
// Lab is unnamed — flagging as "Self-Reported" (not third-party disclosed).
// Licensed Peptides purity reports are image thumbnails — can't read values.
// True Research Labs COAs are gated behind individual product pages.

type PurityRow = {
  slug: string;
  peptide_name: string;
  purity_result: number;
  test_date: string;
  lab_name: string;
  test_source: string;
  batch_number?: string;
};

const PURITY_DATA: PurityRow[] = [
  { slug: "ruo-science", peptide_name: "BPC-157",    purity_result: 99.12,  test_date: "2026-04-01", lab_name: "Undisclosed Lab", test_source: "coa", batch_number: "BPC15-042026-7" },
  { slug: "ruo-science", peptide_name: "Tirzepatide", purity_result: 99.744, test_date: "2026-04-01", lab_name: "Undisclosed Lab", test_source: "coa", batch_number: "GT100-042026-1" },
];

async function main() {
  log(SCRIPT, "Updating transparency flags for new vendors…");

  // Get vendor IDs
  const slugs = [...new Set([
    ...TRANSPARENCY.map(t => t.slug),
    ...PURITY_DATA.map(p => p.slug),
  ])];
  const { data: vendors, error: ve } = await db.from("vendors").select("id, slug").in("slug", slugs);
  if (ve) { log(SCRIPT, `DB error: ${ve.message}`); process.exit(1); }
  const idMap: Record<string, string> = {};
  for (const v of vendors ?? []) idMap[v.slug] = v.id;

  // Update transparency rows
  let ok = 0, failed = 0;
  for (const t of TRANSPARENCY) {
    const vendorId = idMap[t.slug];
    if (!vendorId) { log(SCRIPT, `  ✗ ${t.slug}: not found in DB`); failed++; continue; }

    const { error } = await db
      .from("vendor_transparency")
      .update({
        has_contact_info:         t.has_contact_info,
        has_business_address:     t.has_business_address,
        has_ownership_disclosure: t.has_ownership_disclosure,
        has_lab_disclosure:       t.has_lab_disclosure,
        has_testing_methodology:  t.has_testing_methodology,
        has_batch_numbers:        t.has_batch_numbers,
        updated_at: new Date().toISOString(),
      })
      .eq("vendor_id", vendorId);

    if (error) { log(SCRIPT, `  ✗ ${t.slug}: ${error.message}`); failed++; }
    else { log(SCRIPT, `  ✓ ${t.slug}: transparency updated`); ok++; }
  }

  // Mark vendors with COAs as has_coa=true
  for (const slug of ["true-research-labs", "ruo-science", "licensed-peptides"]) {
    const { error } = await db.from("vendors").update({ has_coa: true }).eq("slug", slug);
    if (error) log(SCRIPT, `  ✗ ${slug} has_coa: ${error.message}`);
    else log(SCRIPT, `  ✓ ${slug}: has_coa=true`);
  }

  // Insert purity data
  log(SCRIPT, "Inserting COA purity data…");
  for (const p of PURITY_DATA) {
    const vendorId = idMap[p.slug];
    if (!vendorId) continue;

    const { error } = await db.from("lab_tests").insert({
      vendor_id:       vendorId,
      peptide_name:    p.peptide_name,
      purity_result:   p.purity_result,
      test_date:       p.test_date,
      lab_name:        p.lab_name,
      test_source:     p.test_source,
      batch_number:    p.batch_number ?? null,
      verified:        false,
      test_type:       "HPLC",
    });

    if (error) log(SCRIPT, `  ✗ ${p.slug} ${p.peptide_name}: ${error.message}`);
    else log(SCRIPT, `  ✓ ${p.slug}: ${p.peptide_name} ${p.purity_result}%`);
  }

  log(SCRIPT, `\nDone. ${ok} transparency rows updated, ${failed} failed.`);
}

main();
