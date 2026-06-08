/**
 * scripts/scrape-transparency.ts
 * Populates vendor_transparency boolean fields using a hybrid approach:
 *
 *   DB-sourced (from lab_tests we already have):
 *     has_lab_disclosure      — vendor has lab_tests with a non-null lab_name
 *     has_batch_numbers       — vendor has lab_tests with a non-null batch_number
 *     has_testing_methodology — vendor has any HPLC/purity lab test rows
 *
 *   Web-scraped (homepage, /contact, /about, COA page):
 *     has_contact_info        — mailto: + phone both found in raw HTML
 *     has_business_address    — street address + ZIP in raw HTML or JSON-LD
 *     has_ownership_disclosure — founder/owner/CEO name pattern on about page
 *
 * Safe to re-run. Does NOT overwrite fda_warning, fraud_flags, domain_years.
 *
 * Run: npm run scrape:transparency
 *      npm run scrape:transparency -- swiss-chems loti-labs
 */

import { db } from "./lib/client.js";
import { sleep, log } from "./lib/scraper.js";

const SCRIPT = "scrape-transparency";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Fetch ──────────────────────────────────────────────────────────────────

async function tryFetch(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(12000),
    });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

async function gatherHtml(website: string, coaUrl: string | null): Promise<string> {
  const origin = new URL(website).origin;

  // Fetch sequentially to avoid CDN rate-limiting across 42 vendors.
  // WordPress/Shopify redirect /contact → /contact/ automatically.
  const paths = ["/", "/contact/", "/about/", "/pages/contact", "/pages/about-us"];
  const pages: string[] = [];
  for (const path of paths) {
    pages.push(await tryFetch(origin + path));
    await new Promise((r) => setTimeout(r, 200));
  }
  if (coaUrl) pages.push(await tryFetch(coaUrl));

  return pages.filter(Boolean).join("\n");
}

// ── JSON-LD ────────────────────────────────────────────────────────────────

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      results.push(...items);
      for (const item of items) {
        if (Array.isArray((item as any)["@graph"])) {
          results.push(...(item as any)["@graph"]);
        }
      }
    } catch { /* ignore malformed */ }
  }
  return results;
}

// ── Heuristics ─────────────────────────────────────────────────────────────

const MAILTO_RE = /href=["']mailto:[^"'@]+@[^"']+["']/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const TEL_HREF_RE = /href=["']tel:[+\d\s\-().]+["']/i;
const PHONE_TEXT_RE = /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/;

