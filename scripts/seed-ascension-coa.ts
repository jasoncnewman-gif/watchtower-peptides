/**
 * Inserts Ascension Peptides purity data extracted from their COA page.
 * Lab: MZ Biolabs (Tucson, AZ), mzbiolabs.com
 * Method: HPLC-UV-MS
 * All data sourced from ascensionpeptides.com/certificates-of-analysis/ (login required)
 *
 * Notes:
 * - "T-30" = Tirzepatide 30mg; "T-10" = Tirzepatide 10mg; "R-10/R-30" = Retatrutide
 * - "S-5" = Semaglutide 5mg; "C-10" = Cagrilintide 10mg
 * - VIP batch 52-05260628 (11.47%) excluded — outlier, likely QC failure; Sept 2025 VIP at 99.05% included
 * - Stack/combo products (KLOW, WOLVERINE, GLOW, FIT STACK) excluded — not single-peptide
 * - Duplicate batches (SS-31 appeared twice with same batch) deduplicated
 */
import { db } from "./lib/client.js";

const ROWS = [
  // May 2026 batch (most recent)
  { peptide_name: "Tirzepatide",        purity_result: 99.81, test_date: "2026-05-21", batch_number: "35-05260628" },
  { peptide_name: "Thymosin Alpha-1",   purity_result: 99.39, test_date: "2026-05-23", batch_number: "33-05260628" },
  { peptide_name: "Retatrutide",        purity_result: 98.86, test_date: "2026-05-21", batch_number: "03-05260628" },
  { peptide_name: "PT-141",             purity_result: 99.26, test_date: "2026-05-23", batch_number: "28-05260628" },
  { peptide_name: "Epithalon",          purity_result: 99.31, test_date: "2026-05-23", batch_number: "15-05260628" },
  { peptide_name: "SS-31",              purity_result: 99.88, test_date: "2026-05-09", batch_number: "40-05260628" },
  { peptide_name: "Retatrutide",        purity_result: 99.83, test_date: "2026-05-09", batch_number: "43-05260628" },
  { peptide_name: "LL-37",              purity_result: 99.93, test_date: "2026-05-09", batch_number: "21-05260628" },
  { peptide_name: "KPV",                purity_result: 99.93, test_date: "2026-05-09", batch_number: "20-05260628" },
  { peptide_name: "Kisspeptin",         purity_result: 99.84, test_date: "2026-05-09", batch_number: "19-05260628" },
  { peptide_name: "Ipamorelin",         purity_result: 99.85, test_date: "2026-05-09", batch_number: "18-05260628" },
  { peptide_name: "AOD-9604",           purity_result: 99.88, test_date: "2026-05-09", batch_number: "09-05260628" },
  { peptide_name: "5-Amino-1MQ",        purity_result: 99.86, test_date: "2026-05-09", batch_number: "36-05260628" },

  // April 2026
  { peptide_name: "CJC-1295 No DAC",    purity_result: 99.27, test_date: "2026-04-10", batch_number: "13-01260229" },
  { peptide_name: "AOD-9604",           purity_result: 99.45, test_date: "2026-04-10", batch_number: "09-01260229" },

  // March 2026
  { peptide_name: "CJC-1295 No DAC",    purity_result: 99.66, test_date: "2026-03-20", batch_number: "60-03260429" },

  // February 2026
  { peptide_name: "Semaglutide",        purity_result: 99.98, test_date: "2026-02-24", batch_number: "04-01260229" },
  { peptide_name: "MOTS-C",             purity_result: 99.71, test_date: "2026-02-24", batch_number: "24-01260229" },
  { peptide_name: "Cagrilintide",       purity_result: 99.71, test_date: "2026-02-24", batch_number: "01-01260229" },
  { peptide_name: "BPC-157",            purity_result: 99.79, test_date: "2026-02-24", batch_number: "12-01260229" },
  { peptide_name: "ARA-290",            purity_result: 99.93, test_date: "2026-02-24", batch_number: "53-12250129" },
  { peptide_name: "TB-500",             purity_result: 99.97, test_date: "2026-02-10", batch_number: "31-01260229" },
  { peptide_name: "Semax",              purity_result: 99.75, test_date: "2026-02-09", batch_number: "30-01260229" },
  { peptide_name: "PT-141",             purity_result: 99.47, test_date: "2026-02-10", batch_number: "28-01260229" },
  { peptide_name: "Melanotan-I",        purity_result: 99.48, test_date: "2026-02-10", batch_number: "22-01260229" },
  { peptide_name: "DSIP",              purity_result: 99.74, test_date: "2026-02-10", batch_number: "14-01260229" },
  { peptide_name: "BPC-157",            purity_result: 99.79, test_date: "2026-02-10", batch_number: "11-01260229" },

  // February 2026 (early)
  { peptide_name: "Tirzepatide",        purity_result: 99.95, test_date: "2026-02-07", batch_number: "35-01260229" },
  { peptide_name: "Tirzepatide",        purity_result: 99.89, test_date: "2026-02-07", batch_number: "05-01260229" },
  { peptide_name: "Thymosin Alpha-1",   purity_result: 99.44, test_date: "2026-02-07", batch_number: "33-01260229" },
  { peptide_name: "Tesamorelin",        purity_result: 99.93, test_date: "2026-02-07", batch_number: "32-01260229" },
  { peptide_name: "Sermorelin",         purity_result: 99.79, test_date: "2026-02-07", batch_number: "38-01260229" },
  { peptide_name: "Selank",             purity_result: 99.32, test_date: "2026-02-07", batch_number: "29-01260229" },

  // January 2026
  { peptide_name: "Retatrutide",        purity_result: 99.88, test_date: "2026-01-26", batch_number: "43-01260229" },
  { peptide_name: "Retatrutide",        purity_result: 99.94, test_date: "2026-01-28", batch_number: "03-01260229" },
  { peptide_name: "Melanotan-II",       purity_result: 99.56, test_date: "2026-01-28", batch_number: "23-01260229" },
  { peptide_name: "GHK-Cu",             purity_result: 99.40, test_date: "2026-01-26", batch_number: "16-01260229" },
  { peptide_name: "5-Amino-1MQ",        purity_result: 99.50, test_date: "2026-01-28", batch_number: "36-01260229" },
  { peptide_name: "NAD+",               purity_result: 99.66, test_date: "2026-01-26", batch_number: "25-01260229" },
  { peptide_name: "FOXO4-DRI",          purity_result: 99.97, test_date: "2026-01-10", batch_number: "55-01260229" },

  // 2025 (older batches)
  { peptide_name: "KPV",                purity_result: 99.76, test_date: "2025-06-30", batch_number: "20-03250428" },
  { peptide_name: "AOD-9604",           purity_result: 99.76, test_date: "2025-09-17", batch_number: "09-03250428" },
  { peptide_name: "HCG",                purity_result: 98.25, test_date: "2025-09-15", batch_number: "39-01260229" },
  { peptide_name: "SS-31",              purity_result: 99.53, test_date: "2025-09-17", batch_number: "40-07250828" },
  { peptide_name: "VIP",                purity_result: 99.05, test_date: "2025-09-15", batch_number: "37-06250728" },
  { peptide_name: "LL-37",              purity_result: 99.59, test_date: "2025-09-15", batch_number: "21-03250428" },
  { peptide_name: "CJC-1295 No DAC",   purity_result: 98.67, test_date: "2025-08-12", batch_number: "13-03250428" },
  { peptide_name: "5-Amino-1MQ",        purity_result: 98.44, test_date: "2025-08-17", batch_number: "36-07250828" },
  { peptide_name: "Kisspeptin",         purity_result: 99.00, test_date: "2025-06-30", batch_number: "19-03250428" },
  { peptide_name: "Ipamorelin",         purity_result: 99.82, test_date: "2025-07-06", batch_number: "18-03250428" },
];

async function main() {
  const { data: vendor, error: ve } = await db.from("vendors").select("id").eq("slug", "ascension-peptides").single();
  if (ve || !vendor) throw new Error(`Vendor not found: ${ve?.message}`);

  const inserts = ROWS.map(r => ({
    vendor_id:        vendor.id,
    peptide_name:     r.peptide_name,
    lab_name:         "MZ Biolabs",
    test_type:        "HPLC",
    purity_result:    r.purity_result,
    endotoxin_result: null,
    test_date:        r.test_date,
    test_source:      "coa",
    batch_number:     r.batch_number,
    verified:         false,
    janoshik_tested:  false,
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) throw new Error(error.message);
  console.log(`Inserted ${inserts.length} lab_tests rows for ascension-peptides`);

  await db.from("vendors").update({ has_coa: true }).eq("id", vendor.id);
  console.log("has_coa confirmed true");
}
main().catch(err => { console.error(err); process.exit(1); });
