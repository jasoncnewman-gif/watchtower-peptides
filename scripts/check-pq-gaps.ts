import { db } from "./lib/client.js";

async function main() {
  const { data: vendors } = await db
    .from("vendors")
    .select("slug, name, overall_score, lab_testing_score, purity_accuracy_score, finnrick_tests_count")
    .in("status", ["active", "flagged"])
    .gt("lab_testing_score", 0)
    .eq("purity_accuracy_score", 0)
    .order("lab_testing_score", { ascending: false });

  console.log("Vendors with LV > 0 but PQ = 0:\n");
  for (const v of vendors ?? []) {
    console.log(`  ${v.name.padEnd(30)} LV=${v.lab_testing_score}  finnrick_n=${v.finnrick_tests_count ?? "-"}  overall=${v.overall_score}`);
  }

  // also check lab_tests row counts per vendor
  const { data: testCounts } = await db
    .from("lab_tests")
    .select("vendor_slug")
    .in("vendor_slug", (vendors ?? []).map(v => v.slug));

  const slugCounts: Record<string, number> = {};
  for (const t of testCounts ?? []) slugCounts[t.vendor_slug] = (slugCounts[t.vendor_slug] ?? 0) + 1;

  console.log("\nlab_tests rows for these vendors:");
  for (const v of vendors ?? []) {
    console.log(`  ${v.slug.padEnd(30)} ${slugCounts[v.slug] ?? 0} rows`);
  }
}

main();
