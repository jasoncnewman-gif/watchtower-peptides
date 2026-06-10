import puppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const pptr = addExtra(puppeteer as any);
pptr.use(StealthPlugin());

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await pptr.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  // Capture admin-ajax.php request/response
  const ajaxData: { postData?: string; response?: string }[] = [];
  page.on("request", (req) => {
    if (req.url().includes("admin-ajax")) {
      console.log("AJAX REQUEST body:", req.postData());
    }
  });
  page.on("response", async (res) => {
    if (res.url().includes("admin-ajax")) {
      try {
        const body = await res.text();
        console.log("AJAX RESPONSE:", body.slice(0, 2000));
      } catch {}
    }
  });

  await page.goto("https://trueresearchlabs.com/coa/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 5000));

  // Check what the rcl-coa-manager JS variables look like
  const pluginVars = await page.evaluate(() => {
    const win = window as any;
    return {
      rcl: win.rcl_coa_params || win.rcl_params || win.coa_params,
      ajaxUrl: win.ajaxurl,
      wc: win.wc_add_to_cart_params?.ajax_url,
    };
  });
  console.log("Plugin vars:", JSON.stringify(pluginVars));

  // Get raw HTML of COA table element
  const tableHtml = await page.evaluate(() => {
    const tables = document.querySelectorAll('[class*="coa"], table, [class*="rcl"]');
    for (const t of Array.from(tables).slice(0, 3)) {
      const h = (t as HTMLElement).outerHTML;
      if (h.length > 200) return h.slice(0, 3000);
    }
    return "no table found";
  });
  console.log("\n=== TABLE HTML ===");
  console.log(tableHtml.slice(0, 2000));

  await browser.close();
}

main().catch(console.error);
