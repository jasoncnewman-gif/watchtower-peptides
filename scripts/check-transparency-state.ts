import { db } from './lib/client.js';

const SLUGS = ['eternal-peptides','oasis-peptides','accelerate-labs','zen-peptides','biolongevity-labs','elite-research-usa'];

async function main() {
  for (const slug of SLUGS) {
    const { data: v } = await db.from('vendors').select('id, name, website').eq('slug', slug).single();
    if (!v) continue;

    const { data: t } = await db.from('vendor_transparency').select('*').eq('vendor_id', v.id).single();
    console.log(`\n${v.name} (${v.website})`);
    if (!t) { console.log('  NO transparency record'); continue; }
    const cols = Object.entries(t).filter(([k]) => k !== 'id' && k !== 'vendor_id' && k !== 'created_at' && k !== 'updated_at');
    cols.forEach(([k, val]) => console.log(`  ${k}: ${val}`));
  }
}

main();
