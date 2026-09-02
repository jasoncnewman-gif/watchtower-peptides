/**
 * scripts/audit-pricing.ts
 * Full-pool product + price sweep — scrapes ALL active vendors, rebuilds
 * peptide_market_prices. Run this before audit:vendors so the CX sub-score
 * uses a consistent market baseline.
 *
 * Run: npm run audit:pricing
 */

import { execSync } from "child_process";
import { db } from "./lib/client.js";
import { log, sleep, parseMg, clean, parsePrice } from "./lib/scraper.js";
import type { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";

const SCRIPT = "audit-pricing";
const UA     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Types ─────────────────────────────────────────────────────────────────────

type VendorRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  login_email: string | null;
  login_password: string | null;
  login_username: string | null;
  login_path: string | null;
  catalog_paths: string[] | null;
  login_platform: string | null;
};

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

// ── Peptide filter ─────────────────────────────────────────────────────────────

const KNOWN_PEPTIDES = [
  "bpc", "tb-500", "thymosin", "sermorelin", "cjc", "ipamorelin",
  "semaglutide", "tirzepatide", "pt-141", "bremelanotide", "kisspeptin",
  "ghrp", "igf", "selank", "semax", "epitalon", "epithalon", "melanotan",
  "gh frag", "aod", "ss-31", "mots-c", "humanin", "fgl",
  "retatrutide", "triptorelin", "hexarelin", "tesamorelin",
  "peptide yy", "gip", "glp", "oxytocin", "ll-37", "ghk",
  "dihexa", "pinealon", "dsip", "thymulin", "mk-677", "nad+", "nad ", "vip", "kpv",
];

function isPeptide(name: string): boolean {
  const lower = (name ?? "").toLowerCase();
  return KNOWN_PEPTIDES.some((kw) => lower.includes(kw));
}

// ── Plain fetch ────────────────────────────────────────────────────────────────

