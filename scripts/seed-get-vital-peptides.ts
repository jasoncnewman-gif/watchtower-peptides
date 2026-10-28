/**
 * Seeds lab_tests + vendor_transparency + verdict for Get Vital Peptides,
 * from a hand-verified sample of 9 of their 13 published Janoshik reports
 * (getvitalpeptides.nl/labresultaten/, reviewed 2026-10-28).
 *
 * Verification performed per docs/coa-validation-framework.md Part 3/4:
 * - Lab is Janoshik, already a known quantity in this DB (docs/lab_registry.md:
 *   Prague, community-standard, not ISO 17025, public key-verifiable --
 *   same lab already trusted for Polaris Peptides and Chameleon Peptides).
 * - 9 of 13 reports downloaded and visually inspected directly: real unique
 *   per-report verification keys, real signature, real QR code, consistent
 *   Janoshik template matching other already-verified Janoshik COAs in this
 *   DB, genuine date progression across 4+ months (Jun/Jul/Sep/Oct 2026 --
 *   not a single templated batch dump), real Lot:MM/YYYY Exp:MM/YYYY batch
 *   dating. Could NOT complete a live key lookup at public.janoshik.com --
 *   Cloudflare-blocked for automated access, a known pre-existing platform
 *   limitation (see docs/lab_registry.md / scripts/seed-labs.ts), not
 *   specific to this vendor.
 * - One result below the ~95% purity bar other vendors get flagged for
 *   (IGF-1 LR3, 91.198%), published by the vendor rather than omitted --
 *   same good-faith-disclosure credit given to Chameleon's failed GHK-Cu
 *   batch. NAD+ and HCG are reported as mg/IU content, not purity% --
 *   that's Janoshik's own correct test-type choice for those compounds,
 *   not a gap. (HCG is not actually a peptide -- a glycoprotein hormone --
 *   logged here anyway since lab_tests already carries non-peptide
 *   compounds like NAD+ for other vendors.)
 *
 * Material transparency finding, not a lab-quality one: every one of the
 * 13 Janoshik orders, across 4+ months, was placed under the client email
 * "Optitropin.EU@protonmail.com" -- not a getvitalpeptides.nl address.
 * Public search associates "Optitropin"/"Optitropin.EU" with underground
 * HGH distribution advertised via steroid-forum sponsor threads (MESO-Rx /
 * thinksteroids "Steroid Underground"), a different and more illicit market
 * than typical research-peptide retail. This does not prove the same people
 * run both operations, but it is a real, undisclosed, unverified
 * operational link -- flagged plainly in the verdict rather than hidden,
 * same posture as every other caveat in this project.
 * Also found: no business address, no KVK/VAT/founder name anywhere on the
 * site, and the footer's "Privacybeleid"/"Algemene Voorwaarden" links are
 * dead "#" placeholders -- these legally-required pages (Dutch/EU distance-
 * selling + GDPR) do not actually exist on the live site, not just
 * "undisclosed." WhatsApp contact number (wa.me/31612345678) is a
 * sequential-digit pattern that reads like an unfilled template value.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-get-vital-peptides.ts
 */
import { db } from './lib/client'

const SLUG   = 'get-vital-peptides'
const SOURCE = 'gvp-labresultaten-2026-10-28'
const BASE   = 'https://getvitalpeptides.nl/wp-content/uploads'

