/**
 * scripts/scrape-gated-vendors.ts
 * Logs in to gated vendor sites and scrapes products + shipping.
 * Credentials and catalog paths are read from the vendors table
 * (login_email, login_password, login_username, login_path, catalog_paths, login_platform).
 *
 * Run: npm run scrape:gated
 *      npm run scrape:gated -- loti-labs felix-chemical-supply
 */

import type { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { db } from "./lib/client.js";
import { clean, parsePrice, parseMg, log, sleep } from "./lib/scraper.js";
import { isPeptideProduct } from "./lib/peptide-classifier.js";

// Puppeteer is lazy-imported in launchBrowser() so its stealth plugin doesn't
// patch Node's fetch before the Supabase DB queries run.

const SCRIPT = "scrape-gated";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Types ─────────────────────────────────────────────────────────────────

type Platform = "woocommerce" | "shopify" | "custom";

type GatedVendorRow = {
  id: string;
  slug: string;
  name: string;
  website: string;
  login_username: string | null;
  login_email: string | null;
  login_password: string | null;
  login_path: string | null;
  catalog_paths: string[] | null;
  login_platform: string | null;
  coa_url: string | null;
  newWebsite?: string;
};

// Peptide classification now lives in ./lib/peptide-classifier.ts, shared
// with scrape-vendor-products.ts. This file used to keep its own copy,
// which had drifted out of sync — missing Cagrilintide and Mazdutide, and
// incorrectly listing "nad+"/"nad " and "mk-677" (a SARM, not a peptide) as
// matches.

// ── Product data ──────────────────────────────────────────────────────────

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

// ── Login helpers ─────────────────────────────────────────────────────────

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

async function loginWooCommerce(page: Page, config: GatedVendorRow): Promise<boolean> {
  const baseUrl = new URL(config.website).origin;
  const loginPath = config.login_path ?? "/my-account/";
  const loginUrl = `${baseUrl}${loginPath}`;
  log(SCRIPT, `  → Navigating to ${loginUrl}`);

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);

    // Dismiss cookie consent / age gate overlays before interacting with the form
    const dismissSels = [
      "#zc-manage",                                          // ZCB cookie banner (Ascension Peptides)
      ".zcb-button-primary",                                 // ZCB variant
      "button[class*='accept'], a[class*='accept']",         // generic accept
      "button[class*='agree'], a[class*='agree']",           // agree variant
      "button[class*='age'], .age-gate__submit, input[value*='Enter']",
    ];
    for (const sel of dismissSels) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); await sleep(600); break; }
      } catch { /* continue */ }
    }

    // Detect username vs email field — WP uses name="log", others use name="username";
    // Xoo Extra Logon (Polaris) uses name="xoo-el-username"
    const userSel = "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']";
    const hasUsernameField = !!(await page.$(userSel).catch(() => null));
    const loginValue = (hasUsernameField && config.login_username) ? config.login_username : config.login_email!;

    // Use page.type() for real keystroke events (required by some JS-validated forms)
    try {
      await page.waitForSelector(userSel, { timeout: 8000 });
      await page.click(userSel);
      await page.type(userSel, loginValue, { delay: 40 });
    } catch {
      log(SCRIPT, `  ✗ Could not find username/email field`);
      return false;
    }

    // Xoo Extra Logon uses name="xoo-el-password"
    const passSel = "input[name='pwd'], input[name='password'], input[name='xoo-el-password'], input[type='password']";
    try {
      await page.waitForSelector(passSel, { timeout: 8000 });
      await page.click(passSel);
      await page.type(passSel, config.login_password!, { delay: 40 });
    } catch {
      log(SCRIPT, `  ✗ Could not find password field`);
      return false;
    }

    // Click submit within the same form as the filled username field — handles pages
    // with multiple forms (e.g. Xoo Extra Logon plugin on Polaris).
    const clicked = await page.evaluate(() => {
      const userField = document.querySelector(
        "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']"
      ) as HTMLInputElement | null;
      const form = userField?.closest("form");
      const submitBtn = form?.querySelector(
        "input[type='submit'], button[type='submit'], input[name='wp-submit']"
      ) as HTMLElement | null;
      if (submitBtn) { submitBtn.click(); return true; }
      return false;
    });
    if (!clicked) {
      // Fallback: click any visible submit button
      const submitSel = "input[name='wp-submit'], button[name='login'], button[type='submit'], input[type='submit']";
      await page.click(submitSel);
    }

    // Wait for either a navigation or an AJAX-driven DOM change (JetEngine, etc.)
    await Promise.race([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
      sleep(6000),
    ]).catch(() => {});
    await sleep(1500);

    const pageText = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    const lower = pageText.toLowerCase();

    if (lower.includes("incorrect") || lower.includes("invalid username") || lower.includes("wrong password") || lower.includes("error")) {
      log(SCRIPT, `  ✗ Login failed — credentials rejected`);
      return false;
    }

    const isLoggedIn = lower.includes("log out") || lower.includes("logout") ||
                       lower.includes("my account") || lower.includes("dashboard") ||
                       lower.includes("orders") || lower.includes("welcome");
    if (isLoggedIn) { log(SCRIPT, `  ✓ Logged in successfully`); return true; }

    // If still on the login page, login failed
    if (page.url().includes("/login") || page.url().includes("my-account") && lower.includes("username")) {
      log(SCRIPT, `  ✗ Login failed — still on login page`);
      return false;
    }

    log(SCRIPT, `  ? Login status unclear at ${page.url()} — proceeding`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `  ✗ Login error: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

async function loginShopify(page: Page, config: GatedVendorRow): Promise<boolean> {
  const baseUrl = new URL(config.website).origin;
  const loginPath = config.login_path ?? "/account/login";
  const loginUrl = `${baseUrl}${loginPath}`;
  log(SCRIPT, `  → Navigating to ${loginUrl}`);

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);

    const filledEmail = await fillField(page, "input[type='email'], input[name='customer[email]']", config.login_email!);
    const filledPass  = await fillField(page, "input[type='password'], input[name='customer[password]']", config.login_password!);

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
      if (!isPeptideProduct(p.name ?? "")) continue;
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
      if (!isPeptideProduct(p.title ?? "")) continue;
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
      if (!name || !isPeptideProduct(name)) return;
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

      const freeThresholdMatch = text.match(/free\s+shipping\s+on\s+(?:all\s+)?orders?\s+(?:over|above)?\s*\$\s*(\d+)/i);
      const freeAllMatch = /free\s+shipping\s+on\s+all\s+(?:domestic\s+)?orders?(?!\s+over|\s+above)/i.test(text);
      if (freeAllMatch) result.shipping_free_threshold = 0;
      else if (freeThresholdMatch) result.shipping_free_threshold = parseFloat(freeThresholdMatch[1]);

      const flatFeeMatch = text.match(/flat[\s-]rate\s+shipping\s+(?:of\s+)?\$\s*(\d+)/i) ??
                           text.match(/\$\s*(\d+)\s+flat[\s-]rate/i);
      if (flatFeeMatch) result.shipping_flat_fee = parseFloat(flatFeeMatch[1]);

      if (/only\s+ship|domestic\s+only|US\s+only/i.test(text)) result.ships_internationally = false;
      else if (/ship(?:ping)?\s+(?:world[-\s]?wide|internationally)/i.test(text)) result.ships_internationally = true;

      if (/visa|mastercard|credit\s+card|debit/i.test(text)) result.credit_card_accepted = true;
      if (/bitcoin|ethereum|crypto|btc|eth\b/i.test(text)) result.crypto_accepted = true;
      if (/paypal/i.test(text)) result.paypal_accepted = true;

      if (Object.keys(result).length > 0) break;
    } catch { /* continue */ }
  }
  return result;
}

// ── COA keywords (mirrors scrape-vendor-coas.ts) ─────────────────────────

const COA_KEYWORDS = [
  "certificate of analysis", "janoshik", "hplc", "lc-ms", "lc/ms",
  "purity:", "purity %", "test result", "lab result", "batch", "lot number",
  "download coa", "view coa", "pdf",
];

async function checkCoaPage(page: Page, vendorId: string, slug: string, coaUrl: string): Promise<void> {
  try {
    const res = await page.goto(coaUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!res || res.status() === 404) {
      log(SCRIPT, `  — COA page 404 at ${coaUrl}`);
      return;
    }
    await sleep(2000);
    const body  = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href)
    );
    const lower = body.toLowerCase();
    const keywordHit = COA_KEYWORDS.some((kw) => lower.includes(kw));
    const linkHit = links.some((h) => h.includes("janoshik") || h.includes(".pdf") || h.includes("coa"));
    const hasCoa = keywordHit || linkHit;

    // Only upgrade has_coa — never downgrade a vendor whose COA was previously confirmed
    if (hasCoa) {
      await db.from("vendors").update({ has_coa: true }).eq("id", vendorId);
    }

    if (hasCoa) {
      log(SCRIPT, `  ✓ COA content detected at ${coaUrl}`);
      const coaLinks = links.filter((h) => h.includes("janoshik") || h.includes(".pdf") || h.includes("coa")).slice(0, 50);
      if (coaLinks.length > 0) {
        await db.from("lab_tests").delete().eq("vendor_id", vendorId);
        const rows = coaLinks.map((href) => ({
          vendor_id: vendorId, peptide_name: null, lab_name: href.includes("janoshik") ? "Janoshik" : null,
          test_type: null, purity_result: null, test_date: null,
          janoshik_tested: href.includes("janoshik"), coa_url: href, verified: false,
        }));
        await db.from("lab_tests").insert(rows);
        log(SCRIPT, `  ✓ ${coaLinks.length} COA links saved`);
      }
    } else {
      log(SCRIPT, `  — No COA content found at ${coaUrl}`);
    }
  } catch (err: any) {
    log(SCRIPT, `  — COA check failed: ${err.message?.slice(0, 60)}`);
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function saveProducts(vendorId: string, products: ProductData[]): Promise<void> {
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

async function handleVendor(browser: Browser, v: GatedVendorRow): Promise<void> {
  console.log(`\n── ${v.name} ─────────────────────────────`);

  const baseUrl = (() => {
    try { return new URL(v.website).origin; } catch { return v.website; }
  })();

  const catalogPaths = v.catalog_paths ?? ["/shop/", "/products/", "/peptides/"];
  const platform = (v.login_platform ?? "woocommerce") as Platform;

  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1280, height: 900 });
  page.setDefaultNavigationTimeout(20000);

  try {
    // Ion Peptide: publicly accessible — no login needed
    if (v.slug === "ion-peptide") {
      log(SCRIPT, `  ℹ Site is publicly accessible — attempting direct scrape`);
      let products: ProductData[] | null = await tryShopifyApi(page, baseUrl);
      if (!products) products = await tryWooCommerceApi(page, baseUrl);
      if (!products) {
        for (const path of catalogPaths) {
          const scraped = await scrapeProductsFromHtml(page, `${baseUrl}${path}`);
          if (scraped.length > 0) { products = scraped; break; }
        }
      }
      if (products && products.length > 0) {
        await saveProducts(v.id, products);
        await db.from("vendors").update({ status: "active" }).eq("id", v.id);
        log(SCRIPT, `  ✓ Reactivated vendor`);
      } else {
        log(SCRIPT, `  ? No peptide products found — activating anyway`);
        await db.from("vendors").update({ status: "active" }).eq("id", v.id);
      }
      const shipping = await scrapeShipping(page, baseUrl);
      if (Object.keys(shipping).length > 0) {
        await db.from("vendors").update(shipping).eq("id", v.id);
        log(SCRIPT, `  ✓ Shipping data updated`);
      }
      if (v.coa_url) await checkCoaPage(page, v.id, v.slug, v.coa_url);
      return;
    }

    // Try public APIs first
    log(SCRIPT, `  ℹ Trying APIs without login first…`);
    let products: ProductData[] | null = await tryShopifyApi(page, baseUrl);
    if (!products) products = await tryWooCommerceApi(page, baseUrl);

    if (products && products.length > 0) {
      log(SCRIPT, `  ✓ API accessible without login — ${products.length} products`);
      await saveProducts(v.id, products);
      const shipping = await scrapeShipping(page, baseUrl);
      if (Object.keys(shipping).length > 0) {
        await db.from("vendors").update(shipping).eq("id", v.id);
        log(SCRIPT, `  ✓ Shipping: ${JSON.stringify(shipping)}`);
      }
      await db.from("vendors").update({ is_gated: false }).eq("id", v.id);
      // COA page may still be gated even if the product API is public — try logging in first
      if (v.coa_url && v.login_email && v.login_password) {
        const loggedIn = platform === "shopify"
          ? await loginShopify(page, v)
          : await loginWooCommerce(page, v);
        if (loggedIn) await checkCoaPage(page, v.id, v.slug, v.coa_url);
        else await checkCoaPage(page, v.id, v.slug, v.coa_url); // try anyway (might be public)
      } else if (v.coa_url) {
        await checkCoaPage(page, v.id, v.slug, v.coa_url);
      }
      return;
    }

    if (!v.login_email || !v.login_password) {
      log(SCRIPT, `  ✗ No credentials in DB — skipping login`);
      return;
    }

    // Attempt login
    let loggedIn = false;
    if (platform === "shopify") {
      loggedIn = await loginShopify(page, v);
    } else {
      loggedIn = await loginWooCommerce(page, v);
    }

    if (!loggedIn) {
      log(SCRIPT, `  ✗ Could not log in — skipping product scrape`);
      await db.from("vendors").update({ is_gated: true }).eq("id", v.id);
      return;
    }

    // Try APIs post-login, then HTML scrape
    products = null;
    if (platform === "shopify") {
      products = await tryShopifyApi(page, baseUrl);
    } else {
      products = await tryWooCommerceApi(page, baseUrl);
    }

    if (!products || products.length === 0) {
      log(SCRIPT, `  ℹ API returned no results — trying HTML scrape`);
      for (const path of catalogPaths) {
        const scraped = await scrapeProductsFromHtml(page, `${baseUrl}${path}`);
        if (scraped.length > 0) {
          products = scraped;
          log(SCRIPT, `  ✓ HTML scrape found ${scraped.length} products at ${path}`);
          break;
        }
        await sleep(500);
      }
    }

    if (products && products.length > 0) {
      await saveProducts(v.id, products);
    } else {
      log(SCRIPT, `  ? No peptide products found after login`);
      log(SCRIPT, `  Current page: [${await page.title()}] ${page.url()}`);
    }

    const shipping = await scrapeShipping(page, baseUrl);
    if (Object.keys(shipping).length > 0) {
      await db.from("vendors").update(shipping).eq("id", v.id);
      log(SCRIPT, `  ✓ Shipping: ${JSON.stringify(shipping)}`);
    } else {
      log(SCRIPT, `  — No shipping data found`);
    }

    await db.from("vendors").update({ is_gated: false }).eq("id", v.id);

    // COA check with active login session
    if (v.coa_url) await checkCoaPage(page, v.id, v.slug, v.coa_url);

  } catch (err: any) {
    log(SCRIPT, `  ✗ Unhandled error: ${err.message?.slice(0, 100)}`);
  } finally {
    await page.close();
  }
}

// ── Status-only corrections ───────────────────────────────────────────────

async function applyStatusCorrections(): Promise<void> {
  console.log("\n── Status corrections ────────────────────────────────");

  const { error: apolloErr } = await db
    .from("vendors")
    .update({ status: "inactive" })
    .eq("slug", "apollo-peptide-sciences");
  if (apolloErr) log(SCRIPT, `  ✗ Apollo update failed: ${apolloErr.message}`);
  else log(SCRIPT, `  ✓ Apollo Peptide Sciences → inactive`);

  const { error: alphaErr } = await db
    .from("vendors")
    .update({ is_gated: true })
    .eq("slug", "alpha-biomed-labs");
  if (alphaErr) log(SCRIPT, `  ✗ Alpha BioMed update failed: ${alphaErr.message}`);
  else log(SCRIPT, `  ✓ Alpha BioMed Labs → is_gated=true`);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const filter = process.argv.slice(2);
  console.log("=== Gated Vendor Scraper ===\n");

  if (!filter.length) await applyStatusCorrections();

  // Load vendors that have stored credentials (regardless of current is_gated flag —
  // some expose public APIs now but may require login in future runs)
  const query = db
    .from("vendors")
    .select("id, slug, name, website, login_username, login_email, login_password, login_path, catalog_paths, login_platform, coa_url")
    .not("login_email", "is", null)
    .in("status", ["active", "flagged"]);

  const { data: rows, error } = await query;
  if (error) { console.error("DB error:", error.message); process.exit(1); }

  let vendors = (rows ?? []) as GatedVendorRow[];
  if (filter.length) {
    vendors = vendors.filter((v) => filter.includes(v.slug));
  }

  if (vendors.length === 0) {
    console.log("No matching gated vendors found in DB.");
    process.exit(0);
  }

  console.log(`Found ${vendors.length} gated vendor(s) to process.\n`);

  // Lazy-import puppeteer here (after DB queries) so the stealth plugin
  // doesn't patch Node's fetch and corrupt Supabase responses.
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
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

  for (const v of vendors) {
    await handleVendor(browser, v);
    await sleep(1500);
  }

  await browser.close();
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
