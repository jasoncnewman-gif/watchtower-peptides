/**
 * scripts/scrape-vendor-products.ts
 * Scrapes each vendor's product catalog and writes to vendor_peptides table.
 * Gated vendors are skipped and marked is_gated = true in the vendors table.
 *
 * Each vendor entry has a catalog URL and per-platform CSS selectors.
 * Most vendor sites run Shopify, WooCommerce, or custom React/Next.js storefronts.
 *
 * ⚠️  SELECTOR VERIFICATION REQUIRED
 * Verify catalogUrl and selectors for each vendor before a production run.
 * Sites that render products client-side require Puppeteer — see note at bottom.
 *
 * Run: npm run scrape:products
 */

import { db } from "./lib/client.js";
import { fetchHtml, clean, parsePrice, parseMg, log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-products";

// ── Vendor catalog config ─────────────────────────────────────────────────

type SelectorSet = {
  productCard: string;   // container for each product
  name: string;          // product name within card
  price: string;         // list price within card
  salePrice?: string;    // sale price within card (optional)
  size?: string;         // size in mg within card or name
  stockStatus?: string;  // out-of-stock indicator within card
};

type VendorCatalogConfig = {
  slug: string;
  catalogUrl: string;
  selectors: SelectorSet;
  isGated?: boolean;
  // Pagination: if the vendor uses ?page=N or /page/N set paginationType
  pagination?: "query" | "path" | "none";
  maxPages?: number;
};

// Platform selector presets
const SHOPIFY_SEL: SelectorSet = {
  productCard: ".product-item, .grid__item, .card-wrapper",
  name:        ".product-item__title, .card__heading, .card-information__title",
  price:       ".price__regular, .price-item--regular, .price .money",
  salePrice:   ".price__sale .price-item--sale, .price-item--sale",
  stockStatus: ".sold-out-message, .product-label--sold-out, [class*='sold-out']",
};

const WOOCOMMERCE_SEL: SelectorSet = {
  productCard: ".product, li.product",
  name:        ".woocommerce-loop-product__title, h2.wc-block-grid__product-title",
  price:       ".price .amount, .price ins .amount",
  salePrice:   ".price ins .amount",
  stockStatus: ".out-of-stock, .stock.out-of-stock",
};

// Generic fallback selectors
const GENERIC_SEL: SelectorSet = {
  productCard: "[class*='product'], [class*='item']",
  name:        "h2, h3, [class*='title'], [class*='name']",
  price:       "[class*='price'], [data-price]",
  stockStatus: "[class*='out-of-stock'], [class*='unavailable']",
};

const VENDOR_CONFIGS: VendorCatalogConfig[] = [
  // Gated vendors — skip scraping, just flag them
  { slug: "felix-chemical-supply", catalogUrl: "", selectors: GENERIC_SEL, isGated: true },
  { slug: "alpha-biomed-labs",     catalogUrl: "", selectors: GENERIC_SEL, isGated: true },

  // Active vendors — catalog pages + selector sets
  { slug: "peptide-partners",       catalogUrl: "https://peptidepartners.com/collections/peptides",   selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 3 },
  { slug: "ion-peptide",            catalogUrl: "https://ionpeptide.com/shop",                        selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 3 },
  { slug: "core-peptides",          catalogUrl: "https://corepeptides.com/collections/all",           selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 3 },
  { slug: "limitless-biotech",      catalogUrl: "https://limitlessbiotech.com/collections/peptides",  selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 3 },
  { slug: "ascension-peptides",     catalogUrl: "https://ascensionpeptides.com/collections/all",      selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "nexaph",                 catalogUrl: "https://nexaph.com/peptides",                        selectors: GENERIC_SEL,     pagination: "none" },
  { slug: "mile-high-compounds",    catalogUrl: "https://milehighcompounds.com/collections/peptides", selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "crush-research",         catalogUrl: "https://crushresearch.com/shop",                     selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "omegamino",              catalogUrl: "https://omegamino.com/collections/all",              selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "orbitrex-peptides",      catalogUrl: "https://orbitrexpeptides.com/shop",                  selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "peptidology",            catalogUrl: "https://peptidology.com/collections/peptides",       selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "swiss-chems",            catalogUrl: "https://swisschems.is/product-category/peptides",    selectors: WOOCOMMERCE_SEL, pagination: "path",  maxPages: 3 },
  { slug: "pure-rawz",              catalogUrl: "https://purerawz.co/peptides",                       selectors: GENERIC_SEL,     pagination: "query", maxPages: 3 },
  { slug: "loti-labs",              catalogUrl: "https://lotilabs.com/shop",                          selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "biotech-peptides",       catalogUrl: "https://biotechpeptides.com/collections/all",        selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 3 },
  { slug: "sports-technology-labs", catalogUrl: "https://sportstechnologylabs.com/shop",              selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "polaris-peptides",       catalogUrl: "https://polarispeptides.com/collections/peptides",   selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "pivot-labs",             catalogUrl: "https://pivotlabs.com/shop",                         selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "ez-peptides",            catalogUrl: "https://ezpeptides.com/collections/all",             selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "skye-peptides",          catalogUrl: "https://skyepeptides.com/collections/peptides",      selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "bulk-peptide-supply",    catalogUrl: "https://bulkpeptidesupply.com/shop",                 selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 3 },
  { slug: "astro-peptides",         catalogUrl: "https://astropeptides.com/collections/all",          selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "dynamic-peptide",        catalogUrl: "https://dynamicpeptide.com/collections/peptides",    selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "glacier-aminos",         catalogUrl: "https://glacieraminos.com/shop",                     selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "penguin-peptides",       catalogUrl: "https://penguinpeptides.com/collections/all",        selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "paramount-peptides",     catalogUrl: "https://paramountpeptides.com/collections/peptides", selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "nuscience-peptides",     catalogUrl: "https://nusciencepeptides.com/shop",                 selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "southern-peptides",      catalogUrl: "https://southernpeptides.com/collections/all",       selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "simple-peptide",         catalogUrl: "https://simplepeptide.com/shop",                     selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "verified-peptides",      catalogUrl: "https://verifiedpeptides.com/collections/peptides",  selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "aavant-research",        catalogUrl: "https://aavantresearch.com/shop",                    selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
  { slug: "nextechlabs",            catalogUrl: "https://nextechlabs.com/collections/all",            selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "apollo-peptide-sciences",catalogUrl: "https://apollopeptidesciences.com/collections/all",  selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "cernum-biosciences",     catalogUrl: "https://cernumbiosciences.com/shop",                 selectors: WOOCOMMERCE_SEL, pagination: "none" },
  { slug: "peptide-crafters",       catalogUrl: "https://peptidecrafters.com/collections/peptides",   selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "lvlup-health",           catalogUrl: "https://lvluphealth.com/collections/all",            selectors: SHOPIFY_SEL,     pagination: "query", maxPages: 2 },
  { slug: "healthgevity",           catalogUrl: "https://healthgevity.com/shop",                      selectors: WOOCOMMERCE_SEL, pagination: "query", maxPages: 2 },
];

// ── Peptide name filter ────────────────────────────────────────────────────
// Only import products whose name contains one of these substrings
const KNOWN_PEPTIDES = [
  "bpc", "tb-500", "thymosin", "sermorelin", "cjc", "ipamorelin",
  "semaglutide", "tirzepatide", "pt-141", "bremelanotide", "kisspeptin",
  "ghrp", "igf", "selank", "semax", "epitalon", "epithalon", "melanotan",
  "hgh", "gh frag", "aod", "ss-31", "mots-c", "humanin", "fgl", "pnkp",
  "retatrutide", "triptorelin", "hexarelin",
];

function isPeptideProduct(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_PEPTIDES.some((kw) => lower.includes(kw));
}

// ── Page URL builder ──────────────────────────────────────────────────────

function pageUrl(base: string, page: number, paginationType: string): string {
  if (page === 1) return base;
  if (paginationType === "query") {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}page=${page}`;
  }
  if (paginationType === "path") {
    return `${base}/page/${page}`;
  }
  return base;
}

// ── Types ─────────────────────────────────────────────────────────────────

type ProductRow = {
  vendor_id: string;
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
  last_checked: string;
};

// ── DB helpers ────────────────────────────────────────────────────────────

async function getVendorId(slug: string): Promise<string | null> {
  const { data } = await db
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id ?? null;
}

// ── Main scrape loop ──────────────────────────────────────────────────────

async function scrapeVendor(config: VendorCatalogConfig): Promise<void> {
  if (config.isGated) {
    log(SCRIPT, `${config.slug}: gated — marking is_gated = true`);
    await db.from("vendors").update({ is_gated: true }).eq("slug", config.slug);
    return;
  }

  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `${config.slug}: not found in DB — run seed-vendors first`);
    return;
  }

  const maxPages = config.maxPages ?? 1;
  const paginationType = config.pagination ?? "none";
  const sel = config.selectors;
  const products: ProductRow[] = [];
  const now = new Date().toISOString();

  for (let page = 1; page <= maxPages; page++) {
    const url = pageUrl(config.catalogUrl, page, paginationType);
    let $;
    try {
      $ = await fetchHtml(url);
    } catch (err) {
      log(SCRIPT, `  ${config.slug} p${page}: ${(err as Error).message}`);
      break;
    }

    const cards = $(sel.productCard);
    if (cards.length === 0) {
      if (page === 1) log(SCRIPT, `  ${config.slug}: no product cards found — verify selectors`);
      break;
    }

    let pageHits = 0;
    cards.each((_, el) => {
      const rawName = clean($(el).find(sel.name).first().text()) ?? "";
      if (!rawName || !isPeptideProduct(rawName)) return;

      const listPriceRaw  = sel.price ? clean($(el).find(sel.price).first().text()) : null;
      const salePriceRaw  = sel.salePrice ? clean($(el).find(sel.salePrice).first().text()) : null;
      const stockRaw      = sel.stockStatus ? $(el).find(sel.stockStatus).length > 0 : false;
      const sizeMg        = parseMg(rawName);

      products.push({
        vendor_id:    vendorId,
        peptide_name: rawName.trim(),
        size_mg:      sizeMg,
        list_price:   parsePrice(listPriceRaw),
        sale_price:   parsePrice(salePriceRaw),
        in_stock:     !stockRaw,
        last_checked: now,
      });
      pageHits++;
    });

    log(SCRIPT, `  ${config.slug} p${page}: ${pageHits} peptide products found`);
    if (pageHits === 0 && page > 1) break; // No more pages
  }

  if (products.length === 0) return;

  // Delete stale rows for this vendor before upserting fresh data
  await db.from("vendor_peptides").delete().eq("vendor_id", vendorId);

  const { error } = await db.from("vendor_peptides").insert(products);
  if (error) {
    log(SCRIPT, `  ✗ DB write failed for ${config.slug}: ${error.message}`);
  } else {
    log(SCRIPT, `  ✓ ${config.slug}: saved ${products.length} products`);
    await db.from("vendors").update({ total_products: products.length }).eq("id", vendorId);
  }
}

async function main() {
  log(SCRIPT, `Processing ${VENDOR_CONFIGS.length} vendors…`);
  for (const config of VENDOR_CONFIGS) {
    await scrapeVendor(config);
    await sleep(500);
  }
  log(SCRIPT, "Done.");
}

main();

/*
 * NOTE — JavaScript-rendered catalog pages:
 * If a vendor's catalog is rendered client-side (React/Next.js/Vue),
 * fetch() will return an empty shell. Install Puppeteer and swap fetchHtml()
 * for a Puppeteer page.content() call on those vendors:
 *
 *   import puppeteer from 'puppeteer'
 *   const browser = await puppeteer.launch({ headless: true })
 *   const page = await browser.newPage()
 *   await page.goto(url, { waitUntil: 'networkidle2' })
 *   const html = await page.content()
 *   const $ = cheerio.load(html)
 */
