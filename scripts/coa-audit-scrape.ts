/**
 * scripts/coa-audit-scrape.ts
 * Automated COA integrity audit. For each pending vendor, visits their COA page,
 * detects lab names + batch numbers, assigns an audit tier, and records findings.
 *
 * Usage:
 *   npm run coa:audit                          — process all pending vendors
 *   npm run coa:audit -- --slug ruo-science    — single vendor
 *   npm run coa:audit -- --dry-run             — print findings without writing to DB
 */

import type { Browser } from "puppeteer";
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "coa-audit";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Known third-party labs ─────────────────────────────────────────────────
// Each entry: display name + strings to search for (case-insensitive)

const KNOWN_LABS: { name: string; signals: string[] }[] = [
  { name: "Janoshik",           signals: ["janoshik"] },
  { name: "Colmaric",           signals: ["colmaric"] },
  { name: "Vanguard",           signals: ["vanguard scientific", "vanguard labs", "vanguard lab"] },
  { name: "Freedom Diagnostics",signals: ["freedom diagnostics"] },
  { name: "Horizon Analytical", signals: ["horizon analytical"] },
  { name: "Acro Biosystems",    signals: ["acro biosystems"] },
  { name: "Anova Labs",         signals: ["anova lab"] },
];

// Batch/lot number patterns
const BATCH_PATTERNS = [
  /\blot\s*(?:no\.?|number|#)?\s*[:\-]?\s*[A-Z0-9]{4,}/i,
  /\bbatch\s*(?:no\.?|number|#)?\s*[:\-]?\s*[A-Z0-9]{4,}/i,
  /\b(?:lot|batch)\s*[:\-]\s*\S{4,}/i,
];

function detectLab(text: string): string | null {
  const lower = text.toLowerCase();
  for (const lab of KNOWN_LABS) {
    if (lab.signals.some((s) => lower.includes(s))) return lab.name;
  }
  return null;
}

function detectBatchNumbers(text: string): boolean {
  return BATCH_PATTERNS.some((re) => re.test(text));
}

function determineTier(hasCoa: boolean, lab: string | null, hasBatch: boolean): number {
  if (!hasCoa) return 0;
  if (!lab)    return 1;
  if (!hasBatch) return 2;
  return 3;
}

// ── Puppeteer helpers ──────────────────────────────────────────────────────

async function getPageContent(
  page: import("puppeteer").Page,
  url: string
): Promise<{ body: string; links: string[] } | null> {
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (!response || response.status() === 404) return null;
    await sleep(3000);
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map(
        (a) => (a as HTMLAnchorElement).href
      )
    );
    return { body, links };
  } catch {
    return null;
  }
}

// Fetch a PDF and return its raw bytes as a string (PDFs contain readable text streams)
async function fetchPdfText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";
    const buf = await res.arrayBuffer();
    // Convert to latin1 string — preserves readable ASCII substrings inside binary PDF
    return Buffer.from(buf).toString("latin1");
  } catch {
    return "";
  }
}

// ── Per-vendor audit ───────────────────────────────────────────────────────

type AuditResult = {
  tier: number;
  status: "complete" | "flagged";
  lab: string | null;
  hasBatch: boolean;
  hasCoa: boolean;
  notes: string;
};

