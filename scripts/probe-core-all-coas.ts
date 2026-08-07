async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  // Get all product links from peptides page
  await page.goto("https://www.corepeptides.com/peptides/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to load all products
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 1000));
  }

  const productLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='/peptides/']")]
      .map(a => (a as HTMLAnchorElement).href)
      .filter(h => h.match(/\/peptides\/[a-z]/) && !h.includes("#"))
      .filter((v, i, arr) => arr.indexOf(v) === i)
  );
  console.log(`Found ${productLinks.length} products`);

  const coaMap: Record<string, string[]> = {};

  // Filter to single-compound products only
  const singleProducts = productLinks.filter(url => !url.match(/-blend-|-tb-500-|ghk-cu-blend/));
  console.log(`Visiting ${Math.min(singleProducts.length, 25)} single-compound products`);

  for (const link of singleProducts.slice(0, 25)) {
    const slug = link.replace(/\/$/, "").split("/").pop() ?? "";
    await page.goto(link + "#tab-certificate_of_analysis", { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click the COA tab
    await page.evaluate(() => {
      const tabLink = document.querySelector("a[href*='certificate_of_analysis']") as HTMLElement;
      if (tabLink) tabLink.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 1500));

    const coaImgs = await page.evaluate(() =>
      [...document.querySelectorAll("img[src*='COA'], img[src*='coa']")]
        .map(img => {
          // Extract original URL from CDN URL
          const src = (img as HTMLImageElement).src;
          const m = src.match(/www\.corepeptides\.com\/(.+)/);
          return m ? `https://www.corepeptides.com/${m[1]}` : src;
        })
    );

    const productName = await page.evaluate(() => document.querySelector("h1, .product_title")?.textContent?.trim() ?? "");
    
    if (coaImgs.length > 0) {
      coaMap[productName] = coaImgs;
      console.log(`  ✓ ${slug}: ${coaImgs.join(", ")}`);
    } else {
      console.log(`  ✗ ${slug}: no COA image`);
    }
  }

  console.log("\n=== COA Map ===");
  console.log(JSON.stringify(coaMap, null, 2));

  await browser.close();
}

main().catch(console.error);
