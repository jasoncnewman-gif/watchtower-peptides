import { db } from "./lib/client.js";

async function main() {
  // Restore has_coa for vendors where COA was confirmed by login but scraper reset it
  const fixes = [
    { slug: "ascension-peptides", has_coa: true },
    { slug: "cernum-biosciences", has_coa: true },
  ];
  for (const f of fixes) {
    await db.from("vendors").update({ has_coa: f.has_coa }).eq("slug", f.slug);
    console.log(`  ✓ ${f.slug} has_coa restored to ${f.has_coa}`);
  }
}
main().catch(console.error);
