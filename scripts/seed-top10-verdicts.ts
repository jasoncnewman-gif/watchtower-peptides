/**
 * Seeds verdict text for the top 10 vendors by overall score.
 */
import { db } from "./lib/client.js";

const VERDICTS: Record<string, string> = {
  "polaris-peptides": "Polaris runs COAs per product rather than linking to a single page — each listing has its own Chromate Analytics or Janoshik report, and nine products have Finnrick endotoxin test results on top of that. Purity data we've reviewed averages 99.4% across eleven tested peptides with no failures. Access to the COA page itself requires a free account login, which is an extra step but not unusual for a members-model vendor. Ownership is publicly disclosed. This is one of the most comprehensively documented vendors in our database.",

  "ez-peptides": "EZ Peptides publishes third-party lab results backed by Finnrick verification across six tested products, and the company lists a physical US address. Most purity results are solid, but one retatrutide batch came back at 93.2% — below the 95% threshold where we start flagging product quality. Whether that's a one-time outlier or a sign of inconsistency requires more data points. No named ownership. The testing infrastructure is real; we'd want to see that retatrutide result addressed before ranking this higher.",

  "peptidology": "Peptidology operates out of Scottsdale, AZ and runs third-party testing through an ISO-17025 accredited lab. Their COA library has 426 documents on file, all batch-specific. Purity average across seven tested products is 99.5% with no failures. Seven Finnrick-verified tests add an independent layer of confirmation. Ownership isn't disclosed, which is the only transparency gap in an otherwise strong profile. One of the better-documented vendors in this space.",

  "orbitrex-peptides": "Orbitrex operates from Iceland, which means purchases fall outside US consumer protection frameworks — worth knowing before you order. On the chemistry side, the record is nearly spotless: 99.89% average purity across seven Finnrick-verified tests, with batch-specific COAs and methodology documentation. A physical address is on file but there's no published contact information. The jurisdiction risk is real; the testing evidence isn't.",

  "bulk-peptide-supply": "Bulk Peptide Supply publicly discloses ownership, lists a physical address, and covers seven products through Finnrick-verified third-party testing — a cleaner transparency profile than most vendors at this score level. Average purity is 99.4% across seven tests. The gaps are minor: no published contact information, and test coverage is still relatively thin for a catalog of this size. A reliable baseline with room to grow.",

  "nextechlabs": "NextechLabs has strong testing numbers — 99.69% average across seven Finnrick-verified products — but no publicly accessible COA archive. We couldn't locate an active COA page, which means the documentation exists in Finnrick's system but isn't independently browsable. No contact information, no ownership disclosure. The purity record is clean; the transparency infrastructure around it is thin. We'd want a working COA page before ranking this higher.",

  "aavant-research": "Aavant Research posts some of the cleanest purity numbers in our dataset — 99.87% average across seven Finnrick-verified tests, including multiple tirzepatide and retatrutide runs. Contact information is public; no physical address or ownership disclosure. The testing record alone would rank them higher if the company identity were clearer. As it stands, you're buying from a well-tested vendor whose principals are unknown.",

  "omegamino": "Omegamino meets the basic requirements: third-party testing, batch numbers, methodology disclosed. Purity averages 99.8% across the four products we have data for, which is solid. But four Finnrick-verified tests is the minimum we'd accept, and there's no contact information, no physical address, and no ownership disclosure. The testing data is good; the company identity is a blank. Sufficient for cautious buyers, not a vendor we'd recommend over better-documented alternatives.",

  "astro-peptides": "Two CJC-1295 batches came back at 88.99% and 85.65% purity — the lowest results in our dataset for any vendor in this group. Both failures were from the same testing date, which suggests a bad batch rather than a systematic problem, but neither has been publicly acknowledged. Other tested products look clean. No COA page is publicly accessible, no contact information, and no address or ownership on file. The CJC-1295 results need an explanation before this vendor earns a stronger recommendation.",

  "paramount-peptides": "Paramount has more Finnrick endotoxin tests than most vendors above it in the rankings — eight total — and both a physical address and contact information are listed. The problem is purity data: we have none in our database. Whether that's a gap in our scraping or a sign that HPLC results aren't publicly available, we can't independently confirm product purity. No ownership disclosure. The infrastructure is there; the chemistry documentation needs to catch up.",
};

async function main() {
  let updated = 0;
  for (const [slug, verdict] of Object.entries(VERDICTS)) {
    const { error } = await db.from("vendors").update({ verdict }).eq("slug", slug);
    if (error) {
      console.error(`✗ ${slug}: ${error.message}`);
    } else {
      console.log(`✓ ${slug}`);
      updated++;
    }
  }
  console.log(`\nDone. Updated ${updated}/${Object.keys(VERDICTS).length} vendors.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
