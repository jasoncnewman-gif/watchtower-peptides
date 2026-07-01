import { db } from './lib/client.js';

async function main() {
  // Get one vendor row to see all columns
  const { data: v } = await db.from('vendors').select('*').eq('slug','zen-peptides').single();
  console.log('Vendor columns:', Object.keys(v ?? {}));
  
  const sentimentKeys = Object.keys(v ?? {}).filter(k => k.includes('sentiment') || k.includes('reddit') || k.includes('review') || k.includes('community'));
  console.log('Sentiment-related:', sentimentKeys);
  sentimentKeys.forEach(k => console.log(` ${k}:`, (v as Record<string,unknown>)?.[k]));

  // Get one sentiment log row
  const { data: log, error: le } = await db.from('vendor_sentiment_log').select('*').limit(1).single();
  if (le) console.log('Sentiment log error:', le.message);
  else console.log('\nSentiment log columns:', Object.keys(log ?? {}));
}

main();
