/**
 * scripts/scrape-vendor-coas.ts
 * Uses Puppeteer to load each vendor's COA/lab-results page and detect
 * whether real COA content is present. Updates has_coa on the vendors table.
 * Also extracts COA PDF links and saves them to lab_tests when found.
 *
 * Run: npm run scrape:coas
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";

puppeteerExtra.use(StealthPlugin());
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-coas";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Vendor COA page URLs ──────────────────────────────────────────────────

type CoaConfig = {
  slug: string;
  coaUrl: string;
};

const VENDOR_CONFIGS: CoaConfig[] = [
  { slug: "peptide-partners",        coaUrl: "https://peptidepartners.com/pages/lab-results" },
  { slug: "ion-peptide",             coaUrl: "https://ionpeptide.com/coa" },
  { slug: "core-peptides",           coaUrl: "https://corepeptides.com/pages/certificates-of-analysis" },
  { slug: "limitless-biotech",       coaUrl: "https://limitlessbiotech.com/pages/lab-testing" },
  { slug: "ascension-peptides",      coaUrl: "https://ascensionpeptides.com/pages/coa" },
  { slug: "nexaph",                  coaUrl: "https://nexaph.com/lab-results" },
  { slug: "mile-high-compounds",     coaUrl: "https://milehighcompounds.com/pages/coa" },
  { slug: "crush-research",          coaUrl: "https://crushresearch.com/lab-testing" },
  { slug: "omegamino",               coaUrl: "https://omegamino.com/pages/coa" },
  { slug: "orbitrex-peptides",       coaUrl: "https://orbitrexpeptides.com/lab-results" },
  { slug: "peptidology",             coaUrl: "https://peptidology.com/pages/lab-results" },
  { slug: "swiss-chems",             coaUrl: "https://swisschems.is/pages/certificates" },
  { slug: "pure-rawz",               coaUrl: "https://purerawz.co/pages/coa" },
  { slug: "loti-labs",               coaUrl: "https://lotilabs.com/pages/lab-test-results" },
  { slug: "biotech-peptides",        coaUrl: "https://biotechpeptides.com/pages/certificates-of-analysis" },
  { slug: "sports-technology-labs",  coaUrl: "https://sportstechnologylabs.com/pages/lab-results" },
  { slug: "polaris-peptides",        coaUrl: "https://polarispeptides.com/pages/coa" },
  { slug: "pivot-labs",              coaUrl: "https://pivotlabs.com/pages/testing" },
  { slug: "ez-peptides",             coaUrl: "https://ezpeptides.com/pages/lab-results" },
  { slug: "skye-peptides",           coaUrl: "https://skyepeptides.com/pages/coa" },
  { slug: "bulk-peptide-supply",     coaUrl: "https://bulkpeptidesupply.com/pages/lab-results" },
  { slug: "astro-peptides",          coaUrl: "https://astropeptides.com/pages/certificates" },
  { slug: "dynamic-peptide",         coaUrl: "https://dynamicpeptide.com/pages/coa" },
  { slug: "glacier-aminos",          coaUrl: "https://glacieraminos.com/lab-results" },
  { slug: "penguin-peptides",        coaUrl: "https://penguinpeptides.com/pages/lab-testing" },
  { slug: "paramount-peptides",      coaUrl: "https://paramountpeptides.com/pages/coa" },
  { slug: "nuscience-peptides",      coaUrl: "https://nusciencepeptides.com/lab-results" },
  { slug: "southern-peptides",       coaUrl: "https://southernpeptides.com/pages/coa" },
  { slug: "simple-peptide",          coaUrl: "https://simplepeptide.com/pages/lab-results" },
  { slug: "verified-peptides",       coaUrl: "https://verifiedpeptides.com/pages/coa" },
  { slug: "aavant-research",         coaUrl: "https://aavantresearch.com/pages/lab-testing" },
  { slug: "nextechlabs",             coaUrl: "https://nextechlabs.com/pages/coa" },
  { slug: "apollo-peptide-sciences", coaUrl: "https://apollopeptidesciences.com/pages/lab-results" },
  { slug: "cernum-biosciences",      coaUrl: "https://cernumbiosciences.com/pages/certificates" },
  { slug: "peptide-crafters",        coaUrl: "https://peptidecrafters.com/pages/coa" },
  { slug: "lvlup-health",            coaUrl: "https://lvluphealth.com/pages/lab-results" },
  { slug: "healthgevity",            coaUrl: "https://healthgevity.com/pages/testing" },
];

// ── COA detection heuristics ──────────────────────────────────────────────

// Keywords that indicate real COA content (not just a "lab testing" marketing page)
const COA_CONTENT_KEYWORDS = [
  "certificate of analysis",
  "janoshik",
  "hplc",
  "lc-ms", "lc/ms",
  "purity:",
  "purity %",
  "test result",
  "lab result",
  "batch",
  "lot number",
  "download coa",
  "view coa",
  "pdf",
];

function hasCoaContent(text: string, linkHrefs: string[]): boolean {
  const lower = text.toLowerCase();
  const keywordHit = COA_CONTENT_KEYWORDS.some((kw) => lower.includes(kw));

  // Also count as COA if there are PDF or janoshik external links
  const linkHit = linkHrefs.some(
    (h) =>
      h.includes("janoshik") ||
      h.includes(".pdf") ||
      h.includes("coa") ||
      h.includes("lab-result")
  );

  return keywordHit || linkHit;
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function getVendorId(slug: string): Promise<string | null> {
  const { data } = await db.from("vendors").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

// ── Per-vendor COA check ──────────────────────────────────────────────────

async function checkCoaPage(browser: Browser, config: CoaConfig): Promise<void> {
  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `  ${config.slug}: not found in DB`);
    return;
  }

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  await page.setUserAgent(USER_AGENT);

  try {
    const response = await page.goto(config.coaUrl, { waitUntil: "networkidle2" });

    if (!response || response.status() === 404) {
      log(SCRIPT, `  ${config.slug}: COA page not found (${response?.status() ?? "no response"})`);
      await db.from("vendors").update({ has_coa: false }).eq("id", vendorId);
      return;
    }

    // Short wait for lazy-loaded content
    await new Promise((r) => setTimeout(r, 1500));

    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    const linkHrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href)
    );

    const hasCoa = hasCoaContent(bodyText, linkHrefs);

    await db.from("vendors").update({ has_coa: hasCoa }).eq("id", vendorId);

    if (hasCoa) {
      log(SCRIPT, `  ✓ ${config.slug}: COA content detected`);

      // Save any discovered COA links as basic lab_test records
      const coaLinks = linkHrefs.filter(
        (h) => h.includes("janoshik") || h.includes(".pdf") || h.includes("coa")
      );
      if (coaLinks.length > 0) {
        const now = new Date().toISOString();
        // Remove stale records first
        await db.from("lab_tests").delete().eq("vendor_id", vendorId);
        const rows = coaLinks.slice(0, 50).map((href) => ({
          vendor_id:       vendorId,
          peptide_name:    null,
          lab_name:        href.includes("janoshik") ? "Janoshik" : null,
          test_type:       null,
          purity_result:   null,
          test_date:       null,
          janoshik_tested: href.includes("janoshik"),
          coa_url:         href,
          verified:        false,
        }));
        await db.from("lab_tests").insert(rows);
        log(SCRIPT, `  ✓ ${config.slug}: ${rows.length} COA links saved`);
      }
    } else {
      log(SCRIPT, `  — ${config.slug}: no COA content found at ${config.coaUrl}`);
    }
  } catch (err) {
    log(SCRIPT, `  ✗ ${config.slug}: ${(err as Error).message}`);
  } finally {
    await page.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  log(SCRIPT, `Processing ${VENDOR_CONFIGS.length} vendors…`);

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser;

  try {
    for (const config of VENDOR_CONFIGS) {
      await checkCoaPage(browser, config);
      await sleep(1500);
    }
  } finally {
    await browser.close();
  }

  log(SCRIPT, "Done.");
}

main();
