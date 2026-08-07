import { db } from "./lib/client.js";

const VENDORS = [
  { slug: "licensed-peptides", url: "https://licensedpeptides.com/purity-reports/" },
  { slug: "core-peptides",     url: "https://www.corepeptides.com/coas/" },
  { slug: "penguin-peptides",  url: "https://penguinpeptides.com/" },
  { slug: "biotech-peptides",  url: "https://biotechpeptides.com/coas/" },
];

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());

  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox"],
  });

  for (const v of VENDORS) {
    console.log(`\n=== ${v.slug} ===`);
    const page = await browser.newPage();
    try {
      await page.goto(v.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const finalUrl = page.url();
      console.log(`  Final URL: ${finalUrl}`);

      // Find all links
      const links = await page.evaluate(() =>
        [...document.querySelectorAll("a[href]")]
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => h.includes("pdf") || h.includes("coa") || h.includes("test") || h.includes("purity") || h.includes("lab") || h.includes("report"))
          .slice(0, 20)
      );
      console.log(`  Relevant links (${links.length}):`);
      links.forEach(l => console.log(`    ${l}`));

      // For penguin — check sitemap or nav for lab-related pages
      if (v.slug === "penguin-peptides") {
        const allLinks = await page.evaluate(() =>
          [...document.querySelectorAll("a[href]")]
            .map(a => (a as HTMLAnchorElement).href)
            .filter(h => h.includes("penguinpeptides"))
            .slice(0, 30)
        );
        console.log(`  All internal links: ${allLinks.join(", ")}`);
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
