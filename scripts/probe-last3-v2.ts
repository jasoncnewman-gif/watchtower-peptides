import { db } from "./lib/client.js";

async function main() {
  const puppeteer = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteer.default.use(StealthPlugin.default());
  const browser = await puppeteer.default.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  // ── 1. Biotech Peptides: login then find COAs ────────────────────────────
  {
    console.log("=== biotech-peptides: login flow ===");
    const page = await browser.newPage();
    // Login at WooCommerce my-account
    await page.goto("https://biotechpeptides.com/my-account/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const loginVisible = await page.evaluate(() => !!document.querySelector("#username, #email, input[name='username']"));
    console.log("  Login form visible:", loginVisible);
    
    if (loginVisible) {
      await page.evaluate(() => {
        const u = document.querySelector("#username, input[name='username']") as HTMLInputElement;
        const p = document.querySelector("#password, input[name='password']") as HTMLInputElement;
        if (u) u.value = "info@watchtowerpeptides.com";
        if (p) p.value = "jikHip-6dewje-xytgih";
      });
      await page.evaluate(() => {
        const btn = document.querySelector("button[type='submit'], input[type='submit']") as HTMLButtonElement;
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 4000));
      const url = page.url();
      console.log("  After login URL:", url);
    }

    // Navigate to product page for BPC-157
    await page.goto("https://biotechpeptides.com/product/bpc-157/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Look for tab/accordion that says "COA" or "Lab" or "Certificate"
    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll("a, button, [role='tab'], li")]
        .filter(el => /coa|lab|certif|analys|purity/i.test(el.textContent || ""))
        .map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 60), href: (el as HTMLAnchorElement).href }))
    );
    console.log("  COA tabs/buttons:", JSON.stringify(tabs));

    // Click any COA tab
    if (tabs.length > 0) {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll("a, button, [role='tab'], li")]
          .find(e => /coa|lab|certif|analys|purity/i.test(e.textContent || "")) as HTMLElement;
        if (el) el.click();
      });
      await new Promise(r => setTimeout(r, 3000));
    }

    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")].map(img => (img as HTMLImageElement).src).filter(s => s.length > 10)
    );
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map(a => (a as HTMLAnchorElement).href).filter(h => /pdf|coa|lab|cert/i.test(h))
    );
    const text = await page.evaluate(() => document.body.innerText.slice(0, 800));
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
    
    console.log("  Images:", imgs.slice(0, 5));
    console.log("  COA links:", links);
    console.log("  Purity values:", purities);
    console.log("  Page text sample:", text.slice(0, 400));
    await page.close();
  }

  // ── 2. Penguin Peptides: click a COA button and intercept ───────────────
  {
    console.log("\n=== penguin-peptides: click COA button ===");
    const page = await browser.newPage();
    
    // Intercept any navigation or new window
    const openedUrls: string[] = [];
    browser.on("targetcreated", t => openedUrls.push(t.url()));
    
    await page.goto("https://penguinpeptides.com/lab-results/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Click the "Certificates of Analysis (COAs)" tab
    await page.evaluate(() => {
      const tabBtn = document.querySelector("#e-n-tab-title-3908540241, [id*='tab-title']") as HTMLElement;
      if (tabBtn) tabBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Now click the first COA item 
    const firstItem = await page.evaluate(() => {
      const items = [...document.querySelectorAll("li, .e-n-accordion-item, [class*='accordion'], [class*='tab-content'] a, [class*='tab-content'] button")];
      const first = items.find(el => el.textContent?.includes("BPC 157") || el.textContent?.includes("GLP"));
      if (first) { (first as HTMLElement).click(); return first.textContent?.trim().slice(0, 60); }
      return null;
    });
    console.log("  Clicked:", firstItem);
    await new Promise(r => setTimeout(r, 3000));

    // Check what appeared
    const iframes = await page.evaluate(() =>
      [...document.querySelectorAll("iframe")].map(f => ({ src: (f as HTMLIFrameElement).src, id: f.id }))
    );
    const newImgs = await page.evaluate(() =>
      [...document.querySelectorAll("img[src*='pdf'], img[src*='coa'], img[src*='lab']")].map(i => (i as HTMLImageElement).src)
    );
    const allLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map(a => (a as HTMLAnchorElement).href).filter(h => /pdf|coa|lab|cert|result/i.test(h)).slice(0, 10)
    );
    const tabContent = await page.evaluate(() => {
      const content = document.querySelector(".e-n-tabs-content, [class*='tab-content'], [class*='accordion-content']");
      return content?.innerText?.slice(0, 500) ?? "";
    });
    
    console.log("  Iframes:", iframes);
    console.log("  COA imgs:", newImgs);
    console.log("  COA links:", allLinks);
    console.log("  Tab content:", tabContent);
    console.log("  Opened URLs:", openedUrls);
    await page.close();
  }

  // ── 3. Core Peptides: try different URLs ────────────────────────────────
  {
    console.log("\n=== core-peptides: URL discovery ===");
    const page = await browser.newPage();
    
    // Try shop page
    for (const url of ["https://www.corepeptides.com/shop/", "https://www.corepeptides.com/products/", "https://corepeptides.com/shop/"]) {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));
      const productLinks = await page.evaluate(() =>
        [...document.querySelectorAll("a[href]")]
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => h.includes("/product/") || h.includes("/shop/"))
          .slice(0, 5)
      );
      const text = await page.evaluate(() => document.body.innerText.slice(0, 200));
      console.log(`  ${url}: ${productLinks.length} product links, text: ${text.slice(0, 100)}`);
      if (productLinks.length > 0) {
        console.log("  Product links:", productLinks);
        // Visit first product
        await page.goto(productLinks[0], { waitUntil: "networkidle2", timeout: 20000 });
        await new Promise(r => setTimeout(r, 3000));
        const tabs = await page.evaluate(() =>
          [...document.querySelectorAll("a, button, [role='tab'], .tab-title")]
            .filter(el => /coa|lab|certif|analys|purity/i.test(el.textContent || ""))
            .map(el => ({ text: el.textContent?.trim().slice(0, 40), href: (el as HTMLAnchorElement).href }))
        );
        const purities = [...(await page.evaluate(() => document.body.innerText)).matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)].map(m => parseFloat(m[1])).filter(v => v >= 85 && v <= 100.5);
        console.log("  COA tabs:", tabs);
        console.log("  Purity values:", purities);
        break;
      }
    }
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
