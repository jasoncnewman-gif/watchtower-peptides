import { db } from './lib/client'

const GROUP2 = ['biotech-peptides','true-research-labs','crush-research','felix-chemical-supply','perfect-peptides','certified-pep','sports-technology-labs']

async function main() {
  const { data: vendors } = await db
    .from('vendors')
    .select('name, slug, website, coa_url, lab_testing_score, purity_accuracy_score, overall_score')
    .in('slug', GROUP2)

  const { data: trans } = await db
    .from('vendor_transparency')
    .select('vendor_id, has_lab_disclosure, has_batch_numbers, has_testing_methodology, notes')

  const { data: vendorIds } = await db
    .from('vendors')
    .select('id, slug')
    .in('slug', GROUP2)

  const idMap = Object.fromEntries((vendorIds ?? []).map(v => [v.slug, v.id]))
  const transMap = Object.fromEntries((trans ?? []).map(t => [t.vendor_id, t]))

  console.log('\nGroup 2 vendor COA details:\n')
  for (const v of vendors ?? []) {
    const vid = idMap[v.slug]
    const t = transMap[vid] ?? {}
    console.log(`${v.name}`)
    console.log(`  website:     ${v.website}`)
    console.log(`  coa_url:     ${v.coa_url ?? 'NOT SET'}`)
    console.log(`  LV=${v.lab_testing_score} PQ=${v.purity_accuracy_score} overall=${v.overall_score}`)
    console.log(`  lab_disclosure=${t.has_lab_disclosure} batch_numbers=${t.has_batch_numbers} methodology=${t.has_testing_methodology}`)
    console.log(`  notes: ${t.notes ?? 'none'}`)
    console.log()
  }
}

main()
