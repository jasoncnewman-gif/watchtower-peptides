import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteerExtra.use(StealthPlugin());

async function main() {
  const browser = await puppeteerExtra.launch({
    headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  // Login
  await page.goto("https://skyepeptides.com/login/", { waitUntil: "networkidle2", timeout: 30000 });
  await page.evaluate(() => {
    (document.querySelector('input[name="username"]') as HTMLInputElement).value = "watchtower";
    (document.querySelector('input[name="password"]') as HTMLInputElement).value = "jikHip-6dewje-xytgih";
    (document.querySelector('button[type="submit"]') as HTMLElement).click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

  // Try all likely COA paths
  for (const path of ["/test-reports/", "/testing/", "/certificates/", "/certificates-of-analysis/", "/purity-reports/"]) {
    await page.goto(`https://skyepeptides.com${path}`, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    const title = await page.title().catch(() => "");
    const status = page.url();
    const is404 = await page.evaluate(() => document.body?.innerText?.includes("Page not found") ?? false);
    console.log(`${path} → ${status} | 404:${is404} | title: ${title}`);
    if (!is404 && !status.includes("login")) {
      const text = await page.evaluate(() => document.body?.innerText?.slice(0, 1000) ?? "");
      console.log("Content:", text);
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]")).map((a: any) => a.href)
          .filter((h: string) => h.match(/\.(pdf|png|jpg)/i) || h.includes("janoshik"))
      );
      console.log("Links:", links.slice(0, 10));
    }
  }

  await browser.close();
}
main().catch(console.error);
