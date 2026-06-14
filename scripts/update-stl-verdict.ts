import { db } from './lib/client'

const verdict = `MZ Biolabs confirmed T3 — HPLC-UV-MS method, signed by analyst Ken Pendarvis ChE, with a real chromatogram and QR code for authenticity. 19 compounds tested, average purity 98.45%. One concern: DSIP tested at 90.2%, below the 95% threshold — if DSIP is in your protocol, source it elsewhere. Physical address and ownership disclosed. No contact information published, and no pricing data is available for a market comparison. At 70, this is a legitimate vendor with real independent testing behind it; the DSIP result is the one flag worth knowing before you buy.`

async function main() {
  const { error } = await db
    .from('vendors')
    .update({ verdict })
    .eq('slug', 'sports-technology-labs')

  if (error) { console.error(error.message); process.exit(1) }
  console.log('Updated STL verdict.')
}

main()
