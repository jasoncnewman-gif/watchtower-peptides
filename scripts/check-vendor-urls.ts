/**
 * Live URL health check for all vendors.
 * Fetches every vendor website, flags dead domains, and suggests TLD alternatives.
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/check-vendor-urls.ts
 */
import { db } from "./lib/client.js";

const TIMEOUT_MS = 10_000;
const TLD_VARIANTS = [".com", ".co", ".net", ".org", ".io", ".is", ".us", ".shop"];

async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WatchtowerBot/1.0)" },
    });
    return { ok: res.status < 500, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

function tldVariants(website: string): string[] {
  // Extract base without TLD, return URLs with each TLD variant
  const url = new URL(website);
  const host = url.hostname; // e.g. peptidology.com
  const parts = host.split(".");
  const baseName = parts.slice(0, -1).join("."); // everything before the last dot
  return TLD_VARIANTS
    .map((tld) => `${url.protocol}//${baseName}${tld}`)
    .filter((v) => v !== website);
}

async function main() {
  const { data, error } = await db
    .from("vendors")
    .select("name, slug, website, status")
    .order("name");

  if (error) { console.error(error); process.exit(1); }

  const vendors = data!.filter((v) => v.website);
  console.log(`\nChecking ${vendors.length} vendor URLs...\n`);

  const dead: Array<{ name: string; slug: string; url: string; suggestion?: string }> = [];

  for (const v of vendors) {
    const result = await probe(v.website);
    if (result.ok) {
      console.log(`  ✓  ${v.name} (${v.status ?? "active"})`);
      continue;
    }

    // Dead — try TLD variants to suggest a fix
    let suggestion: string | undefined;
    for (const variant of tldVariants(v.website)) {
      const altResult = await probe(variant);
      if (altResult.ok) {
        suggestion = variant;
        break;
      }
    }

    const flag = suggestion ? `✗  ${v.name} → DEAD  (try: ${suggestion})` : `✗  ${v.name} → DEAD`;
    console.log(`  ${flag}`);
    dead.push({ name: v.name, slug: v.slug, url: v.website, suggestion });
  }

  console.log(`\n${"─".repeat(60)}`);
  if (dead.length === 0) {
    console.log("All vendor URLs are live.");
  } else {
    console.log(`\n${dead.length} dead URL(s):\n`);
    for (const d of dead) {
      console.log(`  ${d.name} (${d.slug})`);
      console.log(`    Current:    ${d.url}`);
      if (d.suggestion) console.log(`    Suggested:  ${d.suggestion}`);
      else console.log(`    No working TLD variant found — check manually`);
    }
    console.log(`\nTo fix: add entries to fix-vendor-urls.ts and run npm run fix:vendor-urls`);
  }
}

main();
