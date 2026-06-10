/**
 * Logs into Ascension Peptides and extracts COA page image/PDF URLs.
 * Ascension login: name="log" (username), name="pwd" (password), input[name="wp-submit"]
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
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  }) as Browser;

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36");

  await page.goto("https://ascensionpeptides.com/login/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Type into the login form (Ascension uses name="log" and name="pwd")
  await page.type('input[name="log"]', "info@watchtowerpeptides.com", { delay: 40 });
  await page.type('input[name="pwd"]', "jikHip-6dewje-xytgih", { delay: 40 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
    page.click('input[name="wp-submit"]'),
  ]);
  await new Promise(r => setTimeout(r, 2000));
  console.log("After login URL:", page.url());

  await page.goto("https://ascensionpeptides.com/certificates-of-analysis/", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]")).map((a: any) => a.href);
    const imgs = Array.from(document.querySelectorAll("img[src]")).map((img: any) => img.src);
    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 1000),
      docLinks: [...links, ...imgs].filter((h: string) =>
        /\.(pdf|png|jpg|jpeg)/i.test(h) || h.includes("janoshik")
      ),
      allLinks: links.slice(0, 60),
    };
  });

  console.log("\nCOA page URL:", result.url);
  console.log("\nBody text:");
  console.log(result.bodyText);
  console.log("\n--- Doc links (PDF/PNG/JPG/janoshik) ---");
  result.docLinks.forEach(l => console.log(l));
  console.log("\n--- All links (first 60) ---");
  result.allLinks.forEach(l => console.log(l));

  await browser.close();
}
main().catch(console.error);
