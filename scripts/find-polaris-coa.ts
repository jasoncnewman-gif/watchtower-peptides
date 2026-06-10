/**
 * Logs into Polaris and scans their homepage + sitemap for COA URLs.
 */
import type { Browser } from "puppeteer";

async function main() {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
  await Promise.race([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }), new Promise(r => setTimeout(r, 8000))]).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log("Logged in, URL:", page.url());

  // Check homepage nav for COA links
  await page.goto("https://polarispeptides.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const navLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a: any) => ({ href: a.href, text: a.textContent?.trim().slice(0, 60) }))
      .filter(({ href, text }) => {
        const h = href.toLowerCase();
        const t = text.toLowerCase();
        return ["coa", "lab", "certificate", "test", "analys", "purity", "result"].some(kw => h.includes(kw) || t.includes(kw));
      })
  );
  console.log("\n--- Nav COA links ---");
  navLinks.forEach((l: any) => console.log(`"${l.text}" → ${l.href}`));

  // Check sitemap
  const sitemapRes = await page.goto("https://polarispeptides.com/sitemap_index.xml", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
  if (sitemapRes && sitemapRes.status() !== 404) {
    const sitemapText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    console.log("\n--- Sitemap ---");
    console.log(sitemapText);
  }

  // Also check /sitemap.xml
  const sm2 = await page.goto("https://polarispeptides.com/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
  if (sm2 && sm2.status() !== 404) {
    const t = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    if (t.includes("coa") || t.includes("lab") || t.includes("cert")) {
      console.log("\n--- COA in sitemap.xml ---");
      console.log(t.split("\n").filter((l: string) => l.toLowerCase().includes("coa") || l.toLowerCase().includes("lab") || l.toLowerCase().includes("cert")).join("\n"));
    }
  }

  await browser.close();
}
main().catch(console.error);
