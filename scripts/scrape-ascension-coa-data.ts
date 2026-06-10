/**
 * Logs into Ascension Peptides, extracts all purity data from the COA page,
 * and prints it as structured data ready for insertion.
 * The page embeds ANALYSIS DATE / BATCH / PURITY in text alongside COA images.
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

  await page.goto("https://ascensionpeptides.com/login/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.type('input[name="log"]', "info@watchtowerpeptides.com", { delay: 40 });
  await page.type('input[name="pwd"]', "jikHip-6dewje-xytgih", { delay: 40 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
    page.click('input[name="wp-submit"]'),
  ]);
  await new Promise(r => setTimeout(r, 2000));
  console.log("After login URL:", page.url());

  await page.goto("https://ascensionpeptides.com/certificates-of-analysis/", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Extract full page text
  const fullText = await page.evaluate(() => document.body.innerText);
  console.log("\n=== FULL PAGE TEXT ===");
  console.log(fullText);

  await browser.close();
}
main().catch(console.error);
