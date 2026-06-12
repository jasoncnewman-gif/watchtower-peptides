import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "peptide-crafters").single();
  const vendorId = vendor!.id;

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1400, height: 900 });

  // Try the public lab-test-reports page first
  await page.goto("https://peptidecrafters.com/lab-test-reports/", { waitUntil: "networkidle2", timeout: 30000 });
  console.log("Lab reports URL:", page.url());
  const publicContent = await page.evaluate(() => document.body?.innerText?.slice(0, 3000) ?? "");
  console.log("Public page preview:\n", publicContent.slice(0, 1000));

  // Find PDFs/COA links on public page
  const publicLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a: any) => ({ text: a.innerText?.trim(), href: a.href }))
      .filter((l: any) => l.href.match(/\.(pdf|jpg|png|webp)/i) || l.href.includes("janoshik") || l.href.includes("lab"))
  );
  console.log(`Public COA links: ${publicLinks.length}`, JSON.stringify(publicLinks.slice(0, 5)));

  // Now try to login
  console.log("\nAttempting login...");
  await page.goto("https://peptidecrafters.com/login-register/", { waitUntil: "networkidle2", timeout: 30000 });
  console.log("Login page:", page.url());
  const loginHtml = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input")).map((i: any) => ({ name: i.name, type: i.type, id: i.id }));
    return JSON.stringify(inputs);
  });
  console.log("Login form inputs:", loginHtml);

  await browser.close();
}

main().catch(console.error);
