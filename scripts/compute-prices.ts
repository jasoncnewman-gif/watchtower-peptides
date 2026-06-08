/**
 * scripts/compute-prices.ts
 * Computes price_per_mg for every vendor_peptides row with usable data,
 * then aggregates market-wide avg/min/max into peptide_market_prices.
 *
 * Excludes blends (names containing &, +, "mix", "blend", "stack").
 * Requires migration_008.sql to have been run first.
 *
 * Run: npm run compute:prices
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "compute-prices";

// ── Name normalization ─────────────────────────────────────────────────────

// Patterns that identify blend/multi-compound products (not single peptides)
const BLEND_RE = /\s*[&+]\s*|\b(?:mix|blend|stack|combo|combination|complex)\b/i;

// Strip size info embedded in the name (size is already in size_mg column)
function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s*[-–]\s*\d+\s*mg\b/gi, "")    // "- 20mg", "– 30mg"
    .replace(/\s+\d+\s*mg\b/gi, "")             // " 20mg", " 5mg"
    .replace(/\s*\([^)]*\)/g, "")               // "(10mg vials)", "(lyophilized)"
    .replace(/\bvial\b|\bpeptide\b/gi, "")      // filler words
    .replace(/[-\s]+/g, "-")                     // normalize separators
    .replace(/^-+|-+$/g, "")                     // trim edges
    .trim();
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Load all vendor_peptides that have a usable price and non-zero size_mg,
  // joined with the vendor's active status
  log(SCRIPT, "Loading vendor_peptides…");

  const { data: rows, error } = await db
    .from("vendor_peptides")
    .select(`
      id,
      vendor_id,
      peptide_name,
      size_mg,
      list_price,
      sale_price,
      vendors!inner(status)
    `)
    .eq("vendors.status", "active")
    .not("size_mg", "is", null)
    .neq("size_mg", 0)
    .or("list_price.not.is.null,sale_price.not.is.null");

  if (error) {
    log(SCRIPT, `DB error: ${error.message}`);
    process.exit(1);
  }

  log(SCRIPT, `Loaded ${rows?.length ?? 0} rows.`);

  if (!rows || rows.length === 0) {
    log(SCRIPT, "Nothing to process.");
    process.exit(0);
  }

  // ── Step 1: compute price_per_mg per row ────────────────────────────────

  const updates: { id: string; price_per_mg: number }[] = [];
  const marketData: Map<string, { prices: number[]; names: string[] }> = new Map();

  for (const row of rows) {
    const price = (row.sale_price ?? row.list_price) as number;
    const size = row.size_mg as number;

    if (!price || !size) continue;

    const ppm = Math.round((price / size) * 10000) / 10000; // 4 decimal places
    updates.push({ id: row.id, price_per_mg: ppm });

    // Skip blends for market aggregation
    if (BLEND_RE.test(row.peptide_name)) continue;

    const key = normalizeName(row.peptide_name);
    if (!key || key.length < 2) continue;

    if (!marketData.has(key)) {
      marketData.set(key, { prices: [], names: [] });
    }
    const entry = marketData.get(key)!;
    entry.prices.push(ppm);
    entry.names.push(row.peptide_name);
  }

  log(SCRIPT, `Computed price_per_mg for ${updates.length} rows.`);

  // ── Step 2: batch-update vendor_peptides.price_per_mg ───────────────────
  // Supabase doesn't support bulk UPDATE with different values per row,
  // so we upsert using the primary key.

  // Update price_per_mg using a single UPDATE per row, sequential to avoid
  // overwhelming Supabase connection limits.
  log(SCRIPT, `Updating ${updates.length} vendor_peptides rows…`);
  let saved = 0;
  let failed = 0;

  for (const u of updates) {
    const { error } = await db
      .from("vendor_peptides")
      .update({ price_per_mg: u.price_per_mg })
      .eq("id", u.id);
    if (error) { failed++; } else { saved++; }
  }

  log(SCRIPT, `Updated ${saved} rows, ${failed} errors.`);

  // ── Step 3: build peptide_market_prices ─────────────────────────────────

  log(SCRIPT, "Building peptide_market_prices…");

  const marketRows: {
    peptide_key: string;
    display_name: string;
    avg_price_per_mg: number;
    min_price_per_mg: number;
    max_price_per_mg: number;
    vendor_count: number;
    updated_at: string;
  }[] = [];

  for (const [key, { prices, names }] of marketData.entries()) {
    // Require at least 2 vendors for a meaningful market price
    if (prices.length < 2) continue;

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Pick most common raw name as display_name
    const freq: Record<string, number> = {};
    for (const n of names) freq[n] = (freq[n] ?? 0) + 1;
    const displayName = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

    marketRows.push({
      peptide_key: key,
      display_name: displayName,
      avg_price_per_mg: Math.round(avg * 10000) / 10000,
      min_price_per_mg: Math.round(min * 10000) / 10000,
      max_price_per_mg: Math.round(max * 10000) / 10000,
      vendor_count: prices.length,
      updated_at: new Date().toISOString(),
    });
  }

  log(SCRIPT, `${marketRows.length} peptides with ≥2 vendor price points.`);

  if (marketRows.length > 0) {
    const { error: mErr } = await db
      .from("peptide_market_prices")
      .upsert(marketRows, { onConflict: "peptide_key" });
    if (mErr) {
      log(SCRIPT, `peptide_market_prices upsert error: ${mErr.message}`);
    } else {
      log(SCRIPT, `Saved ${marketRows.length} market price rows.`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  log(SCRIPT, "\nTop 10 peptides by vendor coverage:");
  const top10 = marketRows
    .sort((a, b) => b.vendor_count - a.vendor_count)
    .slice(0, 10);
  for (const r of top10) {
    log(
      SCRIPT,
      `  ${r.display_name}: ${r.vendor_count} vendors, avg $${r.avg_price_per_mg.toFixed(4)}/mg`
    );
  }

  log(SCRIPT, "\nDone.");
}

main();
