import { db } from './lib/client'

const REVIEWED_DATE = '2026-06-13'

async function main() {
  const { data, error } = await db
    .from('vendors')
    .update({ last_reviewed: REVIEWED_DATE })
    .in('status', ['active', 'flagged'])
    .select('slug')

  if (error) { console.error('Error:', error.message); process.exit(1) }
  console.log(`Updated ${data?.length ?? 0} vendors → last_reviewed = ${REVIEWED_DATE}`)
  data?.forEach(v => console.log(' ', v.slug))
}

main()
