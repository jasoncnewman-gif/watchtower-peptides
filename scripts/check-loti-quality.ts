import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db
    .from("vendors")
    .select("slug, overall_score, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score")
    .eq("slug", "loti-labs")
    .single();
  console.log("Scores:", JSON.stringify(vendor, null, 2));

  const { data: tests } = await db
    .from("lab_tests")
    .select("peptide_name, purity_percentage, test_date, batch_number, lab_name")
    .eq("vendor_slug", "loti-labs")
    .order("test_date", { ascending: false });
  console.log("\nLab tests:", JSON.stringify(tests, null, 2));
}

main();
