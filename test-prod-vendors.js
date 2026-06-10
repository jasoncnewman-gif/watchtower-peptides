const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing PRODUCTION: https://www.watchtowerpeptides.com/peptides/bpc-157');
  await page.goto('https://www.watchtowerpeptides.com/peptides/bpc-157', { waitUntil: 'networkidle', timeout: 30000 });
  
  const vendorsTab = page.locator('button', { hasText: 'Vendors' }).first();
  const tabExists = await vendorsTab.count();
  console.log('Vendors tab found:', tabExists);
  
  if (tabExists) {
    await vendorsTab.click();
    await page.waitForTimeout(2000);
    
    // Get all vendor rows
    const vendorLinks = await page.locator('a[href^="http"]').evaluateAll(els => 
      els.map(el => ({ text: el.textContent?.trim(), href: el.href, target: el.target }))
         .filter(l => !l.href.includes('watchtowerpeptides.com'))
    );
    console.log('External vendor links count:', vendorLinks.length);
    console.log('Links:', JSON.stringify(vendorLinks.slice(0, 5), null, 2));
    
    // Also dump raw tab panel HTML to see what's there
    const tabHTML = await page.evaluate(() => {
      // Find the visible tab panel
      const panels = document.querySelectorAll('[role="tabpanel"]');
      for (const p of panels) {
        if (p.textContent && p.textContent.length > 50) return p.innerHTML.slice(0, 3000);
      }
      // Fallback: find any element containing vendor-looking content
      return document.body.innerHTML.slice(0, 500);
    });
    console.log('Tab content HTML:', tabHTML.slice(0, 2000));
    
    await page.screenshot({ path: '/tmp/prod-vendors-tab.png' });
    console.log('Screenshot at /tmp/prod-vendors-tab.png');
  }
  
  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
