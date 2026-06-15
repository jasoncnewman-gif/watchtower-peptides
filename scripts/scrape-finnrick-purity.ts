/**
 * Scrapes purity test results from Finnrick vendor pages.
 * Extracts actual purity % from Finnrick's test result tables.
 * Seeds results into lab_tests as test_type='HPLC', lab_name='Finnrick'.
 */
import * as https from 'https'
import { db } from './lib/client'

const SOURCE = 'finnrick-2026-06-13'

const VENDORS = [
  { slug: 'nexaph',            finnrickSlug: 'nexaph' },
  { slug: 'nuscience-peptides', finnrickSlug: 'nuscience-peptides' },
  { slug: 'paramount-peptides', finnrickSlug: 'paramount-peptides' },
  { slug: 'pure-rawz',         finnrickSlug: 'pure-rawz' },
  { slug: 'loti-labs',         finnrickSlug: 'loti-labs' },
  { slug: 'verified-peptides', finnrickSlug: 'verified-peptides' },
  { slug: 'swiss-chems',       finnrickSlug: 'swiss-chems' },
]

function fetchUrl(url: string, depth = 0): Promise<string> {
  if (depth > 3) return Promise.reject(new Error('Too many redirects'))
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
        const loc = res.headers.location || ''
        const next = loc.startsWith('http') ? loc : `https://www.finnrick.com${loc}`
        resolve(fetchUrl(next, depth + 1))
        return
      }
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

interface TestRow {
  peptide: string
  purity: number
  date: string
}

function parseTestRows(html: string): TestRow[] {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  const tableStart = text.indexOf('Quantity Test Date Product')
  if (tableStart === -1) return []

  // End the table at the "About" section
  const aboutIdx = text.indexOf('About ', tableStart)
  const tableText = text.slice(tableStart, aboutIdx > tableStart ? aboutIdx : tableStart + 30000)

  const months: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' }

  // Split into rows by date pattern using matchAll (non-zero-width)
  const datePattern = /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s/g
  const dateMatches = [...tableText.matchAll(datePattern)]
  const rowBounds = dateMatches.map(m => m.index!)

  const rows: TestRow[] = []
  for (let i = 0; i < rowBounds.length; i++) {
    const chunk = tableText.slice(rowBounds[i], rowBounds[i + 1] ?? tableText.length)

    // Date
    const dp = chunk.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/)
    if (!dp) continue
    const date = `${dp[3]}-${months[dp[2]]}-${dp[1].padStart(2, '0')}`

    // Product name: text between date and "View"
    const afterDate = chunk.slice(dp[0].length).trim()
    const viewIdx = afterDate.indexOf(' View ')
    if (viewIdx === -1) continue
    const peptide = afterDate.slice(0, viewIdx).trim()

    // Purity: the XX.XX% that comes immediately after the ±deviation%
    // Format: "...+X.X % PURITY.XX % ..." or "...-X.X % PURITY.XX % ..."
    const purityM = chunk.match(/[+\-]\s*[\d.]+\s*%\s*([\d]{2,3}\.\d+)\s*%/)
    if (!purityM) continue
    const purity = parseFloat(purityM[1])

    rows.push({ peptide, purity, date })
  }

  return rows
}

async function main() {
  const dryRun = process.argv[2] === '--dry-run'

  for (const v of VENDORS) {
    console.log(`\n=== ${v.slug} ===`)

    const { data: vendor, error: ve } = await db
      .from('vendors')
      .select('id, name')
      .eq('slug', v.slug)
      .single()
    if (ve || !vendor) { console.log('  Vendor not found in DB'); continue }

    let html: string
    try {
      html = await fetchUrl(`https://www.finnrick.com/vendors/${v.finnrickSlug}`)
    } catch (e: any) {
      console.log(`  Fetch error: ${e.message}`)
      continue
    }

    const rows = parseTestRows(html)
    if (rows.length === 0) {
      console.log('  No test rows parsed — table structure may differ')
      // Fallback: dump purity numbers from page
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      const purities = [...text.matchAll(/(\d{2,3}\.\d+)\s*%/g)].map(m => m[1])
      console.log('  Raw purity values on page:', purities.slice(0, 20).join(', '))
      continue
    }

    console.log(`  Found ${rows.length} test rows`)
    const avg = rows.reduce((s, r) => s + r.purity, 0) / rows.length
    const min = Math.min(...rows.map(r => r.purity))
    const max = Math.max(...rows.map(r => r.purity))
    console.log(`  Avg purity: ${avg.toFixed(1)}%  Min: ${min}%  Max: ${max}%`)

    // Group by peptide for summary
    const byPeptide: Record<string, number[]> = {}
    for (const r of rows) {
      byPeptide[r.peptide] = byPeptide[r.peptide] ?? []
      byPeptide[r.peptide].push(r.purity)
    }
    for (const [p, vals] of Object.entries(byPeptide)) {
      const pavg = vals.reduce((a, b) => a + b, 0) / vals.length
      console.log(`    ${p}: ${vals.length} tests, avg ${pavg.toFixed(1)}% (${vals.join(', ')}%)`)
    }

    if (!dryRun) {
      // Remove prior rows from this source for this vendor
      await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)

      const inserts = rows.map(r => ({
        vendor_id:     vendor.id,
        peptide_name:  r.peptide,
        lab_name:      'Finnrick',
        test_type:     'HPLC',
        purity_result: r.purity,
        test_date:     r.date,
        test_source:   SOURCE,
      }))

      const { error } = await db.from('lab_tests').insert(inserts)
      if (error) { console.log(`  Insert error: ${error.message}`); continue }
      console.log(`  Inserted ${inserts.length} rows.`)
    } else {
      console.log('  [dry-run] Would insert', rows.length, 'rows')
    }
  }
}

main().catch(console.error)
