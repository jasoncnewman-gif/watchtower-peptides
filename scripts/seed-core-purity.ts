import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "core-peptides").single();
  if (!vendor) { console.error("Vendor not found"); process.exit(1); }

  const SOURCE = "corepeptides-vanguard-2026-06-15";

  const rows = [
    // Vanguard Laboratory (ISO 17025:2017) — April 2026 batch
    { peptide_name: "BPC-157",    purity_result: 99.80, test_date: "2026-04-02", batch_number: "C73447", lab_name: "Vanguard Laboratory" },
    { peptide_name: "Epithalon",  purity_result: 98.16, test_date: "2026-04-02", batch_number: "C73582", lab_name: "Vanguard Laboratory" },
    { peptide_name: "CJC-1295 DAC", purity_result: 99.56, test_date: "2026-04-02", batch_number: "C73459", lab_name: "Vanguard Laboratory" },
    { peptide_name: "AOD-9604",   purity_result: 99.05, test_date: "2025-12-09", batch_number: "C73441", lab_name: "Vanguard Laboratory" },
    { peptide_name: "ARA-290",    purity_result: 99.38, test_date: "2026-04-02", batch_number: "C73549", lab_name: "Vanguard Laboratory" },
    { peptide_name: "FOXO4-DRI",  purity_result: 99.80, test_date: "2026-04-02", batch_number: "C73588", lab_name: "Vanguard Laboratory" },
    { peptide_name: "Cortagen",   purity_result: 99.80, test_date: "2026-04-02", batch_number: "C83647", lab_name: "Vanguard Laboratory" },
    { peptide_name: "Chonluten",  purity_result: 99.01, test_date: "2026-04-28", batch_number: "C73564", lab_name: "Vanguard Laboratory" },
    // Older self-branded COAs (2024)
    { peptide_name: "Cardiogen",  purity_result: 99.30, test_date: "2024-10-08", batch_number: "D70423", lab_name: "Unattributed" },
    { peptide_name: "B7-33",      purity_result: 98.10, test_date: "2024-09-21", batch_number: "D20368", lab_name: "Unattributed" },
    { peptide_name: "Bronchogen", purity_result: 99.30, test_date: "2024-09-09", batch_number: "D91684", lab_name: "Unattributed" },
  ];

  const avg = rows.reduce((s, r) => s + r.purity_result, 0) / rows.length;
  console.log(`Seeding ${rows.length} rows for Core Peptides, avg purity ${avg.toFixed(2)}%`);

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id).eq("test_source", SOURCE);

  const inserts = rows.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.peptide_name,
    lab_name:      r.lab_name,
    test_type:     "HPLC",
    purity_result: r.purity_result,
    test_date:     r.test_date,
    batch_number:  r.batch_number,
    test_source:   SOURCE,
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) { console.error(error); process.exit(1); }
  console.log(`Inserted ${rows.length} rows.`);

  // Update transparency: has_batch_numbers = true (lot numbers on COAs), upgrade T2 → T3
  await db.from("vendor_transparency")
    .update({ has_batch_numbers: true, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendor.id);
  console.log("Updated has_batch_numbers = true (T2 → T3)");

  // Fix coa_url and has_coa
  await db.from("vendors").update({
    coa_url: "https://www.corepeptides.com/peptides/",
    has_coa: true,
    last_reviewed: new Date().toISOString().slice(0, 10),
  }).eq("slug", "core-peptides");
  console.log("Updated coa_url, has_coa, last_reviewed");
}

main().catch(console.error);
