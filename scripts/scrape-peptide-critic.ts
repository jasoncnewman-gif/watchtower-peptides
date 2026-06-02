/**
 * scripts/scrape-peptide-critic.ts
 * Scrapes Peptide Critic vendor review pages and writes results to vendors table.
 *
 * Extracts: star rating, review count, review verbatims (up to 3 positive + 3 negative),
 * coupon codes, credit card accepted flag, established year, and location.
 *
 * ⚠️  SELECTOR VERIFICATION REQUIRED
 * Inspect live Peptide Critic vendor pages and confirm the CSS selectors below.
 *
 * Run: npm run scrape:peptide-critic
 */

import { db } from "./lib/client.js";
import { fetchHtml, clean, parsePrice, log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-peptide-critic";

const BASE_URL = "https://peptidecritic.com";

// Our vendor slug → Peptide Critic URL for that vendor's reviews page
const VENDOR_TARGETS: Record<string, string> = {
  "peptide-partners":       `${BASE_URL}/vendor/peptide-partners`,
  "ion-peptide":            `${BASE_URL}/vendor/ion-peptide`,
  "core-peptides":          `${BASE_URL}/vendor/core-peptides`,
  "limitless-biotech":      `${BASE_URL}/vendor/limitless-biotech`,
  "ascension-peptides":     `${BASE_URL}/vendor/ascension-peptides`,
  "nexaph":                 `${BASE_URL}/vendor/nexaph`,
  "mile-high-compounds":    `${BASE_URL}/vendor/mile-high-compounds`,
  "crush-research":         `${BASE_URL}/vendor/crush-research`,
  "omegamino":              `${BASE_URL}/vendor/omegamino`,
  "orbitrex-peptides":      `${BASE_URL}/vendor/orbitrex-peptides`,
  "peptidology":            `${BASE_URL}/vendor/peptidology`,
  "swiss-chems":            `${BASE_URL}/vendor/swisschems`,
  "pure-rawz":              `${BASE_URL}/vendor/pure-rawz`,
  "loti-labs":              `${BASE_URL}/vendor/loti-labs`,
  "biotech-peptides":       `${BASE_URL}/vendor/biotech-peptides`,
  "sports-technology-labs": `${BASE_URL}/vendor/sports-technology-labs`,
  "polaris-peptides":       `${BASE_URL}/vendor/polaris-peptides`,
  "pivot-labs":             `${BASE_URL}/vendor/pivot-labs`,
  "skye-peptides":          `${BASE_URL}/vendor/skye-peptides`,
  "loti-labs-2":            `${BASE_URL}/vendor/loti-labs`,
};

// ── Selectors ─────────────────────────────────────────────────────────────
const SEL = {
  starRating:       ".star-rating, .rating-value, [data-rating], .vendor-score",
  reviewCount:      ".review-count, .reviews-total, [data-review-count]",
  // Individual review cards
  reviewCard:       ".review-card, .review-item, .user-review",
  reviewText:       ".review-text, .review-body, p",
  reviewSentiment:  ".sentiment, .review-type, [data-sentiment]",
  // Vendor metadata
  couponCode:       ".coupon-code, .promo-code, [data-coupon]",
  creditCard:       ".payment-method, .accepts-cc, [data-payment]",
  established:      ".established, .founded-year, [data-established]",
  location:         ".location, .vendor-location, [data-location]",
};

// ── Types ─────────────────────────────────────────────────────────────────

type PeptideCriticResult = {
  slug: string;
  peptide_critic_rating: number | null;
  peptide_critic_reviews_count: number | null;
  peptide_critic_url: string;
  coupon_code: string | null;
  credit_card_accepted: boolean;
  established_year: number | null;
  location: string | null;
  review_1: string | null;
  review_2: string | null;
  review_3: string | null;
  positive_review_summary: string | null;
  negative_review_summary: string | null;
};

// ── Scraper ───────────────────────────────────────────────────────────────

async function scrapeVendorPage(
  vendorSlug: string,
  url: string
): Promise<PeptideCriticResult | null> {
  try {
    const $ = await fetchHtml(url);

    // Star rating (expect "4.2" or "4.2/5" or "84")
    const ratingRaw = clean($(SEL.starRating).first().text());
    const rating = ratingRaw
      ? parseFloat(ratingRaw.match(/([\d.]+)/)?.[1] ?? "") || null
      : null;

    // Review count
    const countRaw = clean($(SEL.reviewCount).first().text());
    const reviewCount = countRaw
      ? parseInt(countRaw.replace(/[^0-9]/g, ""), 10) || null
      : null;

    // Coupon code — look for text matching pattern like "SAVE10", "PEPTIDE15", etc.
    let coupon: string | null = null;
    $(SEL.couponCode).each((_, el) => {
      const txt = clean($(el).text());
      if (txt && /^[A-Z0-9]{3,20}$/.test(txt)) {
        coupon = txt;
        return false; // break
      }
    });
    // Fallback: scan all text for inline coupon patterns
    if (!coupon) {
      const bodyText = $("body").text();
      const couponMatch = bodyText.match(
        /(?:coupon|promo|code|discount)[:\s]+([A-Z0-9]{4,20})/i
      );
      if (couponMatch) coupon = couponMatch[1];
    }

    // Credit card accepted
    const ccText = $(SEL.creditCard).text().toLowerCase() + $("body").text().toLowerCase();
    const creditCardAccepted =
      ccText.includes("credit card") || ccText.includes("visa") || ccText.includes("mastercard");

    // Established year
    const estRaw = clean($(SEL.established).first().text());
    let establishedYear: number | null = null;
    if (estRaw) {
      const yearMatch = estRaw.match(/(20\d{2})/);
      if (yearMatch) establishedYear = parseInt(yearMatch[1], 10);
    }
    if (!establishedYear) {
      const bodyYearMatch = $("body").text().match(/(?:founded|established|since)\s+(20\d{2})/i);
      if (bodyYearMatch) establishedYear = parseInt(bodyYearMatch[1], 10);
    }

    // Location
    const location = clean($(SEL.location).first().text());

    // Review verbatims — collect up to 3, labelled by sentiment if available
    const reviews: { text: string; positive: boolean }[] = [];
    $(SEL.reviewCard).each((_, el) => {
      if (reviews.length >= 6) return false;
      const text = clean($(el).find(SEL.reviewText).first().text());
      const sentimentEl = $(el).find(SEL.reviewSentiment).text().toLowerCase();
      const positive = sentimentEl.includes("positive") || sentimentEl.includes("good") ||
        !sentimentEl.includes("negative");
      if (text && text.length > 20) {
        reviews.push({ text, positive });
      }
    });

    const positiveReviews = reviews.filter((r) => r.positive).map((r) => r.text);
    const negativeReviews = reviews.filter((r) => !r.positive).map((r) => r.text);

    log(
      SCRIPT,
      `  ${vendorSlug}: rating=${rating}  reviews=${reviewCount}  coupon=${coupon}`
    );

    return {
      slug: vendorSlug,
      peptide_critic_rating: rating,
      peptide_critic_reviews_count: reviewCount,
      peptide_critic_url: url,
      coupon_code: coupon,
      credit_card_accepted: creditCardAccepted,
      established_year: establishedYear,
      location: location,
      review_1: positiveReviews[0] ?? null,
      review_2: positiveReviews[1] ?? null,
      review_3: negativeReviews[0] ?? null,
      positive_review_summary: positiveReviews.slice(0, 3).join(" | ") || null,
      negative_review_summary: negativeReviews.slice(0, 3).join(" | ") || null,
    };
  } catch (err) {
    log(SCRIPT, `  ✗ ${vendorSlug}: ${(err as Error).message}`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const targets = Object.entries(VENDOR_TARGETS);
  log(SCRIPT, `Scraping ${targets.length} vendor pages from ${BASE_URL}…`);

  for (const [vendorSlug, url] of targets) {
    const result = await scrapeVendorPage(vendorSlug, url);
    if (!result) continue;

    const { error } = await db
      .from("vendors")
      .update({
        peptide_critic_rating:        result.peptide_critic_rating,
        peptide_critic_reviews_count: result.peptide_critic_reviews_count,
        peptide_critic_url:           result.peptide_critic_url,
        coupon_code:                  result.coupon_code,
        credit_card_accepted:         result.credit_card_accepted,
        established_year:             result.established_year,
        location:                     result.location,
        review_1:                     result.review_1,
        review_2:                     result.review_2,
        review_3:                     result.review_3,
        positive_review_summary:      result.positive_review_summary,
        negative_review_summary:      result.negative_review_summary,
        updated_at:                   new Date().toISOString(),
      })
      .eq("slug", result.slug);

    if (error) {
      log(SCRIPT, `  ✗ DB write failed for ${result.slug}: ${error.message}`);
    } else {
      log(SCRIPT, `  ✓ Saved ${result.slug}`);
    }

    await sleep(200);
  }

  log(SCRIPT, "Done.");
}

main();
