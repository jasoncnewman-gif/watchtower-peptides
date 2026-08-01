/**
 * Logs into felixchem.is, visits each known per-peptide COA page,
 * collects image URLs, and downloads the most recent COA image for each.
 * Saves to /tmp/felix-coas/<slug>/<filename>.png
 */
import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'

puppeteerExtra.use(StealthPlugin())

const BASE = 'https://felixchem.is'
const OUT  = '/tmp/felix-coas'

// Per-peptide COA pages from homepage scrape
const COA_PAGES: { slug: string; path: string }[] = [
  { slug: 'bpc-157',        path: '/coas-bpc-157/' },
  { slug: 'ipamorelin',     path: '/coas-ipamorelin/' },
  { slug: 'ghk-cu',         path: '/coas-ghk-cu/' },
  { slug: 'tb-500',         path: '/coas-bpctb-blend/' },
  { slug: 'epitalon',       path: '/coas-epitalon/' },
  { slug: 'mots-c',         path: '/coas-mots-c/' },
  { slug: 'nad',            path: '/coas-nad/' },
  { slug: 'dsip',           path: '/coas-dsip/' },
  { slug: 'kpv',            path: '/coas-kpv/' },
  { slug: 'melanotan-1',    path: '/coas-melanotan-1/' },
  { slug: 'melanotan-2',    path: '/coas-melanotan-2/' },
  { slug: 'aod-9604',       path: '/coas-aod-9604/' },
  { slug: 'glutathione',    path: '/coas-glutathione/' },
  { slug: '5-amino-1mq',   path: '/coas-5-amino-1mq/' },
]

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')

  // Login
  await page.goto(`${BASE}/felix-chemical-supply/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.type('#username', 'info@watchtowerpeptides.com')
  await page.type('#password', 'jikHip-6dewje-xytgih')
  await page.click('[name="login"]')
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {})
  console.log('Logged in. URL:', page.url())

  const results: { slug: string; images: string[] }[] = []

  for (const { slug, path: coaPath } of COA_PAGES) {
    await page.goto(`${BASE}${coaPath}`, { waitUntil: 'domcontentloaded', timeout: 20000 })

    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src && !src.includes('Logo') && !src.includes('logo') &&
                       !src.includes('icon') && !src.includes('banner') &&
                       (src.includes('.png') || src.includes('.jpg') || src.includes('.webp')))
        .filter(src => /\d{4,}/.test(src)) // batch numbers appear in filenames
    ) as string[]

    results.push({ slug, images: imgs })
    console.log(`${slug}: ${imgs.length} COA images`)

    // Download the most recent (usually first) image
    if (imgs.length > 0) {
      const dir = path.join(OUT, slug)
      fs.mkdirSync(dir, { recursive: true })
      const imgUrl = imgs[0]
      const filename = path.basename(imgUrl.split('?')[0])
      const dest = path.join(dir, filename)
      try {
        await downloadFile(imgUrl, dest)
        console.log(`  Downloaded: ${filename}`)
      } catch (e: any) {
        console.log(`  Download failed: ${e.message}`)
      }
    }
  }

  await browser.close()
  console.log('\nDone. Images at /tmp/felix-coas/')
  console.log(JSON.stringify(results.map(r => ({ slug: r.slug, count: r.images.length, latest: r.images[0] })), null, 2))
}

main().catch(console.error)
