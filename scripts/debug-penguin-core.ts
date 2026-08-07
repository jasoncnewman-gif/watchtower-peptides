import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  // Penguin /lab-results/
  {
    console.log("=== penguin-peptides /lab-results/ ===");
    const page = await browser.newPage();
    await page.goto("https://penguinpeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const purityRe = /(\d{2,3}\.\d{1,2})\s*%/g;
    const purities = [...text.matchAll(purityRe)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    console.log(`  Purity values: ${purities.slice(0,20).join(", ")} (${purities.length} total)`);
    const pdfLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.includes(".pdf") || h.includes("coa") || h.includes("janoshik") || h.includes("lab"))
        .slice(0, 10)
    );
    console.log(`  PDF/COA links: ${pdfLinks.join(", ")}`);
    console.log(`  Page text sample:\n${text.slice(0, 1500)}`);
    await page.close();
  }

  // Core Peptides — both pages
  for (const url of ["https://www.corepeptides.com/coas/", "https://www.corepeptides.com/coas/page/2/"]) {
    console.log(`\n=== core-peptides ${url} ===`);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    console.log(`  Purity values: ${purities.slice(0,20).join(", ")} (${purities.length} total)`);
    const pdfLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => h.endsWith(".pdf") || h.includes("janoshik") || h.includes("vanguard"))
        .slice(0, 10)
    );
    console.log(`  PDF links: ${pdfLinks.join(", ")}`);
    console.log(`  Text sample:\n${text.slice(0, 800)}`);
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
