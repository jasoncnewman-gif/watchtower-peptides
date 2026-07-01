import type { Browser } from "puppeteer";
import { db } from "./lib/client.js";
import { sleep } from "./lib/scraper.js";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ORIGIN = "https://eliteresearchusa.com";

async function main() {
  const { data: v } = await db.from("vendors").select("login_email, login_password, login_username").eq("slug", "elite-research-usa").single();

  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
  puppeteer.default.use(StealthPlugin());

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.default.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

    await page.goto(`${ORIGIN}/login`, { waitUntil: "networkidle2", timeout: 20000 });
    await sleep(2000);

    // Print all input fields on the login page
    const inputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input")).map(i => ({
        type: i.type, name: i.name, id: i.id, placeholder: i.placeholder, autocomplete: i.autocomplete
      }))
    );
    console.log("Form inputs:", JSON.stringify(inputs, null, 2));

    // Print all buttons
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, input[type=submit]")).map(b => ({
        type: (b as HTMLButtonElement).type,
        name: (b as HTMLButtonElement).name,
        text: b.textContent?.trim().slice(0, 40)
      }))
    );
    console.log("Buttons:", JSON.stringify(buttons, null, 2));

    console.log("Page URL:", page.url());
    console.log("Page title:", await page.title());
  } finally {
    await browser?.close();
  }
}

main();
