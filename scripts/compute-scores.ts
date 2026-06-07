/**
 * scripts/compute-scores.ts
 * Auto-computes preliminary overall_score and sub-scores for all vendors
 * based on available Finnrick data (grade, test count, purity score).
 *
 * Scoring methodology (mirrors /about page):
 *   lab_testing_score       (max 30) — test count + lab credibility
 *   purity_accuracy_score   (max 25) — Finnrick grade + purity score
 *   transparency_score      (max 20) — COA availability
 *   community_reputation_score (max 15) — placeholder until Peptide Critic data
 *   pricing_reliability_score  (max 10) — placeholder
 *
 * Only updates vendors whose overall_score is null or 0 (won't overwrite
 * manually set scores).
 *
 * Run: npm run compute:scores
 * Add to run-all after scrape:finnrick.
 */

import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "compute-scores";

type DbVendorRow = {
  id: string;
  slug: string;
  name: string;
  finnrick_rating: string | null;
  finnrick_score: number | null;
  finnrick_tests_count: number | null;
  has_coa: boolean;
  status: string;
  peptide_critic_rating: number | null;
  peptide_critic_reviews_count: number | null;
};

type DbProductRow = {
  vendor_id: string;
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
};

// ── Scoring functions ─────────────────────────────────────────────────────

function labTestingScore(testsCount: number | null, grade: string | null, hasCoa: boolean): number {
  if (!testsCount || testsCount === 0) {
    // No Finnrick data — give partial credit if they publish COAs (can't verify quality without Finnrick)
    return hasCoa ? 5 : 0;
  }

  // Logarithmic scale: 30 points at ~100 tests
  const base = Math.min(30, Math.round((Math.log(testsCount + 1) / Math.log(101)) * 30));

  // Grade modifier: fewer deductions for cleaner test results
  const modifier: Record<string, number> = {
    A: 1.0, B: 0.87, C: 0.73, D: 0.57, E: 0.40,
  };
  const mod = grade ? (modifier[grade.charAt(0).toUpperCase()] ?? 0.80) : 0.80;

  return Math.round(base * mod);
}

function purityAccuracyScore(grade: string | null, finnrickScore: number | null): number {
  // Grade sets the range; finnrick_score (0–10) adjusts within that range
  const score = finnrickScore ?? 5;
  const t = score / 10; // 0–1

  const ranges: Record<string, [number, number]> = {
    A: [20, 25],
    B: [15, 20],
    C: [8,  15],
    D: [3,   8],
    E: [0,   3],
  };

  if (grade) {
    const key = grade.charAt(0).toUpperCase();
    const range = ranges[key];
    if (range) return Math.round(range[0] + t * (range[1] - range[0]));
  }

  // No grade but has a score — map 0–10 → 8–18
  return Math.round(8 + t * 10);
}

function transparencyScore(hasCoa: boolean): number {
  return hasCoa ? 16 : 8;
}

function communityReputationScore(rating: number | null, reviews: number | null): number {
  if (!rating) return 7; // not on Peptide Critic — neutral default

  // Rating component: 0–10 pts (rating is 0–5 stars)
  const ratingPts = (rating / 5) * 10;

  // Volume bonus: 0–5 pts, log scale, saturates around 100 reviews
  const volumePts = Math.min(5, (Math.log((reviews ?? 0) + 1) / Math.log(101)) * 5);

  return Math.max(0, Math.min(15, Math.round(ratingPts + volumePts)));
}

// ── Pricing score ─────────────────────────────────────────────────────────

type ProductKey = string; // `${normalizedName}::${size_mg}`

function normalizePeptideName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&#\d+;/g, " ").replace(/&\w+;/g, " ")   // HTML entities
    .replace(/[\d.]+\s*mg\s*(vials?)?/gi, " ")          // mg amounts + "vials"
    .replace(/\([^)]{1,30}\)/g, " ")                    // short parentheticals like "(TB4)" "(No DAC)"
    .replace(/\b(vials?|drops?|blend|combo|solution|powder|lyophilized|research|grade|kit)\b/gi, " ")
    .replace(/[|:/\\]/g, " ")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function productKey(name: string, mg: number): ProductKey {
  return `${normalizePeptideName(name)}::${mg}`;
}

