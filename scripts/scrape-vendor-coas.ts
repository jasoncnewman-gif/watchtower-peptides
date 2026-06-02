/**
 * scripts/scrape-vendor-coas.ts
 * Finds each vendor's COA/lab results page, extracts test records,
 * writes to lab_tests table, and updates has_coa on the vendors table.
 *
 * COA page patterns across vendors:
 *  - Dedicated /coa or /lab-results page with a table or list of test cards
 *  - Individual product pages with "View COA" / "Download COA" PDF links
 *  - Janoshik-hosted result pages (external links from vendor site)
 *
 * ⚠️  SELECTOR VERIFICATION REQUIRED
 * Verify coaUrl and selectors for each vendor against the live site.
 *
 * Run: npm run scrape:coas
 */

import { db } from "./lib/client.js";
import { fetchHtml, clean, log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-coas";

// ── Vendor COA config ─────────────────────────────────────────────────────

type CoaVendorConfig = {
  slug: string;
  coaUrl: string;           // Direct COA/lab-results page URL
  selectors: CoaSelectors;
};

type CoaSelectors = {
  testRow:     string;  // container per lab test record
  labName:     string;  // lab name within row
  peptideName: string;  // peptide/product name within row
  testType:    string;  // test type (HPLC, LC-MS, etc.)
  purity:      string;  // purity result (numeric %)
  testDate:    string;  // test date
  coaLink:     string;  // link to COA PDF or external result
};

const DEFAULT_SEL: CoaSelectors = {
  testRow:     ".coa-row, .lab-result, .test-result, tr, .result-item",
  labName:     ".lab-name, .laboratory, td:nth-child(1)",
  peptideName: ".product-name, .peptide, td:nth-child(2)",
  testType:    ".test-type, .method, td:nth-child(3)",
  purity:      ".purity, .result, .pass, td:nth-child(4)",
  testDate:    ".test-date, .date, td:nth-child(5)",
  coaLink:     'a[href*="coa"], a[href*="pdf"], a[href*="lab"], a[href*="janoshik"]',
};

const VENDOR_CONFIGS: CoaVendorConfig[] = [
  { slug: "peptide-partners",       coaUrl: "https://peptidepartners.com/pages/lab-results",              selectors: DEFAULT_SEL },
  { slug: "ion-peptide",            coaUrl: "https://ionpeptide.com/coa",                                 selectors: DEFAULT_SEL },
  { slug: "core-peptides",          coaUrl: "https://corepeptides.com/pages/certificates-of-analysis",    selectors: DEFAULT_SEL },
  { slug: "limitless-biotech",      coaUrl: "https://limitlessbiotech.com/pages/lab-testing",             selectors: DEFAULT_SEL },
  { slug: "ascension-peptides",     coaUrl: "https://ascensionpeptides.com/pages/coa",                   selectors: DEFAULT_SEL },
  { slug: "nexaph",                 coaUrl: "https://nexaph.com/lab-results",                             selectors: DEFAULT_SEL },
  { slug: "mile-high-compounds",    coaUrl: "https://milehighcompounds.com/pages/coa",                   selectors: DEFAULT_SEL },
  { slug: "crush-research",         coaUrl: "https://crushresearch.com/lab-testing",                     selectors: DEFAULT_SEL },
  { slug: "omegamino",              coaUrl: "https://omegamino.com/pages/coa",                           selectors: DEFAULT_SEL },
  { slug: "orbitrex-peptides",      coaUrl: "https://orbitrexpeptides.com/lab-results",                  selectors: DEFAULT_SEL },
  { slug: "peptidology",            coaUrl: "https://peptidology.com/pages/lab-results",                 selectors: DEFAULT_SEL },
  { slug: "swiss-chems",            coaUrl: "https://swisschems.is/pages/certificates",                  selectors: DEFAULT_SEL },
  { slug: "pure-rawz",              coaUrl: "https://purerawz.co/pages/coa",                             selectors: DEFAULT_SEL },
  { slug: "loti-labs",              coaUrl: "https://lotilabs.com/pages/lab-test-results",               selectors: DEFAULT_SEL },
  { slug: "biotech-peptides",       coaUrl: "https://biotechpeptides.com/pages/certificates-of-analysis",selectors: DEFAULT_SEL },
  { slug: "sports-technology-labs", coaUrl: "https://sportstechnologylabs.com/pages/lab-results",        selectors: DEFAULT_SEL },
  { slug: "polaris-peptides",       coaUrl: "https://polarispeptides.com/pages/coa",                     selectors: DEFAULT_SEL },
  { slug: "pivot-labs",             coaUrl: "https://pivotlabs.com/pages/testing",                       selectors: DEFAULT_SEL },
  { slug: "ez-peptides",            coaUrl: "https://ezpeptides.com/pages/lab-results",                  selectors: DEFAULT_SEL },
  { slug: "skye-peptides",          coaUrl: "https://skyepeptides.com/pages/coa",                        selectors: DEFAULT_SEL },
  { slug: "bulk-peptide-supply",    coaUrl: "https://bulkpeptidesupply.com/pages/lab-results",           selectors: DEFAULT_SEL },
  { slug: "astro-peptides",         coaUrl: "https://astropeptides.com/pages/certificates",              selectors: DEFAULT_SEL },
  { slug: "dynamic-peptide",        coaUrl: "https://dynamicpeptide.com/pages/coa",                     selectors: DEFAULT_SEL },
  { slug: "glacier-aminos",         coaUrl: "https://glacieraminos.com/lab-results",                     selectors: DEFAULT_SEL },
  { slug: "penguin-peptides",       coaUrl: "https://penguinpeptides.com/pages/lab-testing",             selectors: DEFAULT_SEL },
  { slug: "paramount-peptides",     coaUrl: "https://paramountpeptides.com/pages/coa",                   selectors: DEFAULT_SEL },
  { slug: "nuscience-peptides",     coaUrl: "https://nusciencepeptides.com/lab-results",                 selectors: DEFAULT_SEL },
  { slug: "southern-peptides",      coaUrl: "https://southernpeptides.com/pages/coa",                    selectors: DEFAULT_SEL },
  { slug: "simple-peptide",         coaUrl: "https://simplepeptide.com/pages/lab-results",               selectors: DEFAULT_SEL },
  { slug: "verified-peptides",      coaUrl: "https://verifiedpeptides.com/pages/coa",                    selectors: DEFAULT_SEL },
  { slug: "aavant-research",        coaUrl: "https://aavantresearch.com/pages/lab-testing",              selectors: DEFAULT_SEL },
  { slug: "nextechlabs",            coaUrl: "https://nextechlabs.com/pages/coa",                         selectors: DEFAULT_SEL },
  { slug: "apollo-peptide-sciences",coaUrl: "https://apollopeptidesciences.com/pages/lab-results",       selectors: DEFAULT_SEL },
  { slug: "cernum-biosciences",     coaUrl: "https://cernumbiosciences.com/pages/certificates",          selectors: DEFAULT_SEL },
  { slug: "peptide-crafters",       coaUrl: "https://peptidecrafters.com/pages/coa",                     selectors: DEFAULT_SEL },
  { slug: "lvlup-health",           coaUrl: "https://lvluphealth.com/pages/lab-results",                 selectors: DEFAULT_SEL },
  { slug: "healthgevity",           coaUrl: "https://healthgevity.com/pages/testing",                    selectors: DEFAULT_SEL },
  { slug: "ion-peptide",            coaUrl: "https://ionpeptide.com/coa",                                 selectors: DEFAULT_SEL },
];

// Recognized lab names (partial match)
const KNOWN_LABS = [
  "janoshik", "trustpointe", "bioregen", "chromate", "kovera",
  "freedom diagnostics", "intertek", "eurofins", "anaspec",
  "peptide sciences lab", "altus biologics",
];

// Recognized test types
const TEST_TYPES = ["hplc", "lc-ms", "lc/ms", "nmr", "gc-ms", "gc/ms", "mass spec", "endotoxin"];

function detectTestType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const t of TEST_TYPES) {
    if (lower.includes(t)) return t.toUpperCase().replace("/", "-");
  }
  return null;
}

