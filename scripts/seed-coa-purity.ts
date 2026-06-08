/**
 * scripts/seed-coa-purity.ts
 * Inserts manually-read purity values from COA images for vendors whose
 * COA pages are image-based (PNG/JPG) and can't be auto-scraped.
 *
 * Labs confirmed third-party:
 *   - Chromate Analytics (chromate.org/verify)
 *   - Kovera Labs (koveralabs.com/verify)
 *   - Freedom Diagnostics (FreedomDiagnosticsTesting.com)
 *   - ILS Laboratories, ISO 17025 accredited (ils-lab.com)
 */
import { db } from "./lib/client.js";

const ROWS: Array<{
  slug: string;
  peptide_name: string;
  purity_result: number;
  endotoxin_result: string | null;
  test_date: string;
  lab_name: string;
  test_source: string;
  batch_number?: string;
}> = [
  // ── Mile High Compounds (Chromate Analytics) ──────────────
  { slug: "mile-high-compounds", peptide_name: "LL-37",      purity_result: 99.647, endotoxin_result: "low",  test_date: "2025-10-23", lab_name: "Chromate Analytics", test_source: "coa", batch_number: "LL3-005-MH-01" },
  { slug: "mile-high-compounds", peptide_name: "GLP-3 RT",   purity_result: 99.089, endotoxin_result: "low",  test_date: "2025-09-25", lab_name: "Chromate Analytics", test_source: "coa", batch_number: "GLP-310-MH-03" },
  { slug: "mile-high-compounds", peptide_name: "Tirzepatide", purity_result: 99.685, endotoxin_result: null,   test_date: "2025-08-20", lab_name: "Chromate Analytics", test_source: "coa", batch_number: "GLP-260-MH-03" },
  { slug: "mile-high-compounds", peptide_name: "BPC-157",    purity_result: 99.146, endotoxin_result: null,   test_date: "2025-08-14", lab_name: "Chromate Analytics", test_source: "coa", batch_number: "BPC-010-MH-02" },
  { slug: "mile-high-compounds", peptide_name: "GLP-3 RT",   purity_result: 99.606, endotoxin_result: "low",  test_date: "2025-10-04", lab_name: "Chromate Analytics", test_source: "coa", batch_number: "GLP-330-MH-03" },

  // ── Ion Peptide (Freedom Diagnostics, Kovera Labs, ILS Labs) ─
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.10,  endotoxin_result: null,  test_date: "2026-01-09", lab_name: "Freedom Diagnostics",  test_source: "coa", batch_number: "5AM50-010826" },
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.887, endotoxin_result: "low", test_date: "2026-04-22", lab_name: "Kovera Labs",           test_source: "coa", batch_number: "10AM-04172026" },
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.802, endotoxin_result: null,  test_date: "2025-12-02", lab_name: "Freedom Diagnostics",  test_source: "coa", batch_number: "5MQ-12125" },
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.795, endotoxin_result: null,  test_date: "2025-12-30", lab_name: "Freedom Diagnostics",  test_source: "coa", batch_number: "5AM10-122825" },
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.75,  endotoxin_result: null,  test_date: "2026-01-23", lab_name: "Freedom Diagnostics",  test_source: "coa", batch_number: "5AMQ-501-222026" },
  { slug: "ion-peptide", peptide_name: "5-Amino-1MQ", purity_result: 99.79,  endotoxin_result: null,  test_date: "2026-05-08", lab_name: "ILS Laboratories",     test_source: "coa", batch_number: "20AM-05042026" },

  // ── Glacier Aminos (Kovera Labs, Freedom Diagnostics) ────────
  { slug: "glacier-aminos", peptide_name: "BPC-157",         purity_result: 99.896, endotoxin_result: "low", test_date: "2026-04-07", lab_name: "Kovera Labs",          test_source: "coa", batch_number: "BPC200A-03" },
  { slug: "glacier-aminos", peptide_name: "Ipamorelin",      purity_result: 99.935, endotoxin_result: "low", test_date: "2026-04-18", lab_name: "Kovera Labs",          test_source: "coa", batch_number: "IPA90A-03" },
  { slug: "glacier-aminos", peptide_name: "Thymosin Beta-4", purity_result: 99.13,  endotoxin_result: "low", test_date: "2026-01-30", lab_name: "Freedom Diagnostics", test_source: "coa" },
];

async function main() {
  // Resolve slugs → vendor IDs
  const slugs = [...new Set(ROWS.map(r => r.slug))];
  const { data: vendors, error: ve } = await db.from("vendors").select("id, slug").in("slug", slugs);
  if (ve) throw new Error(ve.message);
  const idMap = Object.fromEntries((vendors ?? []).map(v => [v.slug, v.id]));

  const inserts = ROWS.map(r => ({
    vendor_id:        idMap[r.slug],
    peptide_name:     r.peptide_name,
    lab_name:         r.lab_name,
    test_type:        "HPLC",
    purity_result:    r.purity_result,
    endotoxin_result: r.endotoxin_result,
    test_date:        r.test_date,
    test_source:      r.test_source,
    batch_number:     r.batch_number ?? null,
    verified:         false,
    janoshik_tested:  false,
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) throw new Error(error.message);
  console.log(`Inserted ${inserts.length} lab_tests rows`);

  // Mark each vendor has_coa=true (already true for all three, but ensure it)
  for (const slug of slugs) {
    await db.from("vendors").update({ has_coa: true }).eq("slug", slug);
    console.log(`  ✓ ${slug} has_coa confirmed`);
  }
}
main().catch(err => { console.error(err); process.exit(1); });
