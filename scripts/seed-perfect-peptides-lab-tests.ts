import { db } from './lib/client'

const SOURCE = 'perfect-peptides-coa-images-2026-06-14'
const LAB = 'Chromate Analytical'

const ROWS = [
  { peptide_name: 'BPC-157',              purity_result: 99.294, test_date: '2026-04-08' },
  { peptide_name: 'Epitalon',             purity_result: 96.695, test_date: '2026-04-09' },
  { peptide_name: 'Retatrutide',          purity_result: 99.150, test_date: '2026-04-09' },
  { peptide_name: 'Tirzepatide',          purity_result: 99.833, test_date: '2026-04-09' },
  { peptide_name: 'CJC-1295/Ipamorelin', purity_result: 99.098, test_date: '2026-04-08' },
  { peptide_name: 'MOTS-C',              purity_result: 99.547, test_date: '2026-04-08' },
  { peptide_name: 'NAD+',               purity_result: 96.478, test_date: '2026-04-07' },
  { peptide_name: 'TB-500',             purity_result: 99.011, test_date: '2026-04-08' },
]

async function main() {
  const { data: vendor, error: ve } = await db
    .from('vendors').select('id, name').eq('slug', 'perfect-peptides').single()
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
