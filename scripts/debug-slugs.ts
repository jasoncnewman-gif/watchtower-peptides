import { db } from "./lib/client.js"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function main() {
  const { data } = await db.from('vendor_peptides').select('peptide_name, vendor_id, size_mg, list_price')
  const all = data ?? []

  const matching = all.filter(r => generateSlug(r.peptide_name) === 'bpc-157')
  console.log('Rows matching slug "bpc-157":')
  console.log(JSON.stringify(matching, null, 2))

  const bySlug = new Map<string, Set<string>>()
  for (const r of all) {
    const s = generateSlug(r.peptide_name)
    if (!bySlug.has(s)) bySlug.set(s, new Set())
    bySlug.get(s)!.add(r.vendor_id)
  }
  console.log('\nBPC-related slugs and vendor counts:')
  for (const [slug, vids] of bySlug.entries()) {
    if (slug.includes('bpc')) console.log(`  ${slug}: ${vids.size} vendors`)
  }
}

main()
