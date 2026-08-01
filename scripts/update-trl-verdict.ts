import { db } from './lib/client'

const verdict = `Horizon Analytical confirmed T3 — UPLC/MS method, signed by Aleksey Yevtodiyenko PhD, with a public verification portal at horizonanalytical.com. Nine compounds tested: AOD-9604 (99.65%), BPC-157 (99.32%), DSIP (99.54%), GHK-Cu (99.58%), Glutathione (99.25%), Ipamorelin (99.42%), MOTS-c (99.58%), NAD+ (99.49%), PT-141 (99.36%). Average purity 99.47%; all results above 99%. Business address confirmed in Sheridan, WY. No ownership disclosure. COA pages are JavaScript-driven — each compound requires clicking into a product lightbox rather than browsing a central archive, which limits independent verification convenience. Horizon Analytical's ISO 17025 accreditation is not confirmed. At 66, this is an Acceptable vendor with a clean purity record across every compound we could verify.`

async function main() {
  const { error } = await db
    .from('vendors')
    .update({ verdict })
    .eq('slug', 'true-research-labs')

  if (error) { console.error(error.message); process.exit(1) }
  console.log('Updated TRL verdict.')
}

main()
