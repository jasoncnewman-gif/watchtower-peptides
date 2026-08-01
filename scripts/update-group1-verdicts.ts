import { db } from './lib/client'

const VERDICTS: Record<string, string> = {
  'nexaph': `Nexaph has 245 Finnrick-tested samples across 10 products — one of the highest independent testing footprints we track. Seven recent tests confirm clean purity across Retatrutide (99.8–99.9%), Ipamorelin (99.8%), and Tesamorelin (99.9%). COAs are hosted on SwiftCS (nexaph.coa.swiftcs.ai), a third-party verification platform — an unusual but legitimate approach; records are browsable without going through the vendor. No physical address, no ownership disclosure. Contact info is accessible. Pricing runs above market average. The Finnrick testing footprint and confirmed purity put this solidly at Trusted; the anonymous operation is the remaining concern.`,

  'nuscience-peptides': `Nuscience has one of the highest Finnrick testing footprints in this category. Seven recent tests confirm clean purity across the GLP-1 class — Tirzepatide (99.89–99.95%), Semaglutide (99.88–99.94%), Retatrutide (99.9%), and Melanotan II (99.9%). Free shipping on all orders. The major gap is operator identity: no contact info, no address, no ownership disclosure is publicly available. The chemistry is independently verified; everything about who is running the business is a blank. At 83, this lands in Trusted — the purity record earns it — but the complete operational anonymity means buyers are transacting with an unidentified entity.`,

  'paramount-peptides': `Paramount Peptides sits at the top of the Trusted tier on the strength of 65 Finnrick-tested samples across 8 products. Seven recent purity results span 98.57–99.95%: Retatrutide 99.67–99.95%, Tirzepatide 99.08–99.83%, BPC-157 98.57–99.95%. Median purity across all 65 tests is 99.7% per Finnrick — 97% of passing samples above 98%. Physical address and contact information are publicly listed. Transparency flags are complete. No ownership disclosure on file. At 91, this is an Elite vendor with a deep, independently verified testing record and the accountability infrastructure to match it.`,

  'pure-rawz': `Seven Finnrick-tested samples confirm clean purity across five peptides: Semaglutide (99.32–99.44%), Retatrutide (99.08–99.27%), Melanotan II (99.57%), Ipamorelin (98.84%), and Tirzepatide (99.05%). All results are above the 98% threshold. The COA page was Cloudflare-blocked during review — the Finnrick results are the primary purity confirmation. No contact info, no physical address, no ownership disclosure. One of the larger peptide catalogs in this space. The confirmed purity puts Pure Rawz at Trusted despite the operational anonymity; the complete lack of identity transparency is the limiting factor.`,

  'verified-peptides': `Verified Peptides has 36 Finnrick-tested samples. Seven recent purity results are clean: PT-141 (99.33–99.94%), Ipamorelin (99.9%), Retatrutide (99.7%), CJC-1295 (98.57%). All results clear the 95% threshold; the CJC-1295 result is the lowest in the set but still passing. No contact info, no physical address, no ownership disclosure. The testing score now reflects confirmed Finnrick purity data, not just test count. At 79, this is a Trusted vendor on chemistry — but identical anonymity concerns to other high-Finnrick vendors apply. Acceptable for chemistry-focused buyers; not recommended if operator accountability matters.`,
}

async function main() {
  for (const [slug, verdict] of Object.entries(VERDICTS)) {
    const { error } = await db.from('vendors').update({ verdict }).eq('slug', slug)
    if (error) { console.error(`${slug}: ${error.message}`); continue }
    console.log(`Updated: ${slug}`)
  }
}

main()
