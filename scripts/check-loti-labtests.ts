import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db.from('vendors').select('id').eq('slug', 'loti-labs').single();
  const { data: tests } = await db.from('lab_tests').select('peptide_name, purity_result, test_type, test_date, test_source').eq('vendor_id', vendor!.id).order('test_date', { ascending: false });
  console.log(JSON.stringify(tests, null, 2));
}

main();
