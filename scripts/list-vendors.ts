import { db } from './lib/client.js';

async function main() {
  const { data } = await db.from('vendors').select('name, slug, status, overall_score').order('overall_score', { ascending: false, nullsFirst: false });
  data?.forEach(v => console.log(`${String(v.overall_score ?? '—').padStart(3)}  ${v.status?.padEnd(10)}  ${v.slug}`));
  console.log(`\nTotal: ${data?.length}`);
}

main();
