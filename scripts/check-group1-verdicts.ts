import { db } from './lib/client'
async function main() {
  const slugs = ['nexaph','nuscience-peptides','paramount-peptides','pure-rawz','loti-labs','verified-peptides','swiss-chems']
  const { data } = await db.from('vendors').select('name, slug, overall_score, verdict').in('slug', slugs)
  for (const v of data ?? []) {
    console.log(`\n${v.name} (${v.overall_score}):\n${v.verdict ?? '(no verdict)'}`)
  }
}
main()
