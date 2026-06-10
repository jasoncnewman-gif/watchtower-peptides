const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to BPC-157...');
  await page.goto('http://localhost:3000/peptides/bpc-157', { waitUntil: 'networkidle' });
  
  // Look for the Vendors tab
  const tabs = await page.locator('[role="tab"], button').allTextContents();
  console.log('Tabs found:', tabs.filter(t => t.trim().length > 0));
  
  // Click the Vendors tab
  const vendorsTab = page.locator('button', { hasText: 'Vendors' }).first();
  const tabExists = await vendorsTab.count();
  console.log('Vendors tab found:', tabExists);
  
  if (tabExists) {
    await vendorsTab.click();
    await page.waitForTimeout(1000);
    
    // Check for vendor rows
    const vendorLinks = await page.locator('a[href^="http"]').allInnerTexts();
    console.log('External links in page:', vendorLinks.slice(0, 10));
    
    // Get all links and their hrefs
    const links = await page.locator('a').evaluateAll(els => 
      els.map(el => ({ text: el.textContent?.trim(), href: el.href, target: el.target }))
         .filter(l => l.href && !l.href.includes('localhost'))
    );
    console.log('External href links:', JSON.stringify(links.slice(0, 15), null, 2));
    
    // Screenshot
    await page.screenshot({ path: '/tmp/vendors-tab.png', fullPage: false });
    console.log('Screenshot saved to /tmp/vendors-tab.png');
    
    // Get the vendors tab panel content
    const tabContent = await page.locator('[role="tabpanel"]').first().innerHTML().catch(() => 'no tabpanel');
    console.log('Tab panel HTML (first 2000 chars):', tabContent.slice(0, 2000));
  }
  
  await browser.close();
})().catch(console.error);
