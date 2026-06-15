import { db } from "./lib/client.js";

async function main() {
  const VERDICTS: Record<string, string> = {
    "core-peptides":
      "Core Peptides uses Vanguard Laboratory — the same ISO/IEC 17025:2017 accredited lab used by Licensed Peptides and Certified Pep — for independent third-party purity testing. All recent COAs (April 2026) are batch-specific, with lot numbers traceable to individual production runs. Tested products show purity between 98.16% and >99.80%. They have a confirmed physical address and contact info, but no ownership disclosure and no Finnrick coverage. At this tier, Core Peptides is a legitimate, well-documented vendor with real independent verification. The remaining gaps are ownership transparency and community review history.",

    "penguin-peptides":
      "Penguin Peptides sends samples to Janoshik, a well-known independent testing lab, for third-party purity verification. Of the 18 products tested, 17 came back above 95% purity. The exception is BPC-157, which tested at 91.6% — below the 95% quality floor and a meaningful flag for their flagship peptide. Everything else is clean: Ipamorelin at 99.85%, MOTS-C at 99.84%, PT-141 at 99.84%. Physical address is on file. No ownership disclosure, no pricing data in our database, no batch numbers on COAs. The BPC-157 result alone prevents a Trusted-tier rating — it's not acceptable at that price point from a vendor using independent testing.",

    "biotech-peptides":
      "Biotech Peptides has a confirmed US physical address, contact info, and a full COA library covering 13 distinct compounds. However, COA documents are self-branded — they do not name a third-party testing lab, so the purity data (all between 98.1% and 99.7%) cannot be independently verified. Good operational transparency and a complete product catalog. The missing element is lab identity: without knowing which lab ran the tests, the COAs can't be treated as independent quality evidence. Acceptable for low-risk peptides if pricing is competitive; not recommended as a primary vendor until independent lab disclosure is confirmed.",
  };

  for (const [slug, verdict] of Object.entries(VERDICTS)) {
    const { error } = await db.from("vendors").update({ verdict }).eq("slug", slug);
    if (error) { console.error(`${slug}: ${error.message}`); continue; }
    console.log(`✓ ${slug}: verdict updated`);
  }
}

main().catch(console.error);
