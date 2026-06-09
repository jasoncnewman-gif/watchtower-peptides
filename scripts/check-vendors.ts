import { db } from "./lib/client.js";

const targets = ["ascension-peptides", "polaris-peptides", "glacier-aminos", "ion-peptide", "mile-high-compounds", "cernum-biosciences", "amino-asylum"];

async function main() {
  const { data: vendors, error } = await db.from("vendors")
    .select("id, slug, has_coa, overall_score, lab_testing_score")
    .in("slug", targets);
  if (error) { console.error("Query error:", error); return; }
  if (!vendors?.length) { console.log("No vendors found"); return; }

  for (const v of vendors) {
    console.log(`\n${v.slug}: score=${v.overall_score}, lab_testing=${v.lab_testing_score}, has_coa=${v.has_coa}`);
    const { data: tests } = await db.from("lab_tests")
      .select("purity_result")
      .eq("vendor_id", v.id)
      .not("purity_result", "is", null);
    const n = tests?.length ?? 0;
    const avg = n ? (tests!.reduce((s, t: any) => s + t.purity_result, 0) / n).toFixed(2) : "N/A";
    console.log(`  → ${n} purity rows, avg=${avg}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
