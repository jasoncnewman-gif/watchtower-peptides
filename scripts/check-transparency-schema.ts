import { db } from './lib/client.js';

async function main() {
  const { data } = await db.from('vendor_transparency').select('*').limit(1).single();
  if (data) console.log('Columns:', Object.keys(data));
  else {
    // Try any record
    const { data: d2 } = await db.from('vendor_transparency').select('*').limit(1);
    console.log('Columns:', Object.keys(d2?.[0] ?? {}));
  }
}

main();
