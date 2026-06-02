/**
 * scripts/scrape-finnrick.ts
 * Scrapes finnrick.com vendor pages using JSON-LD structured data embedded in
 * each page — no CSS selectors needed, no JS execution required.
 *
 * Data extracted per vendor:
 *   finnrick_rating      — best grade across tested products (A–E scale, A=best)
 *   finnrick_score       — ratingValue × 2, on a 0–10 scale
 *   finnrick_tests_count — total independent lab tests run
 *   finnrick_url         — canonical Finnrick page URL
 *
 * Run: npm run scrape:finnrick
 */

import { db } from "./lib/client.js";
import { sleep, log } from "./lib/scraper.js";

const SCRIPT = "scrape-finnrick";
const BASE_URL = "https://www.finnrick.com";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Vendor map: our DB slug → Finnrick URL slug ───────────────────────────
// Vendors not listed here have no Finnrick data and are skipped.
const VENDOR_SLUG_MAP: Record<string, string> = {
  "peptide-partners":       "peptide-partners",
  "nexaph":                 "nexaph",
  "omegamino":              "omegamino",
  "orbitrex-peptides":      "orbitrex-peptides",
  "peptidology":            "peptidology",
  "swiss-chems":            "swiss-chems",
  "pure-rawz":              "pure-rawz",
  "peptide-crafters":       "peptide-crafters",
  "loti-labs":              "loti-labs",
  "polaris-peptides":       "polaris-peptides",
  "ez-peptides":            "ez-peptides",
  "skye-peptides":          "skye-peptides",
  "bulk-peptide-supply":    "bulk-peptide-supply",
  "astro-peptides":         "astro-peptides",
  "paramount-peptides":     "paramount-peptides",
  "nuscience-peptides":     "nuscience-peptides",
  "simple-peptide":         "simple-peptide",
  "verified-peptides":      "verified-peptides",
  "aavant-research":        "aavant-research",
  "nextechlabs":            "nextechlabs",
  // flagged/closed vendors with Finnrick data
  "amino-asylum":           "amino-asylum",
  "paradigm-peptides":      "paradigm-peptide",   // Finnrick uses singular
  "peptide-sciences":       "peptide-sciences",
  "science-bio":            "science",
  "prime-peptides":         "prime-peptides",
};

// ── JSON-LD extraction ────────────────────────────────────────────────────

type FinnrickData = {
  finnrick_rating: string | null;
  finnrick_score: number | null;
  finnrick_tests_count: number | null;
  finnrick_url: string;
};

function parseJsonLd(html: string, pageUrl: string): FinnrickData | null {
  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ];

  for (const block of blocks) {
    let items: unknown[];
    try {
      const parsed = JSON.parse(block[1]);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      continue;
    }

    for (const item of items as Record<string, unknown>[]) {
      // Review is nested inside the vendor's Organization object
      const review = item["review"] as Record<string, unknown> | undefined;
      if (!review || review["@type"] !== "Review") continue;

      const rating = review["reviewRating"] as Record<string, unknown>;
      const ratingValue = rating?.ratingValue
        ? parseFloat(rating.ratingValue as string)
        : null;

      const body = (review["reviewBody"] as string) ?? "";

      // Test count: "74 independent laboratory tests"
      const countMatch = body.match(/(\d+) independent laboratory test/);
      const testCount = countMatch ? parseInt(countMatch[1], 10) : null;

      // Best grade achieved: "rating range: X (best) to Y (worst)"
      // "(best)" marks the highest-performing product; A is Finnrick's top grade.
      // We store the alphabetically-earliest grade as the vendor's primary rating.
      const gradeMatches = [...body.matchAll(/([A-F][+-]?)\s*\((?:best|worst)\)/gi)];
      let bestGrade: string | null = null;
      for (const m of gradeMatches) {
        const g = m[1].toUpperCase();
        if (!bestGrade || g.charCodeAt(0) < bestGrade.charCodeAt(0)) {
          bestGrade = g;
        }
      }

      // Convert ratingValue (1–5) to 0–10 scale
      const finnrickScore =
        ratingValue !== null ? parseFloat((ratingValue * 2).toFixed(1)) : null;

      return {
        finnrick_rating: bestGrade,
        finnrick_score: finnrickScore,
        finnrick_tests_count: testCount,
        finnrick_url: pageUrl,
      };
    }
  }

  return null;
}

// ── Fetch one vendor page ─────────────────────────────────────────────────

async function fetchVendor(
  ourSlug: string,
  finnrickSlug: string
): Promise<{ slug: string; data: FinnrickData } | null> {
  const url = `${BASE_URL}/vendors/${finnrickSlug}`;
  await sleep(1500);
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      log(SCRIPT, `  ${ourSlug}: HTTP ${res.status}`);
      return null;
    }
    const html = await res.text();
    const data = parseJsonLd(html, url);
    if (!data) {
      log(SCRIPT, `  ${ourSlug}: no Review JSON-LD found`);
      return null;
    }
    log(
      SCRIPT,
      `  ${ourSlug}: grade=${data.finnrick_rating ?? "—"}  score=${data.finnrick_score ?? "—"}  tests=${data.finnrick_tests_count ?? "—"}`
    );
    return { slug: ourSlug, data };
  } catch (err) {
    log(SCRIPT, `  ${ourSlug}: ${(err as Error).message}`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const entries = Object.entries(VENDOR_SLUG_MAP);
  log(SCRIPT, `Scraping ${entries.length} vendors from ${BASE_URL}…`);

  let saved = 0;
  let skipped = 0;

  for (const [ourSlug, finnrickSlug] of entries) {
    const result = await fetchVendor(ourSlug, finnrickSlug);
    if (!result) { skipped++; continue; }

    const { error } = await db
      .from("vendors")
      .update({
        finnrick_rating:      result.data.finnrick_rating,
        finnrick_score:       result.data.finnrick_score,
        finnrick_tests_count: result.data.finnrick_tests_count,
        finnrick_url:         result.data.finnrick_url,
        updated_at:           new Date().toISOString(),
      })
      .eq("slug", result.slug);

    if (error) {
      log(SCRIPT, `  ✗ DB write failed for ${result.slug}: ${error.message}`);
      skipped++;
    } else {
      saved++;
    }

    await sleep(200);
  }

  log(SCRIPT, `Done. ${saved} vendors updated, ${skipped} skipped.`);
}

main();
