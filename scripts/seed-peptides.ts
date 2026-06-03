/**
 * scripts/seed-peptides.ts
 * Upserts peptide profile data into the peptides table.
 * Safe to re-run — uses upsert on slug.
 *
 * Run: npm run seed:peptides
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-peptides";

function log(msg: string) {
  console.log(`[${SCRIPT}] ${msg}`);
}

// ── Peptide records ────────────────────────────────────────────────────────

const PEPTIDES = [
  {
    name: "BPC-157",
    full_name: "Body Protection Compound-157",
    slug: "bpc-157",
    tagline: "A synthetic pentadecapeptide derived from gastric juice, researched for tissue repair and gut health.",
    aliases: ["PL 14736", "Bepecin", "PLD-116"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~4 hours (subcutaneous)",
    molecular_weight: "1419.53 g/mol",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
    overview: "BPC-157 is a 15-amino-acid peptide fragment derived from a protective protein found in gastric juice. First isolated in the 1990s, it has been extensively studied in rodent models for its regenerative properties across connective tissue, tendon, bone, and the gastrointestinal tract. Unlike many research peptides, BPC-157 appears to be stable in gastric acid, which has driven interest in oral administration for gut conditions alongside the more conventional injectable routes.",
    description: "Synthetic peptide fragment derived from human gastric juice. Researched for tissue repair, GI healing, and anti-inflammatory effects.",
    what_it_does: "Promotes angiogenesis, accelerates wound healing, modulates nitric oxide synthesis, and exhibits neuroprotective effects.",
    typical_dosage: "250–500 mcg per day, subcutaneous or intramuscular injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 500 mcg/mL (1 mg in 2 mL bac water).",
    category: "healing",
    mechanism: [
      {
        title: "Nitric Oxide Pathway Modulation",
        body: "BPC-157 influences nitric oxide (NO) synthesis, which plays a central role in vascular tone and wound healing. It appears to upregulate endothelial nitric oxide synthase (eNOS), promoting vasodilation and blood flow to injured tissues."
      },
      {
        title: "Angiogenesis Promotion",
        body: "The peptide stimulates the formation of new blood vessels through upregulation of VEGF (vascular endothelial growth factor). This increased vascularization accelerates nutrient and oxygen delivery to healing tissues."
      },
      {
        title: "Growth Factor Upregulation",
        body: "BPC-157 interacts with several growth factor systems including EGF, FGF, and HGF pathways, promoting cellular proliferation and migration that are foundational to tissue repair."
      },
      {
        title: "Tendon-to-Bone Healing",
        body: "Studies suggest BPC-157 stimulates outgrowth of tendon fibroblasts and the expression of tendon-specific proteins, making it a subject of orthopedic research for tendon and ligament injuries."
      }
    ],
    research_applications: [
      {
        area: "Tendon & Ligament Repair",
        evidence: "Strong",
        description: "Multiple animal studies demonstrate accelerated tendon-to-bone healing, with improved biomechanical properties observed in Achilles tendon transection models."
      },
      {
        area: "Gastrointestinal Healing",
        evidence: "Moderate",
        description: "Research in rodent models of IBD, fistulas, and gastric ulcers consistently shows accelerated mucosal healing. The gastric acid stability of BPC-157 makes oral administration potentially viable."
      },
      {
        area: "Muscle Injury Recovery",
        evidence: "Moderate",
        description: "Animal studies show reduced recovery time from muscle crush injuries and improved functional outcomes, attributed to enhanced angiogenesis and satellite cell activation."
      },
      {
        area: "Neurological Protection",
        evidence: "Early",
        description: "Emerging research in rodent models suggests neuroprotective effects following traumatic brain injury and spinal cord injury, potentially via dopaminergic system modulation."
      },
      {
        area: "Joint & Cartilage Health",
        evidence: "Animal",
        description: "Rodent studies show BPC-157 reduces cartilage degeneration in arthritis models, though no human clinical trials have been conducted."
      }
    ],
    dosage: {
      disclaimer: "BPC-157 is a research compound. These dosages are derived from animal studies and anecdotal human reports only. There are no FDA-approved clinical dosing guidelines. Consult a qualified healthcare professional before use.",
      ranges: [
        {
          route: "Subcutaneous (Systemic)",
          range: "250–500 mcg",
          frequency: "Once daily",
          notes: "Most common research protocol. Inject near the site of injury when possible for local effect."
        },
        {
          route: "Intramuscular",
          range: "250–500 mcg",
          frequency: "Once daily",
          notes: "Used when targeting deep muscle or tendon injuries. Slightly higher bioavailability than SC in some models."
        },
        {
          route: "Oral",
          range: "500 mcg–1 mg",
          frequency: "Once daily (fasted)",
          notes: "Gastric acid stability suggests oral administration may be viable for GI conditions. Bioavailability data in humans is lacking."
        }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: [
        "Injection site reactions (redness, mild swelling)",
        "Nausea (rare, typically dose-dependent)",
        "Lightheadedness shortly after injection",
        "Vivid dreams reported anecdotally"
      ],
      unknown_risks: [
        "Long-term effects in humans are unknown — no human clinical trials completed",
        "Potential interaction with angiogenesis in existing tumors is unstudied",
        "Effects on hormone axes with chronic use are not characterized",
        "Immunogenicity with prolonged exposure has not been evaluated"
      ]
    },
    studies: [
      {
        title: "Stable gastric pentadecapeptide BPC 157 in trials for inflammatory bowel disease (PL-10, PLD-116, PL 14736, Pliva, Croatia)",
        authors: "Sikiric P, Seiwerth S, Rucman R, et al.",
        year: 2006,
        journal: "Current Pharmaceutical Design",
        pmid: "16918442",
        url: "https://pubmed.ncbi.nlm.nih.gov/16918442/"
      },
      {
        title: "Pentadecapeptide BPC 157 enhances the growth hormone receptor expression in tendon fibroblasts",
        authors: "Chang CH, Tsai WC, Lin MS, Hsu YH, Pang JH.",
        year: 2011,
        journal: "Molecules",
        pmid: "21245816",
        url: "https://pubmed.ncbi.nlm.nih.gov/21245816/"
      },
      {
        title: "BPC 157 and standard angiogenic growth factors. Gastrointestinal tract healing, lessons from tendons, ligaments and bones",
        authors: "Sikiric P, Rucman R, Turkovic B, et al.",
        year: 2018,
        journal: "Current Pharmaceutical Design",
        pmid: "29589525",
        url: "https://pubmed.ncbi.nlm.nih.gov/29589525/"
      },
      {
        title: "Brain-gut Axis and Pentadecapeptide BPC 157: Theoretical and Practical Implications",
        authors: "Sikiric P, Seiwerth S, Rucman R, et al.",
        year: 2017,
        journal: "Current Neuropharmacology",
        pmid: "26903569",
        url: "https://pubmed.ncbi.nlm.nih.gov/26903569/"
      }
    ],
    research_links: [
      "https://pubmed.ncbi.nlm.nih.gov/16918442/",
      "https://pubmed.ncbi.nlm.nih.gov/21245816/"
    ]
  },

  {
    name: "TB-500",
    full_name: "Thymosin Beta-4 Fragment (17–23)",
    slug: "tb-500",
    tagline: "A synthetic fragment of Thymosin Beta-4 researched for tissue repair, flexibility, and inflammation reduction.",
    aliases: ["Thymosin Beta-4", "Tβ4", "TB4"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "Not well established; estimated days",
    molecular_weight: "895.0 g/mol (fragment)",
    sequence: "Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu",
    overview: "TB-500 is a synthetic peptide that corresponds to the active region of Thymosin Beta-4 (Tβ4), a naturally occurring 43-amino-acid protein found in high concentrations in blood platelets and wound fluid. The Tβ4 protein plays a central role in actin sequestration and cell migration. TB-500, as the 17–23 fragment, retains much of Tβ4's biological activity and is researched for its potential to accelerate wound healing and reduce inflammation. It has gained traction in sports medicine research circles, though no human clinical trials have been published.",
    description: "Synthetic fragment of the naturally occurring Thymosin Beta-4 protein. Researched for tissue healing and anti-inflammatory properties.",
    what_it_does: "Promotes cell migration and proliferation, modulates actin dynamics, reduces inflammation, and supports angiogenesis.",
    typical_dosage: "2–2.5 mg twice per week, subcutaneous injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "healing",
    mechanism: [
      {
        title: "Actin Sequestration",
        body: "Thymosin Beta-4 binds G-actin (monomeric actin) with high affinity, regulating the pool of actin available for polymerization. This modulates cell motility and migration, processes fundamental to wound healing."
      },
      {
        title: "Cell Migration Promotion",
        body: "By regulating actin dynamics, TB-500 promotes the migration of keratinocytes, endothelial cells, and other repair-critical cells to sites of injury, accelerating wound closure."
      },
      {
        title: "Anti-inflammatory Effects",
        body: "TB-500 downregulates inflammatory cytokines including IL-1β and TNF-α. This dual action — promoting healing while reducing inflammation — differentiates it from many other regenerative research compounds."
      }
    ],
    research_applications: [
      {
        area: "Wound Healing",
        evidence: "Moderate",
        description: "Preclinical studies demonstrate accelerated closure of dermal wounds and reduced scarring. Phase I/II trials of native Tβ4 have been conducted for corneal and dermal wounds."
      },
      {
        area: "Cardiac Repair",
        evidence: "Animal",
        description: "Rodent models of myocardial infarction show Tβ4 promotes cardiomyocyte survival and angiogenesis, reducing infarct size."
      },
      {
        area: "Tendon & Muscle Repair",
        evidence: "Animal",
        description: "Animal studies suggest improved tendon and muscle healing, with reduced fibrosis. Popular anecdotally in athletic circles though no RCTs exist."
      }
    ],
    dosage: {
      disclaimer: "TB-500 is a research compound with no approved clinical dosing guidelines. Dosages below are derived from anecdotal reports and animal research extrapolations only. Not medical advice.",
      ranges: [
        {
          route: "Subcutaneous",
          range: "2–2.5 mg",
          frequency: "Twice per week",
          notes: "Common loading protocol: 2–2.5 mg 2x/week for 4–6 weeks, then taper to 1–2 mg/week maintenance."
        },
        {
          route: "Intramuscular",
          range: "2–2.5 mg",
          frequency: "Twice per week",
          notes: "IM administration is sometimes preferred for muscle-specific injuries."
        }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data",
      known_effects: [
        "Injection site discomfort",
        "Fatigue reported by some users",
        "Headache (anecdotal)"
      ],
      unknown_risks: [
        "No long-term human safety data",
        "Potential to stimulate angiogenesis in tumors — significant concern for cancer patients",
        "Interaction with cardiac remodeling processes in healthy individuals is uncharacterized",
        "Effects on immune function with chronic use are unknown"
      ]
    },
    studies: [
      {
        title: "Thymosin beta 4: a multi-functional regenerative peptide. Basic properties and clinical applications",
        authors: "Goldstein AL, Hannappel E, Sosne G, Kleinman HK.",
        year: 2012,
        journal: "Expert Opinion on Biological Therapy",
        pmid: "22107110",
        url: "https://pubmed.ncbi.nlm.nih.gov/22107110/"
      },
      {
        title: "Thymosin β4 and cardiac repair",
        authors: "Bock-Marquette I, Saxena A, White MD, Dimaio JM, Srivastava D.",
        year: 2004,
        journal: "Nature",
        pmid: "15286668",
        url: "https://pubmed.ncbi.nlm.nih.gov/15286668/"
      }
    ],
    research_links: [
      "https://pubmed.ncbi.nlm.nih.gov/22107110/"
    ]
  },

  {
    name: "Ipamorelin",
    full_name: "Ipamorelin Acetate",
    slug: "ipamorelin",
    tagline: "A selective growth hormone secretagogue with a clean side-effect profile, widely researched for GH pulse stimulation.",
    aliases: ["NNC 26-0161", "Ipam"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~2 hours",
    molecular_weight: "711.85 g/mol",
    sequence: "Aib-His-D-2-Nal-D-Phe-Lys-NH2",
    overview: "Ipamorelin is a pentapeptide and selective ghrelin receptor agonist (GHS-R1a) that stimulates the pituitary gland to release growth hormone (GH) in a pulsatile, physiological manner. First described in 1998, it is distinguished from other GH secretagogues by its high selectivity — it does not significantly raise cortisol, prolactin, or ACTH at research doses. This specificity makes it one of the most studied and clinically interesting GH-releasing peptides. It is commonly researched in combination with CJC-1295 for sustained GH elevation.",
    description: "Selective ghrelin receptor agonist that stimulates pulsatile growth hormone release without significantly raising cortisol or prolactin.",
    what_it_does: "Stimulates pituitary GH release, supports body composition, bone density, and recovery without the cortisol/prolactin elevation seen with other secretagogues.",
    typical_dosage: "100–300 mcg per injection, 1–3x daily, subcutaneous",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1–2 mg/mL.",
    category: "performance",
    mechanism: [
      {
        title: "Ghrelin Receptor Agonism (GHS-R1a)",
        body: "Ipamorelin binds and activates the ghrelin receptor (GHS-R1a) in the pituitary gland, triggering growth hormone release. Unlike ghrelin itself, ipamorelin does not stimulate appetite or significantly raise IGF-1 at typical research doses."
      },
      {
        title: "Selective GH Pulse Stimulation",
        body: "Ipamorelin stimulates GH in a pulsatile fashion that mimics natural GH secretion rhythms. This selectivity — relative to GHRP-2 and GHRP-6 — makes it less likely to desensitize the GH axis with repeated use."
      },
      {
        title: "Minimal Cortisol & Prolactin Effect",
        body: "Unlike GHRP-2, ipamorelin does not meaningfully elevate cortisol or prolactin at research-relevant doses. This is considered a significant advantage for protocols requiring sustained use."
      }
    ],
    research_applications: [
      {
        area: "Growth Hormone Deficiency",
        evidence: "Strong",
        description: "Multiple clinical studies demonstrate ipamorelin's ability to restore physiological GH pulsatility in GH-deficient subjects, with a favorable safety profile compared to recombinant GH."
      },
      {
        area: "Body Composition",
        evidence: "Moderate",
        description: "GH elevation from ipamorelin may support lean mass retention and fat metabolism, particularly in GH-deficient populations. Evidence in healthy adults is more limited."
      },
      {
        area: "Bone Density",
        evidence: "Moderate",
        description: "Animal studies and extrapolation from GH research suggest ipamorelin may support bone mineral density, relevant for aging and osteoporosis research contexts."
      },
      {
        area: "Post-Surgical Recovery",
        evidence: "Human",
        description: "A clinical trial (NCT) investigated ipamorelin for attenuating GH axis suppression following major abdominal surgery, showing promising results in maintaining anabolic tone."
      }
    ],
    dosage: {
      disclaimer: "Ipamorelin is a research compound. Dosing below reflects published research protocols and anecdotal data. There are no FDA-approved clinical dosing guidelines. Consult a qualified healthcare professional before use.",
      ranges: [
        {
          route: "Subcutaneous",
          range: "100–300 mcg",
          frequency: "1–3x daily (fasted)",
          notes: "Best administered on an empty stomach or post-exercise to align with natural GH peaks. Common protocol: 200 mcg before bed."
        }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: [
        "Mild injection site irritation",
        "Water retention at higher doses",
        "Transient tingling or flushing (less common than with GHRP-6)",
        "Mild increase in hunger at higher doses"
      ],
      unknown_risks: [
        "Long-term effects on GH axis regulation are not fully characterized",
        "Potential for IGF-1 elevation with chronic high-dose use and associated risks",
        "Interaction with insulin sensitivity at supraphysiological GH levels",
        "Pediatric use contraindicated — potential effects on growth plate closure are unstudied"
      ]
    },
    studies: [
      {
        title: "Ipamorelin, the first selective growth hormone secretagogue",
        authors: "Raun K, Hansen BS, Johansen NL, et al.",
        year: 1998,
        journal: "European Journal of Endocrinology",
        pmid: "9849822",
        url: "https://pubmed.ncbi.nlm.nih.gov/9849822/"
      },
      {
        title: "A selective nonpeptide growth hormone secretagogue",
        authors: "Ankersen M, Johansen NL, Madsen K, et al.",
        year: 1998,
        journal: "Journal of Medicinal Chemistry",
        pmid: "9703476",
        url: "https://pubmed.ncbi.nlm.nih.gov/9703476/"
      },
      {
        title: "Effects of ipamorelin on GH release in humans",
        authors: "Svensson J, Lönn L, Jansson JO, et al.",
        year: 1997,
        journal: "Journal of Clinical Endocrinology & Metabolism",
        pmid: "9386802",
        url: "https://pubmed.ncbi.nlm.nih.gov/9386802/"
      }
    ],
    research_links: [
      "https://pubmed.ncbi.nlm.nih.gov/9849822/",
      "https://pubmed.ncbi.nlm.nih.gov/9703476/"
    ]
  }
];

// ── Upsert ─────────────────────────────────────────────────────────────────

async function main() {
  log(`Upserting ${PEPTIDES.length} peptides…`);

  const { error } = await db
    .from("peptides")
    .upsert(PEPTIDES, { onConflict: "slug" });

  if (error) {
    console.error(`[${SCRIPT}] ERROR:`, error.message);
    process.exit(1);
  }

  log(`Done. ${PEPTIDES.length} peptides upserted.`);
}

main();
