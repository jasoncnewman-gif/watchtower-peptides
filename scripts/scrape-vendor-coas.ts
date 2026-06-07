/**
 * scripts/scrape-vendor-coas.ts
 * Uses Puppeteer to load each vendor's COA/lab-results page and detect
 * whether real COA content is present. Updates has_coa on the vendors table.
 * Also extracts COA PDF links and saves them to lab_tests when found.
 *
 * Run: npm run scrape:coas
 */

import type { Browser } from "puppeteer";
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

// Puppeteer is lazy-imported in main() so the stealth plugin doesn't patch
// Node's fetch before the Supabase DB queries complete (same fix as scrape-gated-vendors.ts).

const SCRIPT = "scrape-coas";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Vendor COA page URLs ──────────────────────────────────────────────────
// Primary source: coa_url column on vendors table (set via seed-vendor-creds.ts).
// The FALLBACK_CONFIGS below are used for vendors that pre-date the DB column
// or haven't been seeded yet.

type CoaConfig = {
  slug: string;
  coaUrl: string;
};

const FALLBACK_CONFIGS: CoaConfig[] = [
  { slug: "peptide-partners",        coaUrl: "https://peptidepartners.com/pages/lab-results" },
  { slug: "ion-peptide",             coaUrl: "https://ionpeptide.com/lab-results/" },
  { slug: "core-peptides",           coaUrl: "https://corepeptides.com/pages/certificates-of-analysis" },
  { slug: "limitless-biotech",       coaUrl: "https://limitlessbiotech.us/pages/lab-testing" },
  { slug: "ascension-peptides",      coaUrl: "https://ascensionpeptides.com/pages/coa" },
  { slug: "nexaph",                  coaUrl: "https://nexaph.com/lab-results" },
  { slug: "mile-high-compounds",     coaUrl: "https://milehighcompounds.is/pages/coa" },
  { slug: "crush-research",          coaUrl: "https://crushresearch.shop/lab-testing" },
  { slug: "omegamino",               coaUrl: "https://omegamino.net/pages/coa" },
  { slug: "orbitrex-peptides",       coaUrl: "https://orbitrexpeptide.is/coas/" },
  { slug: "peptidology",             coaUrl: "https://peptidology.co/certificates/" },
  { slug: "swiss-chems",             coaUrl: "https://swisschems.is/pages/certificates" },
  { slug: "pure-rawz",               coaUrl: "https://purerawz.co/pages/coa" },
  { slug: "loti-labs",               coaUrl: "https://lotilabs.com/coas-updated/" },
  { slug: "biotech-peptides",        coaUrl: "https://biotechpeptides.com/pages/certificates-of-analysis" },
  { slug: "sports-technology-labs",  coaUrl: "https://sportstechnologylabs.com/pages/lab-results" },
  { slug: "polaris-peptides",        coaUrl: "https://polarispeptides.com/pages/coa" },
  { slug: "pivot-labs",              coaUrl: "https://pivotlabs.com/pages/testing" },
  { slug: "ez-peptides",             coaUrl: "https://ezpeptides.com/coa/" },
  { slug: "skye-peptides",           coaUrl: "https://skyepeptides.com/pages/coa" },
  { slug: "bulk-peptide-supply",     coaUrl: "https://bulkpeptidesupply.com/coa-library/" },
  { slug: "astro-peptides",          coaUrl: "https://astropeptides.com/pages/certificates" },
  { slug: "dynamic-peptide",         coaUrl: "https://dynamicpeptide.com/pages/coa" },
  { slug: "glacier-aminos",          coaUrl: "https://glaciersaminos.com/coas" },
  { slug: "penguin-peptides",        coaUrl: "https://penguinpeptides.com/pages/lab-testing" },
  { slug: "paramount-peptides",      coaUrl: "https://paramountpeptides.com/coa/" },
  { slug: "nuscience-peptides",      coaUrl: "https://nusciencepeptides.com/nuscience-lab-test-results/" },
  { slug: "southern-peptides",       coaUrl: "https://southern-peptides-llc.myshopify.com/pages/coa" },
  { slug: "simple-peptide",          coaUrl: "https://simplepeptide.com/pages/lab-results" },
  { slug: "verified-peptides",       coaUrl: "https://verifiedpeptides.com/lab-reports/" },
  { slug: "aavant-research",         coaUrl: "https://aavantacr.com/test-result-coas/" },
  { slug: "nextechlabs",             coaUrl: "https://nextechlaboratories.com/pages/coa" },
  { slug: "apollo-peptide-sciences", coaUrl: "https://apollopeptidesciences.com/pages/lab-results" },
  { slug: "cernum-biosciences",      coaUrl: "https://cernumbiosciences.com/pages/certificates" },
  { slug: "peptide-crafters",        coaUrl: "https://peptidecrafters.com/lab-test-reports/" },
  { slug: "lvlup-health",            coaUrl: "https://lvluphealth.com/pages/lab-results" },
  { slug: "healthgevity",            coaUrl: "https://healthgev.com/pages/testing" },
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

// COA-related link keywords (for homepage nav discovery)
const COA_LINK_KEYWORDS = ["coa", "lab", "certificate", "test result", "analysis", "purity", "janoshik"];

function isCoaNavLink(href: string, text: string): boolean {
  const h = href.toLowerCase();
  const t = text.toLowerCase();
  return COA_LINK_KEYWORDS.some((kw) => h.includes(kw) || t.includes(kw));
}

async function getPageContent(page: import("puppeteer").Page, url: string): Promise<{ body: string; links: string[] } | null> {
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!response || response.status() === 404) return null;
    await new Promise((r) => setTimeout(r, 2500));
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href)
    );
    return { body, links };
  } catch {
    return null;
  }
}

