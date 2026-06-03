import { db } from "./lib/client.js"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function stripSizeSuffix(slug: string): string {
  return slug
    .replace(/-8211-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '')
    .replace(/-8211$/, '')
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)-\d+-vials?(kit)?$/, '')
    .replace(/-\d+-vials?(kit)?$/, '')
    .replace(/-\d+(\.\d+)?(mg|mcg|g|iu|ml)$/, '')
    .replace(/-\d+(x\d+)?(ct|caps?|tabs?|tablets?)$/, '')
    .replace(/-peptide$/, '')
    .replace(/^receptor-grade-/, '')
}

async function main() {
  const [{ data: vpRows }, { data: peptideRows }] = await Promise.all([
    db.from('vendor_peptides').select('peptide_name, vendor_id'),
    db.from('peptides').select('slug, name'),
  ])

  const existingSlugs = new Set((peptideRows ?? []).map(p => p.slug))

  // Count unique vendors per slug
  const bySlug = new Map<string, { vendors: Set<string>; names: Set<string> }>()
  for (const r of vpRows ?? []) {
    const slug = generateSlug(r.peptide_name)
    if (!bySlug.has(slug)) bySlug.set(slug, { vendors: new Set(), names: new Set() })
    bySlug.get(slug)!.vendors.add(r.vendor_id)
    bySlug.get(slug)!.names.add(r.peptide_name)
  }

  // Find slugs not covered by a profile (exact OR size-stripped), with 2+ vendors
  const gaps = [...bySlug.entries()]
    .filter(([slug, { vendors }]) => {
      if (vendors.size < 2) return false
      if (existingSlugs.has(slug)) return false
      if (existingSlugs.has(stripSizeSuffix(slug))) return false
      return true
    })
    .sort((a, b) => b[1].vendors.size - a[1].vendors.size)

  console.log(`\nGaps: ${gaps.length} vendor slugs with 2+ vendors and no peptide profile\n`)
  for (const [slug, { vendors, names }] of gaps) {
    const nameList = [...names].slice(0, 2).join(' / ')
    console.log(`  ${String(vendors.size).padStart(2)}v  ${slug.padEnd(50)}  (${nameList})`)
  }
}

main()
