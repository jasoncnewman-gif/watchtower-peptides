import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());
const VENDOR_SLUG = "skye-peptides";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", VENDOR_SLUG).single();
  const vendorId = vendor!.id;

  const browser = await puppeteerExtra.launch({
    headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto("https://skyepeptides.com/login/", { waitUntil: "networkidle2", timeout: 30000 });
  await page.evaluate(() => {
    (document.querySelector('input[name="username"]') as HTMLInputElement).value = "watchtower";
    (document.querySelector('input[name="password"]') as HTMLInputElement).value = "jikHip-6dewje-xytgih";
    (document.querySelector('button[type="submit"]') as HTMLElement).click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await page.goto("https://skyepeptides.com/test-reports/", { waitUntil: "networkidle2", timeout: 30000 });
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 800));
  }

  const rows = await page.evaluate(() => {
    const results: any[] = [];
    // Use broad selector that caught 93 items in first pass
    const items = Array.from(document.querySelectorAll("li, .product-item, tr, .coa-row, p, div"))
      .filter(el => {
        const text = (el as HTMLElement).innerText ?? "";
        return text.match(/Purity:\s*\d{2,3}\.\d+%/) && text.length < 500;
      });
    for (const el of items) {
      const text = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() ?? "";
      // text is flat like: "Peptide: BPC-157 Batch number: BPC26-10-001 Purity: 99.9% Size: 10 mg"
      const peptideMatch = text.match(/Peptide:\s*(.+?)\s*Batch number:/i);
      const batchMatch = text.match(/Batch number:\s*([^\s:]+)/i);
      const purityMatch = text.match(/Purity:\s*(\d{2,3}\.\d+)%/i);
      if (peptideMatch && purityMatch) {
        results.push({
          peptide: peptideMatch[1].trim().replace(/\s+\d+\s*mg$/i, ""),
          batch: batchMatch?.[1]?.replace(/[A-Z][a-z].*$/, "").trim() ?? null,
          purity: parseFloat(purityMatch[1]),
        });
      }
    }
    return results;
  });

  console.log(`Parsed ${rows.length} rows`);
  rows.slice(0, 10).forEach(r => console.log(JSON.stringify(r)));

  // Deduplicate by (peptide, batch, purity)
  const seen = new Set<string>();
  const unique = rows.filter(r => {
    const key = `${r.peptide}|${r.batch}|${r.purity}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`After dedup: ${unique.length} unique rows`);

  const inserts = unique
    .filter(r => r.purity >= 85 && r.purity <= 100)
    .map(r => ({
      vendor_id: vendorId,
      peptide_name: r.peptide,
      lab_name: "Janoshik",
      purity_result: r.purity,
      batch_number: r.batch ?? null,
      test_date: null,
      test_source: "skye-test-reports",
      verified: true,
    }));

  console.log(`\nInserting ${inserts.length} rows`);
  await db.from("lab_tests").delete().eq("vendor_id", vendorId).eq("test_source", "skye-test-reports");
  for (let i = 0; i < inserts.length; i += 50) {
    const { error } = await db.from("lab_tests").insert(inserts.slice(i, i + 50));
    if (error) console.log("Insert error:", error.message);
    else console.log(`  Batch ${i}–${i + 50} OK`);
  }
  console.log(`Done: ${inserts.length} rows inserted`);

  await browser.close();
}
main().catch(console.error);
