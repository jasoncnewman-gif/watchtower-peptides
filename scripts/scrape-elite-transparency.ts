/**
 * scrape-elite-transparency.ts
 * Logs in to eliteresearchusa.com and scrapes transparency signals.
 */

import type { Browser, Page } from "puppeteer";
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "scrape-elite-transparency";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ORIGIN = "https://eliteresearchusa.com";

const PAGES_TO_CHECK = [
  "/", "/about", "/about-us", "/contact", "/contact-us",
  "/pages/about", "/pages/about-us", "/pages/contact",
  "/lab-results", "/coa", "/coas", "/testing", "/third-party-testing",
  "/pages/lab-results", "/pages/certificates-of-analysis", "/pages/testing",
  "/faq", "/pages/faq",
];

// Signal regexes (same as scrape-transparency.ts)
const MAILTO_RE    = /href=["']mailto:[^"'@]+@[^"']+["']/i;
const EMAIL_RE     = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE     = /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/;
const STREET_RE    = /\b\d{1,5}\s+(?:[NSEW]\.?\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b/i;
const ZIP_RE       = /\b\d{5}(?:-\d{4})?\b/;
const OWNERSHIP_RE = /\b(?:founded|owned|operated|created|started)\s+by\s+[A-Z][a-z]+|(?:CEO|owner|president|founder|director|managing\s+partner|co-founder)[:\s"'–-]+[A-Z][a-z]+\s+[A-Z][a-z]+|Hi,?\s+I'?m\s+[A-Z][a-z]+|my name is\s+[A-Z][a-z]+|Meet\s+(?:our\s+)?(?:team|founder)/i;
const LAB_RE       = /(?:third[- ]party|independent|accredited|external)\s+(?:lab|testing|analys|certificat)|certificate of analysis|COA\b|Janoshik|Vanguard\s+Lab|Freedom\s+Diagnostics|Chromate|MZ\s+Biolabs|Kovera|BioRegen|TrustPointe|ISO\s*17025|A2LA|HPLC|LC-?MS|mass\s+spectrometry|lab\s+report/i;
const METHOD_RE    = /\bHPLC\b|high[- ]performance liquid chromatography|LC[- ]?MS|mass\s+spectrometry|NMR\b|GC[- ]?MS|UPLC\b|endotoxin|heavy\s+metal|sterility\s+test/i;
const BATCH_RE     = /\b(?:batch|lot)\s*(?:number|no\.?|#|id)\b|batch[- ]specific|per[- ]batch|lot[- ]number|COA\s+per\s+(?:batch|lot)|each\s+(?:batch|lot)\s+(?:is\s+)?tested|\b(?:batch|lot)\s*(?:#|:)\s*[A-Z0-9]{3,}/i;
const LAB_NAME_RE  = /[A-Z][A-Za-z\s]{2,30}\s+(?:Lab|Labs|Laboratory|Laboratories|Analytical|Analytics|Testing)\b/;

async function fetchPage(page: Page, url: string): Promise<string> {
  try {
    const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    if (!res || res.status() >= 400) return "";
    await sleep(1200);
    return await page.evaluate(() => document.body?.innerText ?? "");
  } catch {
    return "";
  }
}

// Navigate within a logged-in SPA by checking cookies then re-injecting session
async function fetchPageAuthenticated(page: Page, url: string, cookies: Array<{name: string; value: string; domain: string}>): Promise<string> {
  try {
    await page.setCookie(...cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, url })));
    const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    if (!res || res.status() >= 400) return "";
    await sleep(1500);
    // If redirected to login, session restoration failed
    if (page.url().includes("/login")) return "";
    return await page.evaluate(() => document.body?.innerText ?? "");
  } catch {
    return "";
  }
}

async function main() {
  // Get vendor record + credentials
  const { data: vendor } = await db
    .from("vendors")
    .select("id, name, login_email, login_password, login_username, login_path")
    .eq("slug", "elite-research-usa")
    .single();

  if (!vendor) { log(SCRIPT, "Vendor not found"); return; }

  log(SCRIPT, `Launching browser for ${vendor.name}…`);

  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
  puppeteer.default.use(StealthPlugin());

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.default.launch({
      executablePath: CHROME,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    // ── Login ────────────────────────────────────────────────────────────────
    const loginPath = vendor.login_path ?? "/login";
    log(SCRIPT, `Logging in at ${ORIGIN}${loginPath}…`);
    await page.goto(`${ORIGIN}${loginPath}`, { waitUntil: "networkidle2", timeout: 20000 });
    await sleep(2000);

    // Fill email + password via evaluate (React-compatible: set via native prototype + dispatch events)
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.evaluate((email: string, pass: string) => {
      const nativeInputProto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
      const passEl  = document.querySelector<HTMLInputElement>('input[name="password"]');
      if (emailEl) {
        nativeInputProto?.set?.call(emailEl, email);
        emailEl.dispatchEvent(new Event("input", { bubbles: true }));
        emailEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (passEl) {
        nativeInputProto?.set?.call(passEl, pass);
        passEl.dispatchEvent(new Event("input", { bubbles: true }));
        passEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, vendor.login_email ?? "", vendor.login_password ?? "");
    await sleep(800);

    // Check what buttons exist after fill
    const btns = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, input[type=submit]")).map(b => ({
        tag: b.tagName, type: (b as HTMLButtonElement).type, text: b.textContent?.trim().slice(0, 30)
      }))
    );
    log(SCRIPT, `  Buttons after fill: ${JSON.stringify(btns)}`);

    // Click whichever submit button is available
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>("button[type='submit'], input[type='submit'], button");
      btn?.click();
    });
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    await sleep(2000);

    await sleep(2500);
    const postLoginUrl = page.url();
    const loggedIn = !postLoginUrl.includes("/login") && !postLoginUrl.includes("/account/login");
    log(SCRIPT, loggedIn ? `  ✓ Login successful (${postLoginUrl})` : `  ✗ Login may have failed (${postLoginUrl})`);

    // Capture auth cookies immediately after login — re-inject on every navigation
    const authCookies = await page.cookies();
    log(SCRIPT, `  Captured ${authCookies.length} cookies (${authCookies.map(c => c.name).join(", ")})`);

    // ── Scrape pages ─────────────────────────────────────────────────────────
    const corpus: string[] = [];

    // Scrape the dashboard first (we're already here, no navigation needed)
    const dashboardText = await page.evaluate(() => document.body?.innerText ?? "");
    if (dashboardText.length > 100) {
      corpus.push(dashboardText);
      log(SCRIPT, `  ✓ ${postLoginUrl} (${dashboardText.length} chars)`);
    }

    // Discover internal links from the dashboard nav
    const dashLinks = await page.evaluate((origin: string) => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.startsWith(origin));
    }, ORIGIN);
    log(SCRIPT, `  Dashboard links: ${dashLinks.join(", ")}`);

    // All pages to try, starting with known product/content paths for this site
    const allPaths = [
      "/", "/products", "/about", "/about-us", "/contact", "/contact-us",
      "/faq", "/lab-results", "/coa", "/coas", "/testing",
    ];

    for (const path of allPaths) {
      const url = ORIGIN + path;
      const text = await fetchPageAuthenticated(page, url, authCookies);
      if (text.length > 100 && !text.includes("Sign in or create a free account")) {
        corpus.push(text);
        log(SCRIPT, `  ✓ ${path} (${text.length} chars)`);
      } else if (text.length > 0) {
        log(SCRIPT, `  ✗ ${path} — login wall or empty`);
      }
    }

    // If we got authenticated product pages, look for COA links within them
    const authPage = await page.evaluate((origin: string) => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.startsWith(origin) && /coa|lab|test|certif|purity|report/i.test(h));
    }, ORIGIN);
    for (const link of [...new Set(authPage)].slice(0, 5)) {
      const text = await fetchPageAuthenticated(page, link, authCookies);
      if (text.length > 100) {
        corpus.push(text);
        log(SCRIPT, `  ✓ (discovered) ${link} (${text.length} chars)`);
      }
    }

    const combined = corpus.join("\n");
    log(SCRIPT, `\nTotal content: ${combined.length} chars from ${corpus.length} pages`);

    // ── Evaluate signals ──────────────────────────────────────────────────────
    const signals = {
      has_contact_info:         MAILTO_RE.test(combined) || EMAIL_RE.test(combined) || PHONE_RE.test(combined),
      has_business_address:     STREET_RE.test(combined) && ZIP_RE.test(combined),
      has_ownership_disclosure: OWNERSHIP_RE.test(combined),
      has_lab_disclosure:       LAB_RE.test(combined) || LAB_NAME_RE.test(combined),
      has_testing_methodology:  METHOD_RE.test(combined),
      has_batch_numbers:        BATCH_RE.test(combined),
    };

    log(SCRIPT, "\nSignals:");
    Object.entries(signals).forEach(([k, v]) => log(SCRIPT, `  ${k}: ${v ? "✓" : "✗"}`));

    // Domain age via RDAP
    let domainAge: number | null = null;
    try {
      const rdap = await fetch("https://rdap.org/domain/eliteresearchusa.com", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (rdap.ok) {
        const data = await rdap.json() as Record<string, unknown>;
        const events = (data.events ?? []) as Array<{ eventAction: string; eventDate: string }>;
        const reg = events.find(e => e.eventAction === "registration");
        if (reg?.eventDate) {
          const year = new Date(reg.eventDate).getFullYear();
          domainAge = new Date().getFullYear() - year;
        }
      }
    } catch { /* ignore */ }
    log(SCRIPT, `  domain_years: ${domainAge ?? "?"}`);

    // ── Upsert ────────────────────────────────────────────────────────────────
    const { error } = await db.from("vendor_transparency").upsert(
      { vendor_id: vendor.id, ...signals, domain_years: domainAge, last_reviewed: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() },
      { onConflict: "vendor_id", ignoreDuplicates: false }
    );

    if (error) log(SCRIPT, `✗ DB error: ${error.message}`);
    else log(SCRIPT, "\n✓ Transparency record updated. Run: npm run compute:scores");

  } finally {
    await browser?.close();
  }
}

main();
