import { db } from './lib/client'

const verdict = `Chromate Analytical confirmed T3 — RP-HPLC method, signed by Lucas Weber (Principal Chemist), with batch-specific identifiers and QR-verifiable COA access codes. Seven compounds tested: BPC-157 (99.1%), GHK-Cu (100%), AOD-9604 (99.8%), Epitalon (97.7%), DSIP (98.3%), KPV (99.8%), L-Glutathione (99.8%). Average purity 99.2%; all results above the 95% threshold. COA images accessible via per-product archive pages after login. Seven additional products — ipamorelin, MOTS-c, NAD+, melanotan I/II, 5-amino-1MQ, TB-500 — have COA pages but images are served from a secondary CDN requiring separate authentication, so purity data for those compounds is not confirmed. Physical address disclosed (Saint Augustine, FL). No ownership disclosure on file. Pricing is at the lower end of the market. At 80, this is a Trusted vendor with verified third-party chemistry and a clean purity record on every compound tested.`

async function main() {
  const { error } = await db
    .from('vendors')
    .update({ verdict })
    .eq('slug', 'felix-chemical-supply')

  if (error) { console.error(error.message); process.exit(1) }
  console.log('Updated Felix verdict.')
}

main()