const STREET_RE =
  /\b\d{1,5}\s+(?:[NSEW]\.?\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b/i;
const ZIP_RE = /\b\d{5}(?:-\d{4})?\b/;

const OWNERSHIP_RE =
  /\b(?:founded|owned|operated|created|started)\s+by\s+[A-Z][a-z]+|(?:CEO|owner|president|founder|director|managing partner)[:\s"']+[A-Z][a-z]+\s+[A-Z][a-z]+|Hi,?\s+I'?m\s+[A-Z][a-z]+|my name is\s+[A-Z][a-z]+/i;

function detectFromHtml(html: string) {
  const jsonLd = extractJsonLd(html);

  // has_contact_info: email is sufficient (phone not required)
  const has_contact_info =
    MAILTO_RE.test(html) ||
    EMAIL_RE.test(html) ||
    jsonLd.some((item) => {
      const val = (item as any).email || "";
      return typeof val === "string" && val.includes("@");
    });

  // has_business_address
  const hasAddrHtml = STREET_RE.test(html) && ZIP_RE.test(html);
  const hasAddrJsonLd = jsonLd.some((item) => {
    const addr = (item as any).address;
    if (!addr) return false;
    const street = addr.streetAddress || (typeof addr === "string" ? addr : "");
    return street.length > 0;
  });
  const has_business_address = hasAddrHtml || hasAddrJsonLd;

  // has_ownership_disclosure
  const hasOwnerHtml = OWNERSHIP_RE.test(html);
  const hasOwnerJsonLd = jsonLd.some((item) => {
    if ((item as any)["@type"] !== "Person") return false;
    const name = (item as any).name || "";
    // Exclude email-as-name patterns
    return typeof name === "string" && name.length > 0 && !name.includes("@");
  });
  const has_ownership_disclosure = hasOwnerHtml || hasOwnerJsonLd;

  return { has_contact_info, has_business_address, has_ownership_disclosure };
}

// ── DB-sourced fields ──────────────────────────────────────────────────────

async function detectFromDb(vendorId: string) {
  const { data: tests } = await db
    .from("lab_tests")
    .select("test_type, lab_name, batch_number")
    .eq("vendor_id", vendorId);

  if (!tests || tests.length === 0) {
    return {
      has_lab_disclosure: false,
      has_batch_numbers: false,
      has_testing_methodology: false,
    };
  }

  // Lab was named on at least one test
  const has_lab_disclosure = tests.some(
    (t) => t.lab_name && t.lab_name.trim().length > 0
  );

  // Batch number present on at least one test
  const has_batch_numbers = tests.some(
    (t) => t.batch_number && t.batch_number.trim().length > 0 && t.batch_number !== "(no batch ID)"
  );

  // At least one purity/HPLC test exists (not just endotoxin)
  const has_testing_methodology = tests.some(
    (t) => t.test_type && t.test_type !== "Endotoxin"
  );

  return { has_lab_disclosure, has_batch_numbers, has_testing_methodology };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const filter = process.argv.slice(2);

  let query = db
    .from("vendors")
    .select("id, slug, name, website, coa_url")
    .neq("status", "closed")
    .not("website", "is", null);

  if (filter.length > 0) {
    query = (query as any).in("slug", filter);
  }

  const { data: vendors, error } = await query.order("name");

  if (error) {
    log(SCRIPT, `DB error: ${error.message}`);
    process.exit(1);
  }

  if (!vendors || vendors.length === 0) {
    log(SCRIPT, "No vendors found.");
    process.exit(0);
  }

  log(SCRIPT, `Processing ${vendors.length} vendors…\n`);

  let updated = 0;
  let failed = 0;

  for (const v of vendors) {
    let website: string;
    try {
      website = new URL(v.website).origin;
    } catch {
      log(SCRIPT, `  ${v.slug}: invalid website URL — skipped`);
      failed++;
      continue;
    }

    log(SCRIPT, `  ${v.slug}: fetching…`);

    const [html, dbFields] = await Promise.all([
      gatherHtml(website, v.coa_url),
      detectFromDb(v.id),
    ]);

    // DB fields are always used; web fields supplement when we got HTML
    const webFields = html ? detectFromHtml(html) : {
      has_contact_info: false,
      has_business_address: false,
      has_ownership_disclosure: false,
    };

    // DB fields take priority; HTML acts as fallback for vendors without Finnrick data
    if (!html) log(SCRIPT, `  ${v.slug}: no web content — using DB data only`);

    const KNOWN_LABS = [
      "janoshik", "lab g", "rpc labs", "phytecs", "peptide analytics",
      "valisure", "core scientific", "sg labs", "eurofins", "pha labs",
    ];
    const LAB_NAME_RE = /[A-Z][A-Za-z\s]{2,30}\s+(?:Lab|Labs|Laboratory|Laboratories|Analytical|Analytics|Testing)\b/;
    const METHOD_RE = /\b(?:HPLC|LC-MS|LC\/MS|UHPLC|mass[\s-]spectrometry|NMR|GC-MS|UHPLC|liquid\s+chromatography|high.performance\s+liquid|LCMS)\b/i;
    const BATCH_RE = /\b(?:batch|lot)\s*(?:#|number|no\.?|id)?[\s:]*[A-Z0-9]{3,}/i;

    const lowerHtml = html.toLowerCase();
    const fields = {
      ...webFields,
      has_lab_disclosure:
        dbFields.has_lab_disclosure ||
        KNOWN_LABS.some((lab) => lowerHtml.includes(lab)) ||
        LAB_NAME_RE.test(html),
      has_testing_methodology:
        dbFields.has_testing_methodology || METHOD_RE.test(html),
      has_batch_numbers:
        dbFields.has_batch_numbers || BATCH_RE.test(html),
    };

    log(
      SCRIPT,
      `  ${v.slug}: ` +
        `contact=${fields.has_contact_info ? "✓" : "✗"} ` +
        `address=${fields.has_business_address ? "✓" : "✗"} ` +
        `ownership=${fields.has_ownership_disclosure ? "✓" : "✗"} ` +
        `lab=${fields.has_lab_disclosure ? "✓" : "✗"} ` +
        `method=${fields.has_testing_methodology ? "✓" : "✗"} ` +
        `batch=${fields.has_batch_numbers ? "✓" : "✗"}`
    );

    const { error: upsertErr } = await db
      .from("vendor_transparency")
      .upsert(
        {
          vendor_id: v.id,
          ...fields,
          last_reviewed: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vendor_id", ignoreDuplicates: false }
      );

    if (upsertErr) {
      log(SCRIPT, `  ${v.slug}: DB error — ${upsertErr.message}`);
      failed++;
    } else {
      updated++;
    }

    await sleep(1500);
  }

  log(SCRIPT, `\nDone. ${updated} updated, ${failed} failed/skipped.`);
}

main();
