import { db } from './lib/client.js';

async function main() {
  const { data: logs } = await db
    .from('vendor_sentiment_log')
    .select('id, vendor_slug, status, sentiment, negative_review_summary, created_at')
    .eq('vendor_slug', 'zen-peptides')
    .order('created_at', { ascending: false });
  
  console.log('Sentiment log entries:', logs?.length ?? 0);
  logs?.forEach(l => console.log(JSON.stringify(l, null, 2)));

  const { data: v } = await db
    .from('vendors')
    .select('slug, community_sentiment, positive_review_summary, negative_review_summary, sentiment_post_count')
    .eq('slug', 'zen-peptides')
    .single();
  
  console.log('\nVendor row:', JSON.stringify(v, null, 2));
}

main();
