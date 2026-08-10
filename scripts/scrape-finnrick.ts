/**
 * scripts/scrape-finnrick.ts
 * Scrapes vendor pages on finnrick.com.
 *
 * Rewritten 2026-08-10: Finnrick now gates per-test purity/dosage/lab-name behind
 * a paid membership site-wide (confirmed on multiple vendor pages, not a one-off).
 * The result table only exposes 6 real <td> cells against 8 headers — Date, Result
 * (pass/fail), Test (peptide name + link), then a gated "lab name" CTA, a gated
 * "login to view" cell covering Purity/Dosage/Label, and a COA link. Numeric purity
 * can no longer be scraped for free going forward.
 *
 * Still free, and captured here:
 *   - Per-test: date, peptide name, pass/fail result, Finnrick's test-detail URL
 *     (only the first page of up to 10 most-recent tests — Finnrick paginates
 *     beyond that via an "Older →" click this script does not follow; the vendor-
 *     level summary below already carries the authoritative full-history totals,
 *     so this is a completeness tradeoff, not a correctness one).
 *   - Vendor-level summary block: overall Finnrick rating %, rank out of all
 *     tracked vendors, claimed location (a real cross-check — caught Zen Peptides
 *     mislabeled as USA when Finnrick has it as Singapore), pass/fail counts.
 *
 * Sync is non-destructive: rows are upserted by finnrick_test_id (migration_025),
 * and existing purity_result values scraped before the paywall are never
 * overwritten with null just because a re-scrape can no longer see them.
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
  test_type: string;
  finnrick_result: "pass" | "fail" | null;
  finnrick_test_id: string | null;
  verified: boolean;
};

type VendorSummary = {
  location: string | null;
  ownershipStatus: string | null;
  overallRating: number | null;
  rank: number | null;
  rankOf: number | null;
  passCount: number | null;
  failCount: number | null;
};

// ── Value parsers ──────────────────────────────────────────────────────────

function parseDate(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseResult(s: string): "pass" | "fail" | null {
  const lower = s.toLowerCase();
  if (lower.includes("pass")) return "pass";
  if (lower.includes("fail")) return "fail";
  return null;
}

// Vendor summary block is plain page text, not a stable table — pattern-match it.
// Explicit labeled fields (more robust than positional line-counting, which
// drifted between two observed layouts): "Reported location:\nSingapore\n
// Ownership/control:\nNot established" and "...70%\nFINNRICK RATING\n#189 of
// 301 ranked vendors\n15 of 24 classifiable tests passed".
function parseSummary(pageText: string): VendorSummary {
  let location = pageText.match(/Reported location:\s*\n?\s*([^\n]+)/)?.[1]?.trim() || null;
  const ownershipStatus = pageText.match(/Ownership\/control:\s*\n?\s*([^\n]+(?:\n\(documented\))?)/)?.[1]?.trim().replace(/\n/g, " ") || null;

  // Fallback layout observed without the labeled widget: "← Vendors\n<name>\n<location>\n·\nN tests"
  if (!location) {
    const afterVendors = pageText.split(/←\s*Vendors\n/)[1] ?? "";
    const secondLine = afterVendors.split("\n")[1]?.trim();
    if (secondLine && !/^\d+\s+tests?$/i.test(secondLine)) location = secondLine || null;
  }

  const m = pageText.match(
    /(\d+)%\s*\n?FINNRICK RATING\s*\n?#(\d+)\s+of\s+(\d+)\s+ranked vendors\s*\n?(\d+)\s+of\s+(\d+)\s+classifiable tests passed/
  );
  if (!m) return { location, ownershipStatus, overallRating: null, rank: null, rankOf: null, passCount: null, failCount: null };

  const [, overallRating, rank, rankOf, passCount, totalClassifiable] = m;
  return {
    location,
    ownershipStatus,
    overallRating: Number(overallRating),
    rank: Number(rank),
    rankOf: Number(rankOf),
    passCount: Number(passCount),
    failCount: Number(totalClassifiable) - Number(passCount),
  };
}

// ── Puppeteer scrape ───────────────────────────────────────────────────────

async function scrapeVendor(
  page: Page,
  vendorId: string,
  slug: string,
  finnrickUrl: string
): Promise<{ rows: TestRow[]; summary: VendorSummary | null }> {
  log(SCRIPT, `  ${slug}: ${finnrickUrl}`);

  try {
    await page.goto(finnrickUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("table tbody tr", { timeout: 20000 });
  } catch {
    log(SCRIPT, `  ${slug}: page did not load a test table`);
    return { rows: [], summary: null };
  }
  // The "Reported location"/"Ownership/control" widget can render slightly
  // after the test table — wait for it, but don't fail the whole scrape if it
  // never shows (parseSummary() falls back to positional parsing either way).
  try {
    await page.waitForFunction(() => document.body.innerText.includes("Reported location"), { timeout: 15000 });
  } catch { /* fall back to whatever rendered */ }

  const extracted = await page.evaluate(() => {
    const table = document.querySelector("table");
    const rows = table
      ? Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          const dateText = tds[0]?.textContent?.trim() ?? "";
          const resultText = tds[1]?.textContent?.trim() ?? "";
          const testLink = tds[2]?.querySelector("a");
          const peptideName = testLink?.querySelector("div")?.textContent?.trim() ?? "";
          const testHref = testLink?.getAttribute("href") ?? "";
          return { dateText, resultText, peptideName, testHref };
        })
      : [];
    return { rows, pageText: document.body.innerText };
  });

  const summary = parseSummary(extracted.pageText);

  const parsed: TestRow[] = extracted.rows
    .filter((r) => r.peptideName)
    .map((r) => {
      const testId = r.testHref.split("/").filter(Boolean).pop() ?? null;
      const isEndotoxin = /endotoxin/i.test(r.peptideName);
      return {
        vendor_id: vendorId,
        test_source: "finnrick",
        test_date: parseDate(r.dateText),
        peptide_name: r.peptideName,
        test_type: isEndotoxin ? "Endotoxin" : "HPLC",
        finnrick_result: parseResult(r.resultText),
        finnrick_test_id: testId,
        verified: true,
      };
    });

  log(
    SCRIPT,
    `  ${slug}: ${parsed.length} recent test rows · summary: ${summary.overallRating ?? "?"}% ` +
      `(#${summary.rank ?? "?"}/${summary.rankOf ?? "?"}), ${summary.passCount ?? "?"} pass / ${summary.failCount ?? "?"} fail, ` +
      `location "${summary.location ?? "?"}", ownership "${summary.ownershipStatus ?? "?"}"`
  );

  return { rows: parsed, summary };
}

