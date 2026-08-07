import { db } from "./lib/client.js";

async function main() {
  const slugs = ['loti-labs','swiss-chems','nexaph','nuscience-peptides','paramount-peptides','pure-rawz','verified-peptides'];
  const { data: vendors } = await db.from('vendors').select('id, slug').in('slug', slugs);
  for (const v of vendors ?? []) {
    const { count } = await db.from('lab_tests').select('*', { count: 'exact', head: true }).eq('vendor_id', v.id);
    console.log(`${v.slug.padEnd(28)} ${count ?? 0} rows`);
  }
}

main();
