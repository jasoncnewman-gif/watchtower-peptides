/**
 * Seeds lab_tests + vendor_transparency + verdict for Chameleon Peptides,
 * from a hand-verified sample of 8 COAs pulled directly from
 * chameleonpeptides.com/testing/ (2026-09-14).
 *
 * Verification performed per docs/coa-validation-framework.md Part 3/4:
 * - Vanguard Laboratory COAs: letterhead/address/signers (Dustin Newman,
 *   Tori Johnson) match the already-verified pattern used elsewhere in this
 *   DB; A2LA #6377.01.01 / ISO 17025:2017 badge present; real chromatograms.
 * - MZ Biolabs COAs: real letterhead/address, named analyst, chromatogram +
 *   MS identity confirmation — accreditation not independently confirmed,
 *   so treated as a named-but-unverified lab (see docs/lab_registry.md).
 * - Horizon Analytical COA: matches the already-verified unaccredited
 *   pattern (see /labs/horizon-analytical).
 * - BioChex (new lab, not previously in lab_registry.md): independently
 *   verified via its own portal (biochex.org/verify) — submitted the COA ID
 *   + validation key from the downloaded PDF and got back a matching
 *   CONFORMS record. Real address (Las Vegas, NV), no accreditation claimed.
 * - Janoshik: chameleonpeptides.com's own report links 302-redirect to
 *   verify.janoshik.com/tests/<id> (real domain, unique per-report slug) —
 *   confirms the integration is real; no specific purity pulled from it here.
 *
 * Real finding, not just a clean bill of health: GHK-Cu 50mg batch B003
 * (Vanguard, V260805-29 003) FAILED sterility ("Growth Detected") while
 * passing purity/endotoxin/heavy metals. Chameleon published this failing
 * result themselves rather than hiding it — captured in the verdict below.
 * There's no schema column for sterility pass/fail, so this can't be
 * reflected in the automated score; it's a manual-review-only finding
 * (see coa-validation-framework.md Part 8).
 */
import { db } from './lib/client'

const SLUG   = 'chameleon-peptides'
const SOURCE = 'chameleon-testing-page-2026-09-14'
const BASE   = 'https://chameleonpeptides.com/wp-content/uploads'

const TESTS = [
  { peptide_name: 'TB-500',      lab_name: 'Vanguard Laboratory', test_type: 'HPLC-UV/VIS', purity_result: 98.56, batch_number: 'B003',
    test_date: '2026-08-25', coa_url: `${BASE}/2026/02/V260804-17-TB-500-10mg-B003B-Vanguard-Report.pdf` },
  { peptide_name: 'GHK-Cu',      lab_name: 'Vanguard Laboratory', test_type: 'HPLC-UV/VIS', purity_result: 99.80, batch_number: 'B003',
    test_date: '2026-08-25', coa_url: `${BASE}/2026/09/GHK-Cu_50mg_B003_Vanguard_V260805-29_003_2026-08-25.pdf`,
    container_desc: 'Sterility FAILED (Growth Detected) on this batch per the vendor\'s own published COA — purity/endotoxin/heavy metals passed. See vendor verdict.' },
  { peptide_name: 'CP-2T',       lab_name: 'Vanguard Laboratory', test_type: 'HPLC-UV/VIS', purity_result: 99.51, batch_number: 'B003',
    test_date: '2026-08-25', coa_url: `${BASE}/2026/08/cp-2t-10mg-vanguard-v260810-2-001-sterility-approved-v1.pdf`,
    container_desc: 'House product code as printed on the vendor\'s COA — compound not independently confirmed, left as-labeled.' },
  { peptide_name: 'Tesamorelin',  lab_name: 'Horizon Analytical',  test_type: 'UPLC/MS',      purity_result: 99.39, batch_number: 'CP-1700427-P',
    test_date: '2026-07-02', coa_url: `${BASE}/2026/02/CP-1700427-P-Tesamorelin-purity.pdf` },
  { peptide_name: 'KPV',         lab_name: 'BioChex',             test_type: 'RP-UHPLC',    purity_result: 99.30, batch_number: '112455',
    test_date: '2026-08-05', coa_url: `${BASE}/2026/02/BCX-260807-001-KPV-112455.pdf`,
    container_desc: 'Independently re-verified 2026-09-14 via biochex.org/verify (COA ID + validation key from the PDF) — matched: KPV, batch 112455, Chameleon Peptides, CONFORMS.' },
  { peptide_name: 'BPC-157',     lab_name: 'MZ Biolabs',          test_type: 'HPLC-UV-MS',  purity_result: 99.78, batch_number: 'B003',
    test_date: '2026-09-06', coa_url: `${BASE}/2026/09/COA-BPC-157-15mg-B003-MZ-Biolabs-2026-09-11.pdf` },
  { peptide_name: 'Tesamorelin',  lab_name: 'MZ Biolabs',          test_type: 'HPLC-UV-MS',  purity_result: 99.90, batch_number: 'B006',
    test_date: '2026-09-05', coa_url: `${BASE}/2026/09/COA-Tesamorelin-10mg-B006-MZ-Biolabs-2026-09-11.pdf` },
  { peptide_name: 'IGF-1 LR3',   lab_name: 'MZ Biolabs',          test_type: 'HPLC-UV-MS',  purity_result: 99.09, batch_number: 'B002',
    test_date: '2026-09-05', coa_url: `${BASE}/2026/09/COA-IGF-1-LR3-1mg-B002-MZ-Biolabs-2026-09-11.pdf` },
]

