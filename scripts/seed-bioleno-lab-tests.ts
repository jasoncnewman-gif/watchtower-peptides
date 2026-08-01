/**
 * Seeds lab_tests for Bioleno from BT Labs COA PDFs (bioleno.com/coa/).
 * 21 batches across 18 distinct peptides, all dated tested 2026-07-06.
 * Endotoxin not tested by BT Labs on any report -- recorded as 'n/a'.
 * See vendors.coa_audit_notes for the full lab-legitimacy audit (T2, flagged).
 */
import { db } from './lib/client'

const SLUG   = 'bioleno'
const LAB    = 'BT Labs'
const SOURCE = 'bioleno-coa-pdfs-2026-08-01'
const DATE   = '2026-07-06'

const RAW = [
  { name: 'BPC-157',              batch: 'BC10-202604-01',   purity: 99.7 },
  { name: 'CJC-1295 (no DAC)',    batch: 'CND10-202604-01',  purity: 99.7 },
  { name: 'MOTS-c',               batch: 'MS10-202605-02',   purity: 99.8 },
  { name: 'Melanotan I',          batch: 'MT1-202604-01',    purity: 99.8 },
  { name: 'Tirzepatide',          batch: 'TR10-202604-01',   purity: 99.6 },
  { name: 'Ipamorelin',           batch: 'IP10-202604-01',   purity: 99.8 },
  { name: 'NAD+',                 batch: 'NJ1000-202605-01', purity: 99.8 },
  { name: 'Epithalon',            batch: 'ET10-202604-01',   purity: 99.6 },
  { name: 'MOTS-c',               batch: 'MS10-202604-01',   purity: 99.8 },
  { name: 'Tesamorelin',          batch: 'TSM10-202604-01',  purity: 99.6 },
  { name: 'NAD+',                 batch: 'NJ3100-202604-01', purity: 99.8 },
  { name: 'TB-500',               batch: 'BT10-202604-01',   purity: 99.7 },
  { name: 'Sermorelin',           batch: 'SMO10-202604-01',  purity: 99.7 },
  { name: 'Semax',                batch: 'XA10-202604-01',   purity: 99.7 },
  { name: 'Selank',               batch: 'SK10-202604-01',   purity: 99.7 },
  { name: 'Melanotan II',         batch: 'ML10-202604-01',   purity: 99.8 },
  { name: 'Retatrutide',          batch: 'RT10-202604-01',   purity: 99.7 },
  { name: 'AOD-9604',             batch: '10AD-202604-01',   purity: 99.4 },
  { name: 'Retatrutide',          batch: 'RT10-202605-02',   purity: 99.7 },
  { name: 'GHK-Cu',               batch: 'CU100-202604-01',  purity: 99.7 },
  { name: 'Glutathione',          batch: 'GTT-202604-01',    purity: 99.8 },
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
    vendor_id:       vendor.id,
    peptide_name:    r.name,
    lab_name:        LAB,
    test_type:       'HPLC',
    purity_result:   r.purity,
    batch_number:    r.batch,
    test_date:       DATE,
    endotoxin_result: 'n/a',
    test_source:     SOURCE,
  }))

  const { error } = await db.from('lab_tests').insert(inserts)
  if (error) { console.error('Insert error:', error.message); process.exit(1) }

  await db.from('vendors').update({ coa_url: 'https://bioleno.com/coa/' }).eq('slug', SLUG)

  const avg = RAW.reduce((s, r) => s + r.purity, 0) / RAW.length
  const min = Math.min(...RAW.map(r => r.purity))
  const max = Math.max(...RAW.map(r => r.purity))
  console.log(`Inserted ${inserts.length} rows for ${SLUG}`)
  console.log(`  Lab: ${LAB}`)
  console.log(`  Purity range: ${min}%-${max}%  Avg: ${avg.toFixed(2)}%`)
  console.log(`\nRun \`npm run compute:scores\` to update scores.`)
}

main()
