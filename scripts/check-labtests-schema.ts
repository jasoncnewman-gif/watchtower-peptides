import { db } from "./lib/client.js";

async function main() {
  const { data } = await db.from('lab_tests').select('*').limit(2);
  if (data && data.length > 0) console.log("Columns:", Object.keys(data[0]));
  const { count } = await db.from('lab_tests').select('*', { count: 'exact', head: true });
  console.log("Total rows:", count);
  const { data: sample } = await db.from('lab_tests').select('vendor_id, vendor_slug, test_source, peptide_name, purity_result').limit(3);
  console.log("Sample:", JSON.stringify(sample, null, 2));
}

main();
