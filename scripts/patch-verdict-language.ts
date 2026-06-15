import { db } from "./lib/client.js";

const PATCHES: { slug: string; verdict: string }[] = [
  {
    slug: "apollo-peptide-sciences",
    verdict:
      "The vendor's website is no longer accessible. No products, no documentation, and no presence in third-party databases. This vendor appears to be offline. Listed for historical completeness only.",
  },
  {
    slug: "pivot-labs",
    verdict:
      "The vendor's website is no longer active. No products, no documentation, no operational presence. Listed for historical completeness only.",
  },
  {
    slug: "pure-rawz",
    verdict:
      "Seven Finnrick-tested samples confirm clean purity across five peptides: Semaglutide (99.32–99.44%), Retatrutide (99.08–99.27%), Melanotan II (99.57%), Ipamorelin (98.84%), and Tirzepatide (99.05%). All results are above the 98% threshold. No vendor-hosted COA archive was accessible for review; the Finnrick results are the primary purity confirmation. No contact info, no physical address, no ownership disclosure. One of the larger peptide catalogs in this space. The confirmed purity puts Pure Rawz at Trusted despite the operational anonymity; the complete lack of identity transparency is the limiting factor.",
  },
  {
    slug: "simple-peptide",
    verdict:
      "Fifty Freedom Diagnostics COAs confirmed from their live COA library — all from May–June 2026, all passing HPLC-UV and LC-MS identity confirmation. Average purity 99.67%, floor 98.21% on a Tirzepatide/B12 blend. Single-compound peptides consistently at 99.3–99.99%: BPC-157 500mcg at 99.95%, Ipamorelin at 99.77–99.95%, Semaglutide at 99.91%, Retatrutide at 99.47–99.95%. Seven Finnrick-verified tests add independent corroboration. Freedom Diagnostics performs full endotoxin (USP <85> LAL assay) and microbial PCR alongside purity — that's the deepest testing panel we track. Physical address confirmed: 6586 W Atlantic Ave, Delray Beach, FL. Contact info published (phone and email). No ownership disclosure is the only transparency gap. Infrastructure and testing quality are genuinely strong.",
  },
  {
    slug: "felix-chemical-supply",
    verdict:
      "Chromate Analytical confirmed T3 — RP-HPLC method, signed by Lucas Weber (Principal Chemist), with batch-specific identifiers and QR-verifiable COA access codes. Seven compounds tested: BPC-157 (99.1%), GHK-Cu (100%), AOD-9604 (99.8%), Epitalon (97.7%), DSIP (98.3%), KPV (99.8%), L-Glutathione (99.8%). Average purity 99.2%; all results above the 95% threshold. COA images accessible via per-product archive pages after login. Seven additional products — ipamorelin, MOTS-c, NAD+, melanotan I/II, 5-amino-1MQ, TB-500 — have COA pages but documents for those compounds were not accessible for review, so purity data is not confirmed. Physical address disclosed (Saint Augustine, FL). No ownership disclosure on file. Pricing is at the lower end of the market. At 80, this is a Trusted vendor with verified third-party chemistry and a clean purity record on every compound tested.",
  },
  {
    slug: "true-research-labs",
    verdict:
      "Horizon Analytical confirmed T3 — UPLC/MS method, signed by Aleksey Yevtodiyenko PhD, with a public verification portal at horizonanalytical.com. Nine compounds tested: AOD-9604 (99.65%), BPC-157 (99.32%), DSIP (99.54%), GHK-Cu (99.58%), Glutathione (99.25%), Ipamorelin (99.42%), MOTS-c (99.58%), NAD+ (99.49%), PT-141 (99.36%). Average purity 99.47%; all results above 99%. Business address confirmed in Sheridan, WY. No ownership disclosure. COA access requires navigating into each product page individually rather than browsing a central archive, which limits independent verification convenience. Horizon Analytical's ISO 17025 accreditation is not confirmed. At 66, this is an Acceptable vendor with a clean purity record across every compound we could verify.",
  },
  {
    slug: "peptide-crafters",
    verdict:
      "Peptide Crafters posts third-party COAs for 56 products through Vanguard Laboratory (Olympia, WA), with average purity of 99.57% — among the highest we've verified. Every batch we reviewed exceeded 98%, and their GLP-series products — their core offering — consistently tested above 99.5%. Transparency is solid: lab name, batch numbers, and testing methodology are all disclosed on the lab-test-reports page. The transparency score has room to improve — no public COA policy page or testing FAQ was found. With 56 lab-verified products and near-flawless purity data, Peptide Crafters earns a Recommended rating.",
  },
  {
    slug: "peptide-partners",
    verdict:
      "Seventy-seven COAs posted on their independent certifications page — four labs (TrustPointe, Kovera, BioRegen, Chromate), continuous testing from August 2025 through June 2026. Average purity 99.74%, floor 99.10% (Tesamorelin, TrustPointe). A notable feature: some batches are double-validated — the same lot tested by two separate labs with matching results. Manufacturer IDs (WF03, VI32) are disclosed publicly alongside each COA, which is an unusual level of supply-chain transparency. BPC-157 has been tested six times across multiple batches (99.46–99.99%), Retatrutide nine times (99.33–99.94%). Seven Finnrick-verified tests add independent corroboration. Ownership disclosure is confirmed. No physical address is published. No pricing data is in our database — the overall score likely understates customer experience. Strong testing infrastructure and multi-lab cross-validation put this vendor above most at the same price tier.",
  },
  {
    slug: "swiss-chems",
    verdict:
      "Swiss Chems received an FDA warning letter on December 10, 2024 (part of a four-vendor enforcement wave that also targeted Prime Peptides, Xcel Peptides, and Summit Research). The FDA cited Swiss Chems for selling semaglutide, tirzepatide, and retatrutide as unapproved drugs intended for human use — a violation of FDCA sections 505(a) and 301(d). The company operates out of Iceland, which places purchases outside US consumer protection frameworks.\n\nOn the chemistry side, two CJC-1295 batches came back at 57.25% and 54.44% purity — confirmed failures on one of the most commonly purchased peptides in this catalog. At those concentrations the product is predominantly not what it's labeled. BPC-157 results are clean (99.71–99.95%). Contact info is public; no physical address or ownership disclosure.\n\nThe FDA warning letter, the Iceland jurisdiction, and the CJC-1295 failures together make this vendor one we can't recommend. Do not buy CJC-1295 from Swiss Chems.",
  },
  {
    slug: "mile-high-compounds",
    verdict:
      "Mile High Compounds uses Chromate Analytics — a named third-party lab — across five tested products averaging 99.4% purity, with a floor at 99.09%. Batch-specific identifiers are present on all reviewed COAs. Ownership is disclosed and a physical address is on file. The jurisdiction flag: the operation is Iceland-based and runs outside US consumer protection frameworks. No contact information is published. The chemistry documentation is solid for this tier; the Iceland-based structure and missing contact info are the material risks. Buyers should factor in the limited legal recourse before ordering.",
  },
];

async function main() {
  for (const { slug, verdict } of PATCHES) {
    const { error } = await db.from("vendors").update({ verdict }).eq("slug", slug);
    if (error) {
      console.error(`FAILED ${slug}:`, error.message);
    } else {
      console.log(`OK  ${slug}`);
    }
  }
}

main();
