/**
 * scripts/compute-scores.ts
 * Computes vendor scores using the new 4-sub-score formula.
 *
 * Sub-scores:
 *   Lab Verification   (LV) — max 40 — tiered by verification type + sampling confidence
 *   Product Quality    (PQ) — max 25 — recency-weighted purity average from lab_tests
 *   Transparency       (TR) — max 25 — from vendor_transparency checklist
 *   Customer Experience(CX) — max 10 — price_per_mg vs market average
 *   Total                     max 100
 *
 * Stored in existing columns (repurposed):
 *   lab_testing_score         ← LV (0–40)
 *   purity_accuracy_score     ← PQ (0–25)
 *   transparency_score        ← TR (0–25)
 *   pricing_reliability_score ← CX (0–10)
 *   community_reputation_score ← 0 (removed from score; supplemental module TBD)
 *   overall_score             ← LV + PQ + TR + CX
 *
 * Run: npm run compute:scores
 */

import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "compute-scores";
const NOW = new Date();

// ── Types ──────────────────────────────────────────────────────────────────

type VendorRow = {
  id: string;
  slug: string;
  name: string;
  has_coa: boolean;
  finnrick_tests_count: number | null;
  status: string;
  shipping_free_threshold: number | null;
  shipping_flat_fee: number | null;
};

type LabTestRow = {
  vendor_id: string;
  test_type: string | null;
  purity_result: number | null;
  endotoxin_result: string | null;
  test_date: string | null;
  test_source: string | null;
};

type TransparencyRow = {
  vendor_id: string;
  has_contact_info: boolean;
  has_business_address: boolean;
  has_ownership_disclosure: boolean;
  has_lab_disclosure: boolean;
  has_testing_methodology: boolean;
  has_batch_numbers: boolean;
  domain_years: number | null;
  fda_warning: boolean;
  fraud_flags: boolean;
};

type PeptidePriceRow = {
  vendor_id: string;
  peptide_name: string;
  price_per_mg: number | null;
};

type MarketPriceRow = {
  peptide_key: string;
  avg_price_per_mg: number;
};

// ── 1. Lab Verification (max 40) ───────────────────────────────────────────

function lvTier(vendor: VendorRow, trans: TransparencyRow | undefined): number {
  if ((vendor.finnrick_tests_count ?? 0) > 0) return 4;
  if (!vendor.has_coa) return 0;
  // batch-specific 3rd-party COA
  if (trans?.has_lab_disclosure && trans?.has_batch_numbers) return 3;
  // 3rd-party COA (lab named, no batch IDs)
  if (trans?.has_lab_disclosure) return 2;
  // internal/unverified COA
  return 1;
}

const TIER_BASE: Record<number, number> = { 0: 0, 1: 5, 2: 15, 3: 25, 4: 40 };

function labVerificationScore(vendor: VendorRow, trans: TransparencyRow | undefined): number {
  const tier = lvTier(vendor, trans);

  if (tier < 4) return TIER_BASE[tier];

  // Tier 4: apply sampling confidence modifier
  const n = vendor.finnrick_tests_count ?? 0;
  if (n >= 10) return 40;
  if (n >= 4)  return 30 + Math.round((n - 4) * 1.5); // 4→30 … 9→37
  return 25 + Math.round((n - 1) * 2);                  // 1→25 … 3→29
}

// ── 2. Product Quality (max 25) ────────────────────────────────────────────

// Points per purity band per tier
const PQ_TABLE: Record<number, [number, number, number, number]> = {
  // tier: [fails(<90), low(90-95), mid(95-98), high(>98)]
  1: [0,  4,  7, 10],
  2: [0,  6, 11, 15],
  3: [0,  8, 14, 20],
  4: [0, 10, 18, 25],
};

function purityBandPoints(purity: number, tier: number): number {
  const row = PQ_TABLE[tier];
  if (!row) return 0;
  if (purity >= 98) return row[3];
  if (purity >= 95) return row[2];
  if (purity >= 90) return row[1];
  return row[0];
}

