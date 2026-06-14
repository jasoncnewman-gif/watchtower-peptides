import { db } from './lib/client'

// Biotech Peptides and Crush Research were audited as T1 (no known 3rd-party lab)
// but transparency flags have has_lab_disclosure=true → compute-scores derives T3.
// Correct the flags so derived tier matches audit result.

async function main() {
  const { data: vendors } = await db
    .from('vendors')
    .select('id, name, slug, overall_score')
    .in('slug', ['biotech-peptides', 'crush-research'])

  for (const v of vendors ?? []) {
    const { error } = await db
      .from('vendor_transparency')
      .update({ has_lab_disclosure: false, has_batch_numbers: false, has_testing_methodology: false })
      .eq('vendor_id', v.id)

    if (error) { console.error(`${v.name}: ${error.message}`); continue }
    console.log(`Fixed: ${v.name} — has_lab_disclosure/batch_numbers/methodology → false (tier: 3→1)`)
    console.log(`  Score will drop from ${v.overall_score} → ~${v.overall_score - 20} after compute:scores`)
  }
  console.log('\nRun `npm run compute:scores` to apply.')
}

main()
