/**
 * scripts/scrape-shipping-targeted.ts
 * Re-runs shipping scraper only for active, non-gated vendors with no data yet.
 * Also tries cart/checkout pages which often show free shipping thresholds.
 *
 * Run: npm run scrape:shipping:targeted
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import { db } from "./lib/client.js";
import { sleep } from "./lib/scraper.js";

puppeteerExtra.use(StealthPlugin());

const SCRIPT = "scrape-shipping-targeted";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

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
  /enjoy\s+free\s+(?:standard\s+)?shipping\s+on\s+(?:all\s+)?(?:orders?\s+)?(?:over|above|of)\s+\$\s*(\d+(?:\.\d+)?)/i,
  /free\s+shipping\s+(?:for\s+)?(?:all\s+)?(?:orders?\s+)?(?:totaling\s+|that\s+total\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:or\s+more|and\s+above|\+)/i,
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

interface ShippingResult {
  shipping_free_threshold?: number;
  shipping_flat_fee?: number;
  ships_internationally?: boolean;
  credit_card_accepted?: boolean;
  crypto_accepted?: boolean;
  paypal_accepted?: boolean;
}

function extract(text: string): ShippingResult {
  const t = text.replace(/\s+/g, " ");
  const result: ShippingResult = {};

  for (const pat of FREE_ALL_PATTERNS) {
    if (pat.test(t)) { result.shipping_free_threshold = 0; break; }
  }
  if (result.shipping_free_threshold === undefined) {
    for (const pat of FREE_THRESHOLD_PATTERNS) {
      const m = t.match(pat);
      if (m) { result.shipping_free_threshold = parseFloat(m[1]); break; }
    }
  }
  for (const pat of FLAT_FEE_PATTERNS) {
    const m = t.match(pat);
    if (m) { result.shipping_flat_fee = parseFloat(m[1]); break; }
  }
  if (/we\s+ship\s+(?:world[-\s]?wide|internationally)|international\s+(?:orders?|shipping)\s+(?:are\s+)?(?:accepted|welcome|available)/i.test(t)) {
    result.ships_internationally = true;
  }
  if (/\b(visa|mastercard|credit\s+card|debit\s+card|amex|american\s+express)\b/i.test(t)) result.credit_card_accepted = true;
  if (/\b(bitcoin|ethereum|crypto(?:currency)?|btc|eth|usdc|usdt)\b/i.test(t)) result.crypto_accepted = true;
  if (/\b(paypal)\b/i.test(t)) result.paypal_accepted = true;

  return result;
}

async function getText(page: Page, url: string): Promise<string | null> {
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    if (!resp || resp.status() >= 400) return null;
    await sleep(400);
    return await page.evaluate(() => document.body?.innerText ?? "");
  } catch { return null; }
}

async function scrapeVendor(page: Page, baseUrl: string): Promise<ShippingResult> {
  const origin = baseUrl.replace(/\/$/, "");
  const merged: ShippingResult = {};

  const paths = [
    "/policies/shipping",
    "/shipping-policy",
    "/pages/shipping-policy",
    "/pages/shipping",
    "/shipping",
    "/cart",       // cart pages often show free shipping progress bar
    "/",           // homepage footer/banners
  ];

  for (const path of paths) {
    const text = await getText(page, `${origin}${path}`);
    if (!text) continue;
    const r = extract(text);

    if (r.shipping_free_threshold !== undefined && merged.shipping_free_threshold === undefined)
      merged.shipping_free_threshold = r.shipping_free_threshold;
    if (r.shipping_flat_fee !== undefined && merged.shipping_flat_fee === undefined)
      merged.shipping_flat_fee = r.shipping_flat_fee;
    if (r.ships_internationally && !merged.ships_internationally)
      merged.ships_internationally = true;
    if (r.credit_card_accepted && !merged.credit_card_accepted)
      merged.credit_card_accepted = true;
    if (r.crypto_accepted && !merged.crypto_accepted)
      merged.crypto_accepted = true;
    if (r.paypal_accepted && !merged.paypal_accepted)
      merged.paypal_accepted = true;

    if (merged.shipping_free_threshold !== undefined || merged.shipping_flat_fee !== undefined) break;
    await sleep(300);
  }

  return merged;
}

async function main() {
  // Only target active vendors with no shipping data yet
  const { data: vendors } = await db
    .from("vendors")
    .select("id, name, slug, website")
    .eq("status", "active")
    .is("shipping_free_threshold", null)
    .is("shipping_flat_fee", null)
    .order("name");

  // Exclude gated vendors
  const GATED = new Set(["alpha-biomed-labs", "felix-chemical-supply", "loti-labs",
    "mile-high-compounds", "omegamino", "ascension-peptides", "polaris-peptides"]);

  const targets = (vendors ?? []).filter(v =>
    v.website && !GATED.has(v.slug)
  );

  log(`Targeting ${targets.length} vendors with no shipping data…\n`);

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }) as Browser;

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });

  let updated = 0;

  for (const vendor of targets) {
    process.stdout.write(`  ${vendor.name.padEnd(35)}`);
    try {
      const result = await scrapeVendor(page, vendor.website);
      if (Object.keys(result).length > 0) {
        await db.from("vendors").update(result).eq("id", vendor.id);
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
      } else {
        console.log("—  not found");
      }
    } catch (e: any) {
      console.log(`✗ ${e.message?.slice(0, 60) ?? "error"}`);
    }
    await sleep(600);
  }

  await browser.close();
  console.log(`\nDone. ${updated} updated.`);
}

main();