async function auditVendor(
  browser: Browser,
  slug: string,
  coaUrl: string
): Promise<AuditResult> {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(20000);
  await page.setUserAgent(USER_AGENT);

  let hasCoa   = false;
  let lab: string | null = null;
  let hasBatch = false;

  try {
    const content = await getPageContent(page, coaUrl);

    if (!content) {
      return {
        tier: 1, status: "flagged", lab: null, hasBatch: false, hasCoa: false,
        notes: "COA page inaccessible (blocked or 404)",
      };
    }

    // Search page body text
    lab      = lab      || detectLab(content.body);
    hasBatch = hasBatch || detectBatchNumbers(content.body);

    // Check all link hrefs for lab signals too
    const linkText = content.links.join(" ");
    lab      = lab      || detectLab(linkText);

    // Determine if any COA-like content exists
    const bodyLower = content.body.toLowerCase();
    hasCoa =
      bodyLower.includes("certificate of analysis") ||
      bodyLower.includes("coa") ||
      bodyLower.includes("hplc") ||
      bodyLower.includes("purity") ||
      bodyLower.includes("test result") ||
      bodyLower.includes("lab result") ||
      content.links.some((h) => h.includes(".pdf") || h.includes("janoshik") || h.includes("coa"));

    // Fetch up to 5 PDF links for deeper analysis
    const pdfLinks = content.links.filter((h) => h.includes(".pdf")).slice(0, 5);
    const janoshikLinks = content.links.filter((h) => h.includes("janoshik")).slice(0, 3);

    if (janoshikLinks.length > 0) {
      lab = "Janoshik";
      hasCoa = true;
    }

    for (const pdfUrl of pdfLinks) {
      const pdfText = await fetchPdfText(pdfUrl);
      if (!pdfText) continue;
      lab      = lab      || detectLab(pdfText);
      hasBatch = hasBatch || detectBatchNumbers(pdfText);
      if (lab && hasBatch) break; // found everything we need
    }

    const tier = determineTier(hasCoa, lab, hasBatch);

    const parts: string[] = [];
    if (lab)      parts.push(`Lab: ${lab}`);
    if (hasBatch) parts.push("batch numbers present");
    if (!hasCoa)  parts.push("no COA content detected");
    if (!lab && hasCoa) parts.push("no known lab name found — may be vendor-branded");
    const notes = parts.join("; ") || "audited";

    // Flag if we couldn't confirm the claimed tier (claimed T3 but only found T1/T2)
    const status: "complete" | "flagged" = tier < 2 ? "flagged" : "complete";

    return { tier, status, lab, hasBatch, hasCoa, notes };
  } finally {
    await page.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const slugArg  = args.includes("--slug")    ? args[args.indexOf("--slug")    + 1] : null;
  const dryRun   = args.includes("--dry-run");

  // Load pending vendors
  const query = db
    .from("vendors")
    .select("id, slug, name, coa_url, website, lab_testing_score, overall_score, coa_audit_status")
    .in("status", ["active", "flagged"])
    .eq("coa_audit_status", "pending");

  const { data: vendors } = slugArg
    ? await db.from("vendors").select("id, slug, name, coa_url, website, lab_testing_score, overall_score, coa_audit_status").eq("slug", slugArg)
    : await query;

  if (!vendors || vendors.length === 0) {
    log(SCRIPT, "No pending vendors to audit.");
    return;
  }

  // Filter to those with a COA URL
  const toAudit = vendors.filter((v: any) => v.coa_url);
  const missing = vendors.filter((v: any) => !v.coa_url);
  for (const v of missing as any[]) {
    log(SCRIPT, `  ⚠  ${v.slug}: no coa_url set — skipping`);
  }

  log(SCRIPT, `Auditing ${toAudit.length} vendor(s)${dryRun ? " [DRY RUN]" : ""}…\n`);

  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin }  = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  }) as Browser;

  const results: { slug: string; name: string; result: AuditResult }[] = [];

  try {
    for (const vendor of toAudit as any[]) {
      log(SCRIPT, `→ ${vendor.name} (${vendor.slug})`);
      log(SCRIPT, `  URL: ${vendor.coa_url}`);

      const result = await auditVendor(browser, vendor.slug, vendor.coa_url);

      log(SCRIPT, `  Tier: T${result.tier} | Status: ${result.status} | Lab: ${result.lab ?? "none"} | Batch: ${result.hasBatch}`);
      log(SCRIPT, `  Notes: ${result.notes}`);

      if (!dryRun) {
        await db.from("vendors").update({
          coa_audit_status: result.status,
          coa_audit_tier:   result.tier,
          coa_audit_notes:  result.notes,
          coa_audited_at:   new Date().toISOString(),
        }).eq("slug", vendor.slug);
        log(SCRIPT, `  ✓ Recorded`);
      }

      results.push({ slug: vendor.slug, name: vendor.name, result });
      log(SCRIPT, "");
      await sleep(2000);
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log("\n══════════════════════════════════════════════════");
  console.log("  COA AUDIT SUMMARY");
  console.log("══════════════════════════════════════════════════");
  for (const { name, result } of results) {
    const icon = result.status === "complete" ? "✓" : "⚠";
    console.log(`${icon} [T${result.tier}] ${name}`);
    console.log(`  ${result.notes}`);
  }

  const flagged  = results.filter((r) => r.result.status === "flagged").length;
  const complete = results.filter((r) => r.result.status === "complete").length;
  console.log(`\n${complete} complete | ${flagged} flagged`);
  if (flagged > 0) {
    console.log("\nFlagged vendors need manual review — run npm run coa:queue to see remaining.");
  }
  if (!dryRun && results.length > 0) {
    console.log("\nRun: npm run compute:scores  — to recalculate scores for any tier changes.");
  }
  console.log();
}

main().catch(console.error);
