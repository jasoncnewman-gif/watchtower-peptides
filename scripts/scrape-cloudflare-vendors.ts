/**
 * scripts/scrape-cloudflare-vendors.ts
 * Scrapes Cloudflare-protected vendors using Puppeteer + stealth + real Chrome.
 * Logs in with shared Watchtower credentials before scraping — gated catalogs
 * hide products behind auth and a public scrape is never sufficient.
 *
 * Vendors: certified-pep.com, perfectpeptides.com, maxxresearchsupply.com
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/scrape-cloudflare-vendors.ts
 *      npx tsx --tsconfig scripts/tsconfig.json scripts/scrape-cloudflare-vendors.ts certified-pep
 */

import type { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { db } from "./lib/client.js";
import { clean, parsePrice, parseMg, log, sleep } from "./lib/scraper.js";

// Lazy-import puppeteer in main() so the stealth plugin doesn't patch Node's
// fetch before the Supabase DB queries run.

const SCRIPT = "scrape-cf";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Vendor config ─────────────────────────────────────────────────────────

// Shared Watchtower credentials — used for all WooCommerce gated vendors.
// Source: vendor-action-needed.csv at project root.
const WT_EMAIL    = "info@watchtowerpeptides.com";
const WT_USERNAME = "watchtower";
const WT_PASSWORD = "jikHip-6dewje-xytgih";

type CfVendor = {
  slug: string;
  name: string;
  baseUrl: string;
  loginPath: string;
  shopPaths: string[];
  coaUrl: string | null;
};

const CF_VENDORS: CfVendor[] = [
  {
    slug: "certified-pep",
    name: "Certified Pep",
    baseUrl: "https://certified-pep.com",
    loginPath: "/my-account/",
    shopPaths: ["/shop-peptides/", "/shop/", "/products/"],
    coaUrl: "https://certified-pep.com/lab-testing/",
  },
  {
    slug: "perfect-peptides",
    name: "Perfect Peptides",
    baseUrl: "https://perfectpeptides.com",
    loginPath: "/my-account/",
    shopPaths: ["/shop/", "/products/", "/collections/all"],
    coaUrl: "https://perfectpeptides.com/coa",
  },
  {
    slug: "maxx-research-supply",
    name: "Maxx Research Supply",
    baseUrl: "https://maxxresearchsupply.com",
    loginPath: "/my-account/",
    shopPaths: ["/shop/", "/products/", "/collections/all"],
    coaUrl: null,
  },
];

// ── Peptide filter ────────────────────────────────────────────────────────

const KNOWN_PEPTIDES = [
  "bpc", "tb-500", "thymosin", "sermorelin", "cjc", "ipamorelin",
  "semaglutide", "tirzepatide", "pt-141", "bremelanotide", "kisspeptin",
  "ghrp", "igf", "selank", "semax", "epitalon", "epithalon", "melanotan",
  "gh frag", "aod", "ss-31", "mots-c", "humanin", "fgl",
  "retatrutide", "triptorelin", "hexarelin", "tesamorelin",
  "peptide yy", "gip", "glp", "oxytocin", "ll-37", "ghk",
  "nad", "vip", "kpv", "cagrilintide",
];

function isPeptide(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_PEPTIDES.some((kw) => lower.includes(kw));
}

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

// ── Login ─────────────────────────────────────────────────────────────────

async function loginWooCommerce(page: Page, baseUrl: string, loginPath: string): Promise<boolean> {
  const loginUrl = baseUrl + loginPath;
  log(SCRIPT, `  → Logging in at ${loginUrl}`);
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);

    // Dismiss age gates / overlays
    const dismissSels = [
      "#zc-manage", ".zcb-button-primary",
      "button[class*='accept'], a[class*='accept']",
      "button[class*='age'], .age-gate__submit, input[value*='Enter'], input[value*='Yes']",
    ];
    for (const sel of dismissSels) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); await sleep(600); break; }
      } catch { /* continue */ }
    }

    // Username field — WP uses name="log", some use "username" or "xoo-el-username"
    const userSel = "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']";
    const hasUser = !!(await page.$(userSel).catch(() => null));
    const loginValue = hasUser ? WT_USERNAME : WT_EMAIL;

    try {
      await page.waitForSelector(userSel, { timeout: 8000 });
      await page.click(userSel);
      await page.type(userSel, loginValue, { delay: 40 });
    } catch {
      log(SCRIPT, `  ✗ Could not find username/email field`);
      return false;
    }

    const passSel = "input[name='pwd'], input[name='password'], input[name='xoo-el-password'], input[type='password']";
    try {
      await page.waitForSelector(passSel, { timeout: 8000 });
      await page.click(passSel);
      await page.type(passSel, WT_PASSWORD, { delay: 40 });
    } catch {
      log(SCRIPT, `  ✗ Could not find password field`);
      return false;
    }

    // Click submit in the same form as the username field
    const clicked = await page.evaluate(() => {
      const userField = document.querySelector(
        "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']"
      ) as HTMLInputElement | null;
      const form = userField?.closest("form");
      const btn  = form?.querySelector(
        "input[type='submit'], button[type='submit'], input[name='wp-submit']"
      ) as HTMLElement | null;
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) {
      await page.click("input[name='wp-submit'], button[type='submit'], input[type='submit']").catch(() => {});
    }

    await Promise.race([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
      sleep(6000),
    ]).catch(() => {});
    await sleep(1500);

    const text  = (await page.evaluate(() => document.body?.innerText ?? "").catch(() => "")).toLowerCase();
    const lower = text;

    if (lower.includes("incorrect") || lower.includes("invalid username") || lower.includes("wrong password")) {
      log(SCRIPT, `  ✗ Login failed — credentials rejected`);
      return false;
    }
    const loggedIn = lower.includes("log out") || lower.includes("logout") ||
                     lower.includes("my account") || lower.includes("dashboard") ||
                     lower.includes("orders") || lower.includes("welcome");
    if (loggedIn) {
      log(SCRIPT, `  ✓ Logged in`);
      return true;
    }
    // Still on login page = failed
    if (page.url().includes("my-account") && lower.includes("username")) {
      log(SCRIPT, `  — No account found — proceeding as guest`);
      return false;
    }
    log(SCRIPT, `  ? Login status unclear — proceeding`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `  ✗ Login error: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

// ── Product scrapers ──────────────────────────────────────────────────────

async function tryWooCommerceApi(page: Page, baseUrl: string): Promise<ProductData[] | null> {
  const apiUrl = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100`;
  log(SCRIPT, `  → Trying WooCommerce API: ${apiUrl}`);
  try {
    await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1500);
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body);
    if (!Array.isArray(json) || json.length === 0) return null;

    const results: ProductData[] = [];
    for (const p of json) {
      if (!isPeptide(p.name ?? "")) continue;
      const rawPrice   = p.prices?.price         ? parseInt(p.prices.price)         / 100 : null;
      const rawRegular = p.prices?.regular_price  ? parseInt(p.prices.regular_price) / 100 : null;
      const rawSale    = p.prices?.sale_price     ? parseInt(p.prices.sale_price)    / 100 : null;
      const isOnSale   = rawSale !== null && rawRegular !== null && rawSale < rawRegular;
      results.push({
        peptide_name: clean(p.name) ?? p.name,
        size_mg:      parseMg(p.name),
        list_price:   isOnSale ? rawRegular : rawPrice,
        sale_price:   isOnSale ? rawSale : null,
        in_stock:     p.is_in_stock ?? true,
      });
    }
    log(SCRIPT, `  ✓ WooCommerce API: ${results.length} peptide products`);
    return results.length > 0 ? results : null;
  } catch {
    log(SCRIPT, `  — WooCommerce API failed`);
    return null;
  }
}

