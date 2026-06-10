/**
 * Inspects login pages for Polaris and Ascension to find actual form selectors.
 */
import type { Browser } from "puppeteer";

const TARGETS = [
  { name: "Polaris", url: "https://polarispeptides.com/my-account/" },
  { name: "Ascension", url: "https://ascensionpeptides.com/login/" },
];

async function main() {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }) as Browser;

  for (const target of TARGETS) {
    console.log(`\n\n========== ${target.name} ==========`);
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36");

    try {
      await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      // Try dismissing overlays
      const dismissSels = ["#zc-manage", ".zcb-button-primary", "button[class*='accept']", "button[class*='agree']"];
      for (const sel of dismissSels) {
        try {
          const el = await page.$(sel);
          if (el) { await el.click(); await new Promise(r => setTimeout(r, 800)); break; }
        } catch {}
      }

      const forms = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input")).map((el: any) => ({
          name: el.name, type: el.type, id: el.id, className: el.className.slice(0, 50), placeholder: el.placeholder
        }));
        const buttons = Array.from(document.querySelectorAll("button, input[type='submit']")).map((el: any) => ({
          tag: el.tagName, type: el.type, name: el.name, id: el.id, text: el.textContent?.trim().slice(0, 30)
        }));
        const url = window.location.href;
        const bodyPreview = document.body.innerText.slice(0, 400);
        return { url, inputs, buttons, bodyPreview };
      });

      console.log("URL:", forms.url);
      console.log("Body preview:", forms.bodyPreview);
      console.log("\nInputs:", JSON.stringify(forms.inputs, null, 2));
      console.log("\nButtons:", JSON.stringify(forms.buttons, null, 2));
    } catch (err: any) {
      console.error("Error:", err.message);
    }
    await page.close();
  }

  await browser.close();
}
main().catch(console.error);
