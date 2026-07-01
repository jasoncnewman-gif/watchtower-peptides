import { db } from './lib/client.js';

async function main() {
  const { data, error } = await db
    .from('vendors')
    .select('slug, name, community_sentiment, negative_review_summary')
    .eq('slug', 'zen-peptides');
  
  if (error) console.error('vendors error:', error.message);
  else console.log('vendor:', JSON.stringify(data));

  const { data: logs, error: le } = await db
    .from('vendor_sentiment_log')
    .select('id, vendor_slug, status, sentiment, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (le) console.error('log error:', le.message);
  else console.log('logs:', JSON.stringify(logs));
}

main();
