/**
 * scripts/login-nextgenpeps.ts
 * Logs in to nextgenpeps.com via its email one-time-code flow (no password)
 * and saves the resulting session cookies for scrape-gated-vendors.ts to reuse.
 *
 * Run: npm run login:nextgenpeps
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { log } from "./lib/scraper.js";

config({ path: resolve(process.cwd(), ".env.local") });

const SCRIPT = "login-nextgenpeps";
const EMAIL = process.env.WATCHTOWER_MAIL_USER ?? "info@watchtowerpeptides.com";
const SESSION_FILE = "scripts/.sessions/nextgen-peps-cookies.json";

async function main() {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());

  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    executablePath: chromePath,
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  log(SCRIPT, "Navigating to /login");
  await page.goto("https://nextgenpeps.com/login", { waitUntil: "networkidle2", timeout: 20000 });

  await page.waitForSelector("#account-login-email", { timeout: 10000 });
  await page.evaluate((email: string) => {
    const el = document.querySelector("#account-login-email") as HTMLInputElement;
    el.value = email;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, EMAIL);

  mkdirSync("scripts/.sessions", { recursive: true });

  function clickEmailCodeButton(): Promise<boolean> {
    return page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) =>
        b.textContent?.includes("Email me a code") || b.textContent?.trim() === "Resend"
      ) as HTMLButtonElement | undefined;
      if (btn) { btn.disabled = false; btn.click(); return true; }
      return false;
    });
  }

  // The site rate-limits how often a code can be (re)sent per email address,
  // independent of this script's own session — a click can silently not send
  // a new email. fetch-otp.py only accepts an email newer than requestedAt
  // (older codes get invalidated server-side once a newer one is issued), so
  // a timeout here means the click was rate-limited, not that mail is slow —
  // wait out the cooldown and click resend again, up to 3 total attempts.
  let code: string | undefined;
  for (let attempt = 1; attempt <= 3 && !code; attempt++) {
    const requestedAt = Date.now() / 1000;
    const clicked = await clickEmailCodeButton();
    log(SCRIPT, `Attempt ${attempt}: clicked code button: ${clicked}`);
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});

    log(SCRIPT, "Polling mailbox for verification code…");
    try {
      code = execFileSync(
        "python3",
        [
          "scripts/lib/fetch-otp.py",
          process.env.WATCHTOWER_MAIL_HOST ?? "host2111.hostmonster.com",
          EMAIL,
          process.env.WATCHTOWER_MAIL_PASSWORD ?? "",
          "nextgenpeps",
          String(requestedAt),
          "75",
        ],
        { encoding: "utf8" }
      ).trim();
    } catch {
      log(SCRIPT, `Attempt ${attempt}: no new code email — likely resend cooldown, waiting it out`);
      await new Promise((r) => setTimeout(r, 65000));
    }
  }
  if (!code) throw new Error("Never received a verification code after 3 attempts");
  log(SCRIPT, `Got code: ${code}`);

  await page.waitForSelector('input[name], input[type="text"]', { timeout: 10000 });
  await page.evaluate((c: string) => {
    const inputs = Array.from(document.querySelectorAll("input"));
    const el = inputs.find((i) => i.type === "text" || i.type === "tel" || i.type === "number") as HTMLInputElement | undefined;
    if (!el) throw new Error("No code input found");
    el.value = c;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, code);

  const verifyClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.includes("Verify and sign in")) as HTMLButtonElement | undefined;
    if (btn) { btn.disabled = false; btn.click(); return true; }
    return false;
  });
  log(SCRIPT, `Clicked "Verify and sign in": ${verifyClicked}`);

  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});

  const html = await page.content();
  writeFileSync("scripts/.sessions/_debug-after-verify.html", html);
  await page.screenshot({ path: "scripts/.sessions/_debug-after-verify.png" as any });

  const cookies = await page.cookies();
  writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
  log(SCRIPT, `Saved ${cookies.length} cookies to ${SESSION_FILE}`);
  log(SCRIPT, `Current URL: ${page.url()}`);

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