async function discoverCoaUrl(page: import("puppeteer").Page, baseUrl: string): Promise<string | null> {
  const { protocol, hostname } = new URL(baseUrl);
  const homeUrl = `${protocol}//${hostname}`;
  const content = await getPageContent(page, homeUrl);
  if (!content) return null;

  // Find COA-related links in the homepage
  const candidates = await page.evaluate((keywords: string[]) => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ href: (a as HTMLAnchorElement).href, text: a.textContent?.trim() ?? "" }))
      .filter(({ href, text }) => {
        const h = href.toLowerCase();
        const t = text.toLowerCase();
        return keywords.some((kw) => h.includes(kw) || t.includes(kw));
      })
      .map(({ href }) => href);
  }, COA_LINK_KEYWORDS);

  return candidates[0] ?? null;
}

async function saveCoaLinks(vendorId: string, slug: string, linkHrefs: string[]): Promise<void> {
  const coaLinks = linkHrefs.filter((h) => {
    // Must be an actual document link, not a page anchor or nav link
    if (h.includes("#") && !h.includes("janoshik")) return false;
    if (h.includes("login") || h.includes("account") || h.includes("cart")) return false;
    return h.includes("janoshik") || h.includes(".pdf");
  });
  if (coaLinks.length === 0) return;
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
  log(SCRIPT, `  ✓ ${slug}: ${rows.length} COA links saved`);
}

async function checkCoaPage(browser: Browser, config: CoaConfig): Promise<void> {
  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `  ${config.slug}: not found in DB`);
    return;
  }

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);
  await page.setUserAgent(USER_AGENT);

  try {
    // Stage 1: try the configured COA URL
    let content = await getPageContent(page, config.coaUrl);

    // Stage 2: if 404/error, discover from homepage nav
    if (!content) {
      log(SCRIPT, `  ${config.slug}: guessed URL failed — searching homepage for COA links…`);
      const discovered = await discoverCoaUrl(page, config.coaUrl);
      if (discovered && discovered !== config.coaUrl) {
        log(SCRIPT, `  ${config.slug}: found candidate → ${discovered}`);
        content = await getPageContent(page, discovered);
      }
    }

    if (!content) {
      log(SCRIPT, `  — ${config.slug}: no COA page found`);
      await db.from("vendors").update({ has_coa: false }).eq("id", vendorId);
      return;
    }

    let hasCoa = hasCoaContent(content.body, content.links);

    // Stage 3: configured URL had a page but no COA content — try homepage discovery
    if (!hasCoa) {
      log(SCRIPT, `  ${config.slug}: configured URL has no COA content — trying homepage discovery…`);
      const discovered = await discoverCoaUrl(page, config.coaUrl);
      if (discovered && discovered !== config.coaUrl) {
        log(SCRIPT, `  ${config.slug}: found candidate → ${discovered}`);
        const discoveredContent = await getPageContent(page, discovered);
        if (discoveredContent) {
          hasCoa = hasCoaContent(discoveredContent.body, discoveredContent.links);
          if (hasCoa) content = discoveredContent;
        }
      }
    }

    await db.from("vendors").update({ has_coa: hasCoa }).eq("id", vendorId);

    if (hasCoa) {
      log(SCRIPT, `  ✓ ${config.slug}: COA content detected`);
      await saveCoaLinks(vendorId, config.slug, content.links);
    } else {
      log(SCRIPT, `  — ${config.slug}: no COA content found`);
    }
  } catch (err) {
    log(SCRIPT, `  ✗ ${config.slug}: ${(err as Error).message}`);
  } finally {
    await page.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Optional: pass slug args to target specific vendors, e.g. "npm run scrape:coas -- ion-peptide loti-labs"
  const filter = process.argv.slice(2);

  // Pull coa_url from DB for vendors that have it set; merge with fallback config list
  const { data: dbRows } = await db
    .from("vendors")
    .select("slug, coa_url")
    .not("coa_url", "is", null);

  const dbCoaMap = new Map<string, string>(
    (dbRows ?? []).filter((r: any) => r.coa_url).map((r: any) => [r.slug, r.coa_url])
  );

  // Start from fallback list, override/add with DB values
  const fallbackMap = new Map(FALLBACK_CONFIGS.map((c) => [c.slug, c.coaUrl]));
  for (const [slug, url] of dbCoaMap) fallbackMap.set(slug, url);
  const allConfigs: CoaConfig[] = Array.from(fallbackMap.entries()).map(([slug, coaUrl]) => ({ slug, coaUrl }));

  const configs = filter.length
    ? allConfigs.filter((c) => filter.includes(c.slug))
    : allConfigs;

  log(SCRIPT, `Processing ${configs.length} vendors${filter.length ? ` (filtered: ${filter.join(", ")})` : ""}…`);

  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  }) as Browser;

  try {
    for (const config of configs) {
      await checkCoaPage(browser, config);
      await sleep(1500);
    }
  } finally {
    await browser.close();
  }

  log(SCRIPT, "Done.");
}

main();
