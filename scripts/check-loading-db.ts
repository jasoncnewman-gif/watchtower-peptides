import { db } from "./lib/client.js";

async function main() {
  const SLUGS = ['tb-500', 'thymosin-alpha-1', 'melanotan-i', 'glp-3-r', 'sermorelin', 'ipamorelin', 'cjc-1295'];
  const { data, error } = await db.from('peptides').select('slug,name,dosage').in('slug', SLUGS);
  if (error) { console.error(error); return; }
  for (const p of data ?? []) {
    console.log('\n=== ' + p.slug + ' ===');
    console.log(JSON.stringify(p.dosage, null, 2));
  }
}
main();