function monthsSince(dateStr: string | null): number {
  if (!dateStr) return 24; // treat unknown as 2 years old
  const d = new Date(dateStr);
  return (NOW.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function productQualityScore(
  vendorId: string,
  tier: number,
  tests: LabTestRow[]
): { score: number; hasQualityWarning: boolean } {
  const vendorTests = tests.filter(
    (t) => t.vendor_id === vendorId && t.test_type !== "Endotoxin" && t.purity_result !== null
  );

  // Quality warning: any test in last 6 months with purity <95% or endotoxin=high
  const recentTests = tests.filter(
    (t) => t.vendor_id === vendorId && monthsSince(t.test_date) <= 6
  );
  const hasQualityWarning = recentTests.some(
    (t) => (t.purity_result !== null && t.purity_result < 95) || t.endotoxin_result === "high"
  );

  if (vendorTests.length === 0 || tier === 0) {
    return { score: 0, hasQualityWarning };
  }

  // Recency-weighted average purity (decay half-life ~17 months)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const t of vendorTests) {
    const months = monthsSince(t.test_date);
    const w = Math.exp(-0.04 * months);
    weightedSum += (t.purity_result!) * w;
    totalWeight += w;
  }

  const avgPurity = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { score: purityBandPoints(avgPurity, tier), hasQualityWarning };
}

// ── 3. Transparency / Legitimacy (max 25) ─────────────────────────────────

function transparencyScore(trans: TransparencyRow | undefined): number {
  if (!trans) return 0;
  if (trans.fraud_flags) return 0;

  const positive =
    (trans.has_business_address     ? 5 : 0) +
    (trans.has_ownership_disclosure ? 5 : 0) +
    (trans.has_lab_disclosure       ? 5 : 0) +
    (trans.has_contact_info         ? 3 : 0) +
    (trans.has_testing_methodology  ? 3 : 0) +
    (trans.has_batch_numbers        ? 2 : 0) +
    ((trans.domain_years ?? 0) >= 2 ? 2 : 0);

  const penalized = Math.max(0, positive - (trans.fda_warning ? 10 : 0));

  if (penalized >= 18) return 25;
  if (penalized >=  9) return 16;
  if (penalized >=  1) return  8;
  return 0;
}

// ── 4. Customer Experience / Value (max 10 = pricing 6 + shipping 4) ─────────

const BLEND_RE = /\s*[&+]\s*|\b(?:mix|blend|stack|combo|combination|complex)\b/i;

function normalizePeptideName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s*[-–]\s*\d+\s*mg\b/gi, "")
    .replace(/\s+\d+\s*mg\b/gi, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\bvial\b|\bpeptide\b/gi, "")
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

// Pricing sub-score (max 6): price_per_mg vs market average
function pricingScore(
  vendorId: string,
  peptidePrices: PeptidePriceRow[],
  marketPrices: Map<string, number>
): number {
  const vendorProducts = peptidePrices.filter(
    (p) => p.vendor_id === vendorId && p.price_per_mg !== null && !BLEND_RE.test(p.peptide_name)
  );

  const ratios: number[] = [];
  for (const p of vendorProducts) {
    const key = normalizePeptideName(p.peptide_name);
    const mkt = marketPrices.get(key);
    if (!mkt) continue;
    ratios.push(p.price_per_mg! / mkt);
  }

  if (ratios.length === 0) return 3; // neutral — no comparable data

  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  if (avg < 0.85) return 6; // >15% below market
  if (avg < 0.95) return 5; // 5–15% below
  if (avg < 1.05) return 3; // within 5%
  if (avg < 1.15) return 1; // 5–15% above
  return 0;                  // >15% above market
}

// Shipping sub-score (max 4): free shipping threshold and flat fee
// Vendors with no data get 2 (neutral) — they aren't penalized for missing data.
function shippingScore(vendor: VendorRow): number {
  const { shipping_free_threshold: threshold, shipping_flat_fee: flat } = vendor;

  if (threshold == null && flat == null) return 2; // no data — neutral

  // Always free shipping (threshold = 0 means all orders, flat = 0 also means free)
  if (threshold === 0 || flat === 0) return 4;

  // Free threshold: the lower the better
  if (threshold != null) {
    if (threshold <= 100) return 4; // e.g. free shipping on $100+
    if (threshold <= 200) return 3; // e.g. free shipping on $150–200+
    return 2;                       // high threshold (>$200) — neutral
  }

  // Flat fee only (no free shipping option)
  if (flat != null && flat > 0) return 1;

  return 2; // fallback
}

