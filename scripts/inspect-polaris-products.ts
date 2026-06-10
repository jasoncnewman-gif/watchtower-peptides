/**
 * Checks Polaris product pages post-login for COA links or embedded purity data.
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
    (form?.querySelector("button[type='submit'], input[type='submit']") as HTMLElement | null)?.click();
  });
  await Promise.race([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }), new Promise(r => setTimeout(r, 8000))]).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Get a few product slugs from the API
  const apiRes = await fetch("https://polarispeptides.com/wp-json/wc/v3/products?per_page=5&consumer_key=ck_&consumer_secret=cs_");
  // API might need auth, so let's just use known slugs
  const productPaths = [
    "/product/bpc-157/",
    "/product/bpc157/",
    "/product/semaglutide/",
    "/product/tirzepatide/",
    "/product/tb-500/",
    "/product/ipamorelin/",
  ];

  for (const path of productPaths) {
    const url = `https://polarispeptides.com${path}`;
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
    if (!res || res.status() === 404) {
      process.stdout.write(`${path}:404 `);
      continue;
    }
    const data = await page.evaluate(() => {
      const text = document.body?.innerText?.slice(0, 600) || "";
      const links = Array.from(document.querySelectorAll("a[href]")).map((a: any) => a.href)
        .filter((h: string) => /\.(pdf|jpg|png)/i.test(h) || h.includes("janoshik") || h.includes("coa") || h.includes("lab"));
      return { text, links };
    });
    console.log(`\n\nFOUND: ${url} → ${res.status()}`);
    console.log(data.text);
    if (data.links.length) console.log("Doc links:", data.links.join("\n"));
  }

  // Also try fetching the product catalog HTML to find product URLs
  await page.goto("https://polarispeptides.com/shop/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  const shopLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a.woocommerce-loop-product__link, a[href*='/product/']"))
      .map((a: any) => a.href).slice(0, 10)
  );
  console.log("\n\nShop product links:", shopLinks);

  await browser.close();
}
main().catch(console.error);
