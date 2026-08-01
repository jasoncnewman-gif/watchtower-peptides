/**
 * Scrapes purity PDFs from True Research Labs product pages.
 * PDF URLs are in data-coa-list attrs on rcl-coa-view-btn--purity elements.
 * Downloads most recent purity PDF, extracts purity% via pdftotext.
 */
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import { execSync } from 'child_process'

const BASE = 'https://trueresearchlabs.com'
const TMP  = '/tmp/trl-coas'

// Product slugs that are single-peptide (not blends)
const PRODUCTS = [
  { slug: '5-amino-1mq',            name: '5-Amino-1MQ' },
  { slug: 'aod-9604',               name: 'AOD-9604' },
  { slug: 'bpc-157',                name: 'BPC-157' },
  { slug: 'dsip',                   name: 'DSIP' },
  { slug: 'epitalon',               name: 'Epitalon' },
  { slug: 'follistatin',            name: 'Follistatin 344' },
  { slug: 'ghk-cu',                 name: 'GHK-Cu' },
  { slug: 'glutathione',            name: 'Glutathione' },
  { slug: 'igf-1lr3',               name: 'IGF-1 LR3' },
  { slug: 'ipamorelin',             name: 'Ipamorelin' },
  { slug: 'kpv',                    name: 'KPV' },
  { slug: 'melanotan-1-afamelanotide', name: 'Melanotan I' },
  { slug: 'melanotan-2',            name: 'Melanotan II' },
  { slug: 'mots-c',                 name: 'MOTS-c' },
  { slug: 'nad',                    name: 'NAD+' },
  { slug: 'pt-141',                 name: 'PT-141' },
  { slug: 'hcg',                    name: 'HCG' },
]

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(fetchUrl(res.headers.location!))
        return
      }
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, res => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

function extractPurityFromText(text: string): number | null {
  const lines = text.split('\n')
  const purityIdx = lines.findIndex(l => l.trim() === 'Purity:')
  if (purityIdx === -1) return null
  // After 'Purity:' there are blank lines and a spec line (e.g. '>98%')
  // then more blank lines, then the result (e.g. '99.32%')
  // Find the first line after purityIdx that matches XX.XX% (not starting with >)
  for (let i = purityIdx + 1; i < Math.min(purityIdx + 10, lines.length); i++) {
    const m = lines[i].trim().match(/^([\d]{2,3}\.\d+)%$/)
    if (m) return parseFloat(m[1])
  }
  return null
}

function extractDateFromText(text: string): string | null {
  const m = text.match(/Analysis Conducted:\s*(\d{2}\/\d{2}\/\d{4})/)
  if (!m) return null
  const [mm, dd, yyyy] = m[1].split('/')
  return `${yyyy}-${mm}-${dd}`
}

function extractLotFromText(text: string): string | null {
  const m = text.match(/TRL-(\d+)/)
  return m ? `TRL-${m[1]}` : null
}

interface CoaEntry { url: string; lot: string; date: string }

function extractCoaList(html: string): CoaEntry[] {
  // Find data-coa-list on rcl-coa-view-btn--purity button
  const m = html.match(/rcl-coa-view-btn--purity[^>]*data-coa-list='([^']+)'/)
  if (!m) return []
  // Decode HTML entities
  const json = m[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
  try { return JSON.parse(json) } catch { return [] }
}

interface Result {
  name: string
  slug: string
  purity: number | null
  date: string | null
  lot: string | null
  pdf: string
}

async function main() {
  fs.mkdirSync(TMP, { recursive: true })

  const results: Result[] = []

  for (const product of PRODUCTS) {
    const url = `${BASE}/shop/${product.slug}/`
    console.log(`\nFetching ${product.slug}...`)

    let html: string
    try {
      html = await fetchUrl(url)
    } catch (e: any) {
      console.log(`  SKIP — fetch error: ${e.message}`)
      continue
    }

    const coaList = extractCoaList(html)
    if (coaList.length === 0) {
      console.log(`  SKIP — no purity COA list found`)
      continue
    }

    // Most recent is first
    const latest = coaList[0]
    console.log(`  Purity PDF: ${latest.url} (lot ${latest.lot}, ${latest.date})`)

    const pdfFile = `${TMP}/${product.slug}-purity.pdf`
    try {
      await downloadFile(latest.url, pdfFile)
    } catch (e: any) {
      console.log(`  SKIP — download failed: ${e.message}`)
      continue
    }

    let pdfText = ''
    try {
      pdfText = execSync(`pdftotext "${pdfFile}" -`, { encoding: 'utf8' })
    } catch {
      console.log(`  SKIP — pdftotext failed`)
      continue
    }

    const purity = extractPurityFromText(pdfText)
    const date   = extractDateFromText(pdfText)
    const lot    = extractLotFromText(pdfText)

    console.log(`  Purity: ${purity}%  Date: ${date}  Lot: ${lot}`)
    results.push({ name: product.name, slug: product.slug, purity, date, lot, pdf: latest.url })
  }

  console.log('\n\n=== RESULTS ===')
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)
