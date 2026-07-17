/**
 * scripts/scrape-vendor-products.ts
 * Three-stage product scraping:
 *   1. Shopify /products.json API              — Shopify stores, no browser
 *   2. WooCommerce /wp-json/wc/store/v1/products — WooCommerce stores, no browser
 *   3. Puppeteer headless browser              — fallback for custom stores
 *
 * Run: npm run scrape:products
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";
import * as cheerio from "cheerio";

puppeteerExtra.use(StealthPlugin());
import { db } from "./lib/client.js";
import { clean, parsePrice, parseMg, log, sleep } from "./lib/scraper.js";
import { classifyProduct, unmatchedNames } from "./lib/peptide-classifier.js";

const SCRIPT = "scrape-products";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Vendor config ─────────────────────────────────────────────────────────

type VendorCatalogConfig = {
  slug: string;
  catalogUrl: string;
  isGated?: boolean;
};

const VENDOR_CONFIGS: VendorCatalogConfig[] = [
  // Gated vendors — membership required, no public catalog
  { slug: "felix-chemical-supply", catalogUrl: "", isGated: true },
  { slug: "alpha-biomed-labs",     catalogUrl: "", isGated: true },

  // Active vendors
  { slug: "peptide-partners",        catalogUrl: "https://peptide.partners/shop" },
  { slug: "ion-peptide",             catalogUrl: "https://ionpeptide.com/shop" },
  { slug: "core-peptides",           catalogUrl: "https://www.corepeptides.com/peptides/" },
  { slug: "limitless-biotech",       catalogUrl: "https://limitlessbiotech.us/product-category/peptides/" },
  { slug: "ascension-peptides",      catalogUrl: "https://ascensionpeptides.com/collections/all" },
  { slug: "nexaph",                  catalogUrl: "https://nexaph.com/peptides" },
  { slug: "mile-high-compounds",     catalogUrl: "", isGated: true },
  { slug: "crush-research",          catalogUrl: "https://crushresearch.shop/shop" },
  { slug: "omegamino",               catalogUrl: "", isGated: true },
  { slug: "orbitrex-peptides",       catalogUrl: "https://orbitrexpeptide.is/shop/" },
  // Real domain is peptidology.co (not .com — that was a bug here, DNS never
  // resolved for .com). Site itself login-gates its pages, though the
  // WooCommerce Store API happens to be reachable without auth; handled by
  // scrape-gated-vendors.ts (npm run scrape:gated -- peptidology), which
  // reads the correct website from the vendors table row instead of a
  // hardcoded URL. Marked gated here so this scraper skips it cleanly.
  { slug: "peptidology",             catalogUrl: "", isGated: true },
  { slug: "swiss-chems",             catalogUrl: "https://swisschems.is/product-category/peptides" },
  { slug: "pure-rawz",               catalogUrl: "https://purerawz.co/peptides" },
  { slug: "loti-labs",               catalogUrl: "", isGated: true },
  { slug: "biotech-peptides",        catalogUrl: "https://biotechpeptides.com/collections/all" },
  { slug: "sports-technology-labs",  catalogUrl: "https://sportstechnologylabs.com/shop" },
  { slug: "polaris-peptides",        catalogUrl: "https://polarispeptides.com/collections/peptides" },
  { slug: "pivot-labs",              catalogUrl: "https://pivotlabs.com/shop" },
  { slug: "ez-peptides",             catalogUrl: "https://ezpeptides.com/collections/all" },
  { slug: "skye-peptides",           catalogUrl: "https://skyepeptides.com/collections/peptides" },
  { slug: "bulk-peptide-supply",     catalogUrl: "https://bulkpeptidesupply.com/shop" },
  { slug: "astro-peptides",          catalogUrl: "https://astropeptides.com/products" },
  { slug: "dynamic-peptide",         catalogUrl: "https://dynamicpeptide.com/collections/peptides" },
  { slug: "glacier-aminos",          catalogUrl: "https://glaciersaminos.com/shop" },
  { slug: "penguin-peptides",        catalogUrl: "https://penguinpeptides.com/collections/all" },
  { slug: "paramount-peptides",      catalogUrl: "https://paramountpeptides.com/collections/peptides" },
  { slug: "nuscience-peptides",      catalogUrl: "https://nusciencepeptides.com/shop" },
  { slug: "southern-peptides",       catalogUrl: "https://southern-peptides-llc.myshopify.com/collections/all" },
  { slug: "simple-peptide",          catalogUrl: "https://simplepeptide.com/shop" },
  { slug: "verified-peptides",       catalogUrl: "https://verifiedpeptides.com/shop" },
  { slug: "aavant-research",         catalogUrl: "https://aavantacr.com/shop" },
  { slug: "nextechlabs",             catalogUrl: "https://nextechlaboratories.com/collections/all" },
  { slug: "apollo-peptide-sciences", catalogUrl: "https://apollopeptidesciences.com/collections/all" },
  { slug: "cernum-biosciences",      catalogUrl: "https://cernumbiosciences.com/shop" },
  { slug: "peptide-crafters",        catalogUrl: "https://peptidecrafters.com/collections/peptides" },
  { slug: "lvlup-health",            catalogUrl: "", isGated: true }, // account/PIN login required — no public catalog (confirmed 2026-07-17)
  { slug: "healthgevity",            catalogUrl: "https://healthgev.com/shop" },

  // New vendors added 2026-06-09
  { slug: "ruo-science",             catalogUrl: "https://ruoscience.com/shop" },
  { slug: "true-research-labs",      catalogUrl: "https://trueresearchlabs.com/shop" },
  { slug: "licensed-peptides",       catalogUrl: "", isGated: true },   // login required for full catalog
  { slug: "certified-pep",           catalogUrl: "https://certified-pep.com/shop-peptides/", isGated: true }, // Cloudflare — needs stealth browser
  { slug: "perfect-peptides",        catalogUrl: "https://perfectpeptides.com/shop", isGated: true },         // Cloudflare — needs stealth browser
  { slug: "maxx-research-supply",    catalogUrl: "https://maxxresearchsupply.com/shop", isGated: true },      // Cloudflare — no public data accessible
];

// Peptide/non-peptide classification lives in ./lib/peptide-classifier.ts —
// shared with scrape-gated-vendors.ts so the two scrapers can't drift out of
// sync with each other again (they used to each keep their own copy).

// ── Product data type ─────────────────────────────────────────────────────

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

// ── Stage 1: Shopify JSON API ─────────────────────────────────────────────

type ShopifyVariant = {
  price: string;
  compare_at_price: string | null;
  available: boolean;
};
type ShopifyProduct = {
  title: string;
  available: boolean;
  variants: ShopifyVariant[];
};

function parseShopifyProducts(slug: string, products: ShopifyProduct[]): ProductData[] {
  const results: ProductData[] = [];
  for (const p of products) {
    if (classifyProduct(slug, p.title) !== "peptide") continue;
    const variant = p.variants[0];
    const price = variant?.price ? parseFloat(variant.price) : null;
    const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const isOnSale = compareAt !== null && price !== null && compareAt > price;
    results.push({
      peptide_name: p.title,
      size_mg:      parseMg(p.title),
      list_price:   isOnSale ? compareAt : price,
      sale_price:   isOnSale ? price : null,
      in_stock:     p.available ?? p.variants.some((v) => v.available),
    });
  }
  return results;
}

async function tryShopifyApi(catalogUrl: string, slug: string, browser: Browser): Promise<ProductData[] | null> {
  const { protocol, hostname } = new URL(catalogUrl);
  const apiUrl = `${protocol}//${hostname}/products.json?limit=250`;

  // Stage 1a: plain fetch (fast, no browser overhead)
  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("json")) {
      const json = (await res.json()) as { products?: ShopifyProduct[] };
      if (json.products?.length) return parseShopifyProducts(slug, json.products);
    }
  } catch {
    // fall through to browser attempt
  }

  // Stage 1b: stealth browser fallback (handles Cloudflare-protected Shopify stores)
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);
  await page.setUserAgent(USER_AGENT);
  try {
    await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body) as { products?: ShopifyProduct[] };
    if (!json.products?.length) return null;
    return parseShopifyProducts(slug, json.products);
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

// ── Stage 2: WooCommerce Store API ───────────────────────────────────────

type WooProduct = {
  name: string;
  prices: { price: string; regular_price: string; sale_price: string };
  is_in_stock: boolean;
};

async function tryWooCommerceApi(catalogUrl: string, slug: string, browser: Browser): Promise<ProductData[] | null> {
  try {
    const { protocol, hostname } = new URL(catalogUrl);
    const apiUrl = `${protocol}//${hostname}/wp-json/wc/store/v1/products?per_page=100`;

    // Use stealth browser so Cloudflare-protected sites let the API call through
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    await page.setUserAgent(USER_AGENT);
    try {
      await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      const body = await page.evaluate(() => document.body?.innerText ?? "");
      const json = JSON.parse(body) as WooProduct[];
      if (!Array.isArray(json) || json.length === 0) return null;

      const results: ProductData[] = [];
      for (const p of json) {
        if (classifyProduct(slug, p.name) !== "peptide") continue;
        const rawPrice   = p.prices?.price         ? parseInt(p.prices.price)         / 100 : null;
        const rawRegular = p.prices?.regular_price  ? parseInt(p.prices.regular_price) / 100 : null;
        const rawSale    = p.prices?.sale_price     ? parseInt(p.prices.sale_price)    / 100 : null;
        const isOnSale   = rawSale !== null && rawRegular !== null && rawSale < rawRegular;
        results.push({
          peptide_name: p.name,
          size_mg:      parseMg(p.name),
          list_price:   isOnSale ? rawRegular : rawPrice,
          sale_price:   isOnSale ? rawSale : null,
          in_stock:     p.is_in_stock ?? true,
        });
      }
      return results;
    } finally {
      await page.close();
    }
  } catch (err) {
    log(SCRIPT, `  ${slug}: WooCommerce API error — ${(err as Error).message}`);
    return null;
  }
}

// ── Stage 3: Puppeteer fallback ───────────────────────────────────────────

// WooCommerce selectors (also catches many generic stores)
const CARD_SEL   = "li.product, .product-item, .product-card, [class*='product-grid'] > *";
const NAME_SEL   = ".woocommerce-loop-product__title, h2, h3, [class*='product-title'], [class*='product-name']";
const PRICE_SEL  = ".woocommerce-Price-amount, .price .amount, [class*='price']";
const OOS_SEL    = ".out-of-stock, .sold-out, [class*='out-of-stock'], [class*='sold-out']";

async function scrapeWithPuppeteer(
  browser: Browser,
  config: VendorCatalogConfig
): Promise<ProductData[]> {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);
  await page.setUserAgent(USER_AGENT);

  try {
    await page.goto(config.catalogUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Extra wait for lazy-rendered product grids
    await new Promise((r) => setTimeout(r, 2000));
    const html = await page.content();
    const $ = cheerio.load(html);

    const products: ProductData[] = [];

    $(CARD_SEL).each((_, el) => {
      const name = clean($(el).find(NAME_SEL).first().text()) ?? "";
      if (!name || classifyProduct(config.slug, name) !== "peptide") return;
      const priceText  = clean($(el).find(PRICE_SEL).first().text());
      const outOfStock = $(el).find(OOS_SEL).length > 0 ||
                         $(el).text().toLowerCase().includes("sold out");
      products.push({
        peptide_name: name,
        size_mg:      parseMg(name),
        list_price:   parsePrice(priceText),
        sale_price:   null,
        in_stock:     !outOfStock,
      });
    });

    // Fallback for fully custom storefronts with no recognizable class names
    // (no WooCommerce/generic markup at all — a bespoke Tailwind/Next.js
    // build, for instance) where CARD_SEL matches nothing. Product detail
    // links are a much more universal pattern than any CSS class naming
    // convention, so anchor on those instead: walk up from each
    // `/product/...`-style link to the smallest ancestor that contains both
    // some text and something that parses as a price, and treat that as the
    // card.
    if (products.length === 0) {
      const seen = new Set<string>();
      $("a[href*='/product']").each((_, linkEl) => {
        let card = $(linkEl);
        for (let i = 0; i < 4; i++) {
          const text = clean(card.text()) ?? "";
          const price = parsePrice(text);
          if (text && price !== null) break;
          const parent = card.parent();
          if (parent.length === 0) break;
          card = parent;
        }
        const name = clean(card.find("img").attr("alt") ?? "") || clean(card.text())?.split(/\s{2,}|\$/)[0];
        if (!name || seen.has(name) || classifyProduct(config.slug, name) !== "peptide") return;
        seen.add(name);
        const priceText = clean(card.text());
        products.push({
          peptide_name: name,
          size_mg:      parseMg(name),
          list_price:   parsePrice(priceText),
          sale_price:   null,
          in_stock:     !(card.text().toLowerCase().includes("sold out") || card.text().toLowerCase().includes("out of stock")),
        });
      });
    }

    return products;
  } catch (err) {
    log(SCRIPT, `  ${config.slug}: Puppeteer error — ${(err as Error).message}`);
    return [];
  } finally {
    await page.close();
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function getVendorId(slug: string): Promise<string | null> {
  const { data } = await db.from("vendors").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

async function saveProducts(vendorId: string, slug: string, products: ProductData[]): Promise<void> {
  const now = new Date().toISOString();
  const rows = products.map((p) => ({ ...p, vendor_id: vendorId, last_checked: now }));

  await db.from("vendor_peptides").delete().eq("vendor_id", vendorId);
  const { error } = await db.from("vendor_peptides").insert(rows);
  if (error) {
    log(SCRIPT, `  ✗ ${slug}: DB write failed — ${error.message}`);
  } else {
    log(SCRIPT, `  ✓ ${slug}: ${products.length} products saved`);
    await db.from("vendors").update({ total_products: products.length }).eq("id", vendorId);
  }
}

// ── Per-vendor scrape ─────────────────────────────────────────────────────

async function scrapeVendor(browser: Browser, config: VendorCatalogConfig): Promise<void> {
  if (config.isGated) {
    log(SCRIPT, `  ${config.slug}: gated — skipping`);
    await db.from("vendors").update({ is_gated: true }).eq("slug", config.slug);
    return;
  }

  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `  ${config.slug}: not found in DB`);
    return;
  }

  // Stage 1: Shopify API (plain fetch, browser fallback for Cloudflare-protected stores)
  const shopifyProducts = await tryShopifyApi(config.catalogUrl, config.slug, browser);
  if (shopifyProducts !== null) {
    log(SCRIPT, `  ${config.slug}: Shopify API → ${shopifyProducts.length} peptide products`);
    if (shopifyProducts.length > 0) await saveProducts(vendorId, config.slug, shopifyProducts);
    return;
  }

  // Stage 2: WooCommerce Store API (via stealth browser — bypasses Cloudflare)
  const wooProducts = await tryWooCommerceApi(config.catalogUrl, config.slug, browser);
  if (wooProducts !== null) {
    log(SCRIPT, `  ${config.slug}: WooCommerce API → ${wooProducts.length} peptide products`);
    if (wooProducts.length > 0) await saveProducts(vendorId, config.slug, wooProducts);
    return;
  }

  // Stage 3: Puppeteer
  log(SCRIPT, `  ${config.slug}: APIs not available — using Puppeteer…`);
  await sleep(1000);
  const puppeteerProducts = await scrapeWithPuppeteer(browser, config);
  log(SCRIPT, `  ${config.slug}: Puppeteer → ${puppeteerProducts.length} peptide products`);
  if (puppeteerProducts.length > 0) await saveProducts(vendorId, config.slug, puppeteerProducts);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Optional: npm run scrape:products -- <slug> [<slug> ...] to target specific
  // vendors instead of the full ~40-vendor run (e.g. verifying a single fix).
  const requestedSlugs = process.argv.slice(2);
  const configs = requestedSlugs.length > 0
    ? VENDOR_CONFIGS.filter((c) => requestedSlugs.includes(c.slug))
    : VENDOR_CONFIGS;

  log(SCRIPT, `Processing ${configs.length} vendor(s)…`);

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser;

  try {
    for (const config of configs) {
      await scrapeVendor(browser, config);
      await sleep(1500);
    }
  } finally {
    await browser.close();
  }

  if (unmatchedNames.size > 0) {
    log(SCRIPT, "");
    log(SCRIPT, "Unmatched product names (neither a known peptide nor a known non-peptide — review and classify):");
    for (const [slug, names] of unmatchedNames) {
      log(SCRIPT, `  ${slug} (${names.length}): ${names.join(", ")}`);
    }
  }

  log(SCRIPT, "Done.");
}

main();
