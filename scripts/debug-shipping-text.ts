/**
 * scripts/debug-shipping-text.ts
 * Dumps the raw text from a vendor's shipping page so we can
 * diagnose why the regex patterns aren't matching.
 *
 * Usage: VENDOR_SLUG=polaris-peptides npm run debug:shipping:text
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";
import { sleep } from "./lib/scraper.js";

puppeteerExtra.use(StealthPlugin());

const VENDOR_URLS: Record<string, string> = {
  "peptide-partners":        "https://peptide.partners",
  "core-peptides":           "https://www.corepeptides.com",
  "limitless-biotech":       "https://limitlessbiotech.us",
  "ascension-peptides":      "https://ascensionpeptides.com",
  "orbitrex-peptides":       "https://orbitrexpeptide.is",
  "biotech-peptides":        "https://biotechpeptides.com",
  "polaris-peptides":        "https://polarispeptides.com",
  "skye-peptides":           "https://skyepeptides.com",
  "bulk-peptide-supply":     "https://bulkpeptidesupply.com",
  "astro-peptides":          "https://astropeptides.com",
  "dynamic-peptide":         "https://dynamicpeptide.com",
  "penguin-peptides":        "https://penguinpeptides.com",
  "paramount-peptides":      "https://paramountpeptides.com",
  "nuscience-peptides":      "https://nusciencepeptides.com",
  "southern-peptides":       "https://southern-peptides-llc.myshopify.com",
  "simple-peptide":          "https://simplepeptide.com",
  "verified-peptides":       "https://verifiedpeptides.com",
  "nextechlabs":             "https://nextechlaboratories.com",
  "apollo-peptide-sciences": "https://apollopeptidesciences.com",
  "cernum-biosciences":      "https://cernumbiosciences.com",
  "peptide-crafters":        "https://peptidecrafters.com",
  "lvlup-health":            "https://lvluphealth.com",
  "healthgevity":            "https://healthgev.com",
  "pivot-labs":              "https://pivotlabs.us",
};

async function main() {
  const slug = process.env.VENDOR_SLUG;
  if (!slug) {
    console.log("Usage: VENDOR_SLUG=polaris-peptides npm run debug:shipping:text");
    console.log("Available slugs:", Object.keys(VENDOR_URLS).join(", "));
    process.exit(1);
  }

  const baseUrl = VENDOR_URLS[slug];
  if (!baseUrl) {
    console.error(`Unknown slug: ${slug}`);
    process.exit(1);
  }

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as Browser;

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  const paths = [
    "/policies/shipping",
    "/shipping-policy",
    "/pages/shipping-policy",
    "/pages/shipping",
    "/shipping",
  ];

  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    console.log(`\n─── ${url} ───`);
    try {
      const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
      if (!resp || resp.status() >= 400) {
        console.log(`  HTTP ${resp?.status() ?? "error"}`);
        continue;
      }
      await sleep(500);
      const text = await page.evaluate(() => document.body?.innerText ?? "");
      // Show first 800 chars to find shipping-relevant text
      const preview = text.replace(/\s+/g, " ").slice(0, 800);
      console.log("  " + preview);
    } catch (e: any) {
      console.log(`  ERROR: ${e.message?.slice(0, 80)}`);
    }
  }

  await browser.close();
}

main();
