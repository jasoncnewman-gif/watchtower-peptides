/**
 * Seeds lab_tests for Felix Chemical Supply from Chromate Analytical COA images.
 * 7 compounds extracted visually from COA PNGs downloaded 2026-06-13.
 * Missing: ipamorelin, mots-c, nad+, melanotan-1, melanotan-2, 5-amino-1mq, tb-500 (images on pepbogo.is CDN)
 */
import { db } from './lib/client'

const SLUG   = 'felix-chemical-supply'
const LAB    = 'Chromate Analytical'
const SOURCE = 'felix-coa-images-2026-06-13'

const RAW = [
  { name: 'BPC-157',      purity: 99.144, date: '2025-08-22' },
  { name: 'GHK-Cu',       purity: 99.994, date: '2025-08-14' },
  { name: 'AOD-9604',     purity: 99.769, date: '2025-07-07' },
  { name: 'Epitalon',     purity: 97.716, date: '2025-06-13' },
  { name: 'DSIP',         purity: 98.298, date: '2025-08-25' },
  { name: 'KPV',          purity: 99.798, date: '2025-07-21' },
  { name: 'L-Glutathione', purity: 99.795, date: '2025-06-13' },
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
  console.log(`  Avg purity: ${avg.toFixed(3)}%  Min: ${min}%`)
  console.log(`\nRun \`npm run compute:scores\` to update scores.`)
}

main()
