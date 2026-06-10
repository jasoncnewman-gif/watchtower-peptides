/**
 * scripts/fetch-coa-forensics.ts
 * Forensic COA retrieval for Cloudflare-protected vendors.
 * Bypasses CF with stealth Puppeteer, logs in, navigates to the COA page,
 * extracts all visible text/links, downloads PDFs, and saves a screenshot.
 *
 * Output: /tmp/coa-forensics/{vendor-slug}/
 *   - page-screenshot.png  — full-page render of the COA page
 *   - page-text.txt        — all visible text
 *   - links.json           — all links extracted (href + anchor text)
 *   - coa-1.pdf ... coa-N.pdf — downloaded COA PDFs (up to 10)
 *
 * Run:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/fetch-coa-forensics.ts certified-pep
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/fetch-coa-forensics.ts perfect-peptides
 */

import type { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "coa-forensics";
const CHROME  = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UA      = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const WT_EMAIL    = "info@watchtowerpeptides.com";
const WT_USERNAME = "watchtower";
const WT_PASSWORD = "jikHip-6dewje-xytgih";

type VendorTarget = {
  slug:      string;
  baseUrl:   string;
  loginPath: string;
  coaPaths:  string[]; // try in order until one returns 200
};

const TARGETS: VendorTarget[] = [
  {
    slug:      "certified-pep",
    baseUrl:   "https://certified-pep.com",
    loginPath: "/research-access/",   // custom login, not WooCommerce /my-account/
    coaPaths:  ["/coas/", "/lab-testing/", "/certificates-of-analysis/"],
  },
  {
    slug:      "perfect-peptides",
    baseUrl:   "https://perfectpeptides.com",
    loginPath: "/my-account/",
    coaPaths:  ["/certificates-of-analysis/", "/coa/", "/lab-testing/", "/lab-results/"],
  },
];

// ── Cloudflare bypass + login ─────────────────────────────────────────────

async function establishSession(page: Page, baseUrl: string): Promise<boolean> {
  log(SCRIPT, `  → Loading homepage: ${baseUrl}`);
  await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(2500);

  const title = await page.title();
  if (title.toLowerCase().includes("just a moment") || title.toLowerCase().includes("cloudflare")) {
    log(SCRIPT, `  ⏳ Cloudflare challenge — waiting 10s…`);
    await sleep(10000);
    const after = await page.title();
    if (after.toLowerCase().includes("just a moment")) {
      log(SCRIPT, `  ✗ CF not cleared`);
      return false;
    }
  }
  log(SCRIPT, `  ✓ Session established: "${await page.title()}"`);
  return true;
}

async function login(page: Page, baseUrl: string, loginPath: string): Promise<boolean> {
  log(SCRIPT, `  → Logging in at ${baseUrl}${loginPath}`);
  await page.goto(baseUrl + loginPath, { waitUntil: "domcontentloaded", timeout: 25000 });
  await sleep(2000);

  // WooCommerce selectors + placeholder-based selectors for custom login forms (e.g. Certified Pep)
  const userSel = [
    "input[name='log']",
    "input[name='username']",
    "input[name='xoo-el-username']",
    "input[placeholder*='Email']",
    "input[placeholder*='email']",
    "input[placeholder*='Username']",
    "input[type='email']",
  ].join(", ");
  const passSel = [
    "input[name='pwd']",
    "input[name='password']",
    "input[name='xoo-el-password']",
    "input[placeholder*='Password']",
    "input[placeholder*='password']",
    "input[type='password']",
  ].join(", ");

  try {
    // Dump all inputs on the page for debugging
    await sleep(3000);
    const allInputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input, button")).map(el => ({
        tag:         el.tagName,
        type:        (el as HTMLInputElement).type || "",
        name:        (el as HTMLInputElement).name || "",
        id:          el.id || "",
        placeholder: (el as HTMLInputElement).placeholder || "",
        className:   el.className?.toString().slice(0, 60) || "",
        visible:     (el as HTMLElement).offsetParent !== null,
      }))
    );
    log(SCRIPT, `  DEBUG — inputs/buttons found (${allInputs.length}):`);
    for (const inp of allInputs) {
      log(SCRIPT, `    <${inp.tag.toLowerCase()} type="${inp.type}" name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}" class="${inp.className}" visible=${inp.visible}>`);
    }

    await page.waitForSelector(userSel, { timeout: 10000 });

    // Try username first; fall back to email
    const inputType = await page.$eval(userSel, el => (el as HTMLInputElement).type).catch(() => "text");
    const loginValue = inputType === "email" ? WT_EMAIL : WT_USERNAME;

    await page.click(userSel);
    await page.type(userSel, loginValue, { delay: 40 });
    await page.waitForSelector(passSel, { timeout: 8000 });
    await page.click(passSel);
    await page.type(passSel, WT_PASSWORD, { delay: 40 });

    // Click submit button within the same form
    // Check and tick any required "research use" agreement checkbox before submitting
    await page.evaluate(() => {
      const checkboxes = document.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach(cb => { (cb as HTMLInputElement).checked = true; });
    });

    const clicked = await page.evaluate(() => {
      // Find the form containing the email/username field
      const userSelectors = [
        "input[name='log']", "input[name='username']", "input[name='xoo-el-username']",
        "input[placeholder*='Email']", "input[placeholder*='Username']", "input[type='email']",
      ];
      let u: HTMLInputElement | null = null;
      for (const sel of userSelectors) {
        u = document.querySelector(sel) as HTMLInputElement | null;
        if (u) break;
      }
      const form = u?.closest("form");
      // Look for submit button — WooCommerce or custom ("Continue")
      const btn = (form ?? document).querySelector(
        "input[type='submit'], button[type='submit'], input[name='wp-submit'], " +
        "button[class*='continue'], button[class*='login'], button[class*='submit']"
      ) as HTMLElement | null;
      if (btn) { btn.click(); return btn.textContent?.trim() ?? "clicked"; }
      // Last resort: any button with "continue" or "sign" text
      const btns = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
      const textBtn = btns.find(b => /continue|sign in|login/i.test(b.textContent ?? ""));
      if (textBtn) { textBtn.click(); return textBtn.textContent?.trim() ?? "clicked"; }
      return false;
    });
    if (!clicked) {
      await page.click("input[name='wp-submit'], button[type='submit'], input[type='submit']").catch(() => {});
    }

    await Promise.race([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
      sleep(8000),
    ]).catch(() => {});
    await sleep(1500);

    const body = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    const ok   = body.includes("log out") || body.includes("logout") ||
                 body.includes("orders")  || body.includes("dashboard") ||
                 body.includes("welcome");
    log(SCRIPT, ok ? `  ✓ Logged in` : `  ? Login status unclear — proceeding`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `  ✗ Login failed: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

// ── COA page navigation + extraction ─────────────────────────────────────

async function findAndLoadCoaPage(page: Page, baseUrl: string, coaPaths: string[]): Promise<string | null> {
  for (const p of coaPaths) {
    const url = baseUrl + p;
    log(SCRIPT, `  → Trying COA path: ${url}`);
    try {
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await sleep(2500);
      if (res && res.status() < 400) {
        const title = await page.title();
        const body  = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
        // Make sure we're not on a 404 page with status 200
        if (body.includes("page not found") || body.includes("404") && body.length < 500) {
          log(SCRIPT, `  — Soft 404: ${url}`);
          continue;
        }
        log(SCRIPT, `  ✓ COA page found: ${url} ("${title}")`);
        return url;
      }
      log(SCRIPT, `  — HTTP ${res?.status() ?? "error"}: ${url}`);
    } catch {
      log(SCRIPT, `  — Failed: ${url}`);
    }
  }
  return null;
}

type LinkRecord = { href: string; text: string; type: string };

async function extractPageData(page: Page): Promise<{
  visibleText: string;
  links: LinkRecord[];
  iframes: { tag: string; src: string }[];
}> {
  const visibleText = await page.evaluate(() => document.body?.innerText ?? "");

  const links: LinkRecord[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map(a => ({
      href: (a as HTMLAnchorElement).href,
      text: (a as HTMLAnchorElement).textContent?.trim().replace(/\s+/g, " ") ?? "",
      type: (a as HTMLAnchorElement).href.includes(".pdf")    ? "pdf"
          : (a as HTMLAnchorElement).href.includes(".webp")   ? "webp"
          : (a as HTMLAnchorElement).href.includes(".png")    ? "image"
          : (a as HTMLAnchorElement).href.includes(".jpg")    ? "image"
          : (a as HTMLAnchorElement).href.toLowerCase().includes("coa")   ? "coa-page"
          : (a as HTMLAnchorElement).href.toLowerCase().includes("cert")  ? "cert-page"
          : (a as HTMLAnchorElement).href.toLowerCase().includes("lab")   ? "lab-page"
          : "other",
    }))
  );

  const iframes = await page.evaluate(() =>
    Array.from(document.querySelectorAll("iframe, embed, object")).map(el => ({
      tag: el.tagName.toLowerCase(),
      src: (el as any).src || (el as any).data || (el as any).href || "",
    }))
  );

  return { visibleText, links, iframes };
}

// ── PDF / image downloader ────────────────────────────────────────────────

async function downloadFile(
  url: string,
  destPath: string,
  cookies: string,
  referer: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Cookie":     cookies,
        "Referer":    referer,
      },
    });
    if (!res.ok) {
      log(SCRIPT, `    ✗ HTTP ${res.status}: ${url}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    log(SCRIPT, `    ✓ ${path.basename(destPath)} (${buf.length} bytes)`);
    return true;
  } catch (err: any) {
    log(SCRIPT, `    ✗ Download error: ${err.message?.slice(0, 80)}`);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function handleVendor(browser: Browser, target: VendorTarget): Promise<void> {
  const outDir = `/tmp/coa-forensics/${target.slug}`;
  fs.mkdirSync(outDir, { recursive: true });
  log(SCRIPT, `\n══ ${target.slug} ══  Output: ${outDir}`);

  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  try {
    const cfOk = await establishSession(page, target.baseUrl);
    if (!cfOk) { log(SCRIPT, `  ✗ CF bypass failed — skipping`); return; }

    // For Certified Pep: /research-access/ login is Cloudflare Turnstile-protected.
    // Skip login attempt and go directly to /coas/ — inspect buttons and DOM for direct URLs.
    if (target.slug !== "certified-pep") {
      await login(page, target.baseUrl, target.loginPath);
    } else {
      log(SCRIPT, `  — Skipping login: /research-access/ is Turnstile-protected (unsolvable by automation)`);
    }

    const coaUrl = await findAndLoadCoaPage(page, target.baseUrl, target.coaPaths);
    if (!coaUrl) {
      log(SCRIPT, `  ✗ No COA page found — tried: ${target.coaPaths.join(", ")}`);
      fs.writeFileSync(path.join(outDir, "RESULT.txt"), "COA_NOT_OBTAINABLE\nAll paths returned 404 or error.");
      return;
    }

    // For Certified Pep: inspect the COA buttons in detail — they may carry data-url or onclick URLs
    if (target.slug === "certified-pep") {
      const buttonData = await page.evaluate(() => {
        const items: { tag: string; text: string; href: string; dataAttrs: Record<string,string>; onclick: string }[] = [];
        document.querySelectorAll("a, button, [data-url], [data-href], [data-file], [data-pdf]").forEach(el => {
          const attrs: Record<string,string> = {};
          for (const attr of el.attributes) {
            if (attr.name.startsWith("data-") || attr.name === "href" || attr.name === "onclick") {
              attrs[attr.name] = attr.value;
            }
          }
          const text = (el as HTMLElement).innerText?.trim().slice(0, 60) ?? "";
          if (text.toLowerCase().includes("coa") || text.toLowerCase().includes("contaminant") ||
              Object.values(attrs).some(v => v.includes(".pdf") || v.includes("coa"))) {
            items.push({
              tag:      el.tagName.toLowerCase(),
              text,
              href:     (el as HTMLAnchorElement).href || "",
              dataAttrs: attrs,
              onclick:  el.getAttribute("onclick") || "",
            });
          }
        });
        return items.slice(0, 30);
      });
      if (buttonData.length > 0) {
        log(SCRIPT, `\n  COA button DOM inspection (${buttonData.length} elements):`);
        for (const b of buttonData) {
          log(SCRIPT, `    <${b.tag}> "${b.text}" href=${b.href}`);
          for (const [k,v] of Object.entries(b.dataAttrs)) {
            log(SCRIPT, `      ${k}="${v}"`);
          }
        }
      } else {
        log(SCRIPT, `  — No COA buttons with data attributes found — content likely loads post-auth`);
      }
    }

    // Extract everything visible
    const { visibleText, links, iframes } = await extractPageData(page);

    // Save page text
    fs.writeFileSync(path.join(outDir, "page-text.txt"), visibleText);
    log(SCRIPT, `  ✓ Page text: ${visibleText.length} chars`);

    // Save links JSON
    fs.writeFileSync(path.join(outDir, "links.json"), JSON.stringify(links, null, 2));
    log(SCRIPT, `  ✓ Links: ${links.length} total`);

    // Log COA-relevant links immediately
    const coaRelevant = links.filter(l =>
      l.type !== "other" ||
      l.text.toLowerCase().includes("coa") ||
      l.text.toLowerCase().includes("certificate") ||
      l.text.toLowerCase().includes("download") ||
      l.text.toLowerCase().includes("vanguard") ||
      l.text.toLowerCase().includes("lab") ||
      l.text.toLowerCase().includes("result")
    );
    log(SCRIPT, `\n  COA-relevant links (${coaRelevant.length}):`);
    for (const l of coaRelevant) {
      log(SCRIPT, `    [${l.type}] "${l.text.slice(0, 60)}" → ${l.href}`);
    }

    if (iframes.length > 0) {
      log(SCRIPT, `\n  Embedded content (${iframes.length}):`);
      for (const f of iframes) log(SCRIPT, `    <${f.tag}> ${f.src}`);
    }

    // Screenshot
    const shotPath = path.join(outDir, "page-screenshot.png");
    await page.screenshot({ path: shotPath as `${string}.png`, fullPage: true });
    log(SCRIPT, `  ✓ Screenshot: ${shotPath}`);

    // For Certified Pep: COA images are in data-view attributes (PNG), not regular hrefs
    // Extract them all — login wall only blocks the lightbox, not the asset URLs
    const dataViewUrls: { url: string; title: string }[] = target.slug === "certified-pep"
      ? await page.evaluate(() =>
          Array.from(document.querySelectorAll("[data-view]")).map(el => ({
            url:   (el as HTMLElement).dataset.view ?? "",
            title: (el as HTMLElement).dataset.title ?? el.textContent?.trim() ?? "",
          })).filter(x => x.url)
        )
      : [];

    if (dataViewUrls.length > 0) {
      log(SCRIPT, `\n  Found ${dataViewUrls.length} COA/Contaminant images via data-view`);
      // Save full list
      fs.writeFileSync(path.join(outDir, "coa-image-urls.json"), JSON.stringify(dataViewUrls, null, 2));
      log(SCRIPT, `  ✓ All URLs saved to coa-image-urls.json`);
    }

    // Download COA files — PDFs, webp, or data-view PNGs (up to 10)
    const downloadable: { href: string; text: string; type: string }[] = [
      // data-view PNG COAs (prefer purity COA over contaminant for analysis)
      ...dataViewUrls
        .filter(x => x.title.includes("COA") && !x.title.includes("Contaminant") && x.url.includes(".png"))
        .slice(0, 6)
        .map(x => ({ href: x.url, text: x.title.replace(/[^a-z0-9\s]/gi, "-").trim(), type: "image" })),
      // Also grab a couple of contaminant reports
      ...dataViewUrls
        .filter(x => x.title.includes("Contaminant") && x.url.includes(".png"))
        .slice(0, 2)
        .map(x => ({ href: x.url, text: x.title.replace(/[^a-z0-9\s]/gi, "-").trim(), type: "contaminant" })),
      // Regular PDF/webp links as fallback
      ...links
        .filter(l => (l.type === "pdf" || l.type === "webp") && l.href.startsWith("https://"))
        .slice(0, 4)
        .map(l => ({ ...l })),
    ].slice(0, 10);

    if (downloadable.length === 0) {
      log(SCRIPT, `  — No downloadable COA files found (PDF or webp)`);
    } else {
      log(SCRIPT, `\n  Downloading ${downloadable.length} COA file(s)…`);
      const cookies = (await page.cookies()).map(c => `${c.name}=${c.value}`).join("; ");
      const referer  = coaUrl;

      for (let i = 0; i < downloadable.length; i++) {
        const { href, text, type } = downloadable[i];
        const ext   = type === "webp" ? "webp" : type === "image" || type === "contaminant" ? "png" : "pdf";
        const label = text.replace(/[^a-z0-9]/gi, "-").slice(0, 40) || `coa-${i + 1}`;
        const dest  = path.join(outDir, `${String(i + 1).padStart(2, "0")}-${label}.${ext}`);
        await downloadFile(href, dest, cookies, referer);
      }
    }

    // Summary findings to RESULT.txt
    const labMentions = [
      "vanguard", "janoshik", "colmaric", "freedom diagnostics",
      "acs lab", "mz biolabs", "acslabtest",
    ].filter(lab => visibleText.toLowerCase().includes(lab));

    const summary = [
      `COA page: ${coaUrl}`,
      `Page text length: ${visibleText.length} chars`,
      `Total links: ${links.length}`,
      `COA-relevant links: ${coaRelevant.length}`,
      `Downloadable files: ${downloadable.length}`,
      `Lab names found in page text: ${labMentions.length > 0 ? labMentions.join(", ") : "NONE"}`,
      `Accreditation keywords: ${["iso 17025", "a2la", "accredited", "accreditation"].filter(k => visibleText.toLowerCase().includes(k)).join(", ") || "NONE"}`,
      `Purity mentions: ${visibleText.match(/\d{2,3}\.?\d*\s*%/g)?.slice(0, 10).join(", ") || "none"}`,
      `Batch/lot mentions: ${visibleText.match(/(?:batch|lot)[:\s#]+[a-z0-9\-]+/gi)?.slice(0, 5).join(" | ") || "none"}`,
    ].join("\n");

    fs.writeFileSync(path.join(outDir, "RESULT.txt"), summary);
    log(SCRIPT, `\n  RESULT SUMMARY:\n${summary.split("\n").map(l => "  " + l).join("\n")}`);

  } finally {
    await page.close();
  }
}

async function main() {
  const slugFilter = process.argv.slice(2);

  const targets = slugFilter.length > 0
    ? TARGETS.filter(t => slugFilter.includes(t.slug))
    : TARGETS;

  if (targets.length === 0) {
    console.error(`No matching targets. Available: ${TARGETS.map(t => t.slug).join(", ")}`);
    process.exit(1);
  }

  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin }  = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: CHROME,
    protocolTimeout: 120000,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled", "--window-size=1280,900",
    ],
  }) as Browser;

  for (const target of targets) {
    await handleVendor(browser, target);
    await sleep(2000);
  }

  await browser.close();
  log(SCRIPT, "\n=== Done ===");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