async function tryShopifyApiPlain(website: string): Promise<ProductData[] | null> {
  try {
    const { origin } = new URL(website);
    const res = await fetch(`${origin}/products.json?limit=250`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
    const json = await res.json() as { products?: any[] };
    if (!json.products?.length) return null;
    return json.products.filter((p: any) => isPeptide(p.title)).map((p: any) => {
      const v = p.variants?.[0];
      const price = v?.price ? parseFloat(v.price) : null;
      const cmp   = v?.compare_at_price ? parseFloat(v.compare_at_price) : null;
      const sale  = cmp !== null && price !== null && cmp > price;
      return { peptide_name: p.title, size_mg: parseMg(p.title), list_price: sale ? cmp : price, sale_price: sale ? price : null, in_stock: p.available ?? p.variants?.some((vv: any) => vv.available) };
    });
  } catch { return null; }
}

function mapWooProducts(json: any[]): ProductData[] {
  return json.filter((p: any) => isPeptide(p.name)).map((p: any) => {
    const rp = p.prices?.regular_price ? parseInt(p.prices.regular_price) / 100 : null;
    const sp = p.prices?.sale_price    ? parseInt(p.prices.sale_price)    / 100 : null;
    const pr = p.prices?.price         ? parseInt(p.prices.price)         / 100 : null;
    const sale = sp !== null && rp !== null && sp < rp;
    return { peptide_name: p.name, size_mg: parseMg(p.name), list_price: sale ? rp : pr, sale_price: sale ? sp : null, in_stock: p.is_in_stock ?? true };
  });
}

// Store API namespace is un-versioned on older WooCommerce Blocks, /v1/ on newer;
// some installs also 401 the /v1/ route while leaving the legacy one public. Try both.
const WOO_STORE_PATHS = ["/wp-json/wc/store/products", "/wp-json/wc/store/v1/products"];

async function tryWooApiPlain(website: string): Promise<ProductData[] | null> {
  const { origin } = new URL(website);
  for (const path of WOO_STORE_PATHS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${origin}${path}?per_page=100`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) break;                          // 401/404 — try the other path, don't retry
        const json = await res.json();
        if (Array.isArray(json) && json.length) return mapWooProducts(json);
        break;
      } catch { await sleep(800); }                  // transient (abort / network) — retry once
    }
  }
  return null;
}

// ── Browser ────────────────────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin }  = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());
  return (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled", "--window-size=1280,900"],
  }) as Promise<Browser>;
}

async function loginWooCommerce(page: Page, v: VendorRow): Promise<boolean> {
  const baseUrl  = new URL(v.website!).origin;
  const loginUrl = `${baseUrl}${v.login_path ?? "/my-account/"}`;
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);
    for (const sel of ["#zc-manage", ".zcb-button-primary", "button[class*='accept']", "button[class*='age']"]) {
      try { const el = await page.$(sel); if (el) { await el.click(); await sleep(600); break; } } catch { /* continue */ }
    }
    const userSel  = "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']";
    const loginVal = (await page.$(userSel)) && v.login_username ? v.login_username : v.login_email!;
    await page.waitForSelector(userSel, { timeout: 8000 });
    await page.evaluate((sel: string, val: string) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (el) { el.value = val; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    }, userSel, loginVal);
    const passSel = "input[name='pwd'], input[name='password'], input[name='xoo-el-password'], input[type='password']";
    await page.waitForSelector(passSel, { timeout: 8000 });
    await page.evaluate((sel: string, val: string) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (el) { el.value = val; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    }, passSel, v.login_password!);
    const clicked = await page.evaluate(() => {
      const f = (document.querySelector("input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']") as HTMLInputElement)?.closest("form");
      const btn = f?.querySelector("input[type='submit'], button[type='submit']") as HTMLElement | null;
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) await page.evaluate(() => {
      const btn = document.querySelector("input[name='wp-submit'], button[type='submit'], input[type='submit']") as HTMLElement | null;
      if (btn) btn.click();
    }).catch(() => {});
    await Promise.race([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }), sleep(6000)]).catch(() => {});
    await sleep(1500);
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    if (text.includes("incorrect") || text.includes("invalid username") || text.includes("wrong password")) return false;
    return text.includes("log out") || text.includes("logout") || text.includes("my account") || text.includes("dashboard") || text.includes("orders");
  } catch { return false; }
}

async function loginShopify(page: Page, v: VendorRow): Promise<boolean> {
  const baseUrl  = new URL(v.website!).origin;
  const loginUrl = `${baseUrl}${v.login_path ?? "/account/login"}`;
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);
    const emailSel = "input[type='email'], input[name='customer[email]']";
    const passSel  = "input[type='password'], input[name='customer[password]']";
    await page.waitForSelector(emailSel, { timeout: 8000 });
    await page.click(emailSel);
    await page.type(emailSel, v.login_email!, { delay: 40 });
    await page.click(passSel);
    await page.type(passSel, v.login_password!, { delay: 40 });
    await page.click("button[type='submit'], input[type='submit']");
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    return !text.includes("incorrect email or password");
  } catch { return false; }
}

async function tryShopifyApiBrowser(page: Page, origin: string): Promise<ProductData[] | null> {
  try {
    await page.goto(`${origin}/products.json?limit=250`, { waitUntil: "domcontentloaded", timeout: 12000 });
    const body = await page.evaluate(() => document.body?.innerText ?? "");
    const json = JSON.parse(body) as { products?: any[] };
    if (!json.products?.length) return null;
    return json.products.filter((p: any) => isPeptide(p.title)).map((p: any) => {
      const v = p.variants?.[0];
      const price = v?.price ? parseFloat(v.price) : null;
      const cmp   = v?.compare_at_price ? parseFloat(v.compare_at_price) : null;
      const sale  = cmp !== null && price !== null && cmp > price;
      return { peptide_name: p.title, size_mg: parseMg(p.title), list_price: sale ? cmp : price, sale_price: sale ? price : null, in_stock: p.available ?? p.variants?.some((vv: any) => vv.available) };
    });
  } catch { return null; }
}

async function tryWooApiBrowser(page: Page, origin: string): Promise<ProductData[] | null> {
  for (const path of WOO_STORE_PATHS) {
    try {
      await page.goto(`${origin}${path}?per_page=100`, { waitUntil: "domcontentloaded", timeout: 12000 });
      const body = await page.evaluate(() => document.body?.innerText ?? "");
      const json = JSON.parse(body) as any[];
      if (Array.isArray(json) && json.length) return mapWooProducts(json);
    } catch { /* try next path */ }
  }
  return null;
}

async function scrapeProductsHtml(page: Page, url: string): Promise<ProductData[]> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(2000);
    const $ = cheerio.load(await page.content());
    const products: ProductData[] = [];
    const CARD  = "li.product, .product-item, .product-card, [class*='product-grid'] > *, article";
    const NAME  = ".woocommerce-loop-product__title, h2, h3, [class*='product-title'], [class*='product-name']";
    const PRICE = ".woocommerce-Price-amount, .price .amount, [class*='price']";
    const OOS   = ".out-of-stock, .sold-out, [class*='out-of-stock'], [class*='sold-out']";
    $(CARD).each((_, el) => {
      const name = clean($(el).find(NAME).first().text()) ?? "";
      if (!name || !isPeptide(name)) return;
      products.push({
        peptide_name: name,
        size_mg:      parseMg(name),
        list_price:   parsePrice(clean($(el).find(PRICE).first().text())),
        sale_price:   null,
        in_stock:     $(el).find(OOS).length === 0 && !$(el).text().toLowerCase().includes("sold out"),
      });
    });
    return products;
  } catch { return []; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Optional: `npm run audit:pricing -- <slug> [<slug> ...]` to sweep just those.
  const slugFilter = process.argv.slice(2).filter((a) => !a.startsWith("-"));

  let query = db
    .from("vendors")
    .select("id, name, slug, website, login_email, login_password, login_username, login_path, catalog_paths, login_platform")
    .in("status", ["active", "flagged"])
    .order("name", { ascending: true });
  if (slugFilter.length) query = query.in("slug", slugFilter);

  const { data: vendors, error } = await query;

  if (error || !vendors?.length) { log(SCRIPT, `No vendors: ${error?.message ?? "empty"}`); process.exit(1); }
  log(SCRIPT, `${vendors.length} vendors to process${slugFilter.length ? ` (filtered: ${slugFilter.join(", ")})` : ""}\n`);

  // Always launch — the browser is the fallback for bot-blocked / JS-rendered
  // storefronts too, not just credentialed logins.
  log(SCRIPT, "Launching browser…");
  const browser: Browser = await launchBrowser();

  let updated = 0;
  let skipped = 0;

  try {
    for (const vendor of vendors as VendorRow[]) {
      if (!vendor.website) { log(SCRIPT, `${vendor.name} — no website, skipping`); skipped++; continue; }

      log(SCRIPT, `── ${vendor.name}`);
      const origin   = new URL(vendor.website).origin;
      const hasCreds = !!(vendor.login_email && vendor.login_password);
      let browserPage: Page | null = null;
      let loggedIn   = false;

      async function ensureLogin(): Promise<Page | null> {
        if (!browser || !hasCreds) return null;
        if (browserPage && loggedIn) return browserPage;
        if (!browserPage) {
          browserPage = await browser!.newPage();
          await browserPage.setUserAgent(UA);
          await browserPage.setViewport({ width: 1280, height: 900 });
          browserPage.setDefaultNavigationTimeout(20000);
        }
        const platform = (vendor.login_platform ?? "woocommerce") as "woocommerce" | "shopify";
        log(SCRIPT, `  → Logging in…`);
        loggedIn = platform === "shopify"
          ? await loginShopify(browserPage, vendor)
          : await loginWooCommerce(browserPage, vendor);
        log(SCRIPT, loggedIn ? `  ✓ Login OK` : `  ✗ Login failed`);
        return loggedIn ? browserPage : null;
      }

      try {
        let products: ProductData[] | null = await tryShopifyApiPlain(vendor.website) ?? await tryWooApiPlain(vendor.website);

        // Plain fetch failed (bot-block / WAF 403, disabled REST API, members-only
        // catalog, or JS-rendered store). Retry through the stealth browser — logging
        // in first when we have creds — for every vendor, not just gated ones.
        if ((!products || products.length === 0) && browser) {
          let page: Page | null = null;
          if (hasCreds) {
            page = await ensureLogin();
          } else {
            if (!browserPage) {
              browserPage = await browser.newPage();
              await browserPage.setUserAgent(UA);
              await browserPage.setViewport({ width: 1280, height: 900 });
              browserPage.setDefaultNavigationTimeout(20000);
            }
            page = browserPage;
          }
          if (page) {
            products = await tryShopifyApiBrowser(page, origin) ?? await tryWooApiBrowser(page, origin);
            if (!products || products.length === 0) {
              const paths = vendor.catalog_paths ?? ["/shop/", "/product-category/peptides/", "/products/", "/peptides/", "/collections/all", "/shop"];
              for (const path of paths) {
                const scraped = await scrapeProductsHtml(page, `${origin}${path}`);
                if (scraped.length > 0) { products = scraped; break; }
                await sleep(500);
              }
            }
          }
        }

        if (products && products.length > 0) {
          const now = new Date().toISOString();
          const { data: oldRows } = await db.from("vendor_peptides").select("peptide_name, size_mg, list_price, sale_price, in_stock, last_checked").eq("vendor_id", vendor.id);

          // Don't wipe existing priced rows for a scrape that got names but no prices
          // (theme-specific price selector missed) — keep what we have.
          const newPriced = products.filter((p) => p.list_price != null).length;
          const oldPriced = (oldRows ?? []).filter((r) => r.list_price != null).length;
          if (newPriced === 0 && oldPriced > 0) {
            log(SCRIPT, `  ⚠ ${products.length} names, no prices — keeping ${oldPriced} existing priced rows`);
            skipped++;
            if (browserPage) await browserPage.close().catch(() => {});
            await sleep(1000);
            continue;
          }

          await db.from("vendor_peptides").delete().eq("vendor_id", vendor.id);
          const { error: pe } = await db.from("vendor_peptides").insert(
            products.map((p) => ({ ...p, vendor_id: vendor.id, last_checked: now }))
          );
          if (!pe) {
            await db.from("vendors").update({ total_products: products.length }).eq("id", vendor.id);
            log(SCRIPT, `  ✓ ${products.length} products`);
            updated++;
          } else {
            log(SCRIPT, `  ✗ save error: ${pe.message} — restoring previous data`);
            if (oldRows?.length) await db.from("vendor_peptides").insert(oldRows.map((r) => ({ ...r, vendor_id: vendor.id })));
            skipped++;
          }
        } else {
          log(SCRIPT, `  — no products found`);
          skipped++;
        }
      } catch (err) {
        log(SCRIPT, `  ✗ error: ${err}`);
        skipped++;
      }

      if (browserPage) await browserPage.close().catch(() => {});
      await sleep(1000);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  log(SCRIPT, `\nProduct sweep complete. Updated: ${updated} | Skipped: ${skipped}`);
  log(SCRIPT, "Rebuilding market price baseline…");
  execSync("npm run compute:prices", { stdio: "inherit", cwd: process.cwd() });
  log(SCRIPT, "Done. Market baseline is fresh — safe to run audit:vendors.");
}

main();
