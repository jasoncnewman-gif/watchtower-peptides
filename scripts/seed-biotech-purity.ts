import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "biotech-peptides").single();
  if (!vendor) { console.error("Vendor not found"); process.exit(1); }

  const SOURCE = "biotechpeptides-coa-images-2026-06-15";

  const rows = [
    { peptide_name: "BPC-157",        purity_result: 99.1, test_date: "2026-01-23", batch_number: "3100053" },
    { peptide_name: "AOD-9604",       purity_result: 99.0, test_date: "2026-03-10", batch_number: "3100006" },
    { peptide_name: "Epithalon",      purity_result: 99.7, test_date: "2026-03-03", batch_number: "3100022" },
    { peptide_name: "CJC-1295 DAC",   purity_result: 99.4, test_date: "2026-03-01", batch_number: "3100021" },
    { peptide_name: "Fragment 176-191", purity_result: 99.2, test_date: "2026-02-09", batch_number: "3140029" },
    { peptide_name: "DSIP",           purity_result: 99.2, test_date: "2026-03-23", batch_number: "3100044" },
    { peptide_name: "GHK-Cu",         purity_result: 98.8, test_date: "2026-01-01", batch_number: "3100030" },
    { peptide_name: "ARA-290",        purity_result: 98.9, test_date: "2026-03-21", batch_number: "3100007" },
    { peptide_name: "B7-33",          purity_result: 98.1, test_date: "2026-01-26", batch_number: "3100008" },
    { peptide_name: "Cardiogen",      purity_result: 99.4, test_date: "2026-03-02", batch_number: "3100015" },
    { peptide_name: "FOXO4-DRI",      purity_result: 98.5, test_date: "2026-01-22", batch_number: "3100025" },
    { peptide_name: "Adipotide",      purity_result: 98.2, test_date: "2026-02-01", batch_number: "3100003" },
    { peptide_name: "Chonluten",      purity_result: 98.4, test_date: "2025-08-26", batch_number: "3132298" },
  ];

  const avg = rows.reduce((s, r) => s + r.purity_result, 0) / rows.length;
  console.log(`Seeding ${rows.length} rows for Biotech Peptides, avg purity ${avg.toFixed(2)}%`);

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id).eq("test_source", SOURCE);

  const inserts = rows.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.peptide_name,
    lab_name:      "Unattributed",
    test_type:     "HPLC",
    purity_result: r.purity_result,
    test_date:     r.test_date,
    batch_number:  r.batch_number,
    test_source:   SOURCE,
    coa_url:       "https://biotechpeptides.com/product/" + r.peptide_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "/",
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) { console.error(error); process.exit(1); }
  console.log(`Inserted ${rows.length} rows.`);

  // Also update has_coa, batch_number flag, and last_reviewed
  await db.from("vendors").update({ has_coa: true, last_reviewed: new Date().toISOString().slice(0, 10) }).eq("slug", "biotech-peptides");
  const { data: vt } = await db.from("vendor_transparency").select("has_batch_numbers").eq("vendor_id", vendor.id).maybeSingle();
  if (vt && !vt.has_batch_numbers) {
    await db.from("vendor_transparency").update({ has_batch_numbers: true }).eq("vendor_id", vendor.id);
    console.log("Updated has_batch_numbers = true");
  }
}

main().catch(console.error);
