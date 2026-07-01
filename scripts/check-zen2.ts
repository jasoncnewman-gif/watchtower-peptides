import { db } from './lib/client.js';

async function main() {
  // Find zen vendor
  const { data: v } = await db
    .from('vendors')
    .select('slug, name, community_sentiment, negative_review_summary')
    .ilike('name', '%zen%');
  console.log('Zen vendors:', JSON.stringify(v, null, 2));

  // Check all recent sentiment logs
  const { data: logs } = await db
    .from('vendor_sentiment_log')
    .select('id, vendor_slug, status, sentiment, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('\nRecent sentiment logs:', JSON.stringify(logs, null, 2));
}

main();
