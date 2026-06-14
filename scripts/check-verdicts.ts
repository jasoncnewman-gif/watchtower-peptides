import { db } from './lib/client'

async function main() {
  const { data } = await db
    .from('vendors')
    .select('name, slug, overall_score, verdict')
    .in('slug', ['sports-technology-labs', 'biotech-peptides', 'crush-research'])

  for (const v of data ?? []) {
    console.log(`\n${v.name} (score: ${v.overall_score})`)
    console.log(v.verdict ?? '(no verdict)')
  }
}

main()
