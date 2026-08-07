import { db } from "./lib/client.js";

async function main() {
  const slugs = ['nexaph','nuscience-peptides','paramount-peptides','pure-rawz','verified-peptides'];
  for (const slug of slugs) {
    const { data } = await db.from('lab_tests').select('test_source, vendor_slug').eq('vendor_slug', slug).limit(3);
    const sources = [...new Set((data ?? []).map(r => r.test_source))];
    console.log(`${slug.padEnd(25)} ${data?.length ?? 0} rows  sources: ${sources.join(', ')}`);
  }
}

main();
