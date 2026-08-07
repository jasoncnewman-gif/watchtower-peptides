import { db } from "./lib/client.js";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    }).on("error", reject);
  });
}

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  
  // Login
  await page.goto("https://biotechpeptides.com/my-account/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const u = document.querySelector("#username, input[name='username']") as HTMLInputElement;
    const p = document.querySelector("#password, input[name='password']") as HTMLInputElement;
    if (u) u.value = "info@watchtowerpeptides.com";
    if (p) p.value = "jikHip-6dewje-xytgih";
  });
  await page.evaluate(() => { (document.querySelector("button[type='submit']") as HTMLButtonElement)?.click(); });
  await new Promise(r => setTimeout(r, 3000));

  // Get all products from buy-peptides page
  await page.goto("https://biotechpeptides.com/buy-peptides/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  const productLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='/product/']")]
      .map(a => (a as HTMLAnchorElement).href)
      .filter((v, i, arr) => arr.indexOf(v) === i)
  );

  // Visit remaining products (index 20+) and collect ALL COA URLs
  const coaMap: Record<string, string> = {
    // From previous run
    "Adipotide FTPP (10mg)": "https://biotechpeptides.com/wp-content/uploads/2020/03/Adipotide-FTPP-10mg-COA-2-scaled.webp",
    "AOD 9604 (5mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/AOD-9604-5mg-COA-scaled.webp",
    "ARA-290 (16mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/ARA-290-16mg-COA-scaled.webp",
    "B7-33 (6mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/B7-33-6mg-COA-scaled.webp",
    "BPC-157 (5mg & 10mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/BPC-157-5mg-COA-scaled.webp",
    "BPC-157 & TB-500 & GHK-Cu Blend (70mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/BPC-157-TB-500-GHK-Cu-70mg-COA-scaled.webp",
    "BPC-157 & TB-500 Blend (10mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/BPC-157-TB-500-Blend-10mg-COA-scaled.webp",
    "Cardiogen (20mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/Cardiogen-20mg-COA-scaled.webp",
    "Chonluten (T-34) (20mg)": "https://biotechpeptides.com/wp-content/uploads/2022/06/Chonluten-T-34-20mg-COA-1810x1800.webp",
    "CJC-1295 (Mod GRF 1-29) & Ipamorelin & GHRP-2 Blend (9mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/CJC-1295-Mod-GRF-1-29-Ipamorelin-GHRP-2-Blend-9mg-COA-scaled.webp",
    "CJC-1295 & GHRP-2 Blend (10mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/CJC-1295-GHRP-2-Blend-10mg-COA-scaled.webp",
    "CJC-1295 & GHRP-6 Blend (10mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/CJC-1295-GHRP-6-Blend-10mg-COA-scaled.webp",
    "CJC-1295 & Ipamorelin Blend (10mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/CJC-1295-Ipamorelin-Blend-10mg-COA-scaled.webp",
    "CJC-1295 DAC (5mg)": "https://biotechpeptides.com/wp-content/uploads/2026/04/CJC-1295-DAC-5mg-COA-scaled.webp",
    "DSIP (5mg)": "https://biotechpeptides.com/wp-content/uploads/2020/03/DSIP-5mg-COA-2-scaled.webp",
  };

  for (const link of productLinks.slice(20)) {
    await page.goto(link, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const productName = await page.evaluate(() => document.querySelector("h1, .product_title")?.textContent?.trim() ?? "");
    const coaImg = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("img[src]")];
      const coa = imgs.find(img => (img as HTMLImageElement).src.toUpperCase().includes("COA"));
      return coa ? (coa as HTMLImageElement).src : null;
    });
    if (coaImg) coaMap[productName] = coaImg;
    console.log(`  ${productName}: ${coaImg ?? "NO COA"}`);
  }

  await browser.close();

  // Download all COA images
  const tmpDir = "/tmp/biotech-coas";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  console.log("\n=== Downloading COA images ===");
  // Filter to single-compound products only (no blends for cleaner purity data)
  const singleCompound = Object.entries(coaMap).filter(([name]) => !name.includes("&") && !name.includes("Blend"));
  
  for (const [name, url] of singleCompound) {
    const filename = name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50) + ".webp";
    const dest = path.join(tmpDir, filename);
    try {
      await downloadFile(url, dest);
      console.log(`  ✓ ${name} → ${filename}`);
    } catch (e: any) {
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  }

  console.log(`\nDownloaded to ${tmpDir}`);
  console.log("Files:", fs.readdirSync(tmpDir).join(", "));
}

main().catch(console.error);
