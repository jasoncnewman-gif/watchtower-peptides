import { db } from './lib/client'

const SOURCE = 'certified-pep-coa-images-2026-06-14'
const LAB = 'Vanguard Laboratory'

const ROWS = [
  { peptide_name: 'BPC-157',      purity_result: 99.80, test_date: '2026-04-28' },
  { peptide_name: 'AOD-9604',     purity_result: 99.02, test_date: '2026-01-30' },
  { peptide_name: 'Epithalon',    purity_result: 99.45, test_date: '2026-04-09' },
  { peptide_name: 'DSIP',         purity_result: 98.15, test_date: '2026-06-01' },
  { peptide_name: 'KPV',          purity_result: 99.80, test_date: '2026-06-01' },
  { peptide_name: 'PT-141',       purity_result: 99.22, test_date: '2025-12-19' },
  { peptide_name: 'Ipamorelin',   purity_result: 99.34, test_date: '2025-12-19' },
  { peptide_name: 'CJC-1295',     purity_result: 99.33, test_date: '2026-04-27' },
  { peptide_name: 'Semaglutide',  purity_result: 99.80, test_date: '2026-06-02' },
  { peptide_name: 'Tirzepatide',  purity_result: 99.80, test_date: '2026-02-24' },
  { peptide_name: 'Retatrutide',  purity_result: 99.80, test_date: '2026-02-24' },
  { peptide_name: 'Sermorelin',   purity_result: 99.13, test_date: '2026-04-30' },
  { peptide_name: 'NAD+',         purity_result: 99.29, test_date: '2026-03-03' },
  { peptide_name: 'Melanotan II', purity_result: 99.18, test_date: '2026-05-08' },
  { peptide_name: 'MOTS-C',       purity_result: 99.12, test_date: '2026-05-23' },
]

async function main() {
  const { data: vendor, error: ve } = await db
    .from('vendors').select('id, name').eq('slug', 'certified-pep').single()
  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); return }
  console.log('Vendor:', vendor.name, vendor.id)

  await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)

  const inserts = ROWS.map(r => ({
    vendor_id:     vendor.id,
    peptide_name:  r.peptide_name,
    lab_name:      LAB,
    test_type:     'HPLC' as const,
    purity_result: r.purity_result,
    test_date:     r.test_date,
    test_source:   SOURCE,
  }))

  const { error } = await db.from('lab_tests').insert(inserts)
  if (error) { console.error('Insert error:', error.message); return }

  const avg = ROWS.reduce((s, r) => s + r.purity_result, 0) / ROWS.length
  console.log(`Inserted ${inserts.length} rows. Avg purity: ${avg.toFixed(2)}%`)
}

main().catch(console.error)