// ── Save to DB (non-destructive) ────────────────────────────────────────────

async function saveRows(slug: string, vendorId: string, rows: TestRow[], summary: VendorSummary | null): Promise<void> {
  if (rows.length > 0) {
    const testIds = rows.map((r) => r.finnrick_test_id).filter((id): id is string => !!id);
    const { data: existing } = await db
      .from("lab_tests")
      .select("finnrick_test_id")
      .in("finnrick_test_id", testIds);
    const existingIds = new Set((existing ?? []).map((r: any) => r.finnrick_test_id));

    const toInsert = rows.filter((r) => r.finnrick_test_id && !existingIds.has(r.finnrick_test_id));
    const toUpdate = rows.filter((r) => r.finnrick_test_id && existingIds.has(r.finnrick_test_id));

    if (toInsert.length > 0) {
      const { error } = await db.from("lab_tests").insert(toInsert);
      if (error) log(SCRIPT, `  ${slug}: insert error — ${error.message}`);
    }
    // Update only the fields a free scrape can see — never touch purity_result,
    // so historical numbers scraped before the paywall survive re-scrapes.
    for (const r of toUpdate) {
      const { error } = await db
        .from("lab_tests")
        .update({ test_date: r.test_date, finnrick_result: r.finnrick_result, verified: true })
        .eq("finnrick_test_id", r.finnrick_test_id);
      if (error) log(SCRIPT, `  ${slug}: update error — ${error.message}`);
    }
    log(SCRIPT, `  ${slug}: ${toInsert.length} new rows, ${toUpdate.length} refreshed`);
  }

  if (summary) {
    const { error } = await db
      .from("vendors")
      .update({
        finnrick_overall_rating: summary.overallRating,
        finnrick_rank: summary.rank,
        finnrick_rank_of: summary.rankOf,
        finnrick_pass_count: summary.passCount,
        finnrick_fail_count: summary.failCount,
        finnrick_location: summary.location,
        finnrick_ownership_status: summary.ownershipStatus,
        finnrick_last_scraped: new Date().toISOString(),
        ...((summary.passCount ?? null) !== null && (summary.failCount ?? null) !== null
          ? { finnrick_tests_count: summary.passCount! + summary.failCount! }
          : {}),
      })
      .eq("id", vendorId);
    if (error) log(SCRIPT, `  ${slug}: vendor summary update error — ${error.message}`);
  }
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
      const { rows, summary } = await scrapeVendor(page, v.id, v.slug, v.finnrick_url!);
      await saveRows(v.slug, v.id, rows, summary);
    } finally {
      try { await page.close(); } catch { /* ignore closed-connection errors */ }
    }
    await sleep(2000);
  }

  try { await browser.close(); } catch { /* ignore */ }
  log(SCRIPT, "Done.");
}

main();
