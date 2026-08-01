/**
 * Scrapes Perfect Peptides COA page.
 * Credentials read from Supabase. Auto-registers if no account exists.
 */
import * as fs from 'fs'
import { db } from './lib/client'
import { loginOrRegister, getVendorAuth } from './lib/auth'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'https://perfectpeptides.com'

async function main() {
  const auth = await getVendorAuth('perfect-peptides', db)
  if (!auth) { console.error('No credentials for perfect-peptides in Supabase'); return }

  const puppeteer = (await import('puppeteer-extra')).default
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
  puppeteer.use(StealthPlugin())

  const browser = await (puppeteer as any).launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

  console.log('Loading /my-account/ ...')
  await page.goto(`${BASE}/my-account/`, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))

  const result = await loginOrRegister(page, auth)
  console.log('Auth result:', result)
  if (result === 'failed') {
    fs.writeFileSync('/tmp/pp-auth-fail.html', await page.content())
    await browser.close()
    return
  }

  console.log('\nNavigating to /coas/ ...')
  await page.goto(`${BASE}/coas/`, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))
  console.log('COA URL:', page.url())

  const coaText = await page.evaluate(() => document.body.innerText)
  const coaHtml = await page.content()
  fs.writeFileSync('/tmp/pp-coas.txt', coaText)
  fs.writeFileSync('/tmp/pp-coas.html', coaHtml)

  if (page.url().includes('my-account')) {
    console.log('Still redirected — auth failed')
    await browser.close()
    return
  }

  const imgUrls = [...coaHtml.matchAll(/(?:src|href|data-src|data-view)="(https?:\/\/perfectpeptides\.com\/wp-content\/uploads\/[^"]+\.(?:png|jpg|jpeg|pdf))"/gi)].map(m => m[1])
  const uniqueImgs = [...new Set(imgUrls)].filter(u => !u.match(/logo|icon|badge|thumb|avatar|32x32|180x180|192x/i))
  console.log('\nCOA images:', uniqueImgs.length)
  uniqueImgs.slice(0, 30).forEach(u => console.log(' ', u))
  console.log('\nPage snippet:', coaText.slice(0, 400))

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
