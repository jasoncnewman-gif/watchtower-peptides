import { db } from './lib/client'

const VERDICT = `Perfect Peptides scores at 58 — Acceptable — on 8 Chromate Analytical COAs from April 2026. BPC-157 (99.29%), Tirzepatide (99.83%), MOTS-C (99.55%), CJC-1295/Ipamorelin blend (99.10%), Retatrutide (99.15%), TB-500 (99.01%), Epitalon (96.70%), and NAD+ (96.48%). Average purity 98.64%. Epitalon was tested via HILIC-HPLC against a >90% spec — a different method than the RP-HPLC standard used for the rest of the catalog; the 96.70% result passes but is not directly comparable to the other figures. NAD+ at 96.48% also passes its >90% spec. All eight compounds confirmed by Chromate Analytical via independent COA. A second-lab Krause Analytical COA for Retatrutide from March 2026 reported >99.9% (HPLC-UV/MS), consistent with the Chromate result.

The COA library is behind a free registration wall (no payment required). Physical address in Encinitas, CA is visible on the Krause COA but not publicly disclosed on the website. No Finnrick presence. The transparency score reflects limited public operational disclosure. Score ceiling is the combination of T3 verification tier (no independent aggregator) and low transparency infrastructure.`

async function main() {
  const { error } = await db.from('vendors').update({ verdict: VERDICT }).eq('slug', 'perfect-peptides')
  if (error) { console.error(error.message); return }
  console.log('Verdict updated: perfect-peptides')
}

main().catch(console.error)