function customerExperienceScore(
  vendor: VendorRow,
  peptidePrices: PeptidePriceRow[],
  marketPrices: Map<string, number>
): number {
  return pricingScore(vendor.id, peptidePrices, marketPrices) + shippingScore(vendor);
}

// ── Status tier ────────────────────────────────────────────────────────────

function deriveStatus(score: number, currentStatus: string): string {
  // Preserve flagged/closed/inactive — only update active vendors
  if (currentStatus !== "active") return currentStatus;
  if (score >= 75) return "active"; // "Recommended" display tier
  if (score >= 50) return "active"; // "Use With Caution" display tier
  return "active";                  // "Not Recommended"
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  log(SCRIPT, "Loading data…");

  const [
    { data: vendors,        error: e1 },
    { data: labTests,       error: e2 },
    { data: transparency,   error: e3 },
    { data: peptidePrices,  error: e4 },
    { data: marketPrices,   error: e5 },
  ] = await Promise.all([
    db.from("vendors")
      .select("id, slug, name, has_coa, finnrick_tests_count, status, shipping_free_threshold, shipping_flat_fee")
      .in("status", ["active", "flagged"]),

    db.from("lab_tests")
      .select("vendor_id, test_type, purity_result, endotoxin_result, test_date, test_source"),

    db.from("vendor_transparency")
      .select("vendor_id, has_contact_info, has_business_address, has_ownership_disclosure, has_lab_disclosure, has_testing_methodology, has_batch_numbers, domain_years, fda_warning, fraud_flags"),

    db.from("vendor_peptides")
      .select("vendor_id, peptide_name, price_per_mg")
      .not("price_per_mg", "is", null),

    db.from("peptide_market_prices")
      .select("peptide_key, avg_price_per_mg"),
  ]);

  for (const [err, label] of [[e1,"vendors"],[e2,"lab_tests"],[e3,"transparency"],[e4,"prices"],[e5,"market"]] as const) {
    if (err) { log(SCRIPT, `DB error (${label}): ${(err as any).message}`); process.exit(1); }
  }

  const vendorRows    = (vendors      ?? []) as VendorRow[];
  const testRows      = (labTests     ?? []) as LabTestRow[];
  const transRows     = (transparency ?? []) as TransparencyRow[];
  const priceRows     = (peptidePrices ?? []) as PeptidePriceRow[];
  const marketRows    = (marketPrices  ?? []) as MarketPriceRow[];

  // Index lookups
  const transById = new Map(transRows.map((t) => [t.vendor_id, t]));
  const marketMap = new Map(marketRows.map((m) => [m.peptide_key, m.avg_price_per_mg]));

  log(SCRIPT, `Scoring ${vendorRows.length} vendors…\n`);

  let updated = 0;

  for (const v of vendorRows) {
    const trans = transById.get(v.id);
    const tier  = lvTier(v, trans);

    const lv = labVerificationScore(v, trans);
    const { score: pq, hasQualityWarning } = productQualityScore(v.id, tier, testRows);
    const tr = transparencyScore(trans);
    const cx = customerExperienceScore(v, priceRows, marketMap);
    const overall = lv + pq + tr + cx;

    log(
      SCRIPT,
      `  ${v.name.padEnd(30)} T${tier}  LV=${String(lv).padStart(2)} PQ=${String(pq).padStart(2)} TR=${String(tr).padStart(2)} CX=${String(cx).padStart(2)}  → ${String(overall).padStart(3)}` +
      (hasQualityWarning ? "  ⚠ quality warning" : "")
    );

    const { error } = await db
      .from("vendors")
      .update({
        lab_testing_score:            lv,
        purity_accuracy_score:        pq,
        transparency_score:           tr,
        community_reputation_score:   0,   // removed from score
        pricing_reliability_score:    cx,
        overall_score:                overall,
        updated_at:                   new Date().toISOString(),
      })
      .eq("id", v.id);

    if (error) {
      log(SCRIPT, `  ✗ write error for ${v.slug}: ${error.message}`);
    } else {
      updated++;
    }

    await sleep(60);
  }

  log(SCRIPT, `\nDone. ${updated} vendors scored.`);
}

main();
