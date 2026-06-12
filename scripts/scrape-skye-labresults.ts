import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

const VENDOR_ID_SLUG = "skye-peptides";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", VENDOR_ID_SLUG).single();
  const vendorId = vendor!.id;

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  // Login first
  await page.goto("https://skyepeptides.com/login/", { waitUntil: "networkidle2", timeout: 30000 });
  await page.evaluate((u: string, p: string) => {
    const uf = document.querySelector('input[name="username"], input[name="log"]') as HTMLInputElement;
    const pf = document.querySelector('input[name="password"], input[name="pwd"]') as HTMLInputElement;
    if (uf) uf.value = u;
    if (pf) pf.value = p;
  }, "watchtower", "jikHip-6dewje-xytgih");
  await page.evaluate(() => {
    (document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement)?.click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("After login:", page.url());

  // Try lab results page
  await page.goto("https://skyepeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
  console.log("Lab results URL:", page.url());
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));

  const content = await page.evaluate(() => document.body?.innerText?.slice(0, 5000) ?? "");
  console.log("Page content preview:\n", content.slice(0, 2000));

  // Find all PDF/COA links
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a: any) => ({ text: a.innerText?.trim(), href: a.href }))
      .filter((l: any) => l.href.match(/\.(pdf|jpg|png|webp)/i) || l.href.includes("janoshik") || l.href.includes("coa") || l.href.includes("cert"))
  );
  console.log(`\nCOA links (${links.length}):`, JSON.stringify(links.slice(0, 10), null, 2));

  // Update vendor address
  await db.from("vendors").update({
    city: "Los Angeles", state: "CA", country: "US",
    phone: "+14242940603",
  }).eq("slug", VENDOR_ID_SLUG);
  console.log("Address updated");

  await browser.close();
}

main().catch(console.error);
