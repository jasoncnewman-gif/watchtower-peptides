/**
 * scripts/seed-peptides-5.ts
 * TB-500 Fragment 17-23 and MK-677.
 *
 * Run: npm run seed:peptides5
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-peptides-5";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const PEPTIDES = [

  {
    name: "TB-500 Fragment 17-23",
    full_name: "TB-500 Fragment 17-23 (Thymosin Beta-4 Fragment)",
    slug: "tb-500-frag-17-23",
    tagline: "The minimal active fragment of Thymosin Beta-4 — a heptapeptide spanning residues 17–23 that retains the actin-binding and pro-healing properties of full TB-500 at a fraction of the molecular weight.",
    aliases: ["TB4 Frag 17-23", "TB500 Fragment", "Ac-SDKPDM-NH2", "Thymosin Beta-4 Fragment"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "Short — estimated < 1 hour",
    molecular_weight: "726.8 g/mol",
    sequence: "Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-NH2",
    category: "healing",
    overview: "TB-500 Fragment 17-23 is a synthetic heptapeptide corresponding to residues 17 through 23 of the full Thymosin Beta-4 (TB-500) sequence. It contains the actin-binding motif LKKTET (adjacent to this fragment) and represents the minimal sequence required for many of TB-500's biological activities. Research with the full TB-500 molecule identified this region as critical for G-actin sequestration, cell migration, and wound healing. The fragment is substantially smaller than full TB-500 (727 Da vs ~4963 Da), which may affect tissue distribution and half-life. Preclinical studies suggest it retains anti-inflammatory, pro-healing, and angiogenic properties. Vendors market it as a more cost-effective alternative to full-length TB-500, though comparative clinical data is absent. It is considerably less well-studied than the full molecule.",
    description: "The minimal active heptapeptide fragment of TB-500 retaining actin-binding and pro-healing activity. Smaller and potentially cheaper than full TB-500; less clinical data.",
    typical_dosage: "500 mcg – 2 mg subcutaneous injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Store refrigerated. Shorter half-life than full TB-500 — more frequent dosing may be required.",
    mechanism: [
      {
        title: "Actin Sequestration via the LKKTET-Adjacent Motif",
        body: "The 17-23 fragment contains the core structural region responsible for G-actin binding in Thymosin Beta-4. By sequestering G-actin, it regulates the actin polymerization/depolymerization balance, promoting cell motility, migration into wound sites, and cytoskeletal remodeling necessary for tissue repair.",
      },
      {
        title: "Anti-Inflammatory and Angiogenic Activity",
        body: "Preclinical data suggests the fragment retains the anti-inflammatory properties of full TB-500, reducing pro-inflammatory cytokine expression and promoting vascularization of injured tissue via VEGF-related pathways — though with less evidence than the full molecule.",
      },
    ],
    research_applications: [
      {
        area: "Tissue Repair and Wound Healing",
        evidence: "Early",
        description: "Primary proposed indication, extrapolated from full TB-500 research. Preclinical wound healing models show activity. No direct comparison RCT vs. full TB-500 exists.",
      },
      {
        area: "Inflammation Reduction",
        evidence: "Early",
        description: "Anti-inflammatory effects demonstrated in preclinical models. Mechanistically plausible given the actin-binding activity retained in the fragment.",
      },
    ],
    dosage: {
      disclaimer: "TB-500 Fragment 17-23 has considerably less research than full-length TB-500. Dosing is extrapolated from TB-500 protocols adjusted for molecular weight difference. Research use only. Not medical advice.",
      ranges: [
        {
          route: "Subcutaneous injection",
          range: "500 mcg – 2 mg",
          frequency: "2–3x weekly",
          notes: "Less data on optimal frequency than full TB-500. Some researchers use daily dosing given the shorter estimated half-life. Start conservative.",
        },
      ],
    },
    safety_profile: {
      rating: "Unknown — Limited Independent Data vs Full TB-500",
      known_effects: ["Injection site reactions", "Water retention (reported, less than full TB-500 anecdotally)"],
      unknown_risks: [
        "Comparative safety vs full TB-500 not characterized",
        "Long-term effects unknown",
        "Fragment pharmacokinetics differ from full molecule — tissue distribution may vary",
      ],
    },
    studies: [
      {
        title: "The actin-sequestering domain of thymosin beta-4 promotes cell motility",
        authors: "Safer D, Elzinga M, Nachmias VT.",
        year: 1991,
        journal: "Journal of Biological Chemistry",
        pmid: "2023937",
        url: "https://pubmed.ncbi.nlm.nih.gov/2023937/",
      },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/2023937/"],
  },

  {
    name: "MK-677",
    full_name: "MK-677 (Ibutamoren / Ibutamoren Mesylate)",
    slug: "mk-677",
    tagline: "An orally active, non-peptide GH secretagogue that mimics ghrelin to stimulate sustained GH and IGF-1 elevation — the only orally bioavailable GHS-R agonist widely available, but not a peptide.",
    aliases: ["Ibutamoren", "Ibutamoren Mesylate", "L-163,191", "MK-0677"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~24 hours (oral)",
    molecular_weight: "624.8 g/mol",
    sequence: "N/A — small molecule, not a peptide",
    category: "hormones",
    overview: "MK-677 (ibutamoren) is a non-peptide, orally active GH secretagogue developed by Merck. It acts as a potent ghrelin mimetic, binding the GHS-R1a receptor and stimulating pulsatile GH release and downstream IGF-1 production. Unlike peptide GH secretagogues (CJC-1295, Ipamorelin, GHRP-2), MK-677 is orally bioavailable with a ~24-hour half-life, making it extremely convenient — a single daily oral dose produces sustained GH/IGF-1 elevation throughout the day. It has been studied in phase I/II trials for GH deficiency, muscle wasting, osteoporosis, and Alzheimer's disease, with generally positive results for GH/IGF-1 elevation, lean mass preservation, and bone density. It is technically not a peptide — it is a small molecule spiroindoline compound — but it is widely sold alongside peptides and fits squarely in the GH secretagogue category. Phase III trials were not completed; it remains research-only.",
    description: "Orally active GH secretagogue — the only once-daily oral option for GH axis stimulation. Not a peptide (small molecule) but sold and stacked alongside GH peptides. Strong clinical data for GH/IGF-1 elevation.",
    typical_dosage: "10–25 mg oral, once daily",
    reconstitution_instructions: "Sold as oral liquid or capsules. No reconstitution required. Take with or without food; some prefer evening dosing to align with sleep-related GH pulses.",
    mechanism: [
      {
        title: "Ghrelin Receptor (GHS-R1a) Agonism",
        body: "MK-677 binds and activates the ghrelin receptor (GHS-R1a) on pituitary somatotrophs and hypothalamic neurons, mimicking ghrelin's GH-releasing action. This drives pulsatile GH secretion and sustained elevation of circulating IGF-1 via downstream hepatic signaling.",
      },
      {
        title: "24-Hour GH/IGF-1 Elevation from a Single Dose",
        body: "The ~24-hour half-life means once-daily dosing maintains elevated GH and IGF-1 throughout the day — a pharmacokinetic advantage over injectable peptide secretagogues that require multiple daily injections for equivalent coverage.",
      },
      {
        title: "Appetite Stimulation via Ghrelin Mimicry",
        body: "Like GHRP-6, MK-677's ghrelin receptor activity drives significant appetite stimulation — a desirable effect in mass-gaining contexts and a potential adverse effect in others.",
      },
    ],
    research_applications: [
      {
        area: "GH/IGF-1 Elevation and Body Composition",
        evidence: "Moderate",
        description: "Multiple phase II trials confirm robust GH and IGF-1 elevation. Studies in elderly subjects show preservation of lean mass and reductions in fat mass. The most clinically validated effect of MK-677.",
      },
      {
        area: "Bone Density",
        evidence: "Moderate",
        description: "Phase II data shows increased bone mineral density with chronic MK-677 use, driven by sustained IGF-1 elevation. Studied in elderly women with hip fractures.",
      },
      {
        area: "Sleep Quality",
        evidence: "Moderate",
        description: "Controlled trials show MK-677 increases REM and slow-wave sleep duration. Evening dosing is preferred to leverage this effect.",
      },
      {
        area: "Alzheimer's Disease / Cognition",
        evidence: "Early",
        description: "Phase II trial in Alzheimer's patients — inconclusive for primary cognitive endpoints but confirmed GH/IGF-1 elevation. IGF-1's neuroprotective role is the mechanistic basis.",
      },
    ],
    dosage: {
      disclaimer: "MK-677 is not a peptide — it is a small molecule. It significantly elevates IGF-1 chronically, which carries theoretical long-term risks. It also elevates fasting glucose and can worsen insulin resistance. Research use only. Not medical advice.",
      ranges: [
        {
          route: "Oral",
          range: "10–25 mg",
          frequency: "Once daily",
          notes: "Most research used 25 mg/day. 10–15 mg is often sufficient for research purposes with fewer side effects. Evening dosing preferred to align with sleep GH pulse. Cycle breaks (e.g. 3 months on / 1 month off) are common practice in research protocols.",
        },
      ],
    },
    safety_profile: {
      rating: "Moderate — Well-Characterized in Phase II Trials",
      known_effects: [
        "Increased appetite (significant)",
        "Water retention / transient edema",
        "Elevated fasting glucose (insulin resistance)",
        "Fatigue / lethargy (especially initially)",
        "Tingling / numbness (carpal tunnel-like, reversible)",
        "Elevated IGF-1 — requires monitoring with chronic use",
      ],
      unknown_risks: [
        "Long-term cancer risk with sustained IGF-1 elevation not characterized",
        "Cardiovascular effects with multi-year use unknown",
        "Not recommended in active cancer or strong family history of hormone-sensitive cancers",
      ],
    },
    studies: [
      {
        title: "Effects of an oral ghrelin mimetic on body composition and clinical outcomes in healthy older adults",
        authors: "Nass R, et al.",
        year: 2008,
        journal: "Annals of Internal Medicine",
        pmid: "18765703",
        url: "https://pubmed.ncbi.nlm.nih.gov/18765703/",
      },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/18765703/"],
  },

];

async function main() {
  log(`Seeding ${PEPTIDES.length} profiles…`);
  for (const p of PEPTIDES) {
    const { error } = await db.from("peptides").upsert(p, { onConflict: "slug" });
    if (error) log(`ERROR ${p.name}: ${error.message}`);
    else log(`✓ ${p.name} (${p.slug})`);
  }
  log("Done.");
}
main();
