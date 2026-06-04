/**
 * scripts/scrape-shipping-puppeteer.ts
 * Puppeteer-based shipping & payment scraper for all vendors.
 * Checks shipping policy pages and homepage for free-threshold, flat-fee,
 * international shipping flag, and payment methods (CC/crypto/PayPal).
 *
 * Run: npm run scrape:shipping:puppeteer
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import { db } from "./lib/client.js";
import { sleep } from "./lib/scraper.js";

puppeteerExtra.use(StealthPlugin());

const SCRIPT = "scrape-shipping-puppeteer";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

// ── Vendor catalog → base URL map (from scrape-vendor-products.ts) ────────

const VENDOR_URLS: Record<string, string> = {
  "peptide-partners":        "https://peptide.partners",
  "core-peptides":           "https://www.corepeptides.com",
  "limitless-biotech":       "https://limitlessbiotech.us",
  "ascension-peptides":      "https://ascensionpeptides.com",
  "nexaph":                  "https://nexaph.com",
  "crush-research":          "https://crushresearch.shop",
  "orbitrex-peptides":       "https://orbitrexpeptide.is",
  "swiss-chems":             "https://swisschems.is",
  "pure-rawz":               "https://purerawz.co",
  "biotech-peptides":        "https://biotechpeptides.com",
  "sports-technology-labs":  "https://sportstechnologylabs.com",
  "polaris-peptides":        "https://polarispeptides.com",
  "ez-peptides":             "https://ezpeptides.com",
  "skye-peptides":           "https://skyepeptides.com",
  "bulk-peptide-supply":     "https://bulkpeptidesupply.com",
  "astro-peptides":          "https://astropeptides.com",
  "dynamic-peptide":         "https://dynamicpeptide.com",
  "glacier-aminos":          "https://glaciersaminos.com",
  "penguin-peptides":        "https://penguinpeptides.com",
  "paramount-peptides":      "https://paramountpeptides.com",
  "nuscience-peptides":      "https://nusciencepeptides.com",
  "southern-peptides":       "https://southern-peptides-llc.myshopify.com",
  "simple-peptide":          "https://simplepeptide.com",
  "verified-peptides":       "https://verifiedpeptides.com",
  "aavant-research":         "https://aavantacr.com",
  "nextechlabs":             "https://nextechlaboratories.com",
  "apollo-peptide-sciences": "https://apollopeptidesciences.com",
  "cernum-biosciences":      "https://cernumbiosciences.com",
  "peptide-crafters":        "https://peptidecrafters.com",
  "lvlup-health":            "https://lvluphealth.com",
  "healthgevity":            "https://healthgev.com",
  "pivot-labs":              "https://pivotlabs.us",
  "loti-labs":               "https://lotilabs.com",
  "felix-chemical-supply":   "https://felixchemical.com",
  "alpha-biomed-labs":       "https://alphabiomedlabs.com",
  "mile-high-compounds":     "https://milehighcompounds.com",
  "omegamino":               "https://omegamino.com",
};

// ── Text-extraction helpers ───────────────────────────────────────────────

const FREE_THRESHOLD_PATTERNS = [
  /free\s+shipping\s+on\s+(?:all\s+)?orders?\s+(?:over|above|of)?\s*\$\s*(\d+(?:\.\d+)?)/i,
  /free\s+shipping\s+(?:on\s+orders?\s+)?\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more|and\s+over)/i,
  /orders?\s+(?:over|above)\s+\$\s*(\d+(?:\.\d+)?)\s+(?:get|receive|qualify\s+for)?\s*free\s+shipping/i,
  /\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more)\s+(?:gets?\s+)?free\s+shipping/i,
  /free\s+shipping\s+with\s+(?:a\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:minimum|order)/i,
  /complimentary\s+(?:standard\s+)?shipping\s+on\s+(?:all\s+)?(?:domestic\s+)?orders?\s+(?:over|above|exceeding)\s+\$\s*(\d+(?:\.\d+)?)/i,
  /spend\s+\$\s*(\d+(?:\.\d+)?)\s+(?:or\s+more\s+)?(?:to\s+get\s+|for\s+)?free\s+shipping/i,
  /free\s+(?:standard\s+)?shipping\s+on\s+(?:all\s+)?(?:domestic\s+)?orders?\s+(?:over|above|exceeding|of)\s+\$\s*(\d+(?:\.\d+)?)/i,
  /(?:domestic\s+)?orders?\s+\$\s*(\d+(?:\.\d+)?)\s+(?:and\s+)?(?:over|above|up)\s+(?:ship|receive|qualify\s+for)?\s*free/i,
  /minimum\s+order\s+(?:of\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:for\s+)?free\s+(?:standard\s+)?shipping/i,
  /free\s+(?:USPS|UPS|FedEx|priority)\s+shipping\s+(?:on\s+orders?\s+)?(?:over|above)\s+\$\s*(\d+(?:\.\d+)?)/i,
];

const FREE_ALL_PATTERNS = [
  /free\s+shipping\s+on\s+all\s+(?:domestic\s+)?orders?(?:\s+in\s+the\s+(?:US|USA|United\s+States))?(?!\s+over|\s+above|\s+of|\s+\$)/i,
  /always\s+free\s+(?:domestic\s+)?shipping/i,
  /free\s+(?:standard\s+)?shipping\s+always/i,
  /we\s+offer\s+free\s+shipping\s+on\s+(?:all\s+)?(?:domestic\s+)?orders?(?!\s+over|\s+above)/i,
];

const FLAT_FEE_PATTERNS = [
  /flat[\s-]rate\s+shipping\s+(?:fee\s+)?(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /\$\s*(\d+(?:\.\d+)?)\s+flat[\s-]rate\s+shipping/i,
  /flat\s+(?:shipping\s+)?fee\s+(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /shipping\s+fee\s+(?:is\s+)?(?:only\s+)?\$\s*(\d+(?:\.\d+)?)/i,
];

const INTL_PATTERNS = [
  /we\s+ship\s+(?:world[-\s]?wide|internationally|to\s+(?:most\s+)?(?:countries|international))/i,
  /international\s+(?:orders?|shipping|customers?)\s+(?:are\s+)?(?:accepted|welcome|available)/i,
  /ship(?:ping)?\s+to\s+(?:over\s+)?\d+\s+countries/i,
  /available\s+(?:for\s+)?international\s+shipping/i,
];

const NO_INTL_PATTERNS = [
  /(?:only\s+ship|domestic\s+only|US\s+only|continental\s+US\s+only)/i,
  /we\s+(?:currently\s+)?do\s+not\s+ship\s+internationally/i,
  /no\s+international\s+shipping/i,
];

interface ShippingResult {
  shipping_free_threshold?: number;
  shipping_flat_fee?: number;
  ships_internationally?: boolean;
  credit_card_accepted?: boolean;
  crypto_accepted?: boolean;
  paypal_accepted?: boolean;
}

function extractShipping(text: string): ShippingResult {
  const t = text.replace(/\s+/g, " ");
  const result: ShippingResult = {};

  // Free threshold
  for (const pat of FREE_ALL_PATTERNS) {
    if (pat.test(t)) { result.shipping_free_threshold = 0; break; }
  }
  if (result.shipping_free_threshold === undefined) {
    for (const pat of FREE_THRESHOLD_PATTERNS) {
      const m = t.match(pat);
      if (m) { result.shipping_free_threshold = parseFloat(m[1]); break; }
    }
  }

  // Flat fee
  for (const pat of FLAT_FEE_PATTERNS) {
    const m = t.match(pat);
    if (m) { result.shipping_flat_fee = parseFloat(m[1]); break; }
  }

  // International shipping
  if (NO_INTL_PATTERNS.some(p => p.test(t))) {
    result.ships_internationally = false;
  } else if (INTL_PATTERNS.some(p => p.test(t))) {
    result.ships_internationally = true;
  }

  // Payment methods
  if (/\b(visa|mastercard|credit\s+card|debit\s+card|amex|american\s+express|discover)\b/i.test(t)) {
    result.credit_card_accepted = true;
  }
  if (/\b(bitcoin|ethereum|crypto(?:currency)?|btc|eth|usdc|usdt|monero|litecoin)\b/i.test(t)) {
    result.crypto_accepted = true;
  }
  if (/\b(paypal|pay\s+pal)\b/i.test(t)) {
    result.paypal_accepted = true;
  }

  return result;
}

// ── Puppeteer page text fetcher ───────────────────────────────────────────

async function getPageText(page: Page, url: string): Promise<string | null> {
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    if (!resp || resp.status() >= 400) return null;
    await sleep(500);
    return await page.evaluate(() => document.body?.innerText ?? "");
  } catch {
    return null;
  }
}

// ── Per-vendor scraping ───────────────────────────────────────────────────

async function scrapeVendor(page: Page, slug: string, baseUrl: string): Promise<ShippingResult> {
  const origin = baseUrl.replace(/\/$/, "");
  const merged: ShippingResult = {};

  // Paths to try for shipping policy (most likely first)
  const shippingPaths = [
    "/policies/shipping",      // Shopify
    "/shipping-policy",        // WooCommerce / custom
    "/pages/shipping-policy",  // Shopify alt
    "/pages/shipping",
    "/shipping",
    "/info/shipping",
  ];

  for (const path of shippingPaths) {
    const text = await getPageText(page, `${origin}${path}`);
    if (!text) continue;
    const extracted = extractShipping(text);
    if (extracted.shipping_free_threshold !== undefined || extracted.shipping_flat_fee !== undefined) {
      Object.assign(merged, extracted);
      break;
    }
    await sleep(300);
  }

  // Homepage footer for payment methods (if not yet found)
  const needsPayment = merged.credit_card_accepted === undefined &&
                       merged.crypto_accepted === undefined &&
                       merged.paypal_accepted === undefined;
  if (needsPayment) {
    const homeText = await getPageText(page, origin);
    if (homeText) {
      const extracted = extractShipping(homeText);
      if (extracted.credit_card_accepted) merged.credit_card_accepted = true;
      if (extracted.crypto_accepted) merged.crypto_accepted = true;
      if (extracted.paypal_accepted) merged.paypal_accepted = true;
      // Also pick up shipping threshold from homepage if still missing
      if (merged.shipping_free_threshold === undefined && extracted.shipping_free_threshold !== undefined) {
        merged.shipping_free_threshold = extracted.shipping_free_threshold;
      }
      if (merged.ships_internationally === undefined && extracted.ships_internationally !== undefined) {
        merged.ships_internationally = extracted.ships_internationally;
      }
    }
  }

  return merged;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, name, slug, website")
    .order("name");

  if (error) { log(`DB error: ${error.message}`); process.exit(1); }

  // Build slug → DB id map
  const vendorMap = new Map((vendors ?? []).map(v => [v.slug, { id: v.id, name: v.name }]));

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }) as Browser;

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 800 });

  const slugs = Object.keys(VENDOR_URLS);
  log(`Scraping shipping info for ${slugs.length} vendors with Puppeteer…\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const slug of slugs) {
    const baseUrl = VENDOR_URLS[slug];
    const vendor = vendorMap.get(slug);

    if (!vendor) {
      log(`  SKIP ${slug.padEnd(35)} — not in DB`);
      continue;
    }

    process.stdout.write(`  ${vendor.name.padEnd(35)}`);

    try {
      const result = await scrapeVendor(page, slug, baseUrl);

      const hasData = Object.keys(result).length > 0;
      if (hasData) {
        const { error: upErr } = await db
          .from("vendors")
          .update(result)
          .eq("id", vendor.id);

        if (upErr) {
          console.log(`✗ DB error: ${upErr.message}`);
          errors++;
        } else {
          const parts: string[] = [];
          if (result.shipping_free_threshold === 0) parts.push("free all");
          else if (result.shipping_free_threshold != null) parts.push(`free $${result.shipping_free_threshold}+`);
          if (result.shipping_flat_fee != null) parts.push(`flat $${result.shipping_flat_fee}`);
          if (result.ships_internationally) parts.push("intl");
          if (result.credit_card_accepted) parts.push("CC");
          if (result.crypto_accepted) parts.push("crypto");
          if (result.paypal_accepted) parts.push("PayPal");
          console.log(`✓  ${parts.join(" | ")}`);
          updated++;
        }
      } else {
        console.log("—  not found");
        notFound++;
      }
    } catch (err: any) {
      console.log(`✗ ${err.message?.slice(0, 60) ?? "error"}`);
      errors++;
    }

    await sleep(800);
  }

  await browser.close();

  console.log(`\nDone. ${updated} updated, ${notFound} not found, ${errors} errors.`);
}

main();