const TESTS = [
  { peptide_name: 'BPC-157',       lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.859, batch_number: 'Lot:04/2026',
    test_date: '2026-06-25', coa_url: `${BASE}/2026/09/Test-Report-bpc157.png`, verification_key: '7UZM6AUGRSE4' },
  { peptide_name: 'Retatrutide',   lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.662, batch_number: 'Lot:04/2026',
    test_date: '2026-06-26', coa_url: `${BASE}/2026/09/Test-Report-Reta.png`, verification_key: 'EYM4X6TDZYJ9' },
  { peptide_name: 'IGF-1 LR3',     lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 91.198, batch_number: 'Lot:04/2026',
    test_date: '2026-06-25', coa_url: `${BASE}/2026/09/Test-Report-IGF1.png`, verification_key: 'AVKACDBPXFF4',
    container_desc: 'Below the ~95% purity bar flagged elsewhere in this DB. Published by the vendor rather than omitted.' },
  { peptide_name: 'GHK-Cu',        lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.577, batch_number: 'Lot:04/2026',
    test_date: '2026-06-26', coa_url: `${BASE}/2026/09/Test-Report-ghk-cu.png`, verification_key: 'I51ZJQ3UYHKN' },
  { peptide_name: 'Semaglutide',   lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.330, batch_number: 'Lot:04/2026',
    test_date: '2026-06-26', coa_url: `${BASE}/2026/09/Test-Report-semaglutide.png`, verification_key: 'A6RV7LPP69VB' },
  { peptide_name: 'CJC-1295 No DAC', lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 95.615, batch_number: 'Lot:06/2026',
    test_date: '2026-09-03', coa_url: `${BASE}/2026/10/908bbcaa6abc7930bbc6.png`, verification_key: 'STEFJHJI31YL' },
  { peptide_name: 'Ipamorelin',    lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.823, batch_number: 'Lot:06/2026',
    test_date: '2026-09-03', coa_url: `${BASE}/2026/10/12ebdae583a0d421736e.png`, verification_key: '4YY7PRRCFW1N' },
  { peptide_name: 'NAD+',          lab_name: 'Janoshik', test_type: 'Identity + Quantity', purity_result: null, batch_number: null,
    test_date: '2026-10-02', coa_url: `${BASE}/2026/10/9a5838650a692fe69443.png`, verification_key: 'CGU1QL41NWF4',
    container_desc: '483.01 mg measured content vs. 500mg labeled (96.6% of claim). Quantity assay, not a purity% test.' },
  { peptide_name: 'HCG',           lab_name: 'Janoshik', test_type: 'Identity + Quantity (immunoassay alternative)', purity_result: null, batch_number: 'Lot:04/2026',
    test_date: '2026-07-03', coa_url: `${BASE}/2026/10/249261ad772bef06b8f7.png`, verification_key: '9K15FVSACU6L',
    container_desc: '4266 IU measured vs. 5000 IU labeled (85.3% of claim). Not a peptide (glycoprotein hormone) -- logged for completeness.' },
  // Remaining 4 of 13: trusted from the lab-results page listing, not individually
  // image-verified this pass (no batch number available without the image).
  { peptide_name: 'Tirzepatide',   lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 99.640, batch_number: null,
    test_date: '2026-06-26', coa_url: `${BASE}/2026/09/Test-Report-tirzepatide.png`, verification_key: null },
  { peptide_name: 'TB-500',        lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 98.806, batch_number: null,
    test_date: '2026-06-25', coa_url: `${BASE}/2026/09/Test-Report-TB500.png`, verification_key: null },
  { peptide_name: 'Melanotan II',  lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 97.745, batch_number: null,
    test_date: '2026-06-25', coa_url: `${BASE}/2026/09/Test-Report-melanotan.png`, verification_key: null },
  { peptide_name: 'MOTS-C',        lab_name: 'Janoshik', test_type: 'Identity + Purity', purity_result: 98.613, batch_number: null,
    test_date: '2026-06-25', coa_url: `${BASE}/2026/09/Test-Report-Mots-C.png`, verification_key: null },
]

const VERDICT =
  "Get Vital Peptides is a Netherlands-based research peptide webshop publishing 13 batch-specific Janoshik " +
  "reports (9 hand-verified directly for this review). The lab results themselves look genuine: real unique " +
  "per-report verification keys, real signatures and QR codes matching Janoshik's standard template, and real " +
  "batch dating spanning 4+ months rather than a single dump. Most purity results are strong (mid-to-high 90s " +
  "to 99.8%); one result, IGF-1 LR3 at 91.198%, is below the bar other vendors get flagged for here, and they " +
  "published it rather than hiding it. NAD+ and HCG are reported as measured content (483mg/500mg and " +
  "4266IU/5000IU) rather than purity%, which is the correct test type for those compounds, not a gap.\n\n" +
  "The business-identity side is materially weaker. No KVK (Dutch Chamber of Commerce) number, VAT number, " +
  "business address, or founder/owner name appears anywhere on the site. The footer's \"Privacybeleid\" (Privacy " +
  "Policy) and \"Algemene Voorwaarden\" (Terms & Conditions) links are dead placeholders -- these pages, legally " +
  "required for a Dutch/EU webshop, do not actually exist on the live site. The only phone-style contact is a " +
  "WhatsApp number (wa.me/31612345678) that reads like an unfilled sequential-digit template value. Most " +
  "notably: every one of the 13 Janoshik test orders, across the full 4-month span, was placed under the client " +
  "email \"Optitropin.EU@protonmail.com\" -- not a Get Vital-branded address. Public search associates " +
  "\"Optitropin\"/\"Optitropin.EU\" with underground HGH distribution advertised via steroid-forum sponsor " +
  "threads, a different and more illicit market than typical research-peptide retail. We cannot confirm the same " +
  "people run both operations, but it's a real, unexplained operational link we found, not something the vendor " +
  "discloses -- worth knowing given the site's own \"transparent batch results\" marketing. Shipping terms could " +
  "not be confirmed either: the footer's own \"Verzending\" (Shipping) link is another dead placeholder, and no " +
  "cost or threshold appears anywhere on the shop page."

