import { db } from './lib/client'

const GROUP2 = ['biotech-peptides','true-research-labs','crush-research','felix-chemical-supply','perfect-peptides','certified-pep','sports-technology-labs']

async function main() {
  const { data: vendors } = await db
    .from('vendors')
    .select('id, name, slug, has_coa, coa_audit_tier, coa_audit_status, coa_audit_notes, lab_testing_score')
    .in('slug', GROUP2)

  const vendorIds = (vendors ?? []).map(v => v.id)

  const { data: trans } = await db
    .from('vendor_transparency')
    .select('vendor_id, has_lab_disclosure, has_batch_numbers, has_testing_methodology')
    .in('vendor_id', vendorIds)

  const transMap = Object.fromEntries((trans ?? []).map(t => [t.vendor_id, t]))

  // Derive what lvTier() would compute vs what audit says
  function derivedTier(v: { has_coa: boolean }, t: { has_lab_disclosure: boolean; has_batch_numbers: boolean; has_testing_methodology: boolean } | undefined): number {
    if (!v.has_coa) return 0
    if (t?.has_lab_disclosure && t?.has_batch_numbers) return 3
    if (t?.has_lab_disclosure) return 2
    return 1
  }

  console.log('\nGroup 2 tier audit:\n')
  console.log('Vendor                         audit_tier  derived_tier  LV  mismatch  audit_notes')
  console.log('─'.repeat(95))
  for (const v of vendors ?? []) {
    const t = transMap[v.id]
    const derived = derivedTier(v, t)
    const audit = v.coa_audit_tier ?? '?'
    const mismatch = audit !== '?' && Number(audit) !== derived ? '⚠ MISMATCH' : ''
    console.log(
      `${v.name.padEnd(30)} ${String(audit).padEnd(11)} ${String(derived).padEnd(13)} ${String(v.lab_testing_score).padEnd(4)} ${mismatch.padEnd(10)} ${v.coa_audit_notes ?? ''}`
    )
  }
}

main()
