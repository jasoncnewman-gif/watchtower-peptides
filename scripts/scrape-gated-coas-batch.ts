import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

const VENDORS = [
  {
    slug: "skye-peptides",
    vendorId: "", // fill below
    loginUrl: "https://skyepeptides.com/login/",
    coaUrl: "https://skyepeptides.com/coa/",
    username: "watchtower",
    password: "jikHip-6dewje-xytgih",
  },
  {
    slug: "peptide-crafters",
    vendorId: "",
    loginUrl: "https://peptidecrafters.com/my-account/",
    coaUrl: "https://peptidecrafters.com/coa/",
    username: "watchtower",
    password: "jikHip-6dewje-xytgih",
  },
  {
    slug: "simple-peptide",
    vendorId: "",
    loginUrl: "https://simplepeptide.com/my-account/",
    coaUrl: "https://simplepeptide.com/coa/",
    username: "info@watchtowerpeptides.com",
    password: "jikHip-6dewje-xytgih",
  },
];

async function scrapeVendor(v: typeof VENDORS[0], browser: any) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  console.log(`\n[${v.slug}] Logging in at ${v.loginUrl}`);
  await page.goto(v.loginUrl, { waitUntil: "networkidle2", timeout: 30000 });

  // Try WooCommerce login fields
  await page.evaluate((u: string, p: string) => {
    const userField = document.querySelector('input[name="username"], input[name="log"], input[id="username"]') as HTMLInputElement;
    const passField = document.querySelector('input[name="password"], input[name="pwd"], input[id="password"]') as HTMLInputElement;
    if (userField) userField.value = u;
    if (passField) passField.value = p;
  }, v.username, v.password);

  const submitted = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"], input[type="submit"], input[name="login"]') as HTMLElement;
    if (btn) { btn.click(); return true; }
    return false;
  });

  if (!submitted) { console.log(`[${v.slug}] No submit button found`); await page.close(); return []; }
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log(`[${v.slug}] After login: ${page.url()}`);

  // Now try the COA page
  console.log(`[${v.slug}] Loading COA page: ${v.coaUrl}`);
  await page.goto(v.coaUrl, { waitUntil: "networkidle2", timeout: 30000 }).catch(async () => {
    // Try alternate COA paths
    for (const path of ["/lab-results/", "/certificates-of-analysis/", "/testing/", "/coas/"]) {
      const url = new URL(path, v.coaUrl).href;
      try { await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 }); break; } catch {}
    }
  });

  console.log(`[${v.slug}] COA page URL: ${page.url()}`);
  const pageText = await page.evaluate(() => document.body?.innerText?.slice(0, 3000) ?? "");
  console.log(`[${v.slug}] Page preview:\n${pageText.slice(0, 500)}`);

  // Try to find links to PDFs or lab reports
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a: any) => a.href)
      .filter((h: string) => h.match(/\.(pdf|jpg|png|webp)/i) || h.includes("janoshik") || h.includes("coa") || h.includes("lab") || h.includes("cert"));
  });
  console.log(`[${v.slug}] COA links found: ${links.length}`);
  if (links.length > 0) console.log(`[${v.slug}] Sample links:`, links.slice(0, 5));

  await page.close();
  return links;
}

async function main() {
  // Get vendor IDs
  for (const v of VENDORS) {
    const { data } = await db.from("vendors").select("id").eq("slug", v.slug).single();
    v.vendorId = data?.id ?? "";
  }

  const browser = await puppeteerExtra.launch({ 
    headless: true, 
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  for (const v of VENDORS) {
    if (!v.vendorId) { console.log(`[${v.slug}] No vendor ID, skipping`); continue; }
    await scrapeVendor(v, browser).catch(e => console.log(`[${v.slug}] Error: ${e.message}`));
  }

  await browser.close();
}

main().catch(console.error);
