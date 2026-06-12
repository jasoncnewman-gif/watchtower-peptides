import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

const PEPTIDES = ["BPC-157","TB-500","Ipamorelin","Semaglutide","Tirzepatide","Retatrutide","CJC-1295","GHK-Cu","PT-141","Sermorelin"];
const VENDOR_ID_SLUG = "simple-peptide";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", VENDOR_ID_SLUG).single();
  const vendorId = vendor!.id;

  const browser = await puppeteerExtra.launch({
    headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto("https://simplepeptide.com/coa/", { waitUntil: "networkidle2", timeout: 30000 });
  console.log("COA page:", page.url());

  const results: any[] = [];

  for (const peptide of PEPTIDES) {
    console.log(`\nSearching: ${peptide}`);
    await page.goto("https://simplepeptide.com/coa/", { waitUntil: "networkidle2", timeout: 20000 });
    
    // Fill product name search
    await page.evaluate((name: string) => {
      const input = document.querySelector('input[name="product_name"], input[placeholder*="Product"], input[placeholder*="product"], input[id*="product"]') as HTMLInputElement;
      if (input) { input.value = name; input.dispatchEvent(new Event('input', { bubbles: true })); }
    }, peptide);
    await new Promise(r => setTimeout(r, 500));

    // Submit search
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"], input[type="submit"], .coa-search-btn') as HTMLElement;
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const text = await page.evaluate(() => document.body?.innerText ?? "");
    
    // Look for purity results
    const purityMatches = text.match(/(\d{2,3}\.\d+)\s*%/g);
    const labMatches = text.match(/(?:Lab|Laboratory|Analytical|Analytics|Labs)[:\s]+([A-Za-z\s]+)/gi);
    const batchMatches = text.match(/(?:Lot|Batch|Accession)[:\s#]+([A-Z0-9-]+)/gi);
    
    if (purityMatches || text.toLowerCase().includes("purity")) {
      console.log(`  Found data! Purity: ${purityMatches?.join(", ")} | Labs: ${labMatches?.slice(0,2).join(", ")}`);
      results.push({ peptide, purity: purityMatches, labs: labMatches, batches: batchMatches });
    } else {
      console.log(`  No results found`);
    }
  }

  console.log("\n=== SUMMARY ===", JSON.stringify(results, null, 2));

  // Update address
  await db.from("vendors").update({ city: "Delray Beach", state: "FL", country: "US" }).eq("slug", VENDOR_ID_SLUG);
  const { data: t } = await db.from("vendor_transparency").select("vendor_id").eq("vendor_id", vendorId).single();
  if (t) await db.from("vendor_transparency").update({ has_business_address: true }).eq("vendor_id", vendorId);
  console.log("Simple Peptide address updated");

  await browser.close();
}
main().catch(console.error);
