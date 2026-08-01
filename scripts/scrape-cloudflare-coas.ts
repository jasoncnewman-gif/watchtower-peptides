/**
 * Scrapes COA pages for Cloudflare-protected vendors using real Chrome + stealth.
 * Targets: certified-pep.com/lab-testing/, perfectpeptides.com/coa
 */
import { addExtra } from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as fs from 'fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const WT_EMAIL    = 'info@watchtowerpeptides.com'
const WT_USERNAME = 'watchtower'
const WT_PASSWORD = 'jikHip-6dewje-xytgih'

const VENDORS = [
  { slug: 'certified-pep',   coaUrl: 'https://certified-pep.com/coas/',          loginUrl: 'https://certified-pep.com/my-account/', needs_login: true },
  { slug: 'perfect-peptides', coaUrl: 'https://perfectpeptides.com/coa',         loginUrl: 'https://perfectpeptides.com/my-account/', needs_login: true },
]

async function main() {
  const puppeteer = (await import('puppeteer-extra')).default
  puppeteer.use(StealthPlugin())

  const slugArg = process.argv[2]
  const targets = slugArg ? VENDORS.filter(v => v.slug === slugArg) : VENDORS

  const browser = await (puppeteer as any).launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  for (const vendor of targets) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

    console.log(`\n=== ${vendor.slug} ===`)

    if (vendor.needs_login) {
      await page.goto(vendor.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r => setTimeout(r, 2000))

      const hasUser = await page.$('#username')
      const hasEmail = await page.$('input[type="email"]')

      if (hasUser) {
        await page.type('#username', WT_USERNAME)
        await page.type('#password', WT_PASSWORD)
      } else if (hasEmail) {
        await page.type('input[type="email"]', WT_EMAIL)
        await page.type('#password', WT_PASSWORD)
      }

      const submitBtn = await page.$('[name="login"], button[type="submit"], input[type="submit"]')
      if (submitBtn) await submitBtn.click()
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {})
      console.log('Post-login URL:', page.url())
    }

    await page.goto(vendor.coaUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))

    const html = await page.content()
    fs.writeFileSync(`/tmp/${vendor.slug}-coa.html`, html)

    const text = await page.evaluate(() => document.body.innerText)
    fs.writeFileSync(`/tmp/${vendor.slug}-coa.txt`, text)

    // Find images with COA/purity data (batch-numbered filenames)
    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(s => s && (s.includes('.png') || s.includes('.jpg') || s.includes('.webp')) &&
                     !s.includes('logo') && !s.includes('icon') && !s.includes('banner'))
    ) as string[]

    // Find PDF links
    const pdfs = html.match(/href="([^"]+\.pdf)"/gi)?.map(m => m.replace(/href="|"/g, '')) ?? []

    // Find purity numbers directly in text
    const purities = [...text.matchAll(/(\d{2,3}\.\d{1,3})\s*%/g)].map(m => m[0])

    console.log(`COA URL: ${vendor.coaUrl}`)
    console.log(`Page title: ${await page.title()}`)
    console.log(`Images (${imgs.length}):`, imgs.slice(0, 5))
    console.log(`PDFs (${pdfs.length}):`, pdfs.slice(0, 5))
    console.log(`Purity numbers in text: ${purities.slice(0, 10).join(', ') || 'none'}`)
    console.log(`Text snippet:`, text.slice(0, 500))
    console.log(`Saved HTML → /tmp/${vendor.slug}-coa.html`)

    await page.close()
  }

  await browser.close()
}

main().catch(console.error)
