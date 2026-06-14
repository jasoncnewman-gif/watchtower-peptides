import { db } from './lib/client'

async function main() {
  // 1. Vendors with LV - PQ gap > 15
  const { data: vendors, error } = await db
    .from('vendors')
    .select('name, slug, overall_score, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score, last_reviewed')
    .in('status', ['active', 'flagged'])

  if (error) { console.error(error.message); process.exit(1) }

  const gaps = (vendors ?? [])
    .map(v => ({ ...v, gap: v.lab_testing_score - v.purity_accuracy_score }))
    .filter(v => v.gap > 15)
    .sort((a, b) => b.gap - a.gap)

  console.log(`\n=== LV - PQ Gap > 15 pts (${gaps.length} vendors) ===\n`)
  for (const v of gaps) {
    console.log(`${v.name.padEnd(30)} LV=${v.lab_testing_score} PQ=${v.purity_accuracy_score} gap=${v.gap} overall=${v.overall_score}`)
  }

  // 2. For each, check lab_tests rows
  if (gaps.length === 0) { console.log('No vendors with gap > 15.'); return }

  const slugs = gaps.map(v => v.slug)
  const { data: vendorRows } = await db.from('vendors').select('id, slug').in('slug', slugs)
  const idMap = Object.fromEntries((vendorRows ?? []).map(v => [v.slug, v.id]))

  const vendorIds = Object.values(idMap)
  const { data: labTests } = await db
    .from('lab_tests')
    .select('vendor_id, peptide_name, purity_pct, test_date, source, lab_name')
    .in('vendor_id', vendorIds)

  console.log(`\n=== Lab Tests for gap vendors ===\n`)
  for (const v of gaps) {
    const vid = idMap[v.slug]
    const tests = (labTests ?? []).filter(t => t.vendor_id === vid)
    const hplcTests = tests.filter(t => t.purity_pct !== null && t.purity_pct > 0)
    const nullPurity = tests.filter(t => t.purity_pct === null || t.purity_pct === 0)
    console.log(`${v.name}:`)
    console.log(`  Total lab_tests rows: ${tests.length}`)
    console.log(`  With purity_pct data: ${hplcTests.length}`)
    console.log(`  Null/zero purity:     ${nullPurity.length}`)
    if (hplcTests.length > 0) {
      const avg = hplcTests.reduce((s, t) => s + (t.purity_pct ?? 0), 0) / hplcTests.length
      console.log(`  Avg purity:           ${avg.toFixed(2)}%`)
    }
    if (tests.length > 0) {
      const sources = [...new Set(tests.map(t => t.source).filter(Boolean))]
      const labs    = [...new Set(tests.map(t => t.lab_name).filter(Boolean))]
      console.log(`  Sources: ${sources.join(', ') || 'none'}`)
      console.log(`  Labs:    ${labs.join(', ') || 'none'}`)
    }
    console.log()
  }
}

main()
