import { db } from "./lib/client.js"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
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

  // Find slugs not covered by a peptide profile, with 2+ vendors (i.e., real products)
  const gaps = [...bySlug.entries()]
    .filter(([slug, { vendors }]) => !existingSlugs.has(slug) && vendors.size >= 2)
    .sort((a, b) => b[1].vendors.size - a[1].vendors.size)

  console.log(`\nGaps: ${gaps.length} vendor slugs with 2+ vendors and no peptide profile\n`)
  for (const [slug, { vendors, names }] of gaps) {
    const nameList = [...names].slice(0, 2).join(' / ')
    console.log(`  ${String(vendors.size).padStart(2)}v  ${slug.padEnd(50)}  (${nameList})`)
  }
}

main()
