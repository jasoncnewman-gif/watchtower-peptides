import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";
import * as cheerio from "cheerio";
import { db } from "./lib/client.js";
import { parseMg, parsePrice, clean, log } from "./lib/scraper.js";

puppeteerExtra.use(StealthPlugin());

const KNOWN_PEPTIDES = [
  "bpc","tb-500","thymosin","sermorelin","cjc","ipamorelin","semaglutide",
  "tirzepatide","pt-141","bremelanotide","kisspeptin","ghrp","igf","selank",
  "semax","epitalon","epithalon","melanotan","gh frag","aod","ss-31","mots-c",
  "humanin","fgl","retatrutide","triptorelin","hexarelin","tesamorelin","oxytocin","ll-37",
];
const isP = (n: string) => KNOWN_PEPTIDES.some(kw => n.toLowerCase().includes(kw));

async function main() {
  const browser = await puppeteerExtra.launch({ headless: true, args: ["--no-sandbox"] }) as unknown as Browser;
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

  await page.goto("https://www.corepeptides.com/wp-json/wc/store/v1/products?per_page=100", { waitUntil: "networkidle2" });
  const body = await page.evaluate(() => document.body.innerText);

  try {
    const json = JSON.parse(body);
    if (Array.isArray(json)) {
      const hits = json.filter((p: {name:string}) => isP(p.name));
      log("core-peptides", `WooCommerce API: ${json.length} total, ${hits.length} matching`);
      hits.slice(0,5).forEach((p: {name:string; prices:{price:string}}) => 
        log("core-peptides", `  ${p.name} — $${parseInt(p.prices.price)/100}`)
      );

      if (hits.length > 0) {
        const { data: vendor } = await db.from("vendors").select("id").eq("slug","core-peptides").single();
        if (vendor) {
          await db.from("vendor_peptides").delete().eq("vendor_id", vendor.id);
          const rows = hits.map((p: {name:string; prices:{price:string; regular_price:string; sale_price:string}; is_in_stock:boolean}) => {
            const price = parseInt(p.prices.price)/100;
            const regular = parseInt(p.prices.regular_price)/100;
            const sale = parseInt(p.prices.sale_price)/100;
            const onSale = sale < regular;
            return { vendor_id: vendor.id, peptide_name: p.name, size_mg: parseMg(p.name), list_price: onSale ? regular : price, sale_price: onSale ? sale : null, in_stock: p.is_in_stock, last_checked: new Date().toISOString() };
          });
          const { error } = await db.from("vendor_peptides").insert(rows);
          if (error) log("core-peptides", `DB error: ${error.message}`);
          else log("core-peptides", `✓ Saved ${rows.length} products`);
        }
      }
    }
  } catch {
    log("core-peptides", "Not JSON — site may still be blocking");
    log("core-peptides", body.slice(0, 200));
  }

  await browser.close();
}
main();
