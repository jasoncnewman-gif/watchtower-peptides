async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  // Navigate directly to the COA tab anchor
  await page.goto("https://www.corepeptides.com/peptides/bpc-157/#tab-certificate_of_analysis", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Click the COA tab
  await page.evaluate(() => {
    const link = document.querySelector("a[href*='certificate_of_analysis']") as HTMLElement;
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => window.scrollBy(0, 2000));
  await new Promise(r => setTimeout(r, 2000));

  // Find images that appeared in COA tab
  const tabContent = await page.evaluate(() => {
    const panel = document.querySelector("#tab-certificate_of_analysis, [id*='certificate'], [aria-labelledby*='certificate']");
    return panel ? {
      html: panel.innerHTML.slice(0, 2000),
      text: (panel as HTMLElement).innerText,
      imgs: [...panel.querySelectorAll("img")].map(img => (img as HTMLImageElement).src),
    } : null;
  });
  console.log("Tab content:", JSON.stringify(tabContent, null, 2));

  // Fallback: get all images on page
  const allImgs = await page.evaluate(() =>
    [...document.querySelectorAll("img[src]")]
      .map(img => (img as HTMLImageElement).src)
      .filter(s => !s.includes("svg") && !s.startsWith("data:"))
  );
  console.log("All images:", allImgs);

  const text = await page.evaluate(() => document.body.innerText);
  const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
  console.log("Purity values:", purities);

  await page.close();
  await browser.close();
}

main().catch(console.error);
