/**
 * scripts/scrape-nextgenpeps.ts
 * Dedicated scraper for nextgenpeps.com — a bespoke (Nuxt) storefront, not
 * WooCommerce/Shopify, so it doesn't fit scrape-vendor-products.ts or
 * scrape-gated-vendors.ts's login flows.
 *
 * Despite the "Price revealed on sign-in" UI teaser, pricing and COA/lab
 * data are both server-rendered into the plain HTML with no auth required
 * (verified via curl with no cookies) — confirmed 2026-11-03. So this is a
 * plain fetch + regex/JSON-LD scraper, no Puppeteer or login needed.
 *
 * Sources per product page (https://nextgenpeps.com/shop/<slug>):
 *   - JSON-LD <script type="application/ld+json"> ProductGroup block:
 *     reliable per-variant size + current/sale price (schema.org Offer has
 *     no separate "regular" price field).
 *   - Visible "Regular price"/"Sale price" <span class="sr-only"> markup:
 *     only ever reflects the server-selected DEFAULT variant (confirmed:
 *     ?variant=<sku> query strings do NOT change server-rendered price or
 *     COA content — that's client-side-only hydration behavior). Used to
 *     backfill list_price for the variant whose JSON-LD price matches the
 *     visible sale price; other variants keep list_price null.
 *   - #description-coa section: purity %, lab name, tested date, labeled
 *     size, endotoxin (EU/vial), and purity/endotoxin COA PDF links. Same
 *     caveat — this reflects the default variant's test, not a per-size
 *     breakdown, so one lab_tests row is written per product (not per size).
 *
 * Run: npm run scrape:nextgenpeps
 */
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";
import { classifyProduct, unmatchedNames } from "./lib/peptide-classifier.js";

const SCRIPT = "scrape-nextgenpeps";
const BASE = "https://nextgenpeps.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

type Variant = { size: string; sizeMg: number | null; price: number; inStock: boolean; sku: string };

function sizeMgFromSkuOrText(size: string, sku: string): number | null {
  const fromSize = String(size).match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (fromSize) return parseFloat(fromSize[1]);
  const fromSku = String(sku).match(/(\d+(?:\.\d+)?)\s*mg/i);
  return fromSku ? parseFloat(fromSku[1]) : null;
}

