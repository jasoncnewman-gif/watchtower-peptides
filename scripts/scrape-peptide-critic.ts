/**
 * scripts/scrape-peptide-critic.ts
 * Scrapes Peptide Critic vendor pages via stealth browser.
 * Extracts star rating, review count, description, location, price range.
 * Writes peptide_critic_rating + peptide_critic_reviews_count to vendors table.
 *
 * Run: npm run scrape:peptide-critic
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";

puppeteerExtra.use(StealthPlugin());
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-peptide-critic";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://peptidecritic.com/vendor";

// ── Vendor slug → Peptide Critic URL slug ────────────────────────────────
// Only vendors confirmed to have a Peptide Critic page are listed.
// Vendors not present here get community_reputation_score = null (compute-scores defaults to 7).

const VENDOR_MAP: Record<string, string> = {
  "peptide-partners":       "peptide-partners",
  "ion-peptide":            "ion-peptides",
  "core-peptides":          "core-peptides",
  "limitless-biotech":      "limitless-life-nootropics",
  "ascension-peptides":     "ascension-peptides",
  "nexaph":                 "nexaph",
  "mile-high-compounds":    "mile-high-compounds",
  "crush-research":         "crush-research",
  "omegamino":              "omegamino",
  "orbitrex-peptides":      "orbitrex-peptides",
  "peptidology":            "peptidology",
  "swiss-chems":            "swiss-chems",
  "pure-rawz":              "pure-rawz",
  "loti-labs":              "loti-labs",
  "biotech-peptides":       "biotech-peptides",
  "paradigm-peptides":      "paradigm-peptides",
  "ez-peptides":            "ez-peptides",
  "glacier-aminos":         "glacier-aminos",
  "penguin-peptides":       "penguin-peptides",
  "paramount-peptides":     "paramount-peptides",
  "nuscience-peptides":     "nuscience-peptides",
  "southern-peptides":      "southern-aminos",
  "simple-peptide":         "simple-peptide",
  "verified-peptides":      "verified-peptides",
  "prime-peptides":         "prime-peptides",
  "astro-peptides":         "astro-peptides-usa",
  "peptide-crafters":       "peptide-crafters",
  "felix-chemical-supply":  "felix-chem",
};

// ── Scraper ───────────────────────────────────────────────────────────────

type PCResult = {
  slug: string;
  rating: number | null;
  reviewCount: number | null;
  description: string | null;
  location: string | null;
  priceRange: string | null;
};

async function scrapeVendor(browser: Browser, ourSlug: string, pcSlug: string): Promise<PCResult> {
  const url = `${BASE}/${pcSlug}`;
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);
  await page.setUserAgent(USER_AGENT);

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!response || response.status() === 404) {
      log(SCRIPT, `  — ${ourSlug}: 404`);
      return { slug: ourSlug, rating: null, reviewCount: null, description: null, location: null, priceRange: null };
    }

    await new Promise((r) => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const text = document.body?.innerText ?? "";

      // Rating: a number like "4.9" immediately followed by "(N reviews)"
      const ratingMatch = text.match(/([\d.]+)\s*\n\s*\((\d+)\s+reviews?\)/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const reviewCount = ratingMatch ? parseInt(ratingMatch[2], 10) : null;

      // Description: line after the reviews line (skip "Sign in to save favorites")
      const descMatch = text.match(/\(\d+\s+reviews?\)\s*\n([^\n]+)/i);
      const description = descMatch ? descMatch[1].trim() : null;

      // Location (line after "Location\n")
      const locMatch = text.match(/Location\s*\n([^\n]+)/i);
      const location = locMatch ? locMatch[1].trim() : null;

      // Price Range (line after "Price Range\n")
      const priceMatch = text.match(/Price Range\s*\n([^\n]+)/i);
      const priceRange = priceMatch ? priceMatch[1].trim() : null;

      return { rating, reviewCount, description, location, priceRange };
    });

    log(
      SCRIPT,
      `  ✓ ${ourSlug}: ${data.rating ?? "?"}/5  (${data.reviewCount ?? 0} reviews)  ${data.location ?? ""}`
    );

    return { slug: ourSlug, ...data };
  } catch (err) {
    log(SCRIPT, `  ✗ ${ourSlug}: ${(err as Error).message}`);
    return { slug: ourSlug, rating: null, reviewCount: null, description: null, location: null, priceRange: null };
  } finally {
    await page.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const entries = Object.entries(VENDOR_MAP);
  log(SCRIPT, `Scraping ${entries.length} vendors from Peptide Critic…`);

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser;

  try {
    for (const [ourSlug, pcSlug] of entries) {
      const result = await scrapeVendor(browser, ourSlug, pcSlug);

      const { error } = await db
        .from("vendors")
        .update({
          peptide_critic_rating:        result.rating,
          peptide_critic_reviews_count: result.reviewCount,
          updated_at:                   new Date().toISOString(),
        })
        .eq("slug", result.slug);

      if (error) log(SCRIPT, `  ✗ DB write failed for ${result.slug}: ${error.message}`);

      await sleep(1500);
    }
  } finally {
    await browser.close();
  }

  log(SCRIPT, "Done.");
}

main();
