import { db } from './lib/client.js';

const SLUGS = ['elite-research-usa', 'accelerate-labs', 'eternal-peptides', 'oasis-peptides', 'zen-peptides', 'biolongevity-labs'];

async function main() {
  for (const slug of SLUGS) {
    const { data: v } = await db.from('vendors').select('id, name').eq('slug', slug).single();
    if (!v) continue;
    
    const { data: tests } = await db.from('lab_tests')
      .select('peptide_name, purity_result, test_date, finnrick_score')
      .eq('vendor_id', v.id)
      .eq('test_source', 'finnrick')
      .order('test_date', { ascending: false });
    
    const purities = tests?.filter(t => t.purity_result != null).map(t => t.purity_result!) ?? [];
    const avg = purities.length ? (purities.reduce((a,b) => a+b, 0) / purities.length).toFixed(1) : 'n/a';
    const min = purities.length ? Math.min(...purities).toFixed(1) : 'n/a';
    
    console.log(`\n${v.name} (${tests?.length ?? 0} tests, avg purity: ${avg}%, min: ${min}%)`);
    tests?.forEach(t => console.log(`  ${t.test_date?.slice(0,7) ?? '?'} ${String(t.purity_result ?? '—').padStart(6)}%  ${t.peptide_name}`));
  }
}

main();
