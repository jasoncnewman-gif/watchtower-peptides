/**
 * Seeds verdict text for all active vendors that don't have one yet.
 */
import { db } from "./lib/client.js";

const VERDICTS: Record<string, string> = {
  "simple-peptide":
    "Simple Peptide has seven Finnrick-verified tests, an active COA page, contact info, a physical address, and lab methodology disclosed — a cleaner checklist than most vendors near this score. The gap is purity data: we haven't extracted raw numbers from their COA archive yet, so the score reflects Finnrick's independent testing footprint rather than confirmed purity percentages. No ownership disclosure.",

  "loti-labs":
    "Loti Labs is one of the more transparent operators in this space — ownership disclosed, contact info public, address on file, Finnrick-verified. That makes the CJC-1295 results harder to explain: two separate batches came back below 62% purity. At those levels the product is mostly something else. Their other tested peptides look clean. Until Loti addresses those CJC-1295 results publicly, we can't recommend them for that peptide specifically.",

  "peptide-partners":
    "Ownership is disclosed, contact info is public, and Finnrick-verified testing backs the lab transparency claim. No publicly accessible COA page at the time of review, which is a gap — COA documentation should be independently browsable. No physical address on file. Sufficient identity transparency for the score, but the missing COA archive limits how much we can confirm independently.",

  "ascension-peptides":
    "Ascension's COA page sits behind an age gate, but the documentation inside is thorough. Testing is handled by MZ Biolabs in Tucson, AZ — a named third-party lab with HPLC methodology. We reviewed 50 test results covering a wide catalog, averaging 99.6% purity. No physical address or ownership disclosure. A strong testing record from a vendor that's deliberately hard to browse; worth the extra step to verify.",

  "glacier-aminos":
    "Third-party testing through Kovera Labs and Freedom Diagnostics — two named labs, which is more lab diversification than most vendors at this score level. Three tests averaging 99.7% purity. Contact info is public; no physical address or ownership. The sample is thin for a full catalog recommendation but the existing results are clean.",

  "mile-high-compounds":
    "Chromate Analytics COAs, five tests averaging 99.4% purity. Ownership is disclosed and a physical address is on file. Iceland-based operation (.is domain) — no US consumer protection recourse. No contact information published. The testing data is solid; the jurisdiction and missing contact info are the flags.",

  "ion-peptide":
    "Three different named third-party labs — ILS Laboratories, Kovera Labs, and Freedom Diagnostics — across six tests averaging 99.7% purity. A physical address is on file. No contact info or ownership disclosure. The lab diversification is a genuine differentiator; most vendors this size pick one lab and stick with it.",

  "verified-peptides":
    "Eight Finnrick-verified tests and an active COA page, but the operator is almost entirely anonymous — no contact info, no address, no ownership disclosure. The Finnrick coverage is meaningful for confirming a lab testing relationship exists, but without purity data in our database we can't confirm the actual numbers. Worth watching as more data surfaces.",

  "peptide-crafters":
    "Seven Finnrick-verified tests and an active COA page. Contact info is public. No physical address or ownership disclosure. We don't have purity data in our database from their COA archive, so the score is driven by Finnrick footprint rather than confirmed percentages. The infrastructure is there; the documentation needs to be more publicly accessible.",

  "biotech-peptides":
    "Contact info, a physical address, and lab disclosure are all confirmed — one of the more complete identity profiles at this score level. COA page is active. No Finnrick testing, and we have no purity data in our database. Good baseline legitimacy, but without confirmed purity numbers the chemistry side is unverified.",

  "skye-peptides":
    "Ten Finnrick-verified tests — among the highest counts of any vendor we track. No publicly accessible COA page at time of review. No contact info, no address, no ownership, and no lab disclosed on the vendor's own site. The Finnrick relationship confirms third-party testing exists, but the vendor's own transparency is essentially zero. High testing footprint, no company identity.",

  "nuscience-peptides":
    "Ten Finnrick-verified tests. No company identity disclosed — no contact info, no address, no ownership. COA page exists but we have no purity data extracted from it. Free shipping on all orders. The Finnrick coverage is real, but the operator is completely anonymous. Worth watching, not ready to recommend.",

  "swiss-chems":
    "Two CJC-1295 batches tested below 58% purity — not borderline results, these are failures. A product at 57% purity is mostly not what it's labeled. Other tested peptides look cleaner. Contact info is public, but no physical address or ownership. Do not buy CJC-1295 from Swiss Chems; the rest of the catalog requires more data before recommending.",

  "crush-research":
    "Ownership and contact info are both public, and the COA page is active. No Finnrick testing and no purity data in our database. The company identity is solid for this tier; the chemistry documentation isn't comprehensive enough to verify product quality independently.",

  "sports-technology-labs":
    "Physical address and ownership both disclosed — more accountability than most vendors near this score. COA page is active. No Finnrick testing, no purity data in our database. Pricing runs at the high end of the market. The identity checks out; the testing record needs work to justify the price premium.",

  "nexaph":
    "COAs are hosted on SwiftCS (nexaph.coa.swiftcs.ai), a third-party COA verification platform — an unusual approach but a real one. Ten Finnrick-verified tests. No address, no ownership, and no lab named on the vendor's own site. Above-market pricing. The Finnrick coverage is the strongest signal here; everything else about the company identity is absent.",

  "pure-rawz":
    "Seven Finnrick-verified tests suggest a real lab testing relationship exists. The COA page was inaccessible at review time — Cloudflare blocking — so we can't confirm what's there. No contact info, no address, no ownership. One of the larger catalogs in this space; the anonymity is a significant concern given the scale of the operation.",

  "core-peptides":
    "Third-party lab testing with contact info and a physical address on file. COA page is active. No Finnrick testing. The lab verification is real but not batch-specific — meaning the same COA applies to multiple production runs, which limits how precisely you can trace what you're getting. A legitimate vendor with documentation that needs to go one level deeper.",

  "felix-chemical-supply":
    "Internal testing only — no named third-party lab. Based in Iceland (felixchem.is). Contact info is public and pricing is at the low end of the market. Testing cannot be independently verified. Worth considering only if cost is the primary constraint and you understand the documentation limits.",

  "lvlup-health":
    "No COA page and no lab testing documentation of any kind. Ownership is disclosed. There's not enough evidence to evaluate product quality — we can verify who runs it but not what they're selling. Not recommended until testing documentation appears.",

  "limitless-biotech":
    "No COA page, no lab testing documentation. Contact info is public. Payments are PayPal-only, which limits transaction protection compared to credit card purchases. Not enough evidence to evaluate product quality. Not recommended without third-party testing.",

  "penguin-peptides":
    "COA page exists, and a physical address is on file. No third-party lab verification — internal testing only. No Finnrick testing. Without independent confirmation, the COA documents cannot be treated as reliable quality evidence.",

  "dynamic-peptide":
    "No COA, no lab testing of any kind, no contact info, no address, no ownership disclosure. One of the least-documented vendors in our database. We have no basis for evaluating product quality. Avoid.",

  "healthgevity":
    "No COA page, no lab testing, no physical address. Claims to offer research-grade peptides but provides no independent verification. Not recommended.",

  "alpha-biomed-labs":
    "Institutional-access-only catalog — products are not publicly purchasable at this time. Listed for completeness. No public documentation available to evaluate.",

  "southern-peptides":
    "No documentation of any kind: no COA, no lab testing, no contact info, no address, no ownership. Lowest-scored vendor in our database. Avoid.",
};

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [slug, verdict] of Object.entries(VERDICTS)) {
    const { data: v } = await db.from("vendors").select("id, verdict").eq("slug", slug).maybeSingle();
    if (!v) { console.log(`✗ ${slug}: not found`); continue; }
    if (v.verdict) { console.log(`— ${slug}: already has verdict, skipping`); skipped++; continue; }

    const { error } = await db.from("vendors").update({ verdict }).eq("slug", slug);
    if (error) {
      console.error(`✗ ${slug}: ${error.message}`);
    } else {
      console.log(`✓ ${slug}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped} (already had verdict).`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
