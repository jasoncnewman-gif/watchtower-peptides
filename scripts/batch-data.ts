import { db } from './lib/client'

const slugs = ['ghk-cu', 'semaglutide', 'cjc-1295', 'pt-141', 'sermorelin', 'tesamorelin']

// Keyword patterns for each slug (for ilike matching on peptide_name)
const patterns: Record<string, string> = {
  'ghk-cu':      'ghk',
  'semaglutide': 'semaglut',
  'cjc-1295':    'cjc',
  'pt-141':      'pt-141',
  'sermorelin':  'sermorelin',
  'tesamorelin': 'tesamorelin',
}

async function main() {
  // Pull peptide profiles
  const { data: peptides, error: pe } = await db
    .from('peptides')
    .select('slug,name,research_status,studies,mechanism,overview,research_applications,dosage,safety_profile')
    .in('slug', slugs)
  if (pe) { console.error('peptides error:', pe); process.exit(1) }

  for (const p of (peptides ?? [])) {
    console.log('\n========================================')
    console.log(`PEPTIDE: ${p.slug}  |  research_status: ${p.research_status}`)
    console.log('overview:', (p.overview ?? '').slice(0, 300))
    const studies = (p.studies as any[]) ?? []
    console.log('studies:', JSON.stringify(studies.map((s: any) => ({ pmid: s.pmid, title: (s.title ?? '').slice(0, 70) })), null, 2))
    const mech = (p.mechanism as any[]) ?? []
    console.log('mechanism titles:', mech.map((m: any) => m.title))
    const apps = (p.research_applications as any[]) ?? []
    console.log('research_applications:', apps.map((a: any) => `${a.area} [${a.evidence}]`))
  }

  // Pull vendor pricing per slug via ilike
  console.log('\n\n========== VENDOR PRICING ==========')
  for (const slug of slugs) {
    const pattern = patterns[slug]
    const { data, error } = await db
      .from('vendor_peptides')
      .select('peptide_name,list_price,sale_price,size_mg,in_stock,vendors(name,overall_score,slug)')
      .ilike('peptide_name', `%${pattern}%`)
      .order('list_price')

    if (error) { console.log(`  ${slug}: error — ${error.message}`); continue }

    console.log(`\n--- ${slug} (pattern: %${pattern}%) ---`)
    for (const r of (data ?? [])) {
      const v = r.vendors as any
      const active = r.sale_price ?? r.list_price
      const ppm = r.size_mg && active ? (active / r.size_mg).toFixed(2) : 'n/a'
      console.log(`  ${(v?.name ?? 'unknown').padEnd(30)} score:${String(v?.overall_score ?? '?').padEnd(4)} | ${String(r.size_mg ?? '?').padEnd(8)}mg | $${String(active ?? '?').padEnd(8)} | $${ppm}/mg | stock:${r.in_stock} | "${r.peptide_name}"`)
    }
  }
}

main()
