import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  // Penguin — click the first product's COA and wait
  {
    console.log("=== penguin: click first product COA ===");
    const page = await browser.newPage();
    await page.goto("https://penguinpeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Get all clickable elements and their text
    const clickables = await page.evaluate(() =>
      [...document.querySelectorAll("[class*='coa'], [class*='lab'], [class*='result'], [data-product], button, [role='button']")]
        .map(el => ({ tag: el.tagName, cls: el.className, text: el.textContent?.trim().slice(0, 50), id: el.id }))
        .filter(e => e.text)
        .slice(0, 15)
    );
    console.log("  Clickable elements:", JSON.stringify(clickables, null, 2));

    // Try clicking first product item
    const clicked = await page.evaluate(() => {
      const items = document.querySelectorAll("li, .product-item, [class*='product'], [class*='item']");
      for (const item of items) {
        if (item.textContent?.includes("GLP") || item.textContent?.includes("BPC")) {
          (item as HTMLElement).click();
          return item.textContent?.trim().slice(0, 80);
        }
      }
      return null;
    });
    console.log("  Clicked:", clicked);
    await new Promise(r => setTimeout(r, 3000));

    const text = await page.evaluate(() => document.body.innerText);
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    console.log(`  Purity values after click: ${purities.join(", ")}`);
    console.log(`  Page text (first 600): ${text.slice(0, 600)}`);
    await page.close();
  }

  // Core Peptides — try sitemap
  {
    console.log("\n=== core-peptides: sitemap ===");
    const page = await browser.newPage();
    await page.goto("https://www.corepeptides.com/sitemap.xml", { waitUntil: "networkidle2", timeout: 20000 });
    const xmlText = await page.evaluate(() => document.body.innerText);
    // Find product-like URLs
    const productUrls = xmlText.match(/https:\/\/www\.corepeptides\.com\/[^\s<]+/g)?.filter(u => !u.includes('sitemap') && !u.includes('.xml')).slice(0, 20);
    console.log("  Sitemap URLs sample:", productUrls);
    await page.close();
  }

  // Biotech — check product page HTML for hidden COA images/iframes
  {
    console.log("\n=== biotech-peptides: product page HTML ===");
    const page = await browser.newPage();
    await page.goto("https://biotechpeptides.com/product/bpc-157/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll down to reveal lazy-loaded content
    await page.evaluate(() => window.scrollBy(0, 3000));
    await new Promise(r => setTimeout(r, 2000));

    const imgSrcs = await page.evaluate(() =>
      [...document.querySelectorAll("img[src]")]
        .map(img => (img as HTMLImageElement).src)
        .filter(s => s.includes("coa") || s.includes("lab") || s.includes("pdf") || s.includes("certificate"))
    );
    const iframeSrcs = await page.evaluate(() =>
      [...document.querySelectorAll("iframe")]
        .map(f => (f as HTMLIFrameElement).src)
    );
    const allLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.includes("coa") || h.includes("lab") || h.includes("pdf") || h.includes("janoshik") || h.includes("certificate"))
    );
    console.log("  COA imgs:", imgSrcs);
    console.log("  Iframes:", iframeSrcs);
    console.log("  COA links:", allLinks);

    const text = await page.evaluate(() => document.body.innerText);
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    console.log(`  Purity values: ${purities.join(", ")}`);
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
