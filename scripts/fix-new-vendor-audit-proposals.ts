import { db } from './lib/client.js';

const SLUGS = ['eternal-peptides','oasis-peptides','accelerate-labs','zen-peptides','biolongevity-labs','elite-research-usa'];

async function main() {
  for (const slug of SLUGS) {
    const { data: v } = await db.from('vendors')
      .select('id, name, overall_score, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score')
      .eq('slug', slug).single();
    if (!v) continue;

    // Update pending audit proposal to reflect current computed scores
    const { data: log } = await db.from('vendor_audit_log')
      .select('id')
      .eq('vendor_id', v.id)
      .eq('status', 'pending')
      .order('scraped_at', { ascending: false })
      .limit(1).single();

    if (!log) { console.log(`${slug}: no pending audit log`); continue; }

    const subScores = {
      lv: v.lab_testing_score,
      pq: v.purity_accuracy_score,
      tr: v.transparency_score,
      cx: v.pricing_reliability_score,
    };

    const { error } = await db.from('vendor_audit_log')
      .update({ proposed_score: v.overall_score, sub_scores: subScores })
      .eq('id', log.id);

    if (error) console.error(`✗ ${slug}: ${error.message}`);
    else console.log(`✓ ${v.name}: proposal updated → ${v.overall_score}`);
  }
}

main();
