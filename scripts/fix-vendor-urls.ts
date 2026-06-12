/**
 * One-time script: fix vendor website URLs and mark gated vendors.
 * Run: npm run fix:vendor-urls
 */

import { db } from "./lib/client.js";

async function main() {
  const updates: Array<{ slug: string; patch: Record<string, unknown> }> = [
    { slug: "omegamino",       patch: { is_gated: true, website: "https://omegamino.net" } },
    { slug: "loti-labs",       patch: { is_gated: true } },
    { slug: "limitless-biotech", patch: { website: "https://limitlessbiotech.us" } },
    { slug: "crush-research",  patch: { website: "https://crushresearch.shop" } },
    { slug: "orbitrex-peptides", patch: { website: "https://orbitrexpeptide.is" } },
    { slug: "astro-peptides",  patch: { website: "https://astropeptides.com" } },
    { slug: "glacier-aminos",  patch: { website: "https://glaciersaminos.com" } },
    { slug: "southern-peptides", patch: { website: "https://southern-peptides-llc.myshopify.com" } },
    { slug: "nextechlabs",     patch: { website: "https://nextechlaboratories.com" } },
    { slug: "healthgevity",    patch: { website: "https://healthgev.com" } },
    { slug: "aavant-research", patch: { website: "https://aavantacr.com" } },
    { slug: "peptidology",           patch: { website: "https://peptidology.co" } },
    { slug: "prime-peptides",        patch: { website: "https://primepeptides.co" } },
    { slug: "felix-chemical-supply", patch: { website: "https://felixchemical.com" } },
  ];

  for (const { slug, patch } of updates) {
    const { error } = await db.from("vendors").update(patch).eq("slug", slug);
    if (error) {
      console.error(`  ✗ ${slug}: ${error.message}`);
    } else {
      console.log(`  ✓ ${slug}: updated ${Object.keys(patch).join(", ")}`);
    }
  }

  console.log("Done.");
}

main();
