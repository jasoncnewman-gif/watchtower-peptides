async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  // Check homepage navigation
  await page.goto("https://www.corepeptides.com/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const navLinks = await page.evaluate(() =>
    [...document.querySelectorAll("nav a, header a, .menu a, .nav a")]
      .map(a => ({ text: (a as HTMLAnchorElement).textContent?.trim(), href: (a as HTMLAnchorElement).href }))
      .filter(l => l.text && l.href && !l.href.includes("#"))
  );
  console.log("Nav links:", JSON.stringify(navLinks, null, 2));

  const allLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map(a => (a as HTMLAnchorElement).href)
      .filter(h => h.includes("corepeptides") && !h.includes("#"))
  );
  const unique = [...new Set(allLinks)].slice(0, 30);
  console.log("All links on homepage:", unique);

  await page.close();
  await browser.close();
}

main().catch(console.error);
