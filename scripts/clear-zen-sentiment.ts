import { db } from './lib/client.js';

async function main() {
  // Get vendor id
  const { data: v } = await db.from('vendors').select('id, slug').eq('slug', 'zen-peptides').single();
  if (!v) { console.error('vendor not found'); return; }
  console.log('vendor id:', v.id);

  // Clear sentiment fields on vendor
  const { error: ve } = await db.from('vendors')
    .update({
      reddit_sentiment: null,
      negative_review_summary: null,
      positive_review_summary: null,
    })
    .eq('id', v.id);
  if (ve) console.error('vendor clear error:', ve.message);
  else console.log('✓ Cleared vendor sentiment fields');

  // Find and deny the sentiment log entry
  const { data: logs } = await db.from('vendor_sentiment_log')
    .select('id, status, sentiment')
    .eq('vendor_id', v.id)
    .order('scraped_at', { ascending: false });
  
  console.log('Sentiment log entries:', logs?.length ?? 0, JSON.stringify(logs));

  if (logs?.length) {
    const { error: le } = await db.from('vendor_sentiment_log')
      .update({ status: 'denied' })
      .eq('id', logs[0].id);
    if (le) console.error('log update error:', le.message);
    else console.log('✓ Sentiment log entry denied (id:', logs[0].id, ')');
  }
}

main();
