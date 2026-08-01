/**
 * Logs into certified-pep.com via the embedded cptrg login form on /coas/
 * (the form is in the page HTML directly — no /my-account/ redirect, no Turnstile)
 * then extracts COA purity data.
 * Credentials read from Supabase vendors table.
 */
import * as fs from 'fs'
import { db } from './lib/client'
import { loginOrRegister, getVendorAuth } from './lib/auth'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'https://certified-pep.com'

async function main() {
  // Load credentials from Supabase
  const auth = await getVendorAuth('certified-pep', db)
  if (!auth) { console.error('No credentials for certified-pep in Supabase'); return }

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

  // Load /coas/ — the cptrg login form is embedded here (no Turnstile)
  console.log('Loading /coas/ ...')
  await page.goto(`${BASE}/coas/`, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))
  console.log('URL:', page.url())

  const result = await loginOrRegister(page, auth)
  console.log('Auth result:', result)
  if (result === 'failed') {
    fs.writeFileSync('/tmp/cp-coas-auth-fail.html', await page.content())
    await browser.close()
    return
  }

  await new Promise(r => setTimeout(r, 3000))
  console.log('Post-login URL:', page.url())

  const postLoginText = await page.evaluate(() => document.body.innerText).catch(() => '')
  console.log('Post-login snippet:', postLoginText.slice(0, 500))

  const loggedIn = !postLoginText.includes('Sign in') && !postLoginText.includes('Email or Username')
  console.log('Login success?', loggedIn)

  // Save full HTML for inspection
  const html = await page.content()
  fs.writeFileSync('/tmp/certified-pep-coas-loggedin.html', html)

  if (!loggedIn) {
    console.log('Login failed — check /tmp/certified-pep-coas-loggedin.html')
    await browser.close()
    return
  }

  // Extract purity data from the COA library
  const coaText = await page.evaluate(() => document.body.innerText)
  fs.writeFileSync('/tmp/certified-pep-coas-loggedin.txt', coaText)

  const purities = [...coaText.matchAll(/(\d{2,3}\.\d+)\s*%/g)].map(m => m[0])
  const pdfs = [...html.matchAll(/href="([^"]+\.pdf)"/gi)].map(m => m[1])
  const imgs = [...html.matchAll(/href="([^"]+(?:\.jpg|\.png|\.webp))"\s[^>]*data-(?:title|view)/gi)].map(m => m[1])

  console.log('\n=== COA RESULTS ===')
  console.log('Purity numbers found:', purities.slice(0, 30).join(', ') || 'none')
  console.log('PDFs linked:', pdfs.slice(0, 10))
  console.log('Images linked:', imgs.slice(0, 10))
  console.log('Text snippet:', coaText.slice(0, 2000))

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
