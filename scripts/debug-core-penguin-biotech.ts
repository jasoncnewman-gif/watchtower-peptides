import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  // Core Peptides — look at a product page for embedded COA
  {
    console.log("=== core-peptides: shop page ===");
    const page = await browser.newPage();
    await page.goto("https://www.corepeptides.com/shop/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const productLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href*='/product']")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter((h, i, arr) => arr.indexOf(h) === i)
        .slice(0, 5)
    );
    console.log("  Product links:", productLinks);
    await page.close();
  }

  // Core Peptides — check first product page for COA
  {
    console.log("\n=== core-peptides: BPC-157 product page ===");
    const page = await browser.newPage();
    await page.goto("https://www.corepeptides.com/product/bpc-157/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    const coaLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.includes("pdf") || h.includes("coa") || h.includes("lab") || h.includes("certificate"))
        .slice(0, 10)
    );
    console.log(`  Purity values: ${purities.slice(0,10).join(", ")}`);
    console.log(`  COA links: ${coaLinks.join(", ")}`);
    console.log(`  Text sample:\n${text.slice(0, 500)}`);
    await page.close();
  }

  // Penguin — intercept all network requests on lab-results page
  {
    console.log("\n=== penguin-peptides: network intercept ===");
    const page = await browser.newPage();
    const pdfUrls: string[] = [];
    page.on("response", async res => {
      const url = res.url();
      if (url.includes("pdf") || url.includes("coa") || url.includes("lab") || url.includes(".pdf")) {
        pdfUrls.push(url);
      }
    });
    await page.goto("https://penguinpeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Get all hrefs on the page
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => ({ text: (a as HTMLAnchorElement).textContent?.trim(), href: (a as HTMLAnchorElement).href }))
        .filter(a => a.text && a.text.length > 0 && a.text.length < 50)
        .slice(0, 20)
    );
    console.log("  All links with text:", JSON.stringify(hrefs.slice(0, 10), null, 2));
    console.log(`  PDF responses intercepted: ${pdfUrls.join(", ")}`);
    await page.close();
  }

  // Biotech Peptides — check individual product page
  {
    console.log("\n=== biotech-peptides: product page ===");
    const page = await browser.newPage();
    await page.goto("https://biotechpeptides.com/bpc-157/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    const coaLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.includes("pdf") || h.includes("coa") || h.includes("lab") || h.includes("certificate") || h.includes("janoshik"))
        .slice(0, 10)
    );
    console.log(`  URL: ${page.url()}`);
    console.log(`  Purity values: ${purities.slice(0,10).join(", ")}`);
    console.log(`  COA links: ${coaLinks.join(", ")}`);
    console.log(`  Text sample: ${text.slice(0, 300)}`);
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
