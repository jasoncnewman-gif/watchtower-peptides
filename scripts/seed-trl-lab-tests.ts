/**
 * Seeds lab_tests for True Research Labs from Horizon Analytical purity PDFs.
 * 9 compounds scraped from product pages 2026-06-13. Method: UPLC/MS.
 * Missing: 5-amino-1mq, epitalon, follistatin, igf-1lr3, kpv, melanotan I/II, HCG (no purity COA found)
 */
import { db } from './lib/client'

const SLUG   = 'true-research-labs'
const LAB    = 'Horizon Analytical'
const SOURCE = 'trl-coa-pdfs-2026-06-13'

const RAW = [
  { name: 'AOD-9604',     purity: 99.65, date: '2026-05-19' },
  { name: 'BPC-157',      purity: 99.32, date: '2026-05-03' },
  { name: 'DSIP',         purity: 99.54, date: '2026-03-06' },
  { name: 'GHK-Cu',       purity: 99.58, date: '2026-05-12' },
  { name: 'L-Glutathione', purity: 99.25, date: '2026-03-06' },
  { name: 'Ipamorelin',   purity: 99.42, date: '2026-05-19' },
  { name: 'MOTS-c',       purity: 99.58, date: '2026-05-12' },
  { name: 'NAD+',         purity: 99.49, date: '2026-04-26' },
  { name: 'PT-141',       purity: 99.36, date: '2026-05-19' },
]

async function main() {
  const { data: vendor, error: ve } = await db
    .from('vendors')
    .select('id')
    .eq('slug', SLUG)
    .single()

  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); process.exit(1) }

  await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)

  const inserts = RAW.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.name,
    lab_name:      LAB,
    test_type:     'HPLC',
    purity_result: r.purity,
    test_date:     r.date,
    test_source:   SOURCE,
  }))

  const { error } = await db.from('lab_tests').insert(inserts)
  if (error) { console.error('Insert error:', error.message); process.exit(1) }

  const avg = RAW.reduce((s, r) => s + r.purity, 0) / RAW.length
  const min = Math.min(...RAW.map(r => r.purity))
  console.log(`Inserted ${inserts.length} rows for ${SLUG}`)
  console.log(`  Lab: ${LAB}`)
  console.log(`  Avg purity: ${avg.toFixed(2)}%  Min: ${min}%`)
  console.log(`\nRun \`npm run compute:scores\` to update scores.`)
}

main()
