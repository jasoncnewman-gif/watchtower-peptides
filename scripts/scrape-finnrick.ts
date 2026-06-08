/**
 * scripts/scrape-finnrick.ts
 * Scrapes per-test data from finnrick.com vendor pages.
 * Requires Puppeteer — Finnrick is a JS-rendered Next.js site (no __NEXT_DATA__).
 *
 * Stores individual test rows in lab_tests with test_source='finnrick'.
 * Clean re-scrape: deletes existing finnrick rows before each vendor, then re-inserts.
 *
 * Run: npm run scrape:finnrick
 *      npm run scrape:finnrick -- paradigm-peptides loti-labs
 */

import type { Browser, Page } from "puppeteer";
import { db } from "./lib/client.js";
import { sleep, log } from "./lib/scraper.js";

const SCRIPT = "scrape-finnrick";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ── Types ──────────────────────────────────────────────────────────────────

type TestRow = {
  vendor_id: string;
  test_source: string;
  test_date: string | null;
  peptide_name: string | null;
  container_desc: string | null;
  test_type: string;
  purity_result: number | null;
  label_claim_mg: number | null;
  tested_amount_mg: number | null;
  difference_pct: number | null;
  endotoxin_result: string | null;
  finnrick_score: number | null;
  batch_number: string | null;
  lab_name: string | null;
  verified: boolean;
};

// ── Header mapping ─────────────────────────────────────────────────────────

type ColMap = {
  date: number;
  compound: number;
  container: number;
  purity: number;
  labelClaim: number;
  tested: number;
  difference: number;
  endotoxin: number;
  score: number;
  batch: number;
  lab: number;
};

// Some Finnrick table headers include extra leading columns (e.g. checkbox, group header)
// that have no corresponding <td> in tbody rows. offset corrects for this.
function mapHeaders(headers: string[], offset = 0): Partial<ColMap> {
  const map: Partial<ColMap> = {};
  headers.forEach((h, headerIdx) => {
    const i = headerIdx - offset; // actual data column index
    if (i < 0) return;
    // Strip sort-indicator characters (⌃ ↑ ↓) and normalize
    const n = h.toLowerCase().trim().replace(/[⌃↑↓]/g, "").replace(/[\s_-]+/g, " ").trim();
    // Order matters: more-specific patterns first to prevent partial matches
    if (n === "tested at" || n === "lab" || n.includes("laboratory")) map.lab = i;
    else if (n.includes("date"))                                       map.date = i;
    else if (n.includes("compound") || n.includes("peptide") || n.includes("product")) map.compound = i;
    else if (n.includes("container"))                                  map.container = i;
    else if (n.includes("purity"))                                     map.purity = i;
    else if (n.includes("claim") || n === "label")                    map.labelClaim = i;
    else if (n.includes("tested") || n.includes("measured"))          map.tested = i;
    else if (n.includes("diff") || n.includes("delta"))               map.difference = i;
    else if (n.includes("endotoxin") || n.includes("toxin"))          map.endotoxin = i;
    else if (n.includes("score") || n.includes("finnrick"))           map.score = i;
    else if (n.includes("batch"))                                      map.batch = i;
  });
  return map;
}

// ── Value parsers ──────────────────────────────────────────────────────────

