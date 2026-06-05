/**
 * scripts/scrape-gated-vendors.ts
 * Logs in to gated vendor sites and scrapes products + shipping.
 * Also handles status corrections for Ion Peptide and Apollo Peptide Sciences.
 *
 * Run: npm run scrape:gated
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { db } from "./lib/client.js";
import { clean, parsePrice, parseMg, log, sleep } from "./lib/scraper.js";

puppeteerExtra.use(StealthPlugin());

const SCRIPT = "scrape-gated";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Config ────────────────────────────────────────────────────────────────

type Platform = "woocommerce" | "shopify" | "custom";

type GatedVendorConfig = {
  slug: string;
  name: string;
  baseUrl: string;
  loginPath: string;
  catalogPaths: string[];
  username?: string;     // if site uses username field
  email: string;         // used if no username field, or as fallback
  password: string;
  platform: Platform;
  newWebsite?: string;   // update website URL in DB if changed
};

const GATED_VENDORS: GatedVendorConfig[] = [
  {
    slug: "felix-chemical-supply",
    name: "Felix Chemical Supply",
    baseUrl: "https://felixchem.is",
    loginPath: "/felix-chemical-supply/",
    catalogPaths: ["/felix-chemical-supply/shop/", "/shop/", "/products/"],
    username: "watchtower",
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "woocommerce",
    newWebsite: "https://felixchem.is/felix-chemical-supply/",
  },
  {
    slug: "loti-labs",
    name: "Loti Labs",
    baseUrl: "https://lotilabs.com",
    loginPath: "/my-account/",
    catalogPaths: ["/peptides/", "/catalog/", "/capsules/"],
    username: "watchtower",
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "woocommerce",
  },
  {
    slug: "mile-high-compounds",
    name: "Mile High Compounds",
    baseUrl: "https://milehighcompounds.is",
    loginPath: "/my-account/",
    catalogPaths: ["/shop/", "/products/", "/peptides/"],
    username: "watchtower",
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "woocommerce",
  },
  {
    slug: "omegamino",
    name: "Omegamino",
    baseUrl: "https://omegamino.net",
    loginPath: "/my-account/",
    catalogPaths: ["/shop/", "/products/", "/peptides/"],
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "woocommerce",
  },
  {
    slug: "ascension-peptides",
    name: "Ascension Peptides",
    baseUrl: "https://ascensionpeptides.com",
    loginPath: "/my-account/",
    catalogPaths: ["/collections/all", "/shop/", "/products/"],
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "woocommerce",
  },
  {
    slug: "ion-peptide",
    name: "Ion Peptide",
    baseUrl: "https://ionpeptide.com",
    loginPath: "/my-account/",
    catalogPaths: ["/shop/", "/products/", "/collections/all"],
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "custom",  // site appears to be publicly accessible
  },
  {
    slug: "peptidology",
    name: "Peptidology",
    baseUrl: "https://peptidology.co",
    loginPath: "/login/",
    catalogPaths: ["/products/", "/shop/", "/collections/all"],
    email: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
    platform: "custom",
    newWebsite: "https://peptidology.co",
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
  "dihexa", "pinealon", "dsip", "thymulin", "mk-677",
  "nad+", "nad ", "vip", "kpv", "selank", "ipa",
];

function isPeptide(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_PEPTIDES.some((kw) => lower.includes(kw));
}

// ── Product data ──────────────────────────────────────────────────────────

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

// ── Login helpers ─────────────────────────────────────────────────────────

// Fill a form field by direct value injection (avoids per-keystroke CDP calls that time out)
async function fillField(page: Page, selector: string, value: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 8000 });
    await page.$eval(selector, (el: Element, val: string) => {
      (el as HTMLInputElement).value = val;
      el.dispatchEvent(new Event("input",  { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    return true;
  } catch {
    return false;
  }
}

async function loginWooCommerce(
  page: Page,
  config: GatedVendorConfig
): Promise<boolean> {
  const loginUrl = `${config.baseUrl}${config.loginPath}`;
  log(SCRIPT, `  → Navigating to ${loginUrl}`);

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);

    // Accept any age gate if present
    try {
      const ageBtn = await page.$("button[class*='age'], .age-gate__submit, input[value*='Enter']");
      if (ageBtn) { await ageBtn.click(); await sleep(800); }
    } catch { /* no age gate */ }

    // Detect username vs email field
    const hasUsernameField = !!(await page.$("input[name='username']").catch(() => null));
    const loginValue = hasUsernameField && config.username ? config.username : config.email;
    const userSel = "input[name='username'], input[type='email'], input[name='log']";

    const filledUser = await fillField(page, userSel, loginValue);
    const filledPass = await fillField(page, "input[name='password'], input[type='password']", config.password);

    if (!filledUser || !filledPass) {
      log(SCRIPT, `  ✗ Could not find login form fields`);
      return false;
    }

    const submitSel = "button[name='login'], input[name='login'], button[type='submit'], input[type='submit']";
    await page.click(submitSel);
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await sleep(1500);

    const currentUrl = page.url();
    const pageText = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    const lower = pageText.toLowerCase();

    if (lower.includes("incorrect") || lower.includes("invalid username") || lower.includes("wrong password")) {
      log(SCRIPT, `  ✗ Login failed — credentials rejected at ${currentUrl}`);
      return false;
    }

    const isLoggedIn = lower.includes("log out") || lower.includes("logout") ||
                       lower.includes("dashboard") || lower.includes("orders");
    if (isLoggedIn) { log(SCRIPT, `  ✓ Logged in successfully`); return true; }

    log(SCRIPT, `  ? Login status unclear at ${currentUrl} — proceeding`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `  ✗ Login error: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

async function loginShopify(
  page: Page,
  config: GatedVendorConfig
): Promise<boolean> {
  const loginUrl = `${config.baseUrl}${config.loginPath}`;
  log(SCRIPT, `  → Navigating to ${loginUrl}`);

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);

    const filledEmail = await fillField(page, "input[type='email'], input[name='customer[email]']", config.email);
    const filledPass  = await fillField(page, "input[type='password'], input[name='customer[password]']", config.password);

    if (!filledEmail || !filledPass) {
      log(SCRIPT, `  ✗ Could not find Shopify login fields`);
      return false;
    }

    await page.click("button[type='submit'], input[type='submit']");
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await sleep(1500);

    const pageText = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    if (pageText.toLowerCase().includes("incorrect email or password")) {
      log(SCRIPT, `  ✗ Shopify login failed`);
      return false;
    }

    log(SCRIPT, `  ✓ Shopify login appears successful`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `  ✗ Shopify login error: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

// ── Product scraping helpers ──────────────────────────────────────────────

async function tryWooCommerceApi(page: Page, baseUrl: string): Promise<ProductData[] | null> {
  const apiUrl = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100`;
  try {
    await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 12000 });
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body);
    if (!Array.isArray(json) || json.length === 0) return null;

    const results: ProductData[] = [];
    for (const p of json) {
      if (!isPeptide(p.name ?? "")) continue;
      const rawPrice   = p.prices?.price          ? parseInt(p.prices.price)         / 100 : null;
      const rawRegular = p.prices?.regular_price   ? parseInt(p.prices.regular_price) / 100 : null;
      const rawSale    = p.prices?.sale_price      ? parseInt(p.prices.sale_price)    / 100 : null;
      const isOnSale   = rawSale !== null && rawRegular !== null && rawSale < rawRegular;
      results.push({
        peptide_name: p.name,
        size_mg:      parseMg(p.name),
        list_price:   isOnSale ? rawRegular : rawPrice,
        sale_price:   isOnSale ? rawSale : null,
        in_stock:     p.is_in_stock ?? true,
      });
    }
    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

async function tryShopifyApi(page: Page, baseUrl: string): Promise<ProductData[] | null> {
  const apiUrl = `${baseUrl}/products.json?limit=250`;
  try {
    await page.goto(apiUrl, { waitUntil: "domcontentloaded", timeout: 12000 });
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body) as { products?: any[] };
    if (!json.products?.length) return null;

    const results: ProductData[] = [];
    for (const p of json.products) {
      if (!isPeptide(p.title ?? "")) continue;
      const variant = p.variants?.[0];
      const price = variant?.price ? parseFloat(variant.price) : null;
      const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const isOnSale = compareAt !== null && price !== null && compareAt > price;
      results.push({
        peptide_name: p.title,
        size_mg:      parseMg(p.title),
        list_price:   isOnSale ? compareAt : price,
        sale_price:   isOnSale ? price : null,
        in_stock:     p.available ?? p.variants?.some((v: any) => v.available) ?? true,
      });
    }
    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

async function scrapeProductsFromHtml(page: Page, url: string): Promise<ProductData[]> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(2000);
    const html = await page.content();
    const $ = cheerio.load(html);
    const products: ProductData[] = [];

    const CARD_SEL  = "li.product, .product-item, .product-card, [class*='product-grid'] > *, article";
    const NAME_SEL  = ".woocommerce-loop-product__title, h2, h3, [class*='product-title'], [class*='product-name']";
    const PRICE_SEL = ".woocommerce-Price-amount, .price .amount, [class*='price']";
    const OOS_SEL   = ".out-of-stock, .sold-out, [class*='out-of-stock'], [class*='sold-out']";

    $(CARD_SEL).each((_, el) => {
      const name = clean($(el).find(NAME_SEL).first().text()) ?? "";
      if (!name || !isPeptide(name)) return;
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
    return products;
  } catch {
    return [];
  }
}

async function scrapeShipping(page: Page, baseUrl: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  const paths = ["/policies/shipping", "/shipping-policy", "/pages/shipping-policy", "/pages/shipping", "/shipping"];

  for (const path of paths) {
    try {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 10000 });
      const text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
      if (text.length < 100) continue;

      // Free threshold
      const freeThresholdMatch = text.match(/free\s+shipping\s+on\s+(?:all\s+)?orders?\s+(?:over|above)?\s*\$\s*(\d+)/i);
      const freeAllMatch = /free\s+shipping\s+on\s+all\s+(?:domestic\s+)?orders?(?!\s+over|\s+above)/i.test(text);
      if (freeAllMatch) result.shipping_free_threshold = 0;
      else if (freeThresholdMatch) result.shipping_free_threshold = parseFloat(freeThresholdMatch[1]);

      // Flat fee
      const flatFeeMatch = text.match(/flat[\s-]rate\s+shipping\s+(?:of\s+)?\$\s*(\d+)/i) ??
                           text.match(/\$\s*(\d+)\s+flat[\s-]rate/i);
      if (flatFeeMatch) result.shipping_flat_fee = parseFloat(flatFeeMatch[1]);

      // International
      if (/only\s+ship|domestic\s+only|US\s+only/i.test(text)) result.ships_internationally = false;
      else if (/ship(?:ping)?\s+(?:world[-\s]?wide|internationally)/i.test(text)) result.ships_internationally = true;

      // Payment
      if (/visa|mastercard|credit\s+card|debit/i.test(text)) result.credit_card_accepted = true;
      if (/bitcoin|ethereum|crypto|btc|eth\b/i.test(text)) result.crypto_accepted = true;
      if (/paypal/i.test(text)) result.paypal_accepted = true;

      if (Object.keys(result).length > 0) break;
    } catch { /* continue */ }
  }
  return result;
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
    log(SCRIPT, `  ✗ DB write failed — ${error.message}`);
  } else {
    log(SCRIPT, `  ✓ ${products.length} products saved`);
    await db.from("vendors").update({ total_products: products.length }).eq("id", vendorId);
  }
}

// ── Per-vendor orchestration ──────────────────────────────────────────────

async function handleVendor(browser: Browser, config: GatedVendorConfig): Promise<void> {
  console.log(`\n── ${config.name} ─────────────────────────────`);

  const vendorId = await getVendorId(config.slug);
  if (!vendorId) {
    log(SCRIPT, `  SKIP — not found in DB`);
    return;
  }

  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1280, height: 900 });
  page.setDefaultNavigationTimeout(20000);

  try {
    // Update website URL if changed
    if (config.newWebsite) {
      await db.from("vendors").update({ website: config.newWebsite }).eq("id", vendorId);
      log(SCRIPT, `  ↪ Updated website → ${config.newWebsite}`);
    }

    // Special case: Ion Peptide — just activate and scrape without login
    if (config.slug === "ion-peptide") {
      log(SCRIPT, `  ℹ Site is publicly accessible — attempting direct scrape`);
      let products: ProductData[] | null = null;

      // Try Shopify API first
      products = await tryShopifyApi(page, config.baseUrl);
      if (!products) {
        // Try WooCommerce API
        products = await tryWooCommerceApi(page, config.baseUrl);
      }
      if (!products) {
        // Try HTML scrape from each catalog path
        for (const path of config.catalogPaths) {
          const scraped = await scrapeProductsFromHtml(page, `${config.baseUrl}${path}`);
          if (scraped.length > 0) { products = scraped; break; }
        }
      }

      if (products && products.length > 0) {
        await saveProducts(vendorId, config.slug, products);
        await db.from("vendors").update({ status: "active" }).eq("id", vendorId);
        log(SCRIPT, `  ✓ Reactivated vendor`);
      } else {
        log(SCRIPT, `  ? No peptide products found via auto-detect — activating anyway`);
        await db.from("vendors").update({ status: "active" }).eq("id", vendorId);
      }
      const shipping = await scrapeShipping(page, config.baseUrl);
      if (Object.keys(shipping).length > 0) {
        await db.from("vendors").update(shipping).eq("id", vendorId);
        log(SCRIPT, `  ✓ Shipping data updated`);
      }
      return;
    }

    // Try APIs without login first (some "gated" sites still expose public product APIs)
    log(SCRIPT, `  ℹ Trying APIs without login first…`);
    let products: ProductData[] | null = null;
    products = await tryShopifyApi(page, config.baseUrl);
    if (!products) products = await tryWooCommerceApi(page, config.baseUrl);

    if (products && products.length > 0) {
      log(SCRIPT, `  ✓ API accessible without login — ${products.length} products`);
      await saveProducts(vendorId, config.slug, products);
      const shipping = await scrapeShipping(page, config.baseUrl);
      if (Object.keys(shipping).length > 0) {
        await db.from("vendors").update(shipping).eq("id", vendorId);
        log(SCRIPT, `  ✓ Shipping: ${JSON.stringify(shipping)}`);
      }
      await db.from("vendors").update({ is_gated: false }).eq("id", vendorId);
      return;
    }

    // Attempt login
    let loggedIn = false;
    if (config.platform === "shopify") {
      loggedIn = await loginShopify(page, config);
    } else {
      loggedIn = await loginWooCommerce(page, config);
    }

    if (!loggedIn) {
      log(SCRIPT, `  ✗ Could not log in — skipping product scrape`);
      await db.from("vendors").update({ is_gated: true }).eq("id", vendorId);
      return;
    }

    // Try to get products post-login
    products = null;
    if (config.platform === "shopify") {
      products = await tryShopifyApi(page, config.baseUrl);
    } else {
      products = await tryWooCommerceApi(page, config.baseUrl);
    }

    // Fall back to HTML scraping
    if (!products || products.length === 0) {
      log(SCRIPT, `  ℹ API returned no results — trying HTML scrape`);
      for (const path of config.catalogPaths) {
        const scraped = await scrapeProductsFromHtml(page, `${config.baseUrl}${path}`);
        if (scraped.length > 0) {
          products = scraped;
          log(SCRIPT, `  ✓ HTML scrape found ${scraped.length} products at ${path}`);
          break;
        }
        await sleep(500);
      }
    }

    if (products && products.length > 0) {
      await saveProducts(vendorId, config.slug, products);
    } else {
      log(SCRIPT, `  ? No peptide products found after login`);
      // Print page title and URL to help debug
      const url = page.url();
      const title = await page.title();
      log(SCRIPT, `  Current page: [${title}] ${url}`);
    }

    // Scrape shipping info
    const shipping = await scrapeShipping(page, config.baseUrl);
    if (Object.keys(shipping).length > 0) {
      await db.from("vendors").update(shipping).eq("id", vendorId);
      log(SCRIPT, `  ✓ Shipping: ${JSON.stringify(shipping)}`);
    } else {
      log(SCRIPT, `  — No shipping data found`);
    }

    await db.from("vendors").update({ is_gated: false }).eq("id", vendorId);

  } catch (err: any) {
    log(SCRIPT, `  ✗ Unhandled error: ${err.message?.slice(0, 100)}`);
  } finally {
    await page.close();
  }
}

// ── Status-only corrections (no scraping needed) ──────────────────────────

async function applyStatusCorrections(): Promise<void> {
  console.log("\n── Status corrections ────────────────────────────────");

  // Apollo Peptide Sciences: original domain dead, .org is a separate unrelated vendor
  const { error: apolloErr } = await db
    .from("vendors")
    .update({ status: "inactive" })
    .eq("slug", "apollo-peptide-sciences");
  if (apolloErr) log(SCRIPT, `  ✗ Apollo update failed: ${apolloErr.message}`);
  else log(SCRIPT, `  ✓ Apollo Peptide Sciences → inactive (original domain dead)`);

  // Alpha BioMed Labs: institutional-only gate, no way in, mark is_gated
  const { error: alphaErr } = await db
    .from("vendors")
    .update({ is_gated: true })
    .eq("slug", "alpha-biomed-labs");
  if (alphaErr) log(SCRIPT, `  ✗ Alpha BioMed update failed: ${alphaErr.message}`);
  else log(SCRIPT, `  ✓ Alpha BioMed Labs → is_gated=true (institutional access only)`);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  // Optional: pass slug filter as CLI args, e.g. "npm run scrape:gated -- loti-labs ascension-peptides"
  const filter = process.argv.slice(2);

  console.log("=== Gated Vendor Scraper ===\n");

  if (!filter.length) await applyStatusCorrections();

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

  const vendors = filter.length
    ? GATED_VENDORS.filter((v) => filter.includes(v.slug))
    : GATED_VENDORS;

  for (const config of vendors) {
    await handleVendor(browser, config);
    await sleep(1500);
  }

  await browser.close();
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