const VERDICT =
  "Chameleon Peptides is a real, well-documented operation (Origin Sourcing Group LLC, Sacramento CA) using four independent labs — " +
  "Vanguard Laboratory (ISO 17025/A2LA-accredited), Janoshik, Horizon Analytical, and BioChex, a smaller lab with no independent track record yet " +
  "but a working, independently-verified report portal. Batch-specific COAs are published for most of the catalog with real chromatograms, mass-spec " +
  "identity confirmation, and full heavy-metals/endotoxin/sterility panels — one of the more thorough disclosure setups we've seen on a new listing. " +
  "One real caveat: a GHK-Cu 50mg batch (B003) failed sterility testing (\"Growth Detected\") on Vanguard's own COA, while passing purity and endotoxin — " +
  "Chameleon published that failing result themselves rather than hiding it, which cuts both ways: good-faith disclosure, but confirms at least one " +
  "contaminated batch reached their published record. No ownership/founder identity is disclosed beyond the LLC registration. Free shipping, no international."

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
    has_contact_info: true,          // support email, phone (916) 450-9387, named contact
    has_business_address: true,      // 1731 Howe Ave #301, Sacramento, CA 95825
    has_ownership_disclosure: false, // LLC name disclosed, no named owner/founder
    has_lab_disclosure: true,
    has_testing_methodology: true,   // HPLC-UV/VIS, HPLC-MS, ICP-MS, LAL, USP<71> all named
    has_batch_numbers: true,
    domain_years: null,
    fda_warning: false,
    fraud_flags: false,
    last_reviewed: new Date().toISOString().slice(0, 10),
    notes: 'Onboarded + COA-audited 2026-09-14. See lab_tests.test_source = chameleon-testing-page-2026-09-14 for the verified sample and container_desc for per-test notes (GHK-Cu sterility fail, CP-2T unconfirmed compound).',
  }, { onConflict: 'vendor_id' })
  if (trErr) { console.error('vendor_transparency upsert error:', trErr.message); process.exit(1) }

  const { error: vErr } = await db.from('vendors').update({
    has_coa: true,
    coa_url: 'https://chameleonpeptides.com/testing/',
    city: 'Sacramento',
    state: 'CA',
    shipping_free_threshold: 0,
    ships_internationally: false,
    credit_card_accepted: true,
    verdict: VERDICT,
    coa_audit_status: 'complete',
    coa_audit_tier: 3,
    coa_audit_notes: '8 COAs hand-verified across 4 labs (Vanguard/MZ Biolabs/Horizon Analytical/BioChex) 2026-09-14. BioChex independently re-verified via its own portal. GHK-Cu B003 sterility fail found and disclosed in verdict.',
    coa_audited_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString().slice(0, 10),
  }).eq('id', vendor.id)
  if (vErr) { console.error('vendors update error:', vErr.message); process.exit(1) }

  console.log(`Seeded ${TESTS.length} lab_tests rows for ${SLUG}.`)
  console.log('Updated vendor_transparency + vendors (has_coa, coa_audit_tier=3, verdict, last_reviewed).')
  console.log('Run `npm run compute:scores` next.')
}

main()
