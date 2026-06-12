import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import * as path from "path";

puppeteerExtra.use(StealthPlugin());

async function main() {
  const browser = await puppeteerExtra.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  // The login wall IS the homepage - type into the age gate login form
  await page.goto("https://felixchem.is/felix-chemical-supply/", { waitUntil: "domcontentloaded", timeout: 30000 });
  const preLoginText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log("Homepage text:", preLoginText);

  // Check if login form is present
  const hasUsername = await page.$('#username');
  console.log("Has #username field:", !!hasUsername);

  if (hasUsername) {
    await page.type('#username', 'info@watchtowerpeptides.com');
    await page.type('#password', 'jikHip-6dewje-xytgih');
    await page.click('[name="login"]');
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  }

  const postUrl = page.url();
  const postText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log("Post-login URL:", postUrl);
  console.log("Post-login text:", postText);

  // Dump all links to find COA pages
  const html = await page.content();
  fs.writeFileSync("/tmp/felix-homepage.html", html);
  console.log("Saved homepage HTML to /tmp/felix-homepage.html");

  // Extract all href attributes
  const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map(m => m[1]).filter(h => h && !h.startsWith("javascript") && !h.startsWith("#"));
  const coaHrefs = hrefs.filter(h => h.toLowerCase().includes("coa"));
  console.log("All COA hrefs found:", coaHrefs.slice(0, 20));

  // Try navigating to product-category pages with coa
  if (coaHrefs.length > 0) {
    const target = coaHrefs.find(h => h.includes("bpc")) || coaHrefs[0];
    console.log("\nNavigating to:", target);
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
    const productPageUrl = page.url();
    const productHtml = await page.content();
    fs.writeFileSync("/tmp/felix-coa-page.html", productHtml);

    const imgs = Array.from(productHtml.matchAll(/src="([^"]+\.(png|jpg|webp|jpeg))"/gi)).map(m => m[1]).slice(0, 10);
    const pdfs = Array.from(productHtml.matchAll(/href="([^"]+\.pdf)"/gi)).map(m => m[1]).slice(0, 10);
    const text = await page.evaluate(() => document.body.innerText.slice(0, 2000));

    const labSigs = ["kovera", "vanguard", "janoshik", "freedom diagnostics", "mz biolabs", "chromate", "horizon", "colmaric", "acs lab", "lab"];
    const labsFound = labSigs.filter(s => productHtml.toLowerCase().includes(s));

    console.log("COA product page:", productPageUrl);
    console.log("Labs found:", labsFound);
    console.log("Images:", imgs);
    console.log("PDFs:", pdfs);
    console.log("Text:", text.slice(0, 800));
  }

  await browser.close();
}

main().catch(console.error);