async function main() {
  const { data: vendor, error: ve } = await db.from('vendors').select('id').eq('slug', SLUG).single()
  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); process.exit(1) }

  await db.from('lab_tests').delete().eq('vendor_id', vendor.id).eq('test_source', SOURCE)
  const { error: te } = await db.from('lab_tests').insert(
    TESTS.map(({ verification_key, ...t }) => ({ ...t, vendor_id: vendor.id, verified: true, test_source: SOURCE }))
  )
  if (te) { console.error('lab_tests insert error:', te.message); process.exit(1) }

  const { error: trErr } = await db.from('vendor_transparency').upsert({
    vendor_id: vendor.id,
    has_contact_info: true,          // WhatsApp + X/YouTube/Pinterest; no email, no traditional phone
    has_business_address: false,     // no address anywhere on site
    has_ownership_disclosure: false, // no founder/owner name; no KVK/VAT anywhere
    has_lab_disclosure: true,
    has_testing_methodology: true,   // dedicated lab-results page naming Janoshik, same credit given to Polaris/Chameleon
    has_batch_numbers: true,         // real Lot:MM/YYYY Exp:MM/YYYY dating on the reports we viewed
    domain_years: null,
    fda_warning: false,
    fraud_flags: false,
    last_reviewed: new Date().toISOString().slice(0, 10),
    notes: 'Onboarded + COA-audited 2026-10-28. See lab_tests.test_source = ' + SOURCE + ' for the verified sample. ' +
      'No KVK/VAT/address/founder disclosed; Privacy Policy and Terms footer links are dead placeholders (pages do ' +
      'not exist). All 13 Janoshik orders placed under client email Optitropin.EU@protonmail.com -- public search ' +
      'ties that name to underground HGH distribution via steroid forums, unexplained and undisclosed by the vendor.',
  }, { onConflict: 'vendor_id' })
  if (trErr) { console.error('vendor_transparency upsert error:', trErr.message); process.exit(1) }

  const { error: vErr } = await db.from('vendors').update({
    has_coa: true,
    coa_url: 'https://getvitalpeptides.nl/labresultaten/',
    country: 'NL',
    // Shipping cost/threshold: left unset. The footer's own "Verzending" link is a dead
    // placeholder and no figure appears on the shop page -- genuinely unknown, not just unresearched.
    ships_internationally: true, // ships to "most European countries" per site (homepage copy, not the dead shipping page)
    verdict: VERDICT,
    coa_audit_status: 'complete',
    coa_audit_tier: 3,
    coa_audit_notes: '9 of 13 published COAs hand-verified (Janoshik, already-known lab) 2026-10-28. Real distinct ' +
      'verification keys, signatures, QR codes, batch dating across 4+ months. Could not complete a live key lookup ' +
      '-- public.janoshik.com Cloudflare-blocked for automated access (pre-existing platform limitation). Material ' +
      'transparency finding: all 13 orders placed under client email tied by public search to an unrelated ' +
      'underground-HGH brand (Optitropin.EU); see verdict.',
    coa_audited_at: new Date().toISOString(),
    last_reviewed: new Date().toISOString().slice(0, 10),
  }).eq('id', vendor.id)
  if (vErr) { console.error('vendors update error:', vErr.message); process.exit(1) }

  console.log(`Seeded ${TESTS.length} lab_tests rows for ${SLUG}.`)
  console.log('Updated vendor_transparency + vendors (has_coa, coa_audit_tier=3, verdict, last_reviewed).')
  console.log('Run `npm run compute:scores` next.')
}

main()