function detectLabName(text: string): string | null {
  const lower = text.toLowerCase();
  for (const lab of KNOWN_LABS) {
    if (lower.includes(lab)) {
      return lab.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return null;
}

function parsePurity(text: string): number | null {
  // Match "99.4%", "99.4 %", "purity: 99.4", "pass (99.4)"
  const match = text.match(/(9\d\.?\d*)\s*%?/);
  return match ? parseFloat(match[1]) : null;
}

function parseDate(text: string): string | null {
  // Try ISO, then M/D/Y, then Month YYYY
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const mdyMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdyMatch) return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, "0")}-${mdyMatch[2].padStart(2, "0")}`;
  return null;
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function getVendorId(slug: string): Promise<string | null> {
  const { data } = await db.from("vendors").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

// ── Scraper ───────────────────────────────────────────────────────────────

type LabTestRow = {
  vendor_id: string;
  peptide_name: string | null;
  lab_name: string | null;
  test_type: string | null;
  purity_result: number | null;
  test_date: string | null;
  janoshik_tested: boolean;
  coa_url: string | null;
  verified: boolean;
};

async function scrapeCoaPage(config: CoaVendorConfig): Promise<void> {
  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `${config.slug}: not found in DB`);
    return;
  }

  let $;
  try {
    $ = await fetchHtml(config.coaUrl);
  } catch (err) {
    log(SCRIPT, `${config.slug}: ✗ ${(err as Error).message}`);
    return;
  }

  const sel = config.selectors;
  const rows: LabTestRow[] = [];
  const pageText = $("body").text();

  // Scan explicit test row elements
  $(sel.testRow).each((_, el) => {
    const rowText = $(el).text();

    const labName    = detectLabName($(el).find(sel.labName).text()) ??
                       detectLabName(rowText);
    const peptide    = clean($(el).find(sel.peptideName).first().text());
    const testType   = detectTestType($(el).find(sel.testType).text()) ??
                       detectTestType(rowText);
    const purity     = parsePurity($(el).find(sel.purity).text()) ??
                       parsePurity(rowText);
    const dateStr    = parseDate($(el).find(sel.testDate).text()) ??
                       parseDate(rowText);
    const coaHref    = $(el).find(sel.coaLink).attr("href") ?? null;
    const coaUrl     = coaHref
      ? coaHref.startsWith("http") ? coaHref : config.coaUrl + coaHref
      : null;

    if (!purity && !labName && !coaUrl) return; // skip empty rows

    rows.push({
      vendor_id:       vendorId,
      peptide_name:    peptide,
      lab_name:        labName,
      test_type:       testType,
      purity_result:   purity,
      test_date:       dateStr,
      janoshik_tested: (labName ?? "").toLowerCase().includes("janoshik") ||
                       (coaUrl ?? "").includes("janoshik"),
      coa_url:         coaUrl,
      verified:        purity !== null && purity >= 95,
    });
  });

  // Also collect any bare COA/PDF links not inside a table row
  if (rows.length === 0) {
    $('a[href*="coa"], a[href*="pdf"], a[href*="janoshik"], a[href*="lab"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const coaUrl = href.startsWith("http") ? href : config.coaUrl + href;
      const linkText = $(el).text();
      rows.push({
        vendor_id:       vendorId,
        peptide_name:    clean(linkText),
        lab_name:        detectLabName(pageText),
        test_type:       detectTestType(linkText),
        purity_result:   null,
        test_date:       null,
        janoshik_tested: coaUrl.includes("janoshik"),
        coa_url:         coaUrl,
        verified:        false,
      });
    });
  }

  const hasCoa = rows.length > 0;

  if (!hasCoa) {
    log(SCRIPT, `${config.slug}: no COA data found — verify coaUrl and selectors`);
    await db.from("vendors").update({ has_coa: false }).eq("id", vendorId);
    return;
  }

  // Delete stale lab_test rows for this vendor, then insert fresh
  await db.from("lab_tests").delete().eq("vendor_id", vendorId);
  const { error } = await db.from("lab_tests").insert(rows);
  if (error) {
    log(SCRIPT, `${config.slug}: ✗ DB write failed — ${error.message}`);
    return;
  }

  await db.from("vendors").update({ has_coa: true }).eq("id", vendorId);
  log(SCRIPT, `${config.slug}: ✓ ${rows.length} test records saved`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // De-duplicate slugs (iron-peptide listed twice above for example)
  const seen = new Set<string>();
  const configs = VENDOR_CONFIGS.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });

  log(SCRIPT, `Processing ${configs.length} vendors…`);

  for (const config of configs) {
    await scrapeCoaPage(config);
    await sleep(1000);
  }

  log(SCRIPT, "Done.");
}

main();
