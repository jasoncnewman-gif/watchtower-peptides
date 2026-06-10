/**
 * Scans Polaris Peptides post-login for COA page.
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
  await page.evaluate(() => {
    const form = (document.querySelector('input[name="xoo-el-username"]') as HTMLElement)?.closest("form");
    const btn = form?.querySelector("button[type='submit'], input[type='submit']") as HTMLElement | null;
    btn?.click();
  });
  await Promise.race([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }), new Promise(r => setTimeout(r, 8000))]).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log("Logged in, URL:", page.url());

  // Scan all links from my-account page
  const acctLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a: any) => ({ href: a.href, text: a.textContent?.trim().slice(0, 50) }))
  );
  const coaKeywords = ["coa", "lab", "certificate", "test", "analys", "purity"];
  const coaLinks = acctLinks.filter((l: any) => coaKeywords.some(kw => l.href.toLowerCase().includes(kw) || l.text.toLowerCase().includes(kw)));
  console.log("COA links from /my-account/:", JSON.stringify(coaLinks.slice(0, 20)));

  // Try alternative paths
  const paths = [
    "/coa/", "/coas/", "/lab-results/", "/lab-testing/", "/certificates/",
    "/certificates-of-analysis/", "/third-party-testing/", "/testing/",
    "/product-testing/", "/quality-testing/", "/purity/",
    "/certificate-of-analysis/",
  ];
  for (const path of paths) {
    const url = `https://polarispeptides.com${path}`;
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => null);
    const status = res?.status() ?? "err";
    if (status !== 404 && status !== "err") {
      const text = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || "");
      console.log(`\nFOUND: ${url} → ${status}`);
      console.log(text);
    } else {
      process.stdout.write(`${path}:${status} `);
    }
  }
  console.log("\n");

  // Also check footer links on homepage
  await page.goto("https://polarispeptides.com/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  const footLinks = await page.evaluate((kws: string[]) => {
    const all = Array.from(document.querySelectorAll("footer a[href], .footer a[href], nav a[href]"));
    return all.map((a: any) => ({ href: a.href, text: a.textContent?.trim().slice(0, 50) }))
      .filter(({ href, text }: any) => kws.some(kw => href.toLowerCase().includes(kw) || text.toLowerCase().includes(kw)));
  }, coaKeywords);
  console.log("Footer/nav COA links:", JSON.stringify(footLinks.slice(0, 20)));

  await browser.close();
}
main().catch(console.error);
