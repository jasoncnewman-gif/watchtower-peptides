/**
 * Inserts Polaris Peptides purity data from product-page COAs.
 * COAs are embedded per-product (not on a single COA page).
 * Labs: Chromate Analytics (chromate.org/verify) and Janoshik (janoshik.com)
 *
 * Data read from:
 *   BPC-157:     chromate.org #21703 (Sep 2024), #23439 (Mar 2025)
 *   TB-500:      chromate.org #21702 (Sep 2024)
 *   Ipamorelin:  chromate.org #22049 (Nov 2024)
 *   Tirzepatide: janoshik.com #77455 (Sep 2025)
 *   Semaglutide: janoshik.com #52346 (Nov 2024)
 */
import { db } from "./lib/client.js";

const ROWS = [
  // BPC-157 — Chromate Analytics
  { peptide_name: "BPC-157",     purity_result: 99.139, test_date: "2024-09-30", lab_name: "Chromate Analytics", batch_number: "POL-BPC10-2" },
  { peptide_name: "BPC-157",     purity_result: 98.534, test_date: "2025-03-13", lab_name: "Chromate Analytics", batch_number: "POL-BPC10-5" },
  { peptide_name: "BPC-157",     purity_result: 98.364, test_date: "2025-03-13", lab_name: "Chromate Analytics", batch_number: "POL-BPC10-5" },

  // TB-500 — Chromate Analytics
  { peptide_name: "TB-500",      purity_result: 99.603, test_date: "2024-09-30", lab_name: "Chromate Analytics", batch_number: "POL-TB10-2" },

  // Ipamorelin — Chromate Analytics
  { peptide_name: "Ipamorelin",  purity_result: 99.481, test_date: "2024-11-19", lab_name: "Chromate Analytics", batch_number: "POL-IPA10-2" },

  // Tirzepatide — Janoshik #77455 (3 vials)
  { peptide_name: "Tirzepatide", purity_result: 99.604, test_date: "2025-09-05", lab_name: "Janoshik",           batch_number: "POL-T10-16" },
  { peptide_name: "Tirzepatide", purity_result: 99.496, test_date: "2025-09-05", lab_name: "Janoshik",           batch_number: "POL-T10-16" },
  { peptide_name: "Tirzepatide", purity_result: 99.706, test_date: "2025-09-05", lab_name: "Janoshik",           batch_number: "POL-T10-16" },

  // Semaglutide — Janoshik #52346 (3 vials)
  { peptide_name: "Semaglutide", purity_result: 99.570, test_date: "2024-11-11", lab_name: "Janoshik",           batch_number: "POL-S10-7" },
  { peptide_name: "Semaglutide", purity_result: 99.797, test_date: "2024-11-11", lab_name: "Janoshik",           batch_number: "POL-S10-7" },
  { peptide_name: "Semaglutide", purity_result: 99.786, test_date: "2024-11-11", lab_name: "Janoshik",           batch_number: "POL-S10-7" },
];

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "polaris-peptides").single();
  if (!vendor) throw new Error("polaris-peptides not found");

  const inserts = ROWS.map(r => ({
    vendor_id:        vendor.id,
    peptide_name:     r.peptide_name,
    lab_name:         r.lab_name,
    test_type:        "HPLC",
    purity_result:    r.purity_result,
    endotoxin_result: null,
    test_date:        r.test_date,
    test_source:      "coa",
    batch_number:     r.batch_number,
    verified:         false,
    janoshik_tested:  r.lab_name === "Janoshik",
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) throw new Error(error.message);
  console.log(`Inserted ${inserts.length} lab_tests rows for polaris-peptides`);

  await db.from("vendors").update({ has_coa: true }).eq("id", vendor.id);
  console.log("has_coa set to true");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
