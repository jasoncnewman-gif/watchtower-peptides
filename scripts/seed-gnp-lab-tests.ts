/**
 * Seeds lab_tests + vendor_transparency + verdict for GNP Peptides, from a
 * hand-verified sample of 8 COAs pulled directly from
 * gnppeptides.com/pages/certificates-of-analysis (2026-10-26).
 *
 * Verification performed per docs/coa-validation-framework.md Part 3/4:
 * - Lab is Freedom Diagnostics, already a known quantity in this DB (see
 *   docs/lab_registry.md: Franklin TN, CLIA #14D2263999, HPLC-UV + LC-MS/MS,
 *   not ISO 17025 -- used by other already-vetted vendors, e.g. Felix
 *   Chemical Supply). Not a new/unverifiable lab claim.
 * - All 8 COAs show real, distinct chromatograms (different retention times
 *   per compound), real mass-spec data (correct isotope/charge-state
 *   notation per compound, e.g. [M+2H]2+ for BPC-157 vs [M+3H+K]4+ for the
 *   larger GLP-3RT/Retatrutide), real distinct lot numbers (BRX-xxx series),
 *   and span real dates (April 6 - April 23, 2026), i.e. genuine batch
 *   progression over time, not a single templated dump.
 * - Vendor publicly discloses imperfect/pending results on its own COA page
 *   (Wolverine 98.76% under retest, GHK-Cu pending) rather than hiding them
 *   -- same honesty signal already credited to Chameleon Peptides.
 * - Ran the same trust-scanner calibration check used for the "what can you
 *   find" research pass: gnppeptides.com scores lower than an
 *   already-verified-real comparator (Chameleon Peptides) on a third-party
 *   scanner almost entirely due to domain age / review-volume, not a
 *   specific fraud finding.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-gnp-lab-tests.ts
 */
import { db } from './lib/client'

const SLUG   = 'gnp-peptides'
const SOURCE = 'gnp-coa-page-2026-10-26'
const BASE   = 'https://gnppeptides.com/wp-content/uploads/2026/04'

const TESTS = [
  { peptide_name: 'BPC-157',    lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.256, batch_number: 'BRX-BPC-02',
    test_date: '2026-04-08', coa_url: `${BASE}/GNP_BPC-157_10mg_2604060399_99.256-1.pdf` },
  { peptide_name: 'CJC-1295 DAC', lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.58, batch_number: 'BRX-CJC-DAC-02',
    test_date: '2026-04-22', coa_url: `${BASE}/GNP_CJC-1295-DAC_5mg_2604220134_99.58.pdf` },
  { peptide_name: 'Retatrutide', lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.968, batch_number: 'BRX-RT-02',
    test_date: '2026-04-08', coa_url: `${BASE}/GNP_GLP-3RT_10mg_2604060402_99.968-1.pdf`,
    container_desc: 'Listed on vendor site as "GLP-3RT" (house code); identity confirmed as Retatrutide via COA mass spec and retention time.' },
  { peptide_name: 'Epitalon',   lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.884, batch_number: 'BRX-EPI-02',
    test_date: '2026-04-08', coa_url: `${BASE}/GNP_Epithalon_50mg_2604060395_99.884-1.pdf` },
  { peptide_name: 'Ipamorelin', lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.826, batch_number: 'BRX-IPA-02',
    test_date: '2026-04-08', coa_url: `${BASE}/GNP_Ipamorelin_10mg_2604060403_99.826-1.pdf` },
  { peptide_name: 'MOTS-C',     lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.58, batch_number: 'BRX-MOT10-002',
    test_date: '2026-04-23', coa_url: `${BASE}/GNP_MOTS-C_10mg_2604220136_99.58.pdf` },
  { peptide_name: 'KPV',        lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.41, batch_number: 'BRX-KPV-002',
    test_date: '2026-04-23', coa_url: `${BASE}/GNP_KPV_10mg_2604220137_99.41.pdf` },
  { peptide_name: 'DSIP',       lab_name: 'Freedom Diagnostics', test_type: 'HPLC-UV/MS', purity_result: 99.64, batch_number: 'BRX-DSP-02',
    test_date: '2026-04-15', coa_url: `${BASE}/GNP_DSIP_5mg_2604140072_99.64.pdf` },
]

const VERDICT =
  "GNP Peptides is a real, well-documented new vendor (Trenton, NJ business address; ships from Florida) using Freedom Diagnostics, " +
  "a lab already verified elsewhere in this database, for third-party testing. Batch-specific COAs are published for the catalog with real " +
  "chromatograms, mass-spec identity confirmation, and distinct lot numbers per batch -- better sample-to-result traceability than many vendors " +
  "on this site. They also publicly disclose imperfect results rather than hiding them (a couple of products flagged as under retest or pending " +
  "on their own COA page at time of review). The main caveat is simply age: the domain is under a year old with little independent review history yet, " +
  "which is why some automated trust scanners flag it as \"new\" -- that's a volume-of-track-record issue, not a specific red flag we found in our own " +
  "review. No ownership/founder identity is disclosed. Ships only to the lower 48 US, flat $20 shipping, no international."

async function main() {
  const { data: vendor, error: ve } = await db.from('vendors').select('id').eq('slug', SLUG).single()
  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); process.exit(1) }

  await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)
  const { error: te } = await db.from('lab_tests').insert(
    TESTS.map(t => ({ ...t, vendor_id: vendor.id, verified: true, test_source: SOURCE }))
  )
  if (te) { console.error('lab_tests insert error:', te.message); process.exit(1) }

  const { error: trErr } = await db.from('vendor_transparency').upsert({
    vendor_id: vendor.id,
    has_contact_info: true,          // email (info@gnppeptides.com), no phone listed
    has_business_address: true,      // 400 Riverview Plaza, Suite 104, Trenton, NJ 08611
    has_ownership_disclosure: false, // no named owner/founder anywhere on site
    has_lab_disclosure: true,
    has_testing_methodology: true,   // HPLC-UV + LC-MS clearly named
    has_batch_numbers: true,         // real, distinct lot numbers per COA
    domain_years: null,
    fda_warning: false,
    fraud_flags: false,
    last_reviewed: new Date().toISOString().slice(0, 10),
    notes: 'Onboarded + COA-audited 2026-10-26. See lab_tests.test_source = gnp-coa-page-2026-10-26 for the verified sample. No phone number or named owner disclosed; domain is new (~8 months at review time) with limited independent review history.',
  }, { onConflict: 'vendor_id' })
  if (trErr) { console.error('vendor_transparency upsert error:', trErr.message); process.exit(1) }

  const { error: vErr } = await db.from('vendors').update({
    has_coa: true,
    coa_url: 'https://www.gnppeptides.com/pages/certificates-of-analysis',
    city: 'Trenton',
    state: 'NJ',
    shipping_flat_fee: 20,
    ships_internationally: false,
    verdict: VERDICT,
    coa_audit_status: 'complete',
    coa_audit_tier: 3,
    coa_audit_notes: '8 COAs hand-verified (Freedom Diagnostics, already-known lab) 2026-10-26. Real distinct lot numbers, chromatograms, and MS data per compound. Vendor self-discloses pending/under-retest results.',
    coa_audited_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString().slice(0, 10),
  }).eq('id', vendor.id)
  if (vErr) { console.error('vendors update error:', vErr.message); process.exit(1) }

  console.log(`Seeded ${TESTS.length} lab_tests rows for ${SLUG}.`)
  console.log('Updated vendor_transparency + vendors (has_coa, coa_audit_tier=3, verdict, last_reviewed).')
  console.log('Run `npm run compute:scores` next.')
}

main()
