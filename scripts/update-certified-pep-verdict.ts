import { db } from './lib/client'

const VERDICT = `Certified Pep scores at 63 — Acceptable — on 15 Vanguard Laboratory COAs covering BPC-157 (99.80%), Semaglutide (99.80%), Tirzepatide (99.80%), Retatrutide (99.80%), KPV (99.80%), Epithalon (99.45%), Ipamorelin (99.34%), CJC-1295 (99.33%), NAD+ (99.29%), Sermorelin (99.13%), MOTS-C (99.12%), Melanotan II (99.18%), PT-141 (99.22%), AOD-9604 (99.02%), and DSIP (98.15%). All COAs from Vanguard Laboratory (A2LA #6377.01.01, ISO 17025 accredited). Average purity 99.35%. All 15 compounds clear the 98% threshold.

The vendor's COA library is gated behind account registration. Contaminant panels are posted alongside every purity COA — an above-average transparency practice. No independent third-party testing platform (e.g. Finnrick) confirms these results. Physical address, ownership, and phone are not publicly listed. Contact is available through an on-site chat. The purity record is clean across a wide product range; the score ceiling is the absence of Finnrick or equivalent third-party corroboration.`

async function main() {
  const { error } = await db.from('vendors').update({ verdict: VERDICT }).eq('slug', 'certified-pep')
  if (error) { console.error(error.message); return }
  console.log('Verdict updated: certified-pep')
}

main().catch(console.error)
