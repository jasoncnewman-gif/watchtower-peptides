/**
 * Scrapes purity data from JS-rendered COA pages using Puppeteer.
 * Targets: licensed-peptides, core-peptides, penguin-peptides, biotech-peptides
 */
import { db } from "./lib/client.js";

const VENDORS = [
  { slug: "licensed-peptides", url: "https://licensedpeptides.com/purity-reports/",        lab: "Vanguard Laboratory" },
  { slug: "core-peptides",     url: "https://www.corepeptides.com/coas/",                  lab: "Unattributed" },
  { slug: "penguin-peptides",  url: "https://penguinpeptides.com/pages/lab-testing",        lab: "Unattributed" },
  { slug: "biotech-peptides",  url: "https://biotechpeptides.com/coas/",                   lab: "Unattributed" },
];

function slugToName(slug: string): string {
  return slug
    .replace(/-\d+\s*mg.*$/i, "")
    .replace(/-vial$/i, "")
    .split("-")
    .map(w => w.length <= 4 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  const dryRun = process.argv[2] === "--dry-run";
  const filterSlug = process.argv.find(a => a.startsWith("--slug="))?.split("=")[1];

  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());

  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const vendors = filterSlug ? VENDORS.filter(v => v.slug === filterSlug) : VENDORS;

  for (const v of vendors) {
    console.log(`\n=== ${v.slug} ===`);
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    try {
      await page.goto(v.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const pageText = await page.evaluate(() => document.body.innerText);
      const html = await page.content();

      // Extract purity percentages with context
      const purityRe = /(\d{2,3}\.\d{1,2})\s*%/g;
      const purities = [...pageText.matchAll(purityRe)]
        .map(m => parseFloat(m[1]))
        .filter(v => v >= 85 && v <= 100.5);
      console.log(`  Purity values in rendered text: ${purities.slice(0, 20).join(", ")}${purities.length > 20 ? "..." : ""}`);
      console.log(`  Total: ${purities.length}`);

      // Dump 2000 chars of page text for structure analysis
      const purityIdx = pageText.indexOf("%");
      if (purityIdx >= 0) {
        console.log(`\n  --- Page text sample (around first %) ---`);
        console.log(pageText.slice(Math.max(0, purityIdx - 300), purityIdx + 500));
      } else {
        console.log(`  --- First 1000 chars of page text ---`);
        console.log(pageText.slice(0, 1000));
      }

    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

main().catch(console.error);