function parseJsonLdVariants(html: string): { productName: string; variants: Variant[] } | null {
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);

      // Multi-size products: ProductGroup with a hasVariant[] array.
      if (data["@type"] === "ProductGroup" && Array.isArray(data.hasVariant)) {
        const variants: Variant[] = data.hasVariant.map((v: any) => ({
          size: v.size ?? "",
          sizeMg: sizeMgFromSkuOrText(v.size ?? "", v.sku ?? ""),
          price: parseFloat(v.offers?.price),
          inStock: v.offers?.availability?.includes("InStock") ?? true,
          sku: v.sku ?? "",
        })).filter((v: Variant) => !Number.isNaN(v.price));
        return { productName: data.name ?? data.productGroupID, variants };
      }

      // Single-size products: plain Product with its own offers, no hasVariant
      // — the mg size lives only in the SKU (e.g. "MOTS-C-10MG").
      if (data["@type"] === "Product" && data.offers && !Array.isArray(data.hasVariant)) {
        const price = parseFloat(data.offers.price);
        if (Number.isNaN(price)) continue;
        return {
          productName: data.name,
          variants: [{
            size: "",
            sizeMg: sizeMgFromSkuOrText("", data.sku ?? ""),
            price,
            inStock: data.offers.availability?.includes("InStock") ?? true,
            sku: data.sku ?? "",
          }],
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function parseDefaultListPrice(html: string): number | null {
  const m = html.match(/Regular price\s*<\/span>\$([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}
function parseDefaultSalePrice(html: string): number | null {
  const m = html.match(/Sale price\s*<\/span>\$([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

type CoaInfo = {
  purity: number | null;
  labName: string | null;
  testDate: string | null;
  labeledSize: string | null;
  endotoxin: string | null;
  purityPdfUrl: string | null;
  endotoxinPdfUrl: string | null;
};

function parseCoa(html: string): CoaInfo {
  const sectionStart = html.indexOf('id="description-coa"');
  if (sectionStart === -1) {
    return { purity: null, labName: null, testDate: null, labeledSize: null, endotoxin: null, purityPdfUrl: null, endotoxinPdfUrl: null };
  }
  const section = html.slice(sectionStart, sectionStart + 15000);

  const purityMatch = section.match(/text-\[#4ade80\][^>]*>([\d.]+)%<\/p>/);
  const dt = (label: string) => {
    const m = section.match(new RegExp(`<dt[^>]*>${label}</dt><dd[^>]*>([^<]*)</dd>`));
    return m ? m[1].trim() : null;
  };
  const endotoxinMatch = section.match(
    /Endotoxin<\/span>.*?<span class="ml-auto[^"]*">([^<]+)<\/span>/s
  );
  const pdfLinks = [...section.matchAll(/href="([^"]+\.pdf[^"]*)"/g)].map((m) => decodeURIComponent(m[1]));
  const purityPdf = pdfLinks.find((h) => /purity/i.test(h)) ?? pdfLinks[0] ?? null;
  const endotoxinPdf = pdfLinks.find((h) => /endotoxin/i.test(h)) ?? null;

  return {
    purity: purityMatch ? parseFloat(purityMatch[1]) : null,
    labName: dt("Lab"),
    testDate: dt("Tested"),
    labeledSize: dt("Labeled"),
    endotoxin: endotoxinMatch ? endotoxinMatch[1].trim() : null,
    purityPdfUrl: purityPdf,
    endotoxinPdfUrl: endotoxinPdf,
  };
}

function parseIsoDate(text: string | null): string | null {
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function getProductSlugs(): Promise<string[]> {
  const html = await fetchHtml(`${BASE}/shop`);
  const hrefs = [...html.matchAll(/href="\/shop\/([^"?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]);
  const slugs = [...new Set(hrefs)].filter((s) => s !== "category" && !s.startsWith("category/"));
  return slugs;
}

async function main() {
  log(SCRIPT, "Fetching product catalog…");
  const slugs = await getProductSlugs();
  log(SCRIPT, `Found ${slugs.length} product slugs.`);

  const { data: vendor, error: vErr } = await db
    .from("vendors").select("id").eq("slug", "nextgen-peps").single();
  if (vErr || !vendor) { log(SCRIPT, `✗ Vendor lookup failed: ${vErr?.message}`); return; }

  const peptideRows: any[] = [];
  const labTestRows: any[] = [];
  let nonPeptideCount = 0;

  for (const slug of slugs) {
    const url = `${BASE}/shop/${slug}`;
    try {
      const html = await fetchHtml(url);
      const parsed = parseJsonLdVariants(html);
      if (!parsed || parsed.variants.length === 0) {
        log(SCRIPT, `  — No JSON-LD variant data at /shop/${slug}`);
        await sleep(300);
        continue;
      }

      const classification = classifyProduct("nextgen-peps", parsed.productName);
      if (classification !== "peptide") {
        nonPeptideCount++;
        await sleep(300);
        continue;
      }

      const defaultList = parseDefaultListPrice(html);
      const defaultSale = parseDefaultSalePrice(html);
      const coa = parseCoa(html);

      for (const v of parsed.variants) {
        const isDefaultVariant = defaultSale !== null && Math.abs(v.price - defaultSale) < 0.001;
        peptideRows.push({
          peptide_name: parsed.productName,
          size_mg: v.sizeMg,
          list_price: isDefaultVariant ? defaultList : null,
          sale_price: v.price,
          in_stock: v.inStock,
          coa_available: coa.purity !== null,
          coa_url: coa.purityPdfUrl,
        });
      }

      if (coa.purity !== null) {
        labTestRows.push({
          peptide_name: parsed.productName,
          lab_name: coa.labName,
          test_type: "HPLC",
          purity_result: coa.purity,
          test_date: parseIsoDate(coa.testDate),
          verified: false,
          coa_url: coa.purityPdfUrl,
          janoshik_tested: coa.labName === "Janoshik",
          endotoxin_result: coa.endotoxin,
          test_source: "coa",
          container_desc: coa.labeledSize,
        });
      }

      log(SCRIPT, `  ✓ ${parsed.productName}: ${parsed.variants.length} size(s), purity=${coa.purity ?? "n/a"}`);
    } catch (err: any) {
      log(SCRIPT, `  ✗ ${slug}: ${err.message?.slice(0, 100)}`);
    }
    await sleep(300);
  }

  log(SCRIPT, `\nClassified ${peptideRows.length} peptide size-rows, skipped ${nonPeptideCount} non-peptide products.`);
  if (unmatchedNames.size > 0) {
    log(SCRIPT, `Unmatched product names (neither known peptide nor known non-peptide):`);
    for (const [vendor_, names] of unmatchedNames) log(SCRIPT, `  ${vendor_}: ${names.join(", ")}`);
  }

  const now = new Date().toISOString();
  await db.from("vendor_peptides").delete().eq("vendor_id", vendor.id);
  if (peptideRows.length > 0) {
    const rows = peptideRows.map((r) => ({ ...r, vendor_id: vendor.id, last_checked: now }));
    const { error } = await db.from("vendor_peptides").insert(rows);
    if (error) log(SCRIPT, `✗ vendor_peptides insert failed: ${error.message}`);
    else log(SCRIPT, `✓ Saved ${rows.length} vendor_peptides rows`);
  }

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id);
  if (labTestRows.length > 0) {
    const rows = labTestRows.map((r) => ({ ...r, vendor_id: vendor.id }));
    const { error } = await db.from("lab_tests").insert(rows);
    if (error) log(SCRIPT, `✗ lab_tests insert failed: ${error.message}`);
    else log(SCRIPT, `✓ Saved ${rows.length} lab_tests rows`);
  }

  await db.from("vendors").update({
    total_products: peptideRows.length,
    has_coa: labTestRows.length > 0,
    is_gated: false, // product/price/COA data confirmed public; only checkout requires login
  }).eq("id", vendor.id);

  log(SCRIPT, "\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
