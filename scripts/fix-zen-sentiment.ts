import { db } from './lib/client.js';

async function main() {
  // Check what's there
  const { data: logs } = await db
    .from('vendor_sentiment_log')
    .select('id, vendor_slug, status, sentiment, created_at')
    .eq('vendor_slug', 'zen-peptides')
    .order('created_at', { ascending: false });

  console.log('Current sentiment logs for zen-peptides:');
  logs?.forEach(l => console.log(` id=${l.id} status=${l.status} sentiment=${l.sentiment} created=${l.created_at?.slice(0,10)}`));

  // Check what's on the vendor record itself
  const { data: vendor } = await db
    .from('vendors')
    .select('slug, community_sentiment, positive_review_summary, negative_review_summary')
    .eq('slug', 'zen-peptides')
    .single();

  console.log('\nVendor sentiment fields:');
  console.log(' community_sentiment:', vendor?.community_sentiment);
  console.log(' negative_review_summary:', vendor?.negative_review_summary);
}

main();
