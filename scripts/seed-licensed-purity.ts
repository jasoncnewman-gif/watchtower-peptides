import { db } from "./lib/client.js";

const SOURCE = "licensedpeptides-coa-images-2026-06-15";

const ROWS = [
  { peptide: "BPC-157",               purity: 99.80, date: "2026-03-25", batch: "032520261",   lab: "Vanguard Laboratory" },
  { peptide: "GLP-2T",                purity: 99.80, date: "2026-05-05", batch: "White Cap",   lab: "Vanguard Laboratory" },
  { peptide: "GLP-3R",                purity: 99.12, date: "2026-05-05", batch: "Blue Cap",    lab: "Vanguard Laboratory" },
  { peptide: "MOTS-C",                purity: 99.08, date: "2026-05-05", batch: "Blue Cap",    lab: "Vanguard Laboratory" },
  { peptide: "NAD+",                  purity: 98.76, date: "2026-05-05", batch: "Clear Cap",   lab: "Vanguard Laboratory" },
  { peptide: "GHK-Cu",                purity: 99.80, date: "2026-05-05", batch: "Clear Cap",   lab: "Vanguard Laboratory" },
  { peptide: "Melanotan 1",           purity: 99.28, date: "2026-05-11", batch: "Blue Cap",    lab: "Vanguard Laboratory" },
  { peptide: "Melanotan 2",           purity: 99.23, date: "2026-05-05", batch: "Yellow Cap",  lab: "Vanguard Laboratory" },
  { peptide: "Thymosin Alpha-1",      purity: 99.07, date: "2026-05-05", batch: "White Cap",   lab: "Vanguard Laboratory" },
  { peptide: "Sermorelin",            purity: 99.04, date: "2026-05-05", batch: "Black Cap",   lab: "Vanguard Laboratory" },
  { peptide: "Semax",                 purity: 99.80, date: "2026-05-05", batch: "Blue Cap",    lab: "Vanguard Laboratory" },
  { peptide: "Selank",                purity: 99.80, date: "2026-03-25", batch: "032520261",   lab: "Vanguard Laboratory" },
  { peptide: "DSIP",                  purity: 98.82, date: "2026-03-25", batch: "032520261",   lab: "Vanguard Laboratory" },
  { peptide: "CJC-1295/Ipamorelin",   purity: 99.05, date: "2026-05-05", batch: "White Cap",   lab: "Vanguard Laboratory" },
  { peptide: "Epithalon",             purity: 99.80, date: "2026-02-10", batch: "EPITHA-01",   lab: "Vanguard Laboratory" },
  { peptide: "PT-141",                purity: 99.80, date: "2026-02-20", batch: "LP02202016",  lab: "Vanguard Laboratory" },
  { peptide: "Cagrilintide",          purity: 99.18, date: "2026-03-25", batch: "032520261",   lab: "Vanguard Laboratory" },
  { peptide: "TB-500",                purity: 99.80, date: "2026-02-10", batch: "TB500T-01",   lab: "Vanguard Laboratory" },
  { peptide: "Tesamorelin/Ipamorelin",purity: 99.02, date: "2026-05-05", batch: "Green Cap",   lab: "Vanguard Laboratory" },
  { peptide: "GLOW",                  purity: 99.80, date: "2026-05-05", batch: "Brown Cap",   lab: "Vanguard Laboratory" },
];

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "licensed-peptides").single();
  if (!vendor) { console.error("Vendor not found"); return; }

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id).eq("test_source", SOURCE);

  const inserts = ROWS.map(r => ({
    vendor_id:    vendor.id,
    peptide_name: r.peptide,
    batch_number: r.batch,
    test_date:    r.date,
    purity_result: r.purity,
    test_type:    "HPLC",
    lab_name:     r.lab,
    test_source:  SOURCE,
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) { console.error("Insert error:", error.message); return; }

  const avg = (ROWS.reduce((s, r) => s + r.purity, 0) / ROWS.length).toFixed(2);
  console.log(`Inserted ${inserts.length} rows. Avg purity: ${avg}%`);

  await db.from("vendors").update({ last_reviewed: new Date().toISOString().slice(0, 10) }).eq("slug", "licensed-peptides");
  console.log("Done.");
}

main().catch(console.error);
