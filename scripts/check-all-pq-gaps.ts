import { db } from "./lib/client.js";

async function main() {
  const { data: vendors } = await db
    .from("vendors")
    .select("id, slug, name, lab_testing_score, purity_accuracy_score, finnrick_tests_count")
    .in("status", ["active", "flagged"])
    .gt("lab_testing_score", 0)
    .eq("purity_accuracy_score", 0)
    .order("lab_testing_score", { ascending: false });

  for (const v of vendors ?? []) {
    const { data: tests } = await db
      .from("lab_tests")
      .select("peptide_name, purity_result, test_date")
      .eq("vendor_id", v.id)
      .not("purity_result", "is", null)
      .neq("test_type", "Endotoxin");

    const rows = tests ?? [];
    const avg = rows.length > 0
      ? (rows.reduce((s, r) => s + r.purity_result!, 0) / rows.length).toFixed(1)
      : "—";

    console.log(`${v.name.padEnd(28)} LV=${v.lab_testing_score}  rows=${String(rows.length).padStart(2)}  avg=${avg}%`);
    if (rows.length > 0) {
      const byPeptide: Record<string, number[]> = {};
      for (const r of rows) {
        byPeptide[r.peptide_name] = byPeptide[r.peptide_name] ?? [];
        byPeptide[r.peptide_name].push(r.purity_result!);
      }
      for (const [p, vals] of Object.entries(byPeptide)) {
        const pavg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        console.log(`  ${p}: ${vals.join(", ")}% (avg ${pavg}%)`);
      }
    }
  }
}

main();
