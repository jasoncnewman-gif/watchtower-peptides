import { db } from './lib/client'

// Flip a single vendor's status by slug — e.g. to temporarily hide a vendor
// without deleting any of its data. All of the vendor's rows in lab_tests,
// vendor_peptides, vendor_transparency, score_history, etc. are left untouched;
// only vendors.status changes. Reverse it later by running this again with the
// original status.
//
// Effect of a non-"active" status (already wired throughout the app):
//   - dropped from /vendors, the homepage, /about counts, and sitemap.xml
//   - /vendors/<slug> returns 404
//   - excluded from compute:prices market averages and compute:scores
//   - (with the matching page.tsx fix) hidden from peptide profile Vendors tabs
//
// Usage:
//   npm run vendor:status -- --slug certified-pep --status inactive
//   npm run vendor:status -- --slug certified-pep --status active

const VALID = ['active', 'flagged', 'closed', 'inactive'] as const
type Status = (typeof VALID)[number]

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const slug = arg('slug')
  const status = arg('status') as Status | undefined

  if (!slug || !status || !VALID.includes(status)) {
    console.error(`Usage: npm run vendor:status -- --slug <slug> --status <${VALID.join('|')}>`)
    process.exit(1)
  }

  const { data: before, error: readErr } = await db
    .from('vendors')
    .select('slug, name, status, overall_score')
    .eq('slug', slug)
    .single()

  if (readErr || !before) {
    console.error(`No vendor found for slug "${slug}": ${readErr?.message ?? 'no row'}`)
    process.exit(1)
  }

  if (before.status === status) {
    console.log(`${before.name} is already "${status}" — nothing to do.`)
    return
  }

  const { error: writeErr } = await db
    .from('vendors')
    .update({ status })
    .eq('slug', slug)

  if (writeErr) {
    console.error(`Update failed: ${writeErr.message}`)
    process.exit(1)
  }

  console.log(`${before.name}: status "${before.status}" -> "${status}"`)
  console.log(`(overall_score ${before.overall_score ?? 'null'} and all vendor data left unchanged)`)
  console.log(`To restore: npm run vendor:status -- --slug ${slug} --status ${before.status}`)
}

main()
