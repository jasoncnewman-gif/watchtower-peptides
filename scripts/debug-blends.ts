import { db } from "./lib/client.js"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

const BLEND_KEYWORDS = ['glow', 'klow', 'wolverine', 'deadpool', 'diamond', 'nova', 'isoflow', 'run-bpc', 'repair-stack', 'health-stack']

async function main() {
  const { data } = await db.from('vendor_peptides').select('peptide_name, vendor_id, list_price, size_mg')
  const all = data ?? []

  for (const keyword of BLEND_KEYWORDS) {
    const matches = all.filter(r => generateSlug(r.peptide_name).includes(keyword))
    if (matches.length === 0) continue
    console.log(`\n── ${keyword.toUpperCase()} ────`)
    const seen = new Set<string>()
    for (const r of matches) {
      if (!seen.has(r.peptide_name)) {
        seen.add(r.peptide_name)
        console.log(`  "${r.peptide_name}"  (${r.size_mg ?? '?'}mg, $${r.list_price ?? '?'})`)
      }
    }
  }
}

main()
