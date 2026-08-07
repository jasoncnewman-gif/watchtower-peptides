async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto("https://www.corepeptides.com/peptides/bpc-157/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => window.scrollBy(0, 3000));
  await new Promise(r => setTimeout(r, 2000));

  // Look for COA tabs, buttons, or images
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll("a, button, [role='tab'], .tab-title, li")]
      .filter(el => /coa|lab|certif|analys|purity|test/i.test(el.textContent ?? ""))
      .map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 60), href: (el as HTMLAnchorElement).href }))
  );
  console.log("COA tabs/links:", JSON.stringify(tabs, null, 2));

  const coaImgs = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map(img => (img as HTMLImageElement).src).filter(s => /coa|lab|cert|purity/i.test(s))
  );
  console.log("COA images:", coaImgs);

  const allImgs = await page.evaluate(() =>
    [...document.querySelectorAll("img[src]")].map(img => (img as HTMLImageElement).src)
  );
  console.log("All images:", allImgs);

  const text = await page.evaluate(() => document.body.innerText);
  const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
  console.log("Purity values:", purities);
  console.log("Page text (first 800):", text.slice(0, 800));

  await page.close();
  await browser.close();
}

main().catch(console.error);
