/**
 * Seeds lab_tests for Sports Technology Labs from their public COA page.
 * Source: https://sportstechnologylabs.com/coas/ — 19 peptide entries, MZ Biolabs.
 * Scraped 2026-06-13. Purity visible in page HTML; no batch numbers in page text.
 */
import { db } from './lib/client'

const SLUG = 'sports-technology-labs'
const LAB  = 'MZ Biolabs'
const SOURCE = 'stl-coa-page-2026-06-13'

// MM/DD/YY or MM/DD/YYYY → YYYY-MM-DD
function parseDate(s: string): string {
  const [m, d, y] = s.split('/')
  const year = y.length === 2 ? (parseInt(y) >= 50 ? '19' : '20') + y : y
  return `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const RAW = [
  { name: 'AOD-9604',                        date: '05/14/26', purity: 99.02 },
  { name: 'BPC-157',                          date: '07/03/25', purity: 99.85 },
  { name: 'CJC-1295 with DAC',               date: '07/03/25', purity: 98.96 },
  { name: 'Delta Sleep-Inducing Peptide',    date: '10/17/25', purity: 90.20 }, // DSIP — below 95%, expected
  { name: 'Epitalon',                         date: '07/15/25', purity: 95.32 },
  { name: 'GHK-Cu',                           date: '04/24/26', purity: 99.97 },
  { name: 'GHRP-6',                           date: '10/17/25', purity: 99.90 },
  { name: 'IGF-1 LR3',                        date: '07/08/25', purity: 97.42 },
  { name: 'Ipamorelin',                       date: '03/31/25', purity: 99.74 },
  { name: 'Kisspeptin-10',                    date: '10/17/25', purity: 99.30 },
  { name: 'KPV',                              date: '01/31/25', purity: 100.00 },
  { name: 'Melanotan II',                     date: '10/17/25', purity: 97.21 },
  { name: 'MOTS-c',                           date: '10/17/25', purity: 99.50 },
  { name: 'NAD+',                             date: '04/30/26', purity: 99.30 },
  { name: 'PEG MGF',                          date: '10/29/25', purity: 99.50 },
  { name: 'PT-141',                           date: '10/17/25', purity: 99.90 },
  { name: 'Selank',                           date: '10/17/25', purity: 96.80 },
  { name: 'Sermorelin',                       date: '05/15/26', purity: 99.17 },
  { name: 'TB-500',                           date: '03/27/25', purity: 99.42 },
]

async function main() {
  const { data: vendor, error: ve } = await db
    .from('vendors')
    .select('id')
    .eq('slug', SLUG)
    .single()

  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); process.exit(1) }

  // Clear previous rows from this source
  await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)

  const inserts = RAW.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.name,
    lab_name:      LAB,
    test_type:     'HPLC',
    purity_result: r.purity,
    test_date:     parseDate(r.date),
    test_source:   SOURCE,
  }))

  const { error } = await db.from('lab_tests').insert(inserts)
  if (error) { console.error('Insert error:', error.message); process.exit(1) }

  const avg = RAW.reduce((s, r) => s + r.purity, 0) / RAW.length
  const min = Math.min(...RAW.map(r => r.purity))
  console.log(`Inserted ${inserts.length} rows for ${SLUG}`)
  console.log(`  Lab: ${LAB}`)
  console.log(`  Avg purity: ${avg.toFixed(2)}%  Min: ${min}%`)
  console.log(`  DSIP at 90.2% will trigger quality warning — expected`)
  console.log(`\nRun \`npm run compute:scores\` to update scores.`)
}

main()