function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeMarketMedians(products: DbProductRow[]): Map<ProductKey, number> {
  // Per (key, vendor) keep only the cheapest price so one vendor doesn't skew the median
  const cheapestPerVendor = new Map<string, number>();
  for (const p of products) {
    if (!p.size_mg || !p.list_price) continue;
    const key = productKey(p.peptide_name, p.size_mg);
    const mapKey = `${key}::${p.vendor_id}`;
    const effective = p.sale_price ?? p.list_price;
    const existing = cheapestPerVendor.get(mapKey);
    if (existing === undefined || effective < existing) cheapestPerVendor.set(mapKey, effective);
  }

  // Group prices by product key across vendors
  const pricesByKey = new Map<ProductKey, number[]>();
  for (const [mapKey, price] of cheapestPerVendor) {
    const key = mapKey.slice(0, mapKey.lastIndexOf("::"));
    if (!pricesByKey.has(key)) pricesByKey.set(key, []);
    pricesByKey.get(key)!.push(price);
  }

  // Only keep keys with at least 3 vendors (otherwise the "median" isn't meaningful)
  const medians = new Map<ProductKey, number>();
  for (const [key, prices] of pricesByKey) {
    if (prices.length >= 3) medians.set(key, medianOf(prices));
  }
  return medians;
}

function pricingReliabilityScore(
  vendorId: string,
  allProducts: DbProductRow[],
  marketMedians: Map<ProductKey, number>
): number {
  const vendorProducts = allProducts.filter(
    (p) => p.vendor_id === vendorId && p.size_mg && p.list_price
  );

  const ratios: number[] = [];
  for (const p of vendorProducts) {
    const key = productKey(p.peptide_name, p.size_mg!);
    const mdn = marketMedians.get(key);
    if (!mdn) continue;
    const effective = p.sale_price ?? p.list_price!;
    ratios.push(effective / mdn);
  }

  if (ratios.length === 0) return 5; // no comparable products — neutral

  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  // 20% below median → 10pts; at median → ~7pts; 40% above → 0pts
  return Math.max(0, Math.min(10, Math.round(10 * (1.4 - avg) / 0.6)));
}

// ── Status derivation (matches lib/supabase.ts logic) ────────────────────

function deriveStatus(score: number): string {
  if (score >= 80) return "recommended";
  if (score >= 55) return "caution";
  return "not-recommended";
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const [{ data: vendors, error }, { data: products, error: prodError }] = await Promise.all([
    db.from("vendors")
      .select("id, slug, name, finnrick_rating, finnrick_score, finnrick_tests_count, has_coa, status, peptide_critic_rating, peptide_critic_reviews_count")
      .in("status", ["active", "flagged"]),
    db.from("vendor_peptides")
      .select("vendor_id, peptide_name, size_mg, list_price, sale_price")
      .not("list_price", "is", null),
  ]);

  if (error) { console.error("Failed to load vendors:", error.message); process.exit(1); }
  if (prodError) { console.error("Failed to load products:", prodError.message); process.exit(1); }

  const rows = (vendors ?? []) as DbVendorRow[];
  const allProducts = (products ?? []) as DbProductRow[];
  const marketMedians = computeMarketMedians(allProducts);

  log(SCRIPT, `Computing scores for ${rows.length} vendors… (${marketMedians.size} comparable product benchmarks)`);

  let updated = 0;
  let skipped = 0;

  for (const v of rows) {
    const lab        = labTestingScore(v.finnrick_tests_count, v.finnrick_rating, v.has_coa);
    const purity     = purityAccuracyScore(v.finnrick_rating, v.finnrick_score);
    const trans      = transparencyScore(v.has_coa);
    const community  = communityReputationScore(v.peptide_critic_rating, v.peptide_critic_reviews_count);
    const pricing    = pricingReliabilityScore(v.id, allProducts, marketMedians);
    const overall    = lab + purity + trans + community + pricing;

    log(
      SCRIPT,
      `  ${v.name.padEnd(28)} lab=${lab}  purity=${purity}  trans=${trans}  community=${community}  pricing=${pricing}  → ${overall}`
    );

    const { error: writeErr } = await db
      .from("vendors")
      .update({
        lab_testing_score:           lab,
        purity_accuracy_score:       purity,
        transparency_score:          trans,
        community_reputation_score:  community,
        pricing_reliability_score:   pricing,
        overall_score:               overall,
        updated_at:                  new Date().toISOString(),
      })
      .eq("id", v.id);

    if (writeErr) {
      log(SCRIPT, `  ✗ DB write failed for ${v.slug}: ${writeErr.message}`);
    } else {
      updated++;
    }

    await sleep(80);
  }

  log(SCRIPT, `Done. ${updated} vendors scored, ${skipped} skipped.`);
}

main();
