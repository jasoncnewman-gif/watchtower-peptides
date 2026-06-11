import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

const VENDOR_ID = "c25ea91c-9af8-4e3b-a5ab-dfb5b2098c2f";
const COA_URL = "https://peptidology.co/certificates/";

async function main() {
  const browser = await puppeteerExtra.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  console.log("Loading COA page...");
  await page.goto(COA_URL, { waitUntil: "networkidle2", timeout: 45000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));

  const rows = await page.evaluate(() => {
    const results: any[] = [];
    const blocks = Array.from(document.querySelectorAll("div.pcm-product-block"));

    for (const block of blocks) {
      const productName = (block.querySelector(".pcm-product-name a") as HTMLElement)?.innerText?.trim() || "";
      if (!productName) continue;

      const tableRows = Array.from(block.querySelectorAll("tr.pcm-coa-row"));
      for (const tr of tableRows) {
        const cells = Array.from(tr.querySelectorAll("td")).map((c: any) => c.innerText?.trim() || "");
        if (cells.length < 5) continue;

        const purityMatch = cells[4]?.match(/(\d{2,3}\.\d+)%/);
        if (!purityMatch) continue;

        results.push({
          product: productName,
          variant: cells[0].replace(/\s*(DISCONTINUED|NEW|discontinued|new|\d+ batches?)\s*/gi, "").trim(),
          lot: cells[1].replace(/\s*(NEW|new)\s*/gi, "").trim(),
          tested: cells[2].trim(),
          purity: parseFloat(purityMatch[1]),
        });
      }
    }
    return results;
  });

  await browser.close();

  console.log(`Scraped ${rows.length} rows`);
  console.log("Sample:", JSON.stringify(rows.slice(0, 3), null, 2));

  const inserts = rows.map((r: any) => ({
    vendor_id: VENDOR_ID,
    peptide_name: r.product,
    lab_name: "Vanguard / Eagle Analytical",
    purity_result: r.purity,
    test_date: (() => {
      try { const d = new Date(r.tested); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); }
      catch { return null; }
    })(),
    batch_number: r.lot || null,
    container_desc: r.variant || null,
    test_source: "peptidology-coa-page",
    verified: true,
  }));

  await db.from("lab_tests").delete().eq("vendor_id", VENDOR_ID);
  console.log("Cleared existing rows");

  let inserted = 0;
  for (let i = 0; i < inserts.length; i += 50) {
    const { error } = await db.from("lab_tests").insert(inserts.slice(i, i + 50));
    if (error) console.log(`Insert error:`, error.message);
    else inserted += Math.min(50, inserts.length - i);
  }

  console.log(`Inserted ${inserted} rows`);
}

main().catch(console.error);
