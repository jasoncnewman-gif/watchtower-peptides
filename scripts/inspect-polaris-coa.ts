/**
 * Logs into Polaris Peptides and finds their COA page URL.
 */
import type { Browser } from "puppeteer";

async function main() {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }) as Browser;

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36");

  // Login
  await page.goto("https://polarispeptides.com/my-account/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.type('input[name="xoo-el-username"]', "info@watchtowerpeptides.com", { delay: 40 });
  await page.type('input[name="xoo-el-password"]', "jikHip-6dewje-xytgih", { delay: 40 });

  const clicked = await page.evaluate(() => {
    const form = (document.querySelector('input[name="xoo-el-username"]') as HTMLElement)?.closest("form");
    const btn = form?.querySelector("button[type='submit'], input[type='submit']") as HTMLElement | null;
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!clicked) await page.click("button[type='submit']");

  await Promise.race([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
    new Promise(r => setTimeout(r, 8000)),
  ]).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log("After login URL:", page.url());

  // Scan homepage for COA links
  const COA_KEYWORDS = ["coa", "lab", "certificate", "test result", "analysis", "purity", "janoshik"];
  const links = await page.evaluate((kws: string[]) => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a: any) => ({ href: a.href, text: a.textContent?.trim().slice(0, 60) }))
      .filter(({ href, text }) => {
        const h = href.toLowerCase();
        const t = text.toLowerCase();
        return kws.some(kw => h.includes(kw) || t.includes(kw));
      });
  }, COA_KEYWORDS);

  console.log("\n--- COA-related links from post-login page ---");
  links.forEach(l => console.log(`${l.text} → ${l.href}`));

  // Also try common WooCommerce COA paths
  const candidates = [
    "https://polarispeptides.com/coa/",
    "https://polarispeptides.com/coas/",
    "https://polarispeptides.com/lab-results/",
    "https://polarispeptides.com/certificates/",
    "https://polarispeptides.com/certificates-of-analysis/",
    "https://polarispeptides.com/lab-testing/",
  ];

  console.log("\n--- Checking common COA paths ---");
  for (const url of candidates) {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
    const status = res?.status() ?? "error";
    if (status !== 404 && status !== "error") {
      const text = await page.evaluate(() => document.body.innerText.slice(0, 200));
      console.log(`\n${url} → ${status}`);
      console.log(text);
      // Extract all document links
      const docLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href], img[src]"))
          .map((el: any) => el.href || el.src)
          .filter((h: string) => /\.(pdf|png|jpg|jpeg)/i.test(h) || h.includes("janoshik"))
      );
      if (docLinks.length) {
        console.log("Doc links:", docLinks.slice(0, 30).join("\n"));
      }
    } else {
      console.log(`${url} → ${status}`);
    }
  }

  await browser.close();
}
main().catch(console.error);
