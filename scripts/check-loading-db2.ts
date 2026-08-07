import { db } from "./lib/client.js";

async function main() {
  const SLUGS = ['melanotan-i', 'ta-1', 'kisspeptin-10', 'bnp-32', 'retatrutide'];
  const { data, error } = await db.from('peptides').select('slug,name,dosage').in('slug', SLUGS);
  if (error) { console.error(error); return; }
  // also search by name
  const { data: data2, error: e2 } = await db.from('peptides')
    .select('slug,name,dosage')
    .ilike('name', '%melanotan%');
  for (const p of [...(data ?? []), ...(data2 ?? [])]) {
    console.log('\n=== ' + p.slug + ' (' + p.name + ') ===');
    console.log(JSON.stringify(p.dosage, null, 2));
  }
}
main();
