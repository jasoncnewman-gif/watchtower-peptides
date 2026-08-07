import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  // Licensed Peptides — get all JPG image URLs from COA page
  {
    console.log("=== licensed-peptides: all COA image URLs ===");
    const page = await browser.newPage();
    await page.goto("https://licensedpeptides.com/purity-reports/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll("img[src], a[href]")]
        .map(el => (el as any).src || (el as any).href)
        .filter(u => u && (u.includes("pdf.jpg") || u.includes("-pdf") || u.includes("uploads") || u.includes("Report")))
    );
    console.log(`  Found ${imgs.length} COA image URLs:`);
    imgs.forEach(u => console.log(`    ${u}`));
    await page.close();
  }

  // Penguin — click first COA button and intercept network requests
  {
    console.log("\n=== penguin-peptides: intercept COA click ===");
    const page = await browser.newPage();
    const pdfUrls: string[] = [];
    page.on("request", req => {
      if (req.url().includes("pdf") || req.url().includes("coa") || req.url().includes("janoshik")) {
        pdfUrls.push(req.url());
      }
    });
    await page.goto("https://penguinpeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Find and click first COA button
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("a, button")].filter(el =>
        el.textContent?.toLowerCase().includes("coa") || el.textContent?.toLowerCase().includes("view") || el.textContent?.toLowerCase().includes("report")
      );
      if (btns.length > 0) { (btns[0] as HTMLElement).click(); return btns[0].textContent?.trim(); }
      return null;
    });
    console.log(`  Clicked: ${clicked}`);
    await new Promise(r => setTimeout(r, 3000));
    console.log(`  Intercepted URLs: ${pdfUrls.join(", ")}`);

    // Also check what happened to page
    const newUrl = page.url();
    console.log(`  Current URL after click: ${newUrl}`);
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
