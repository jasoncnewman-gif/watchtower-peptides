import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "penguin-peptides").single();
  if (!vendor) { console.error("Vendor not found"); process.exit(1); }

  const SOURCE = "penguinpeptides-janoshik-2026-06-15";

  const rows = [
    // Janoshik task numbers visible on each COA; batch "Unknown" on all
    { peptide_name: "BPC-157",          purity_result: 91.646, test_date: "2026-01-21", coa_task: "#100469" },
    { peptide_name: "AOD-9604",         purity_result: 99.723, test_date: "2026-01-23", coa_task: "#100481" },
    { peptide_name: "Retatrutide",      purity_result: 99.465, test_date: "2026-01-21", coa_task: "#100656" },
    { peptide_name: "Ipamorelin",       purity_result: 99.853, test_date: "2026-01-22", coa_task: "#100552" },
    { peptide_name: "CJC-1295 DAC",     purity_result: 99.133, test_date: "2026-01-22", coa_task: "#100463" },
    { peptide_name: "CJC-1295",         purity_result: 99.774, test_date: "2026-01-22", coa_task: "#100641" },
    { peptide_name: "HGH 191AA",        purity_result: 95.016, test_date: "2026-01-22", coa_task: "#100534" },
    { peptide_name: "GHK-Cu",           purity_result: 99.547, test_date: "2026-01-21", coa_task: "#100626" },
    { peptide_name: "DSIP",             purity_result: 99.028, test_date: "2026-01-22", coa_task: "#100629" },
    { peptide_name: "Melanotan 2",      purity_result: 99.503, test_date: "2026-01-21", coa_task: "#100610" },
    { peptide_name: "MOTS-C",           purity_result: 99.837, test_date: "2026-01-21", coa_task: "#100590" },
    { peptide_name: "Tesamorelin",      purity_result: 99.132, test_date: "2026-01-22", coa_task: "#100776" },
    { peptide_name: "Kisspeptin",       purity_result: 99.449, test_date: "2026-01-21", coa_task: "#100600" },
    { peptide_name: "Selank",           purity_result: 99.622, test_date: "2026-01-22", coa_task: "#100770" },
    { peptide_name: "Semax",            purity_result: 99.471, test_date: "2026-01-22", coa_task: "#100780" },
    { peptide_name: "PT-141",           purity_result: 99.839, test_date: "2026-01-21", coa_task: "#100792" },
    { peptide_name: "Oxytocin",         purity_result: 96.360, test_date: "2026-01-21", coa_task: "#100767" },
    { peptide_name: "ARA-290",          purity_result: 99.704, test_date: "2026-01-21", coa_task: "#100472" },
  ];

  const avg = rows.reduce((s, r) => s + r.purity_result, 0) / rows.length;
  console.log(`Seeding ${rows.length} rows for Penguin Peptides, avg purity ${avg.toFixed(2)}%`);
  console.log(`BPC-157 note: 91.646% — below 95% quality threshold`);

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id).eq("test_source", SOURCE);

  const inserts = rows.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.peptide_name,
    lab_name:      "Janoshik",
    test_type:     "HPLC",
    purity_result: r.purity_result,
    test_date:     r.test_date,
    batch_number:  null,
    test_source:   SOURCE,
    coa_url:       `https://www.janoshik.com/verify/ (task ${r.coa_task})`,
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) { console.error(error); process.exit(1); }
  console.log(`Inserted ${rows.length} rows.`);

  // Update transparency: has_lab_disclosure = true, coa_url = working URL
  await db.from("vendor_transparency")
    .update({ has_lab_disclosure: true, has_batch_numbers: false, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendor.id);
  console.log("Updated has_lab_disclosure = true");

  // Fix coa_url (old one 404s)
  await db.from("vendors").update({ coa_url: "https://penguinpeptides.com/lab-results/", has_coa: true }).eq("slug", "penguin-peptides");
  console.log("Updated coa_url and has_coa");
}

main().catch(console.error);
