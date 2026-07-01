import { db } from './lib/client.js';

async function main() {
  for (const slug of ['elite-research-usa', 'accelerate-labs']) {
    const { data: v } = await db.from('vendors').select('id, name').eq('slug', slug).single();
    if (!v) continue;
    
    const { data: tests } = await db.from('lab_tests')
      .select('peptide_name, purity_result, test_date, finnrick_score, test_type, verified, lab_name')
      .eq('vendor_id', v.id)
      .eq('test_source', 'finnrick');
    
    console.log(`\n${v.name}:`);
    tests?.forEach(t => console.log(`  peptide=${t.peptide_name} purity=${t.purity_result} finnrick_score=${t.finnrick_score} verified=${t.verified} lab=${t.lab_name}`));
  }
}

main();
