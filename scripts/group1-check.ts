import { db } from './lib/client'
async function main() {
  const { data } = await db
    .from('vendors')
    .select('name, slug, overall_score, lab_testing_score, purity_accuracy_score')
    .gt('lab_testing_score', 30)
    .eq('purity_accuracy_score', 0)
    .in('status', ['active', 'flagged'])
  console.log('Vendors with LV>30 (likely Finnrick T4) but PQ=0:')
  for (const v of data ?? []) {
    console.log(` ${v.name} (${v.slug}) overall=${v.overall_score} LV=${v.lab_testing_score} PQ=${v.purity_accuracy_score}`)
  }
}
main()