async function tryShopifyApi(page: Page, baseUrl: string): Promise<ProductData[] | null> {
  const apiUrl = `${baseUrl}/products.json?limit=250`;
  log(SCRIPT, `  → Trying Shopify API: ${apiUrl}`);
  try {
    await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1500);
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body) as { products?: any[] };
    if (!json.products?.length) return null;

    const results: ProductData[] = [];
    for (const p of json.products) {
      if (!isPeptide(p.title ?? "")) continue;
      const variant    = p.variants?.[0];
      const price      = variant?.price ? parseFloat(variant.price) : null;
      const compareAt  = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const isOnSale   = compareAt !== null && price !== null && compareAt > price;
      results.push({
        peptide_name: p.title,
        size_mg:      parseMg(p.title),
        list_price:   isOnSale ? compareAt : price,
        sale_price:   isOnSale ? price : null,
        in_stock:     p.available ?? p.variants?.some((v: any) => v.available) ?? true,
      });
    }
    log(SCRIPT, `  ✓ Shopify API: ${results.length} peptide products`);
    return results.length > 0 ? results : null;
  } catch {
    log(SCRIPT, `  — Shopify API failed`);
    return null;
  }
}

async function scrapeShopHtml(page: Page, url: string): Promise<ProductData[]> {
  log(SCRIPT, `  → Scraping HTML: ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
    await sleep(2500);

    // Dismiss age gates / cookie banners
    const dismissSels = [
      "button[class*='accept'], a[class*='accept']",
      "button[class*='agree'], a[class*='agree']",
      "button[class*='age'], .age-gate__submit, input[value*='Enter'], input[value*='Yes']",
      "#age-gate-submit, .age-gate button",
    ];
    for (const sel of dismissSels) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await sleep(1200);
          break;
        }
      } catch { /* continue */ }
    }

    const html = await page.content();
    const $    = cheerio.load(html);
    const products: ProductData[] = [];

    const CARD_SEL  = "li.product, .product-item, .product-card, [class*='product-grid'] > li, [class*='product-grid'] > div, article.post-type-product";
    const NAME_SEL  = ".woocommerce-loop-product__title, .woocommerce-loop-product__title h2, h2.woocommerce-loop-product__title, h2, h3, [class*='product-title'], [class*='product-name']";
    const PRICE_SEL = ".price .woocommerce-Price-amount, .price bdi, .woocommerce-Price-amount, [class*='price'] bdi, [class*='price']:not(.price del)";
    const OOS_SEL   = ".out-of-stock, .sold-out, [class*='out-of-stock'], [class*='sold-out']";

    $(CARD_SEL).each((_, el) => {
      const name = clean($(el).find(NAME_SEL).first().text()) ?? "";
      if (!name || !isPeptide(name)) return;

      // Get the current/sale price — prefer the last .amount in .price (which is the sale price)
      const priceAmounts = $(el).find(".price").find(".woocommerce-Price-amount bdi, .woocommerce-Price-amount");
      let listPrice: number | null = null;
      let salePrice: number | null = null;

      if (priceAmounts.length >= 2) {
        // del = original, ins or last = sale
        const delPrice = $(el).find(".price del .woocommerce-Price-amount").first().text();
        const insPrice = $(el).find(".price ins .woocommerce-Price-amount").first().text();
        listPrice = parsePrice(clean(delPrice));
        salePrice = parsePrice(clean(insPrice));
      } else {
        listPrice = parsePrice(clean($(el).find(PRICE_SEL).first().text()));
      }

      const outOfStock = $(el).find(OOS_SEL).length > 0 ||
                         $(el).text().toLowerCase().includes("sold out") ||
                         $(el).text().toLowerCase().includes("out of stock");

      products.push({
        peptide_name: name,
        size_mg:      parseMg(name),
        list_price:   listPrice,
        sale_price:   salePrice,
        in_stock:     !outOfStock,
      });
    });

    // Dedupe by peptide_name (keep first occurrence)
    const seen = new Set<string>();
    const deduped = products.filter(p => {
      if (seen.has(p.peptide_name)) return false;
      seen.add(p.peptide_name);
      return true;
    });

    log(SCRIPT, `  ✓ HTML scrape: ${deduped.length} peptide products`);
    return deduped;
  } catch (err: any) {
    log(SCRIPT, `  — HTML scrape failed: ${err.message?.slice(0, 80)}`);
    return [];
  }
}

// ── COA check ─────────────────────────────────────────────────────────────

const COA_KEYWORDS = [
  "certificate of analysis", "janoshik", "hplc", "lc-ms", "lc/ms",
  "purity:", "purity %", "test result", "lab result", "batch", "lot number",
  "download coa", "view coa",
];

async function checkCoaPage(page: Page, vendorId: string, coaUrl: string): Promise<void> {
  try {
    log(SCRIPT, `  → Checking COA page: ${coaUrl}`);
    const res = await page.goto(coaUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (!res || res.status() >= 400) {
      log(SCRIPT, `  — COA page ${res?.status() ?? "error"} at ${coaUrl}`);
      return;
    }
    await sleep(2000);

    const body  = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map(a => (a as HTMLAnchorElement).href)
    );

    const lower    = body.toLowerCase();
    const kwHit    = COA_KEYWORDS.some(kw => lower.includes(kw));
    const linkHit  = links.some(h => h.includes("janoshik") || h.includes(".pdf") || h.includes("coa"));
    const hasCoa   = kwHit || linkHit;

    if (hasCoa) {
      await db.from("vendors").update({ has_coa: true }).eq("id", vendorId);
      log(SCRIPT, `  ✓ COA content detected`);

      const coaLinks = links.filter(h =>
        h.includes("janoshik") || h.includes(".pdf") || h.includes("coa")
      ).slice(0, 50);

      if (coaLinks.length > 0) {
        const rows = coaLinks.map(href => ({
          vendor_id:       vendorId,
          peptide_name:    null as string | null,
          lab_name:        href.includes("janoshik") ? "Janoshik" : null as string | null,
          test_type:       null as string | null,
          purity_result:   null as number | null,
          test_date:       null as string | null,
          janoshik_tested: href.includes("janoshik"),
          coa_url:         href,
          verified:        false,
        }));
        await db.from("lab_tests").insert(rows);
        log(SCRIPT, `  ✓ ${coaLinks.length} COA links saved`);
      }
    } else {
      log(SCRIPT, `  — No COA content found`);
    }
  } catch (err: any) {
    log(SCRIPT, `  — COA check failed: ${err.message?.slice(0, 60)}`);
  }
}

// ── DB save ────────────────────────────────────────────────────────────────

async function saveProducts(vendorId: string, slug: string, products: ProductData[]): Promise<void> {
  const now = new Date().toISOString();
  const rows = products.map(p => ({ ...p, vendor_id: vendorId, last_checked: now }));
  await db.from("vendor_peptides").delete().eq("vendor_id", vendorId);
  const { error } = await db.from("vendor_peptides").insert(rows);
  if (error) {
    log(SCRIPT, `  ✗ DB write failed: ${error.message}`);
  } else {
    log(SCRIPT, `  ✓ ${products.length} products saved for ${slug}`);
    await db.from("vendors").update({ total_products: products.length }).eq("id", vendorId);
  }
}

// ── Per-vendor orchestration ──────────────────────────────────────────────

async function handleVendor(browser: Browser, vendor: CfVendor, vendorId: string): Promise<void> {
  log(SCRIPT, `\n── ${vendor.name} (${vendor.baseUrl}) ──`);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  try {
    // First: hit the homepage to establish a Cloudflare session/cookie
    log(SCRIPT, `  → Loading homepage to establish CF session…`);
    await page.goto(vendor.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    // Check if Cloudflare challenge page
    const title = await page.title();
    if (title.toLowerCase().includes("just a moment") || title.toLowerCase().includes("cloudflare")) {
      log(SCRIPT, `  ⏳ Cloudflare challenge detected — waiting 8s for resolution…`);
      await sleep(8000);
      const titleAfter = await page.title();
      if (titleAfter.toLowerCase().includes("just a moment")) {
        log(SCRIPT, `  ✗ Cloudflare challenge not cleared — stealth bypass insufficient`);
        return;
      }
    }
    log(SCRIPT, `  ✓ Homepage loaded: "${title}"`);

    // Login with shared Watchtower credentials before scraping.
    // Gated catalogs hide products behind auth — public scrape is never sufficient.
    await loginWooCommerce(page, vendor.baseUrl, vendor.loginPath);

    // Try WooCommerce API first (fastest, most complete)
    let products = await tryWooCommerceApi(page, vendor.baseUrl);

    // Try Shopify API
    if (!products) {
      products = await tryShopifyApi(page, vendor.baseUrl);
    }

    // Fall back to HTML scraping of each shop path
    if (!products) {
      for (const shopPath of vendor.shopPaths) {
        const result = await scrapeShopHtml(page, vendor.baseUrl + shopPath);
        if (result.length > 0) {
          products = result;
          break;
        }
        await sleep(1000);
      }
    }

    if (products && products.length > 0) {
      const withPrice = products.filter(p => p.list_price !== null || p.sale_price !== null);
      if (withPrice.length > 0) {
        await saveProducts(vendorId, vendor.slug, withPrice);
      } else {
        log(SCRIPT, `  — ${products.length} products found but none have pricing`);
      }
    } else {
      log(SCRIPT, `  — No products found`);
    }

    // Check COA page
    if (vendor.coaUrl) {
      await checkCoaPage(page, vendorId, vendor.coaUrl);
    }

  } catch (err: any) {
    log(SCRIPT, `  ✗ Fatal error: ${err.message?.slice(0, 100)}`);
  } finally {
    await page.close();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const slugFilter = process.argv.slice(2);

  // Fetch vendor IDs from DB
  const slugs = CF_VENDORS.map(v => v.slug);
  const { data: rows } = await db.from("vendors").select("id, slug").in("slug", slugs);
  const idMap: Record<string, string> = {};
  for (const r of rows ?? []) idMap[r.slug] = r.id;

  const vendors = CF_VENDORS.filter(v => {
    if (slugFilter.length > 0 && !slugFilter.includes(v.slug)) return false;
    if (!idMap[v.slug]) {
      log(SCRIPT, `${v.slug}: not found in DB — run seed-vendors.ts first`);
      return false;
    }
    return true;
  });

  if (vendors.length === 0) {
    log(SCRIPT, "No vendors to process.");
    return;
  }

  log(SCRIPT, `Processing ${vendors.length} Cloudflare-protected vendor(s)…`);

  // Lazy-import puppeteer so stealth plugin doesn't patch Node's fetch before DB queries
  const { default: puppeteerExtra }  = await import("puppeteer-extra");
  const { default: StealthPlugin }   = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: chromePath,
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900",
    ],
  }) as Browser;

  for (const vendor of vendors) {
    await handleVendor(browser, vendor, idMap[vendor.slug]);
    await sleep(2000);
  }

  await browser.close();
  log(SCRIPT, "\n=== Done ===");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
