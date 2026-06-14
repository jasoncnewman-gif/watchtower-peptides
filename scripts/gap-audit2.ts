import { db } from './lib/client'

async function main() {
  const { data, error } = await db
    .from('vendors')
    .select('name, slug, lab_testing_score, purity_accuracy_score, finnrick_tests_count, has_coa, overall_score')
    .in('status', ['active', 'flagged'])

  if (error) { console.error(error.message); process.exit(1) }

  const gaps = (data ?? [])
    .map(v => ({
      name: v.name,
      slug: v.slug,
      lv: v.lab_testing_score,
      pq: v.purity_accuracy_score,
      gap: v.lab_testing_score - v.purity_accuracy_score,
      finnrick: v.finnrick_tests_count ?? 0,
      has_coa: v.has_coa,
      overall: v.overall_score,
    }))
    .filter(v => v.gap > 15)
    .sort((a, b) => b.gap - a.gap)

  console.log(`\nVendors with LV - PQ gap > 15 (${gaps.length} total)\n`)
  console.log('Name                           LV  PQ  gap  finnrick  has_coa  overall')
  console.log('─'.repeat(75))
  for (const v of gaps) {
    console.log(
      `${v.name.padEnd(30)} ${String(v.lv).padStart(2)}  ${String(v.pq).padStart(2)}  ${String(v.gap).padStart(3)}  ${String(v.finnrick).padStart(8)}  ${String(v.has_coa).padEnd(7)}  ${v.overall}`
    )
  }

  // Group by root cause
  const finnrickNoPurity = gaps.filter(v => v.finnrick > 0 && v.pq === 0)
  const coaNoPurity      = gaps.filter(v => v.finnrick === 0 && v.has_coa && v.pq === 0)
  const partialPurity    = gaps.filter(v => v.pq > 0 && v.gap > 15)

  console.log(`\n=== Root Cause Groups ===`)
  console.log(`Finnrick tests counted but NO purity rows in lab_tests (${finnrickNoPurity.length}):`)
  finnrickNoPurity.forEach(v => console.log(`  ${v.name} — ${v.finnrick} Finnrick tests, PQ=0`))
  console.log(`COA confirmed but NO purity data entered (${coaNoPurity.length}):`)
  coaNoPurity.forEach(v => console.log(`  ${v.name}`))
  console.log(`Partial purity data (${partialPurity.length}):`)
  partialPurity.forEach(v => console.log(`  ${v.name} — LV=${v.lv} PQ=${v.pq}`))
}

main()
