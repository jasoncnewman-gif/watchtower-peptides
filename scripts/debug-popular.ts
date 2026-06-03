import { db } from "./lib/client.js"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function main() {
  const { data } = await db.from('vendor_peptides').select('peptide_name, vendor_id')
  const all = data ?? []

  const bySlug = new Map<string, Set<string>>()
  for (const r of all) {
    const s = generateSlug(r.peptide_name)
    if (!bySlug.has(s)) bySlug.set(s, new Set())
    bySlug.get(s)!.add(r.vendor_id)
  }

  // Show slugs with 2+ vendors, sorted by vendor count
  const popular = [...bySlug.entries()]
    .filter(([, vids]) => vids.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 40)

  for (const [slug, vids] of popular) {
    console.log(`${String(vids.size).padStart(2)} vendors  ${slug}`)
  }
}

main()
