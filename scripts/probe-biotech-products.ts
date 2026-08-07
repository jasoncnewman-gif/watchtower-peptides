import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  
  // Login first
  await page.goto("https://biotechpeptides.com/my-account/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const u = document.querySelector("#username, input[name='username']") as HTMLInputElement;
    const p = document.querySelector("#password, input[name='password']") as HTMLInputElement;
    if (u) u.value = "info@watchtowerpeptides.com";
    if (p) p.value = "jikHip-6dewje-xytgih";
  });
  await page.evaluate(() => {
    const btn = document.querySelector("button[type='submit'], input[type='submit']") as HTMLButtonElement;
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log("Logged in, current URL:", page.url());

  // Get all products from shop
  await page.goto("https://biotechpeptides.com/buy-peptides/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  let productLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='/product/']")]
      .map(a => (a as HTMLAnchorElement).href)
      .filter((v, i, arr) => arr.indexOf(v) === i)
  );
  
  if (productLinks.length === 0) {
    // Try the shop page directly
    await page.goto("https://biotechpeptides.com/peptides/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    productLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href*='/product/']")]
        .map(a => (a as HTMLAnchorElement).href)
        .filter((v, i, arr) => arr.indexOf(v) === i)
    );
  }
  
  console.log(`Found ${productLinks.length} product links:`, productLinks);

  // Visit each product and collect COA image URLs
  const coaImages: { product: string; url: string; coaImg: string | null }[] = [];
  
  for (const link of productLinks.slice(0, 20)) {
    await page.goto(link, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const productName = await page.evaluate(() => document.querySelector("h1, .product_title")?.textContent?.trim() ?? "");
    const coaImg = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("img[src]")];
      const coa = imgs.find(img => (img as HTMLImageElement).src.toUpperCase().includes("COA"));
      return coa ? (coa as HTMLImageElement).src : null;
    });
    
    coaImages.push({ product: productName, url: link, coaImg });
    console.log(`  ${productName}: ${coaImg ?? "NO COA IMG"}`);
  }

  await browser.close();
}

main().catch(console.error);