function cell(cells: string[], idx: number | undefined): string {
  if (idx === undefined || idx < 0 || idx >= cells.length) return "";
  return cells[idx].trim();
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

function parsePurity(s: string): number | null {
  const m = s.match(/([\d.]+)\s*%?/);
  return m ? parseFloat(m[1]) : null;
}

function parseDate(s: string): string | null {
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function parseEndotoxin(s: string): string | null {
  const lower = s.toLowerCase();
  if (lower.includes("low") || lower.includes("pass")) return "low";
  if (lower.includes("high") || lower.includes("fail")) return "high";
  return null;
}

// ── Row parser ─────────────────────────────────────────────────────────────

function parseRow(
  cells: string[],
  cols: Partial<ColMap>,
  vendorId: string
): TestRow | null {
  const peptide = cell(cells, cols.compound);
  if (!peptide) return null; // skip empty/header rows

  // Endotoxin-only rows: score cell contains text "Endotoxins" instead of a number
  const scoreRaw = cell(cells, cols.score);
  const isEndotoxinOnly = /endotoxin/i.test(scoreRaw);

  // Always read endotoxin result from the endotoxin column (scoreRaw only identifies the type)
  const endoRaw = cell(cells, cols.endotoxin);

  return {
    vendor_id: vendorId,
    test_source: "finnrick",
    test_date: parseDate(cell(cells, cols.date)),
    peptide_name: peptide,
    container_desc: cell(cells, cols.container) || null,
    test_type: isEndotoxinOnly ? "Endotoxin" : "HPLC",
    purity_result: isEndotoxinOnly ? null : parsePurity(cell(cells, cols.purity)),
    label_claim_mg: parseNum(cell(cells, cols.labelClaim)),
    tested_amount_mg: parseNum(cell(cells, cols.tested)),
    difference_pct: parseNum(cell(cells, cols.difference)),
    endotoxin_result: parseEndotoxin(endoRaw),
    finnrick_score: isEndotoxinOnly ? null : parseNum(scoreRaw),
    batch_number: cell(cells, cols.batch) || null,
    lab_name: cell(cells, cols.lab) || null,
    verified: true,
  };
}

// ── Puppeteer scrape ───────────────────────────────────────────────────────

async function scrapeVendor(
  page: Page,
  vendorId: string,
  slug: string,
  finnrickUrl: string
): Promise<TestRow[]> {
  log(SCRIPT, `  ${slug}: ${finnrickUrl}`);

  try {
    await page.goto(finnrickUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("table tbody tr", { timeout: 20000 });
  } catch {
    log(SCRIPT, `  ${slug}: no test table found`);
    return [];
  }

  const extracted = await page.evaluate(() => {
    // Pick the table with the most rows (the test results table)
    const tables = Array.from(document.querySelectorAll("table"));
    const best = tables.reduce<HTMLTableElement | null>((acc, t) => {
      return t.querySelectorAll("tbody tr").length > (acc?.querySelectorAll("tbody tr").length ?? 0)
        ? t
        : acc;
    }, null);

    if (!best) return { headers: [] as string[], rows: [] as string[][] };

    const headers = Array.from(best.querySelectorAll("thead th, thead td")).map(
      (th) => th.textContent?.trim() ?? ""
    );

    const rows = Array.from(best.querySelectorAll("tbody tr"))
      .map((tr) =>
        Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? "")
      )
      .filter((cells) => cells.some((c) => c.length > 0));

    return { headers, rows };
  });

  if (!extracted.headers.length) {
    log(SCRIPT, `  ${slug}: could not find table headers`);
    return [];
  }

  // Correct for extra header-only columns (e.g. checkbox, group headers)
  // that have no <td> in tbody rows
  const headerOffset = extracted.rows.length > 0
    ? Math.max(0, extracted.headers.length - extracted.rows[0].length)
    : 0;

  const cols = mapHeaders(extracted.headers, headerOffset);
  const parsed: TestRow[] = [];

  for (const cells of extracted.rows) {
    const row = parseRow(cells, cols, vendorId);
    if (row) parsed.push(row);
  }

  log(SCRIPT, `  ${slug}: found ${parsed.length} rows`);
  return parsed;
}

// ── Save to DB ─────────────────────────────────────────────────────────────

async function saveRows(slug: string, vendorId: string, rows: TestRow[]): Promise<void> {
  const { error: delErr } = await db
    .from("lab_tests")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("test_source", "finnrick");

  if (delErr) {
    log(SCRIPT, `  ${slug}: delete error — ${delErr.message}`);
    return;
  }

  if (rows.length === 0) {
    log(SCRIPT, `  ${slug}: 0 rows — nothing inserted`);
    return;
  }

  const { error: insErr } = await db.from("lab_tests").insert(rows);
  if (insErr) {
    log(SCRIPT, `  ${slug}: insert error — ${insErr.message}`);
    return;
  }

  const nonEndoCount = rows.filter((r) => r.test_type !== "Endotoxin").length;
  await db
    .from("vendors")
    .update({ finnrick_tests_count: nonEndoCount, updated_at: new Date().toISOString() })
    .eq("id", vendorId);

  log(SCRIPT, `  ${slug}: saved ${rows.length} rows (${nonEndoCount} purity tests)`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const filter = process.argv.slice(2);

  let query = db
    .from("vendors")
    .select("id, slug, finnrick_url")
    .not("finnrick_url", "is", null);

  if (filter.length > 0) {
    query = (query as any).in("slug", filter);
  }

  const { data: vendors, error } = await query;

  if (error) {
    log(SCRIPT, `DB error: ${error.message}`);
    process.exit(1);
  }

  if (!vendors || vendors.length === 0) {
    log(SCRIPT, "No vendors with finnrick_url found.");
    process.exit(0);
  }

  log(SCRIPT, `Found ${vendors.length} vendor(s) — launching browser…`);

  // Lazy import: must come after all DB queries so stealth plugin
  // doesn't patch Node's fetch and corrupt Supabase responses.
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: CHROME,
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900",
    ],
  }) as Browser;

  for (const v of vendors) {
    const page = await browser.newPage();
    try {
      const rows = await scrapeVendor(page, v.id, v.slug, v.finnrick_url!);
      await saveRows(v.slug, v.id, rows);
    } finally {
      try { await page.close(); } catch { /* ignore closed-connection errors */ }
    }
    await sleep(2000);
  }

  try { await browser.close(); } catch { /* ignore */ }
  log(SCRIPT, "Done.");
}

main();
