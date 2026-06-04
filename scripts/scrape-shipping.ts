/**
 * scripts/scrape-shipping.ts
 * Scrapes shipping info (flat fee, free shipping threshold) from each vendor's website.
 * Checks homepage, /shipping, /shipping-policy, and /pages/shipping-policy.
 *
 * Run: npm run scrape:shipping
 */

import { db } from "./lib/client.js";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Patterns for free shipping threshold
const FREE_THRESHOLD_PATTERNS = [
  /free\s+shipping\s+on\s+(?:all\s+)?orders?\s+(?:over|above|of)?\s*\$\s*(\d+(?:\.\d+)?)/i,
  /free\s+shipping\s+(?:on\s+orders?\s+)?\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more|and\s+over)/i,
  /orders?\s+(?:over|above)\s+\$\s*(\d+(?:\.\d+)?)\s+(?:get|receive|qualify for)?\s*free\s+shipping/i,
  /\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more)\s+for\s+free\s+shipping/i,
  /free\s+shipping\s+with\s+(?:a\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:minimum|order)/i,
  /complimentary\s+shipping\s+on\s+orders?\s+(?:over|above)\s+\$\s*(\d+(?:\.\d+)?)/i,
];

// Patterns for free shipping on everything (threshold = 0)
const FREE_ALL_PATTERNS = [
  /free\s+shipping\s+on\s+all\s+(?:domestic\s+)?orders?(?:\s+in\s+the\s+(?:US|USA|United\s+States))?(?!\s+over|\s+above|\s+of|\s+\$)/i,
  /always\s+free\s+(?:domestic\s+)?shipping/i,
  /free\s+(?:standard\s+)?shipping\s+always/i,
];

// Patterns for flat rate fee
const FLAT_FEE_PATTERNS = [
  /flat[\s-]rate\s+shipping\s+(?:fee\s+)?(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /\$\s*(\d+(?:\.\d+)?)\s+flat[\s-]rate\s+shipping/i,
  /flat\s+(?:shipping\s+)?fee\s+(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /shipping\s+(?:fee\s+)?(?:is\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:flat|fixed)/i,
  /(?:standard\s+)?shipping\s+(?:is\s+)?(?:only\s+)?\$\s*(\d+(?:\.\d+)?)/i,
];

function extractShipping(text: string): { flatFee?: number; freeThreshold?: number } {
  const t = text.replace(/\s+/g, " ");

  for (const pat of FREE_ALL_PATTERNS) {
    if (pat.test(t)) return { freeThreshold: 0 };
  }

  let freeThreshold: number | undefined;
  let flatFee: number | undefined;

  for (const pat of FREE_THRESHOLD_PATTERNS) {
    const m = t.match(pat);
    if (m) { freeThreshold = parseFloat(m[1]); break; }
  }

  for (const pat of FLAT_FEE_PATTERNS) {
    const m = t.match(pat);
    if (m) { flatFee = parseFloat(m[1]); break; }
  }

  return { flatFee, freeThreshold };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Encoding": "identity" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip tags, decode entities, collapse whitespace
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ");
  } catch {
    return null;
  }
}

async function scrapeVendorShipping(website: string): Promise<{ flatFee?: number; freeThreshold?: number }> {
  const base = website.startsWith("http") ? website : `https://${website}`;
  let origin: string;
  try { origin = new URL(base).origin; } catch { return {}; }

  const paths = [
    origin,
    `${origin}/shipping`,
    `${origin}/shipping-policy`,
    `${origin}/pages/shipping`,
    `${origin}/pages/shipping-policy`,
    `${origin}/info/shipping`,
  ];

  for (const url of paths) {
    const text = await fetchText(url);
    if (!text) continue;
    const result = extractShipping(text);
    if (result.freeThreshold !== undefined || result.flatFee !== undefined) return result;
    await sleep(300);
  }

  return {};
}

async function main() {
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, name, slug, website")
    .eq("status", "active")
    .order("name");

  if (error) { console.error("DB error:", error.message); process.exit(1); }

  const active = (vendors ?? []).filter(v => v.website && v.website.length > 0);
  console.log(`Scraping shipping info for ${active.length} vendors…\n`);

  let updated = 0;
  let notFound = 0;

  for (const vendor of active) {
    process.stdout.write(`  ${vendor.name.padEnd(32)}`);

    const result = await scrapeVendorShipping(vendor.website);

    if (result.freeThreshold !== undefined || result.flatFee !== undefined) {
      const update: Record<string, number> = {};
      if (result.freeThreshold !== undefined) update.shipping_free_threshold = result.freeThreshold;
      if (result.flatFee !== undefined) update.shipping_flat_fee = result.flatFee;

      await db.from("vendors").update(update).eq("id", vendor.id);

      const parts = [];
      if (result.freeThreshold === 0) parts.push("free all");
      else if (result.freeThreshold !== undefined) parts.push(`free $${result.freeThreshold}+`);
      if (result.flatFee !== undefined) parts.push(`flat $${result.flatFee}`);
      console.log(`✓  ${parts.join(", ")}`);
      updated++;
    } else {
      console.log("—  not found");
      notFound++;
    }

    await sleep(500);
  }

  console.log(`\nDone. ${updated} updated, ${notFound} not found.`);
}

main();
