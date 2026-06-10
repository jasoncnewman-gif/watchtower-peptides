/**
 * scripts/seed-new-vendor-products.ts
 * One-off targeted product seeder for new vendors that are publicly accessible.
 * - True Research Labs: WooCommerce API
 * - RUO Science: shop page HTML (API returns incomplete catalog)
 * - Licensed Peptides: gated — skipped, needs Puppeteer login scraper
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-new-vendor-products.ts
 */

import * as cheerio from "cheerio";
import { db } from "./lib/client.js";
import { log, parseMg, clean } from "./lib/scraper.js";

const SCRIPT = "seed-new-vendor-products";

type ProductData = {
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

const KNOWN_PEPTIDES = [
  "bpc", "tb-500", "thymosin", "sermorelin", "cjc", "ipamorelin",
  "semaglutide", "tirzepatide", "pt-141", "bremelanotide", "kisspeptin",
  "ghrp", "igf", "selank", "semax", "epitalon", "epithalon", "melanotan",
  "gh frag", "aod", "ss-31", "mots-c", "humanin", "fgl",
  "retatrutide", "triptorelin", "hexarelin", "tesamorelin",
  "peptide yy", "gip", "glp", "oxytocin", "ll-37",
  "cagrilintide", "ghk", "vip", "kpv", "nad", "slu-pp",
];

function isPeptide(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_PEPTIDES.some((kw) => lower.includes(kw));
}

type WooProduct = {
  name: string;
  prices: { price: string; regular_price: string; sale_price: string };
  is_in_stock: boolean;
};

async function fetchWooCommerceProducts(baseUrl: string, slug: string): Promise<ProductData[]> {
  const url = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100`;
  const res = await fetch(url);
  if (!res.ok) {
    log(SCRIPT, `  ${slug}: WooCommerce API returned ${res.status}`);
    return [];
  }
  const json = (await res.json()) as WooProduct[];
  if (!Array.isArray(json)) return [];

  const results: ProductData[] = [];
  for (const p of json) {
    if (!isPeptide(p.name)) continue;
    const rawPrice   = p.prices?.price         ? parseInt(p.prices.price)         / 100 : null;
    const rawRegular = p.prices?.regular_price  ? parseInt(p.prices.regular_price) / 100 : null;
    const rawSale    = p.prices?.sale_price     ? parseInt(p.prices.sale_price)    / 100 : null;
    const isOnSale   = rawSale !== null && rawRegular !== null && rawSale < rawRegular;
    results.push({
      peptide_name: clean(p.name) ?? p.name,
      size_mg:      parseMg(p.name),
      list_price:   isOnSale ? rawRegular : rawPrice,
      sale_price:   isOnSale ? rawSale : null,
      in_stock:     p.is_in_stock ?? true,
    });
  }
  return results;
}

// RUO Science uses a different visibility setting for most products.
// Products gathered from the shop page on 2026-06-09.
const RUO_SCIENCE_PRODUCTS: ProductData[] = [
  { peptide_name: "Tesamorelin – 10 MG",  size_mg: 10,   list_price: 55.00,  sale_price: null,  in_stock: true },
  { peptide_name: "Tesamorelin – 20 MG",  size_mg: 20,   list_price: 170.00, sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 5 MG",   size_mg: 5,    list_price: 90.00,  sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 10 MG",  size_mg: 10,   list_price: 100.00, sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 15 MG",  size_mg: 15,   list_price: 140.00, sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 30 MG",  size_mg: 30,   list_price: 195.00, sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 40 MG",  size_mg: 40,   list_price: 230.00, sale_price: null,  in_stock: true },
  { peptide_name: "Tirzepatide – 60 MG",  size_mg: 60,   list_price: 280.00, sale_price: null,  in_stock: true },
  { peptide_name: "Retatrutide – 5 MG",   size_mg: 5,    list_price: 90.00,  sale_price: null,  in_stock: true },
  { peptide_name: "Retatrutide – 10 MG",  size_mg: 10,   list_price: 150.00, sale_price: null,  in_stock: true },
  { peptide_name: "Retatrutide – 15 MG",  size_mg: 15,   list_price: 195.00, sale_price: null,  in_stock: true },
  { peptide_name: "Retatrutide – 30 MG",  size_mg: 30,   list_price: 240.00, sale_price: null,  in_stock: true },
  { peptide_name: "Retatrutide – 60 MG",  size_mg: 60,   list_price: 295.00, sale_price: null,  in_stock: true },
  { peptide_name: "MOTS-c – 10 MG",       size_mg: 10,   list_price: 33.00,  sale_price: null,  in_stock: true },
  { peptide_name: "MOTS-c – 20 MG",       size_mg: 20,   list_price: 57.00,  sale_price: null,  in_stock: true },
  { peptide_name: "MOTS-c – 40 MG",       size_mg: 40,   list_price: 105.00, sale_price: null,  in_stock: true },
  { peptide_name: "Semaglutide – 10 MG",  size_mg: 10,   list_price: 45.00,  sale_price: null,  in_stock: true },
  { peptide_name: "BPC-157 – 10 MG",      size_mg: 10,   list_price: 48.75,  sale_price: null,  in_stock: true },
  { peptide_name: "IGF-1 LR3 – 1 MG",    size_mg: 1,    list_price: 45.00,  sale_price: null,  in_stock: true },
  { peptide_name: "NAD – 500 MG",         size_mg: 500,  list_price: 69.00,  sale_price: null,  in_stock: true },
  { peptide_name: "NAD – 1000 MG",        size_mg: 1000, list_price: 130.00, sale_price: 80.00, in_stock: true },
  { peptide_name: "GHK-Cu – 100 MG",      size_mg: 100,  list_price: 95.00,  sale_price: 85.00, in_stock: true },
  { peptide_name: "Cagrilintide – 10 MG", size_mg: 10,   list_price: 160.00, sale_price: 150.00, in_stock: true },
  { peptide_name: "Sermorelin – 10 MG",   size_mg: 10,   list_price: 160.00, sale_price: 110.00, in_stock: true },
  { peptide_name: "TB-500 – 10 MG",       size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "Selank – 10 MG",       size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "Semax – 10 MG",        size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "KPV – 10 MG",          size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "Kisspeptin – 10 MG",   size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "VIP – 10 MG",          size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "GHRP-2 – 5 MG",        size_mg: 5,    list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "GHRP-6 – 5 MG",        size_mg: 5,    list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "CJC-1295 – 2 MG",      size_mg: 2,    list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "Ipamorelin – 2 MG",    size_mg: 2,    list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "AOD-9604 – 5 MG",      size_mg: 5,    list_price: null,   sale_price: null,  in_stock: true },
  { peptide_name: "Melanotan-II – 10 MG", size_mg: 10,   list_price: null,   sale_price: null,  in_stock: true },
];

async function getVendorId(slug: string): Promise<string | null> {
  const { data } = await db.from("vendors").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

async function saveProducts(slug: string, products: ProductData[]): Promise<void> {
  const vendorId = await getVendorId(slug);
  if (!vendorId) {
    log(SCRIPT, `  ${slug}: not found in DB — run seed first`);
    return;
  }
  const now = new Date().toISOString();
  const rows = products
    .filter(p => p.list_price !== null || p.sale_price !== null)
    .map(p => ({ ...p, vendor_id: vendorId, last_checked: now }));

  await db.from("vendor_peptides").delete().eq("vendor_id", vendorId);
  const { error } = await db.from("vendor_peptides").insert(rows);
  if (error) {
    log(SCRIPT, `  ✗ ${slug}: ${error.message}`);
  } else {
    log(SCRIPT, `  ✓ ${slug}: ${rows.length} products saved`);
    await db.from("vendors").update({ total_products: rows.length }).eq("id", vendorId);
  }
}

async function main() {
  log(SCRIPT, "Seeding products for new accessible vendors…");

  // True Research Labs — WooCommerce API
  log(SCRIPT, "Fetching True Research Labs via WooCommerce API…");
  const trlProducts = await fetchWooCommerceProducts("https://trueresearchlabs.com", "true-research-labs");
  log(SCRIPT, `  true-research-labs: ${trlProducts.length} peptide products from API`);
  if (trlProducts.length > 0) await saveProducts("true-research-labs", trlProducts);

  // RUO Science — manually gathered (API returns incomplete catalog)
  log(SCRIPT, "Seeding RUO Science from gathered product list…");
  const ruoFiltered = RUO_SCIENCE_PRODUCTS.filter(p => p.list_price !== null);
  log(SCRIPT, `  ruo-science: ${ruoFiltered.length} products with pricing`);
  await saveProducts("ruo-science", ruoFiltered);

  // Licensed Peptides — gated, skip
  log(SCRIPT, "  licensed-peptides: gated — skipping (needs Puppeteer login scraper)");

  log(SCRIPT, "Done.");
}

main();
