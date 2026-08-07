import { db } from "./lib/client.js";

async function main() {
  const slugs = ['licensed-peptides','core-peptides','penguin-peptides','crush-research','biotech-peptides'];
  const { data } = await db
    .from("vendors")
    .select("slug, name, website, coa_url, has_coa, has_lab_disclosure, has_batch_numbers")
    .in("slug", slugs);
  for (const v of data ?? []) {
    console.log(`${v.name}: website=${v.website} coa_url=${v.coa_url}`);
  }
}

main();
