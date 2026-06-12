import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";

puppeteerExtra.use(StealthPlugin());

async function main() {
  const browser = await puppeteerExtra.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  // Login
  await page.goto("https://felixchem.is/felix-chemical-supply/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.type('#username', 'info@watchtowerpeptides.com');
  await page.type('#password', 'jikHip-6dewje-xytgih');
  await page.click('[name="login"]');
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  console.log("Post-login:", page.url());

  // Go to BPC-157 COA page with domcontentloaded (not networkidle2 to avoid timeout)
  await page.goto("https://felixchem.is/coas-bpc-157/", { waitUntil: "domcontentloaded", timeout: 30000 });
  console.log("COA page:", page.url());

  const outDir = "/tmp/coa-forensics/felix-chemical-supply";
  fs.mkdirSync(outDir, { recursive: true });

  // Screenshot what loaded
  await page.screenshot({ path: `${outDir}/bpc-coa-page.png`, fullPage: false });
  console.log("Screenshot saved");

  // Get page text and check for lab names
  const bodyText = await page.evaluate(() => document.body.innerText);
  const labSigs = ["chromate", "horizon", "vanguard", "freedom", "kovera", "mz biolabs", "colmaric", "acs lab", "third-party", "tested by", "certificate"];
  const found = labSigs.filter(s => bodyText.toLowerCase().includes(s));
  console.log("Lab signals in body text:", found);
  console.log("Body text snippet:", bodyText.slice(0, 500));
  fs.writeFileSync(`${outDir}/bpc-coa-text.txt`, bodyText);

  // Now download an actual COA image via authenticated cookie
  // Use page.goto on the image URL so we use the session
  const imgTargetPage = await browser.newPage();
  const imageUrl = "https://felixchem.is/wp-content/uploads/2026/02/81825-BPC-1-789x1024.png";
  const imgResponse = await imgTargetPage.goto(imageUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

  if (imgResponse) {
    const contentType = imgResponse.headers()["content-type"] || "";
    console.log("Image response content-type:", contentType);
    if (contentType.includes("image")) {
      const imgBuffer = await imgResponse.buffer();
      fs.writeFileSync(`${outDir}/bpc157-coa.png`, imgBuffer);
      console.log("COA image saved:", imgBuffer.length, "bytes");
    } else {
      await imgTargetPage.screenshot({ path: `${outDir}/img-response.png` });
      console.log("Non-image response, saved screenshot");
    }
  }

  await imgTargetPage.close();
  await browser.close();
}

main().catch(console.error);
