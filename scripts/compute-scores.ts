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
  overall_score: number | null;
  finnrick_rating: string | null;
  finnrick_score: number | null;
  finnrick_tests_count: number | null;
  has_coa: boolean;
  status: string;
};

// ── Scoring functions ─────────────────────────────────────────────────────

function labTestingScore(testsCount: number | null, grade: string | null): number {
  if (!testsCount || testsCount === 0) return 0;

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

// Placeholder until Peptide Critic data is in
function communityReputationScore(): number {
  return 8;
}

// Placeholder until pricing data is in
function pricingReliabilityScore(): number {
  return 6;
}

// ── Status derivation (matches lib/supabase.ts logic) ────────────────────

function deriveStatus(score: number): string {
  if (score >= 80) return "recommended";
  if (score >= 55) return "caution";
  return "not-recommended";
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, slug, name, overall_score, finnrick_rating, finnrick_score, finnrick_tests_count, has_coa, status")
    .in("status", ["active", "flagged"]);

  if (error) {
    console.error("Failed to load vendors:", error.message);
    process.exit(1);
  }

  const rows = (vendors ?? []) as DbVendorRow[];
  log(SCRIPT, `Computing scores for ${rows.length} vendors…`);

  let updated = 0;
  let skipped = 0;

  for (const v of rows) {
    // Skip vendors with a manually set overall_score > 0
    if (v.overall_score && v.overall_score > 0) {
      log(SCRIPT, `  ${v.name}: skipped (manual score ${v.overall_score})`);
      skipped++;
      continue;
    }

    const lab        = labTestingScore(v.finnrick_tests_count, v.finnrick_rating);
    const purity     = purityAccuracyScore(v.finnrick_rating, v.finnrick_score);
    const trans      = transparencyScore(v.has_coa);
    const community  = communityReputationScore();
    const pricing    = pricingReliabilityScore();
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
