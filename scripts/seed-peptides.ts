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
  },

  // ── Batch 2 ───────────────────────────────────────────────────────────────

  {
    name: "Sermorelin",
    full_name: "Sermorelin Acetate",
    slug: "sermorelin",
    tagline: "A synthetic analog of GHRH that stimulates natural growth hormone release — one of the most studied GH secretagogues.",
    aliases: ["GHRH 1-29", "GRF 1-29"],
    fda_status: "not-approved",
    research_status: "Strong",
    half_life: "~10–20 minutes",
    molecular_weight: "3357.9 g/mol",
    sequence: "Tyr-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH2",
    overview: "Sermorelin is a synthetic 29-amino-acid analog of endogenous growth hormone-releasing hormone (GHRH). It was FDA-approved for pediatric GH deficiency diagnosis in the 1990s (withdrawn from US market in 2008 for commercial, not safety, reasons). Sermorelin stimulates the pituitary to produce GH in a physiological, pulsatile manner — preserving the body's natural feedback regulation. This makes it mechanistically distinct from and often considered safer than exogenous GH administration. It remains widely used in anti-aging and wellness medicine.",
    description: "Synthetic GHRH analog stimulating pituitary growth hormone secretion via a physiological feedback-regulated mechanism.",
    typical_dosage: "200–500 mcg subcutaneously at bedtime",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "GHRH Receptor Agonism", body: "Sermorelin binds the pituitary GHRH receptor (GHRHR), activating adenylyl cyclase and increasing cAMP. This triggers GH synthesis and pulsatile release from somatotroph cells — the same mechanism as endogenous GHRH." },
      { title: "Preserved Feedback Regulation", body: "Because sermorelin stimulates endogenous GH production rather than delivering exogenous GH, the hypothalamic-pituitary axis remains intact. Somatostatin feedback still modulates output, reducing risk of oversuppression or excess." },
      { title: "Liver IGF-1 Induction", body: "GH released in response to sermorelin triggers hepatic IGF-1 synthesis. IGF-1 mediates many of GH's anabolic and tissue-repair effects including protein synthesis and lipolysis." }
    ],
    research_applications: [
      { area: "GH Deficiency Treatment", evidence: "Strong", description: "Sermorelin was historically FDA-approved for GH deficiency diagnosis and has been used therapeutically. Multiple clinical trials demonstrate its ability to restore GH pulsatility in both children and adults." },
      { area: "Anti-Aging & Body Composition", evidence: "Moderate", description: "Studies in older adults with relative GH deficiency show improvements in lean mass, fat mass, bone density, and sleep quality with sermorelin administration." },
      { area: "Sleep Quality", evidence: "Moderate", description: "GH secretion is predominantly nocturnal. Sermorelin administered at bedtime aligns with this rhythm and may enhance slow-wave sleep, improving recovery and cognition." }
    ],
    dosage: {
      disclaimer: "Sermorelin is a research compound. These protocols are derived from clinical literature and anti-aging medicine practice. Not FDA-approved for these uses. Consult a qualified physician.",
      ranges: [
        { route: "Subcutaneous (at bedtime)", range: "200–500 mcg", frequency: "Daily", notes: "Bedtime injection aligns with natural GH pulsatility. Fast for 2+ hours before injection for maximum effect." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Injection site redness or mild pain", "Transient facial flushing", "Headache (dose-dependent)", "Water retention at higher doses"],
      unknown_risks: ["Long-term effects beyond 2-year clinical trials are not well characterized", "Potential interaction with active cancers via IGF-1 elevation", "Effects of chronic use on GH axis desensitization"]
    },
    studies: [
      { title: "Sermorelin: a better approach to management of adult-onset growth hormone insufficiency?", authors: "Walker RF.", year: 2006, journal: "Clinical Interventions in Aging", pmid: "18047263", url: "https://pubmed.ncbi.nlm.nih.gov/18047263/" },
      { title: "Growth hormone-releasing hormone analog (sermorelin) effects on adult pituitary", authors: "Prakash A, Goa KL.", year: 1999, journal: "BioDrugs", pmid: "18020633", url: "https://pubmed.ncbi.nlm.nih.gov/18020633/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/18047263/"]
  },

  {
    name: "CJC-1295",
    full_name: "CJC-1295 (Without DAC)",
    slug: "cjc-1295",
    tagline: "A modified GHRH analog with extended half-life, commonly stacked with Ipamorelin for synergistic GH pulse amplification.",
    aliases: ["Modified GRF 1-29", "Mod GRF 1-29", "CJC-1295 no DAC"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~30 minutes",
    molecular_weight: "3367.9 g/mol",
    sequence: "Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg-NH2",
    overview: "CJC-1295 without DAC (also called Modified GRF 1-29) is a modified version of sermorelin with four amino acid substitutions that extend its half-life from ~10 minutes to ~30 minutes while preserving GHRH receptor affinity. It is almost exclusively used in combination with a GHRP such as Ipamorelin, as the two work synergistically — CJC-1295 amplifies the GH pulse while Ipamorelin triggers its release. This combination is considered one of the most physiologically sound GH optimization protocols in research medicine.",
    description: "Modified GHRH analog with extended half-life. Used in combination with GHRPs to amplify pulsatile GH secretion.",
    typical_dosage: "100 mcg subcutaneously, combined with 100–300 mcg Ipamorelin",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "GHRH Receptor Agonism with Extended Activity", body: "CJC-1295's four amino acid substitutions protect it from dipeptidyl aminopeptidase IV (DPP-IV) cleavage, extending its active half-life to ~30 minutes. This allows a single injection to meaningfully amplify the GH pulse triggered by a co-administered GHRP." },
      { title: "Synergistic Action with GHRPs", body: "GHRH analogs and GHRPs act through distinct receptor pathways. When combined, they produce GH pulses 2–10x larger than either agent alone. CJC-1295 (no DAC) + Ipamorelin is the most common research protocol exploiting this synergy." }
    ],
    research_applications: [
      { area: "GH Pulse Amplification", evidence: "Moderate", description: "Combined GHRH/GHRP protocols reliably produce robust GH pulses in clinical and research settings, supporting muscle preservation, fat metabolism, and recovery." },
      { area: "Body Composition", evidence: "Moderate", description: "GH elevations from CJC-1295/Ipamorelin combinations support lean mass retention and fat reduction, particularly in GH-deficient or aging populations." }
    ],
    dosage: {
      disclaimer: "CJC-1295 (no DAC) is a research compound. These protocols are drawn from anti-aging clinical practice and research literature. Not medical advice.",
      ranges: [
        { route: "Subcutaneous (with Ipamorelin)", range: "100 mcg", frequency: "1–3x daily", notes: "Always co-administer with a GHRP. Inject fasted, ideally before sleep or after training. 100 mcg CJC-1295 + 200 mcg Ipamorelin is the most studied combination." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Water retention", "Mild fatigue or lethargy post-injection", "Transient flushing", "Increased hunger (less than GHRP-6)"],
      unknown_risks: ["Long-term GH axis effects with continuous use", "IGF-1 elevation and associated cancer risk with chronic supraphysiological use", "Effects in oncology patients contraindicated"]
    },
    studies: [
      { title: "Stimulation of growth hormone (GH) and insulin-like growth factor I secretion by a single injection of a long-acting analog of GHRH", authors: "Jetté L, et al.", year: 2005, journal: "Journal of Endocrinology", pmid: "15755685", url: "https://pubmed.ncbi.nlm.nih.gov/15755685/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/15755685/"]
  },

  {
    name: "Tesamorelin",
    full_name: "Tesamorelin Acetate",
    slug: "tesamorelin",
    tagline: "The only FDA-approved GHRH analog — approved for HIV-associated lipodystrophy, and studied for visceral fat reduction and cognitive health.",
    aliases: ["TH9507", "Egrifta"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~26 minutes",
    molecular_weight: "5135.7 g/mol",
    sequence: "Trans-3-hexenoic acid-Tyr-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH2",
    overview: "Tesamorelin is a synthetic GHRH analog distinguished by an N-terminal trans-3-hexenoic acid modification that extends its half-life and metabolic stability. It is FDA-approved (as Egrifta) for the reduction of excess abdominal fat in HIV-infected adults with lipodystrophy — a condition causing abnormal fat redistribution from antiretroviral therapy. Beyond this approved indication, tesamorelin has been investigated for visceral adiposity in non-HIV populations and, notably, for cognitive decline in older adults with mild cognitive impairment. It represents the gold standard among GHRH analogs due to its clinical validation.",
    description: "FDA-approved GHRH analog for HIV lipodystrophy. Also studied for visceral fat reduction and cognitive preservation in aging populations.",
    typical_dosage: "1–2 mg subcutaneously once daily",
    reconstitution_instructions: "Reconstitute with provided diluent. Each vial typically contains 1 mg tesamorelin.",
    category: "performance",
    mechanism: [
      { title: "GHRH Receptor Agonism", body: "Tesamorelin binds the pituitary GHRH receptor with high affinity, triggering pulsatile GH release. The N-terminal modification protects against DPP-IV degradation, extending active half-life." },
      { title: "Visceral Fat Reduction via GH/IGF-1", body: "GH promotes lipolysis, particularly in visceral adipose tissue which is more metabolically sensitive to GH than subcutaneous fat. Tesamorelin's GH elevation preferentially reduces visceral adiposity." },
      { title: "Neuroprotective Pathways", body: "IGF-1 generated in response to tesamorelin crosses the blood-brain barrier and supports neuronal survival, synaptic plasticity, and amyloid-beta clearance — mechanisms relevant to Alzheimer's disease research." }
    ],
    research_applications: [
      { area: "HIV Lipodystrophy", evidence: "Strong", description: "FDA-approved indication. Multiple Phase III trials demonstrate significant visceral fat reduction (15–20%) over 26 weeks in HIV+ adults on antiretroviral therapy." },
      { area: "Visceral Adiposity (non-HIV)", evidence: "Moderate", description: "Studies in overweight non-HIV adults show meaningful visceral fat reduction, though effects attenuate after discontinuation." },
      { area: "Cognitive Function in Aging", evidence: "Human", description: "A randomized clinical trial (NCT01713946) found tesamorelin improved cognitive function and reduced amyloid accumulation in older adults with mild cognitive impairment." }
    ],
    dosage: {
      disclaimer: "Tesamorelin is FDA-approved only for HIV-associated lipodystrophy. Off-label research use should occur under physician supervision. Not for self-administration.",
      ranges: [
        { route: "Subcutaneous (abdominal)", range: "1–2 mg", frequency: "Once daily", notes: "Rotate injection sites. Approved dose is 2 mg/day for HIV lipodystrophy. Research protocols for non-HIV uses often use 1–2 mg/day." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Injection site reactions (erythema, pruritus)", "Peripheral edema", "Arthralgia and myalgia", "Glucose intolerance at higher doses", "Headache"],
      unknown_risks: ["Long-term cardiovascular effects with chronic use in non-HIV populations", "Potential interaction with active malignancies via IGF-1 elevation", "Cognitive effects in non-MCI populations are unstudied"]
    },
    studies: [
      { title: "Effects of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation", authors: "Falutz J, et al.", year: 2010, journal: "AIDS", pmid: "20581652", url: "https://pubmed.ncbi.nlm.nih.gov/20581652/" },
      { title: "Tesamorelin improves cognitive function in older adults", authors: "Baker LD, et al.", year: 2012, journal: "Neurology", pmid: "22801723", url: "https://pubmed.ncbi.nlm.nih.gov/22801723/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/20581652/"]
  },

  {
    name: "PT-141",
    full_name: "Bremelanotide",
    slug: "pt-141",
    tagline: "An FDA-approved melanocortin receptor agonist for female sexual dysfunction, and studied in men for erectile and libido enhancement.",
    aliases: ["Bremelanotide", "PT141"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~2.7 hours",
    molecular_weight: "1025.2 g/mol",
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
    overview: "PT-141 (bremelanotide) is a cyclic heptapeptide derived from the hormone alpha-MSH (alpha-melanocyte-stimulating hormone). Unlike most sexual function drugs that act on the vascular system (e.g. PDE5 inhibitors), PT-141 acts centrally through melanocortin receptors in the hypothalamus — directly modulating sexual motivation and arousal at the neurological level. It was FDA-approved in 2019 as Vyleesi for premenopausal women with hypoactive sexual desire disorder (HSDD). Research in men suggests benefits for erectile dysfunction, particularly in cases where PDE5 inhibitors are insufficient.",
    description: "Melanocortin receptor agonist acting centrally on sexual motivation. FDA-approved for HSDD in premenopausal women.",
    typical_dosage: "1.75 mg subcutaneously 45 minutes before sexual activity",
    reconstitution_instructions: "Available as pre-filled autoinjector (Vyleesi). Research peptide requires reconstitution with bacteriostatic water; typical concentration 1 mg/mL.",
    category: "sexual-health",
    mechanism: [
      { title: "Melanocortin Receptor Agonism (MC3R/MC4R)", body: "PT-141 activates MC3 and MC4 receptors in the hypothalamus and limbic system. MC4R activation in particular modulates dopaminergic pathways involved in sexual motivation, arousal, and reward — distinct from peripheral vascular mechanisms." },
      { title: "Central vs. Peripheral Action", body: "Unlike sildenafil or tadalafil, PT-141 does not require sexual stimulation-induced nitric oxide release. It generates sexual arousal via CNS pathways, making it effective in psychogenic and mixed-etiology sexual dysfunction." }
    ],
    research_applications: [
      { area: "Hypoactive Sexual Desire Disorder (Women)", evidence: "Strong", description: "FDA-approved for HSDD in premenopausal women. Phase III trials showed significant improvement in satisfying sexual events and desire scores vs. placebo." },
      { area: "Erectile Dysfunction (Men)", evidence: "Human", description: "Phase II trials in men with erectile dysfunction showed PT-141 significantly improved erectile function, including in a subset of men who did not respond to sildenafil." },
      { area: "Psychogenic Sexual Dysfunction", evidence: "Moderate", description: "Central mechanism makes PT-141 particularly relevant for sexual dysfunction with psychological components where peripheral vasodilators are ineffective." }
    ],
    dosage: {
      disclaimer: "PT-141 is FDA-approved only for HSDD in premenopausal women. Use in men is off-label. Always consult a physician before use. Not for self-administration.",
      ranges: [
        { route: "Subcutaneous (abdomen or thigh)", range: "1–1.75 mg", frequency: "As needed, max 1x per 24h", notes: "Inject 45 minutes before anticipated sexual activity. Start with 1 mg to assess tolerability. No more than 1 dose per 24 hours. Max 8 doses per month in FDA labeling." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea (most common, ~40% of users)", "Flushing", "Headache", "Transient blood pressure elevation", "Hyperpigmentation with repeated use"],
      unknown_risks: ["Cardiovascular effects with frequent use require monitoring", "Transient hypertension contraindicates use in uncontrolled hypertension", "Long-term hyperpigmentation effects with chronic use"]
    },
    studies: [
      { title: "Bremelanotide for Hypoactive Sexual Desire Disorder in Premenopausal Women", authors: "Simon JA, et al.", year: 2019, journal: "Obstetrics & Gynecology", pmid: "31348226", url: "https://pubmed.ncbi.nlm.nih.gov/31348226/" },
      { title: "PT-141: a melanocortin agonist for the treatment of sexual dysfunction", authors: "Molinoff PB, et al.", year: 2003, journal: "Annals of the New York Academy of Sciences", pmid: "14504454", url: "https://pubmed.ncbi.nlm.nih.gov/14504454/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/31348226/"]
  },

  {
    name: "AOD-9604",
    full_name: "Anti-Obesity Drug 9604",
    slug: "aod-9604",
    tagline: "A modified fragment of human growth hormone studied for fat metabolism and cartilage regeneration without GH's systemic effects.",
    aliases: ["hGH Fragment 177-191", "AOD9604"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~30 minutes",
    molecular_weight: "1817.1 g/mol",
    sequence: "Tyr-Leu-Arg-Ile-Val-Gln-Cys-Arg-Ser-Val-Glu-Gly-Ser-Cys-Gly-Phe-NH2",
    overview: "AOD-9604 is a modified fragment of human growth hormone (hGH) corresponding to amino acids 177–191 of the C-terminal region. It was specifically engineered to retain hGH's fat-burning properties while eliminating its growth-promoting and insulin-desensitizing effects. AOD-9604 reached Phase II/III clinical trials for obesity treatment, demonstrating a favorable safety profile though modest efficacy as a standalone anti-obesity drug. More recent research has investigated its potential in cartilage and bone repair, with a Phase II trial completed in osteoarthritis.",
    description: "Modified hGH fragment targeting lipolysis without growth or insulin effects. Investigated for obesity and cartilage repair.",
    typical_dosage: "300–600 mcg subcutaneously once daily",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "weight-loss",
    mechanism: [
      { title: "Beta-3 Adrenergic Receptor Stimulation", body: "AOD-9604 stimulates beta-3 adrenergic receptors in adipose tissue, activating hormone-sensitive lipase and triggering lipolysis — the breakdown of stored triglycerides into free fatty acids." },
      { title: "No IGF-1 or Insulin Axis Effects", body: "Unlike intact hGH, AOD-9604 does not bind the GH receptor and does not stimulate IGF-1 production or alter insulin sensitivity. This makes it potentially safer for metabolic risk populations." },
      { title: "Cartilage Repair Pathways", body: "In vitro and animal studies suggest AOD-9604 stimulates chondrocyte activity and proteoglycan synthesis, providing a rationale for its investigation in osteoarthritis and cartilage defects." }
    ],
    research_applications: [
      { area: "Fat Metabolism", evidence: "Moderate", description: "Multiple Phase I/II trials confirmed safety and demonstrated fat reduction. Phase III results were modest compared to approved GLP-1 agonists, limiting commercial development." },
      { area: "Cartilage & Bone Repair", evidence: "Early", description: "A Phase II trial investigated AOD-9604 (as Teriparatide alternative) in cartilage repair. Preclinical data is promising but human evidence remains limited." }
    ],
    dosage: {
      disclaimer: "AOD-9604 is a research compound. These protocols are derived from clinical trial data. Not FDA-approved. Consult a physician before use.",
      ranges: [
        { route: "Subcutaneous", range: "300–600 mcg", frequency: "Once daily (fasted)", notes: "Inject in the morning on an empty stomach to maximize lipolytic effect. Some protocols use 1 mg/day." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Injection site reactions", "Mild fatigue", "Headache (infrequent)"],
      unknown_risks: ["Long-term effects on lipid metabolism are not fully characterized", "Interaction with thyroid function has been suggested but not confirmed", "Effects in diabetic populations require further study"]
    },
    studies: [
      { title: "Effect of AOD9604 on Body Weight and Composition in Obese Subjects", authors: "Heffernan M, et al.", year: 2001, journal: "Endocrine", pmid: "11762705", url: "https://pubmed.ncbi.nlm.nih.gov/11762705/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/11762705/"]
  },

  {
    name: "Epithalon",
    full_name: "Epitalon (Epithalamin Tetrapeptide)",
    slug: "epithalon",
    tagline: "A tetrapeptide derived from the pineal gland studied for telomere elongation, anti-aging, and circadian rhythm regulation.",
    aliases: ["Epitalon", "Epithalamin", "Ala-Glu-Asp-Gly"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "Not well established",
    molecular_weight: "390.35 g/mol",
    sequence: "Ala-Glu-Asp-Gly",
    overview: "Epithalon (also spelled Epitalon) is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) based on epithalamin, a natural polypeptide extract from the bovine pineal gland. It was developed by the St. Petersburg Institute of Bioregulation and Gerontology, where most of the available research originated. Its proposed mechanisms include activation of telomerase (the enzyme that maintains telomere length), antioxidant effects, and normalization of circadian rhythm via pineal melatonin regulation. While the research is intriguing, the evidence base is largely from Russian institutions with limited independent replication.",
    description: "Synthetic pineal gland tetrapeptide studied for telomerase activation, anti-aging effects, and circadian regulation.",
    typical_dosage: "5–10 mg per day via injection for 10–20 day cycles",
    reconstitution_instructions: "Reconstitute with bacteriostatic water or saline. Typical concentration: 5 mg/mL.",
    category: "healing",
    mechanism: [
      { title: "Telomerase Activation", body: "Epithalon appears to activate the enzyme telomerase, which maintains and extends telomere length. Telomere shortening is associated with cellular aging; telomerase activation may theoretically slow this process." },
      { title: "Pineal Melatonin Regulation", body: "As a pineal peptide, epithalon is proposed to normalize pineal gland function and melatonin secretion — improving circadian rhythm, sleep quality, and melatonin's antioxidant effects." },
      { title: "Antioxidant Activity", body: "Epithalon demonstrates free radical scavenging activity in vitro and appears to reduce lipid peroxidation markers in animal models, potentially contributing to cellular longevity." }
    ],
    research_applications: [
      { area: "Telomere Biology & Anti-Aging", evidence: "Animal", description: "Animal studies demonstrate telomere elongation and extended lifespan in rodents. Human evidence is limited to observational data and small studies from Russian research groups." },
      { area: "Circadian Rhythm & Sleep", evidence: "Early", description: "Small human studies suggest improvements in sleep quality and melatonin levels in elderly subjects with disrupted circadian rhythms." },
      { area: "Cancer Research", evidence: "Animal", description: "Some animal studies suggest oncostatic effects and reduced cancer incidence, though mechanisms are unclear and human evidence is absent." }
    ],
    dosage: {
      disclaimer: "Epithalon is a research compound with limited peer-reviewed evidence. These protocols are derived from the Russian research literature. Not medical advice. Approach with appropriate scientific skepticism.",
      ranges: [
        { route: "Subcutaneous or Intramuscular", range: "5–10 mg", frequency: "Daily for 10–20 days", notes: "Typically administered in cycles of 10–20 days, 1–2 times per year. Split doses (morning and evening) used in some protocols." },
        { route: "Intranasal", range: "5–20 mg", frequency: "Daily", notes: "Intranasal protocols are used in some research settings, though bioavailability data is limited." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data",
      known_effects: ["Injection site reactions", "Vivid dreams (attributed to melatonin effects)", "Mild drowsiness"],
      unknown_risks: ["Long-term effects of chronic telomerase activation are unknown — theoretical cancer risk not characterized", "Limited independent safety data outside Russian research", "Interactions with autoimmune conditions are unstudied"]
    },
    studies: [
      { title: "Effect of epithalon on the lifespan increase in Drosophila melanogaster", authors: "Khavinson VK, et al.", year: 2000, journal: "Mechanisms of Ageing and Development", pmid: "11040467", url: "https://pubmed.ncbi.nlm.nih.gov/11040467/" },
      { title: "Epithalon peptide induces telomerase activity and telomere elongation in human somatic cells", authors: "Khavinson V, et al.", year: 2003, journal: "Bulletin of Experimental Biology and Medicine", pmid: "14564067", url: "https://pubmed.ncbi.nlm.nih.gov/14564067/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/11040467/"]
  },

  {
    name: "Thymosin Alpha-1",
    full_name: "Thymalfasin",
    slug: "thymosin-alpha-1",
    tagline: "A thymic peptide that modulates innate and adaptive immunity — FDA-approved in 35+ countries for hepatitis and cancer immunotherapy.",
    aliases: ["Tα1", "Thymalfasin", "Zadaxin"],
    fda_status: "not-approved",
    research_status: "Strong",
    half_life: "~2 hours",
    molecular_weight: "3108.4 g/mol",
    sequence: "Ac-Ser-Asp-Ala-Ala-Val-Asp-Thr-Ser-Ser-Glu-Ile-Thr-Thr-Lys-Asp-Leu-Lys-Glu-Lys-Lys-Glu-Val-Val-Glu-Glu-Ala-Glu-Asn-OH",
    overview: "Thymosin Alpha-1 (Tα1) is a 28-amino-acid peptide naturally secreted by the thymus gland that plays a central role in T-cell maturation and immune modulation. It is FDA-approved in over 35 countries (as Zadaxin) for the treatment of hepatitis B, hepatitis C, and as an adjunct to cancer immunotherapy and vaccines. In the US, it remains an investigational compound. Tα1 has been studied extensively for its ability to enhance T-cell function and innate immunity without overstimulating inflammatory pathways — an unusual immunomodulatory profile with therapeutic potential in chronic infections, cancer, and vaccine enhancement.",
    description: "Thymic immunomodulatory peptide enhancing T-cell maturation. Approved in 35+ countries for hepatitis and cancer immunotherapy.",
    typical_dosage: "1.6 mg subcutaneously twice weekly",
    reconstitution_instructions: "Reconstitute with sterile water for injection. Typical concentration: 1.6 mg/mL (standard clinical vial).",
    category: "healing",
    mechanism: [
      { title: "T-Cell Maturation and Differentiation", body: "Tα1 promotes the maturation of T-cell precursors in the thymus and peripheral lymphoid organs, increasing the pool of functional CD4+ and CD8+ T cells available for immune responses." },
      { title: "TLR Signaling Enhancement", body: "Tα1 activates toll-like receptor (TLR) signaling pathways — particularly TLR2, TLR4, and TLR9 — enhancing innate immune responses to pathogens without triggering excessive inflammation." },
      { title: "Dendritic Cell Activation", body: "Tα1 stimulates dendritic cell maturation and antigen presentation, potentiating both innate and adaptive immune arms. This is the basis for its use as a vaccine adjuvant." }
    ],
    research_applications: [
      { area: "Hepatitis B & C Treatment", evidence: "Strong", description: "Multiple RCTs demonstrate improved viral clearance and liver function in hepatitis B and C patients treated with Tα1, particularly in combination with interferon. Approved in 35+ countries for this indication." },
      { area: "Cancer Immunotherapy Adjunct", evidence: "Strong", description: "Studies show improved immune function, treatment tolerance, and survival outcomes when Tα1 is combined with chemotherapy or immunotherapy, likely via restoration of chemo-induced immunosuppression." },
      { area: "Vaccine Enhancement", evidence: "Human", description: "Clinical trials demonstrate improved antibody responses and seroconversion rates when Tα1 is co-administered with influenza, hepatitis B, and COVID-19 vaccines in immunocompromised patients." },
      { area: "Chronic Infection & Sepsis", evidence: "Moderate", description: "Studies in ICU patients with sepsis-induced immunosuppression show improved T-cell counts and clinical outcomes with Tα1 treatment." }
    ],
    dosage: {
      disclaimer: "Thymosin Alpha-1 is not FDA-approved in the United States. These dosing parameters are from clinical trial data and approved international labeling. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "1.6 mg", frequency: "Twice weekly", notes: "Standard clinical dosing from hepatitis treatment trials. Some cancer protocols use 1.6 mg daily for 6 weeks. Duration varies by indication." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (Approved Internationally)",
      known_effects: ["Injection site reactions (mild)", "Transient flu-like symptoms at initiation", "Fatigue (infrequent)"],
      unknown_risks: ["Theoretical autoimmune exacerbation in predisposed individuals", "Long-term effects of chronic immune upregulation not fully characterized", "Interaction with immunosuppressive drugs in transplant patients requires caution"]
    },
    studies: [
      { title: "Thymalfasin (thymosin alpha 1) in the treatment of hepatitis B", authors: "You J, Zhuang L, et al.", year: 2006, journal: "Journal of Gastroenterology and Hepatology", pmid: "16740133", url: "https://pubmed.ncbi.nlm.nih.gov/16740133/" },
      { title: "Thymosin alpha 1: the regulating role in the immunity", authors: "Garaci E, et al.", year: 2007, journal: "Annals of the New York Academy of Sciences", pmid: "18083923", url: "https://pubmed.ncbi.nlm.nih.gov/18083923/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/16740133/"]
  },

  {
    name: "Selank",
    full_name: "Selank (TP-7)",
    slug: "selank",
    tagline: "A synthetic analog of the endogenous immunomodulatory tetrapeptide Tuftsin, studied for anxiolytic, nootropic, and immune-enhancing effects.",
    aliases: ["TP-7", "Selanc"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~2 minutes (endogenous Tuftsin); selank ~5 minutes",
    molecular_weight: "751.8 g/mol",
    sequence: "Thr-Lys-Pro-Arg-Pro-Gly-Pro",
    overview: "Selank is a synthetic heptapeptide analog of the endogenous immunomodulatory tetrapeptide Tuftsin (Thr-Lys-Pro-Arg), developed by the Institute of Molecular Genetics of the Russian Academy of Sciences. By extending Tuftsin with a stabilizing Pro-Gly-Pro sequence, selank achieves significantly greater metabolic stability. It is widely used in Russia as an anxiolytic and nootropic agent. Unlike benzodiazepines, selank modulates the GABA-A system without producing sedation, tolerance, or dependence. It also demonstrates notable immune-enhancing effects and has been studied for stress-induced immunosuppression.",
    description: "Synthetic Tuftsin analog with anxiolytic, nootropic, and immunomodulatory properties. Used clinically in Russia without the dependency risks of benzodiazepines.",
    typical_dosage: "250–500 mcg intranasally, 1–3x daily",
    reconstitution_instructions: "Available as nasal spray in Russian clinical settings. Research peptide: reconstitute with sterile saline for intranasal use.",
    category: "healing",
    mechanism: [
      { title: "GABAergic Modulation without Receptor Binding", body: "Selank enhances GABA-A receptor function indirectly — not by binding the benzodiazepine site, but by increasing GABA release and modulating receptor expression. This produces anxiolysis without sedation, tolerance, or withdrawal." },
      { title: "BDNF Upregulation", body: "Selank increases brain-derived neurotrophic factor (BDNF) expression in the hippocampus, supporting neuroplasticity, memory consolidation, and stress resilience." },
      { title: "Enkephalinase Inhibition", body: "Selank inhibits enzymes that degrade endogenous enkephalins, increasing their availability. Enkephalins modulate mood, stress response, and immune function." }
    ],
    research_applications: [
      { area: "Generalized Anxiety Disorder", evidence: "Human", description: "Russian clinical trials demonstrate anxiolytic efficacy comparable to benzodiazepines without sedation or cognitive impairment. Used clinically in Russia for anxiety and neurosis." },
      { area: "Cognitive Enhancement", evidence: "Moderate", description: "Studies show improvements in memory consolidation, attention, and learning under stress conditions, attributed to BDNF upregulation and cholinergic modulation." },
      { area: "Immunomodulation", evidence: "Moderate", description: "As a Tuftsin analog, selank enhances macrophage and NK cell activity and normalizes stress-induced T-cell suppression." }
    ],
    dosage: {
      disclaimer: "Selank is not FDA-approved. Evidence is primarily from Russian clinical research. Not medical advice.",
      ranges: [
        { route: "Intranasal", range: "250–500 mcg", frequency: "1–3x daily", notes: "Most common route. Drip 1–2 drops into each nostril. Effects onset within 10–15 minutes." },
        { route: "Subcutaneous", range: "250–500 mcg", frequency: "1–2x daily", notes: "Injectable route produces more consistent bioavailability than intranasal." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Mild nasal irritation (intranasal route)", "Transient lightheadedness", "Drowsiness at higher doses"],
      unknown_risks: ["Long-term neurological effects not characterized in large trials", "Limited pharmacokinetic data in Western populations", "Interaction with psychiatric medications requires caution"]
    },
    studies: [
      { title: "Comparative analysis of the pharmacological activity of peptide anxiolytics selank and semax", authors: "Semenova TP, et al.", year: 2010, journal: "Zhurnal Vysshei Nervnoi Deyatelnosti", pmid: "20886792", url: "https://pubmed.ncbi.nlm.nih.gov/20886792/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/20886792/"]
  },

  {
    name: "GHK-Cu",
    full_name: "Copper Peptide GHK-Cu (Glycyl-L-Histidyl-L-Lysine Copper)",
    slug: "ghk-cu",
    tagline: "A naturally occurring copper-binding tripeptide that declines with age, studied for skin repair, wound healing, and anti-inflammatory gene expression.",
    aliases: ["Copper Peptide", "GHK", "Glycyl-His-Lys"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "Not well established (topical bioavailability variable)",
    molecular_weight: "340.38 g/mol (as free peptide); 402.9 g/mol (copper complex)",
    sequence: "Gly-His-Lys",
    overview: "GHK-Cu is a naturally occurring tripeptide-copper complex found in human plasma, saliva, and urine. Plasma concentrations peak in early adulthood (~200 ng/mL at age 20) and decline significantly with age (~80 ng/mL at age 60), a pattern correlating with declining wound healing capacity and increasing inflammation. GHK-Cu modulates expression of over 4,000 human genes, with a striking pattern — it generally downregulates genes associated with inflammation, cancer progression, and oxidative stress while upregulating genes involved in tissue repair, collagen synthesis, and stem cell activity. Its applications span wound healing, skin anti-aging, and potentially neurological repair.",
    description: "Naturally occurring tripeptide-copper complex declining with age. Modulates gene expression toward repair and regeneration.",
    typical_dosage: "Topical: used in cosmetic formulations; Injectable: 1–2 mg subcutaneously",
    reconstitution_instructions: "Reconstitute with sterile water or saline. Stable in solution at pH 5–7.",
    category: "healing",
    mechanism: [
      { title: "Gene Expression Modulation", body: "GHK-Cu influences the expression of over 4,000 human genes via chromatin remodeling and transcription factor activation. Key effects include upregulation of collagen, elastin, and decorin while downregulating TNF-α, IL-6, and other pro-inflammatory cytokines." },
      { title: "Copper Chaperone Activity", body: "The copper ion in GHK-Cu is critical for its activity. Copper is a cofactor for lysyl oxidase (collagen/elastin crosslinking), superoxide dismutase (antioxidant), and cytochrome c oxidase (mitochondrial function)." },
      { title: "Wound Contraction and Angiogenesis", body: "GHK-Cu stimulates wound contraction via fibroblast activation and promotes angiogenesis through VEGF upregulation, accelerating tissue repair and vascularization." }
    ],
    research_applications: [
      { area: "Wound Healing", evidence: "Moderate", description: "Multiple studies demonstrate accelerated wound closure, improved collagen quality, and reduced scarring with topical GHK-Cu application in both animal models and limited human studies." },
      { area: "Skin Anti-Aging", evidence: "Moderate", description: "Clinical studies show improvements in skin thickness, wrinkle reduction, and elasticity with topical GHK-Cu formulations. Widely incorporated into cosmeceuticals." },
      { area: "Anti-Inflammatory Gene Regulation", evidence: "Strong", description: "Gene array studies consistently demonstrate GHK-Cu's broad downregulation of inflammatory and oncogenic gene networks — suggesting potential in chronic inflammatory conditions." },
      { area: "Hair Growth", evidence: "Early", description: "Topical GHK-Cu has been investigated for androgenetic alopecia with some promising small trials showing increased hair follicle size and density." }
    ],
    dosage: {
      disclaimer: "GHK-Cu is used in cosmetic and research contexts. Injectable protocols are not FDA-approved and should be approached with caution. Not medical advice.",
      ranges: [
        { route: "Topical", range: "0.1–1% concentration in formulation", frequency: "1–2x daily", notes: "Most evidence base. Well-tolerated. Look for formulations with copper chelated to the peptide, not just copper ions." },
        { route: "Subcutaneous", range: "1–2 mg", frequency: "Daily to 3x weekly", notes: "Injectable use is off-label research. Limited human bioavailability data for systemic effects via injection." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Topical: mild irritation in sensitive skin", "Injectable: injection site reactions", "Blue-green skin discoloration at injection site (temporary, from copper)"],
      unknown_risks: ["Systemic copper accumulation with chronic high-dose injection is unstudied", "Interaction with Wilson's disease or copper metabolism disorders", "Long-term injectable safety data absent"]
    },
    studies: [
      { title: "GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration", authors: "Pickart L, Vasquez-Soltero JM, Margolina A.", year: 2015, journal: "BioMed Research International", pmid: "26065009", url: "https://pubmed.ncbi.nlm.nih.gov/26065009/" },
      { title: "The human tripeptide GHK-Cu in prevention of oxidative stress and degenerative conditions of aging", authors: "Pickart L, Margolina A.", year: 2018, journal: "Oxidative Medicine and Cellular Longevity", pmid: "29765469", url: "https://pubmed.ncbi.nlm.nih.gov/29765469/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/26065009/"]
  },

  {
    name: "Semaglutide",
    full_name: "Semaglutide (GLP-1 Receptor Agonist)",
    slug: "semaglutide",
    tagline: "An FDA-approved GLP-1 receptor agonist (Ozempic/Wegovy) that reduces appetite and blood glucose — the most clinically validated weight loss peptide.",
    aliases: ["Ozempic", "Wegovy", "Rybelsus", "GLP-1 analog"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~1 week (weekly dosing)",
    molecular_weight: "4113.6 g/mol",
    sequence: "His-Aib-Glu-Gly-Thr-Phe-Thr-Ser-Asp-Val-Ser-Ser-Tyr-Leu-Glu-Gly-Gln-Ala-Ala-Lys(C18 fatty diacid)-Glu-Phe-Ile-Ala-Trp-Leu-Val-Arg-Gly-Arg",
    overview: "Semaglutide is a synthetic analog of GLP-1 (glucagon-like peptide-1), a naturally occurring incretin hormone secreted by intestinal L-cells in response to food intake. Its unique C18 fatty diacid modification enables albumin binding, extending its half-life to approximately one week — enabling convenient weekly subcutaneous dosing. FDA-approved as Ozempic (2017) for type 2 diabetes and cardiovascular risk reduction, Wegovy (2021) for chronic weight management at higher doses, and Rybelsus for oral type 2 diabetes treatment. The SELECT trial (2023) demonstrated a 20% reduction in major cardiovascular events in non-diabetic obese adults, expanding its clinical relevance. Note: research peptide semaglutide sold by vendors is not the same as FDA-approved pharmaceutical Ozempic/Wegovy and is not FDA-approved.",
    description: "Long-acting GLP-1 receptor agonist FDA-approved for diabetes (Ozempic) and weight management (Wegovy). Research versions are not FDA-approved.",
    typical_dosage: "0.25 mg weekly (starting); titrate to 1 mg (diabetes) or 2.4 mg (weight management)",
    reconstitution_instructions: "FDA-approved versions are pre-filled pens. Research peptide: reconstitute with bacteriostatic water; start with low concentration (0.5 mg/mL) for dose precision.",
    category: "weight-loss",
    mechanism: [
      { title: "GLP-1 Receptor Agonism", body: "Semaglutide binds the GLP-1 receptor on pancreatic beta cells, stimulating glucose-dependent insulin secretion and suppressing glucagon. This improves glycemic control without causing hypoglycemia at physiological glucose levels." },
      { title: "Central Appetite Suppression", body: "GLP-1 receptors in the hypothalamus and brainstem regulate energy homeostasis. Semaglutide's CNS activity reduces appetite, increases satiety signals, and decreases food reward — the primary mechanism for its ~15% weight loss effect." },
      { title: "Gastric Emptying Delay", body: "Semaglutide slows gastric emptying, prolonging the sensation of fullness after meals and blunting post-meal glucose spikes." },
      { title: "Cardiovascular Protection", body: "Beyond metabolic effects, semaglutide reduces atherosclerotic plaque formation and cardiovascular inflammation. The SELECT trial demonstrated 20% MACE reduction, confirming direct cardioprotective mechanisms independent of weight loss." }
    ],
    research_applications: [
      { area: "Type 2 Diabetes Management", evidence: "Strong", description: "FDA-approved. SUSTAIN trial program demonstrated HbA1c reductions of 1.2–1.8% and significant cardiovascular risk reduction versus placebo and active comparators." },
      { area: "Chronic Weight Management", evidence: "Strong", description: "FDA-approved (Wegovy 2.4 mg). STEP trials demonstrated ~15% mean body weight reduction at 68 weeks — the most effective non-surgical weight loss intervention in clinical history." },
      { area: "Cardiovascular Risk Reduction", evidence: "Strong", description: "SELECT trial (2023, n=17,604): semaglutide 2.4 mg reduced MACE by 20% in obese non-diabetic adults — a landmark result expanding indication to cardiovascular prevention." },
      { area: "NASH/MAFLD", evidence: "Moderate", description: "NASH trials demonstrate semaglutide reduces liver steatosis and inflammation. Phase III ESSENCE trial ongoing for NASH/cirrhosis indication." }
    ],
    dosage: {
      disclaimer: "FDA-approved semaglutide (Ozempic/Wegovy) must be prescribed by a physician. Research peptide semaglutide is NOT FDA-approved and is not the same as pharmaceutical semaglutide. Compounded semaglutide availability varies by jurisdiction. Always consult a physician.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "0.25 mg → 2.4 mg", frequency: "Once weekly", notes: "Titrate slowly: 0.25 mg/week x4 weeks, then 0.5 mg/week x4 weeks, then 1 mg (diabetes) or continue titrating to 2.4 mg (weight). Slow titration minimizes GI side effects." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea (most common, 44% at initiation)", "Vomiting", "Diarrhea or constipation", "Decreased appetite", "Injection site reactions", "Fatigue at initiation", "Gallstones (increased risk with rapid weight loss)"],
      unknown_risks: ["Thyroid C-cell tumors (black box warning; seen in rodents, not confirmed in humans)", "Pancreatitis risk (rare but serious)", "Muscle mass loss with aggressive caloric restriction", "Long-term effects beyond 3-year trial data", "Rebound weight gain after discontinuation"]
    },
    studies: [
      { title: "Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)", authors: "Wilding JPH, et al.", year: 2021, journal: "New England Journal of Medicine", pmid: "33567185", url: "https://pubmed.ncbi.nlm.nih.gov/33567185/" },
      { title: "Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT)", authors: "Lincoff AM, et al.", year: 2023, journal: "New England Journal of Medicine", pmid: "37952131", url: "https://pubmed.ncbi.nlm.nih.gov/37952131/" },
      { title: "Semaglutide 2.4 mg once weekly for weight management in obesity (STEP 2)", authors: "Davies M, et al.", year: 2021, journal: "Lancet", pmid: "33667417", url: "https://pubmed.ncbi.nlm.nih.gov/33667417/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/33567185/", "https://pubmed.ncbi.nlm.nih.gov/37952131/"]
  },

  {
    name: "IGF-1 LR3",
    full_name: "Insulin-like Growth Factor-1 Long Arg3",
    slug: "igf-1-lr3",
    tagline: "A long-acting analog of IGF-1 with ~60x greater potency than native IGF-1, studied for muscle hypertrophy, recovery, and neuroprotection.",
    aliases: ["Long R3 IGF-1", "LR3-IGF-1"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~20–30 hours (vs. ~15 minutes for native IGF-1)",
    molecular_weight: "9111.5 g/mol",
    sequence: "Met-Arg-[IGF-1 sequence with Arg substitution at position 3]",
    overview: "IGF-1 LR3 is a synthetic analog of insulin-like growth factor 1 (IGF-1) that incorporates a 13-amino-acid N-terminal extension and an Arg substitution at position 3. These modifications reduce binding to IGF-binding proteins (IGFBPs) — which normally sequester IGF-1 and limit its activity — resulting in a dramatically extended half-life (~20–30 hours vs. ~15 minutes for native IGF-1) and approximately 60-fold greater potency. IGF-1 is the primary mediator of GH's anabolic effects, stimulating protein synthesis, satellite cell activation, and muscle hypertrophy. LR3 modification allows systemic activity that native IGF-1, which is largely bound and locally restricted, cannot achieve.",
    description: "Long-acting IGF-1 analog with reduced IGFBP binding, extended half-life, and potent systemic anabolic and neuroprotective activity.",
    typical_dosage: "20–100 mcg per day subcutaneously or intramuscularly",
    reconstitution_instructions: "Reconstitute with 0.6% acetic acid or bacteriostatic water acidified to pH 4–5. Store at 4°C after reconstitution.",
    category: "performance",
    mechanism: [
      { title: "IGF-1 Receptor Activation", body: "IGF-1 LR3 binds the IGF-1 receptor (IGF-1R) with high affinity, activating PI3K/Akt and MAPK/ERK pathways that drive protein synthesis, cell proliferation, and inhibition of apoptosis." },
      { title: "Satellite Cell Activation", body: "In skeletal muscle, IGF-1 signaling activates quiescent satellite cells — muscle stem cells that fuse with existing fibers to increase myonuclear domain and support hypertrophy." },
      { title: "Reduced IGFBP Binding", body: "The Arg3 substitution dramatically reduces binding affinity for all six IGF-binding proteins, ensuring that systemic LR3-IGF-1 remains biologically active rather than being sequestered. This is the primary differentiator from native IGF-1." }
    ],
    research_applications: [
      { area: "Muscle Hypertrophy & Recovery", evidence: "Animal", description: "Animal studies demonstrate significant muscle mass increases with IGF-1 LR3. Human data in non-deficient subjects is limited and largely anecdotal from athletic use." },
      { area: "GH Deficiency Treatment", evidence: "Moderate", description: "IGF-1 analogs have been studied as alternatives to GH therapy for short stature and GH deficiency. Mecasermin (native IGF-1) is FDA-approved; LR3 analog is not." },
      { area: "Neuroprotection", evidence: "Early", description: "IGF-1 signaling supports neuronal survival and synaptic plasticity. Animal models suggest IGF-1 LR3 may enhance neuroregeneration following injury." }
    ],
    dosage: {
      disclaimer: "IGF-1 LR3 is a research compound with potent metabolic activity. Hypoglycemia risk is real. Start at low doses and never use without understanding insulin-like side effects. Not medical advice.",
      ranges: [
        { route: "Subcutaneous or Intramuscular", range: "20–100 mcg", frequency: "Once daily", notes: "Start at 20 mcg to assess hypoglycemia risk. Inject with or after food. Doses above 100 mcg increase hypoglycemia risk substantially. Cycle length: 4–6 weeks maximum." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Hypoglycemia (serious risk — insulin-like activity)", "Injection site discomfort", "Jaw pain/facial growth (acromegalic effects at high doses)", "Joint pain", "Organ enlargement with chronic high-dose use"],
      unknown_risks: ["Cancer promotion risk via IGF-1R signaling is a significant theoretical concern", "Long-term effects on GH axis suppression", "Cardiac hypertrophy with chronic supraphysiological use", "Interaction with insulin therapy"]
    },
    studies: [
      { title: "IGF-1 LR3: a potent insulin-like growth factor-I analogue", authors: "Ballard FJ, et al.", year: 1993, journal: "Biochemistry and Molecular Biology International", pmid: "8405974", url: "https://pubmed.ncbi.nlm.nih.gov/8405974/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/8405974/"]
  },

  {
    name: "Hexarelin",
    full_name: "Hexarelin Acetate",
    slug: "hexarelin",
    tagline: "One of the most potent GHRPs, studied for maximal GH release and cardiac protection — but with notable cortisol and prolactin elevation.",
    aliases: ["Examorelin", "EP-23905", "MF-6003"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~70 minutes",
    molecular_weight: "887.05 g/mol",
    sequence: "His-D-2-MeTrp-Ala-Trp-D-Phe-Lys-NH2",
    overview: "Hexarelin is a synthetic hexapeptide GHRP (growth hormone-releasing peptide) and one of the most potent GH secretagogues developed. It produces GH pulses larger than those from GHRP-2 or Ipamorelin, but at the cost of meaningfully elevating cortisol and prolactin — limiting its suitability for long-term protocols. What distinguishes hexarelin from other GHRPs is its direct cardiac activity: hexarelin binds CD36 receptors on cardiomyocytes independently of GH secretion, demonstrating cardioprotective effects in animal models of ischemia. This dual GH-secretagogue and cardioprotective activity makes it an interesting research subject beyond body composition applications.",
    description: "Potent GHRP with maximal GH release and direct cardiac protective activity via CD36 receptor binding.",
    typical_dosage: "100–200 mcg subcutaneously, 1–2x daily",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "Ghrelin Receptor Agonism (GHS-R1a)", body: "Hexarelin binds GHS-R1a with high affinity, producing some of the largest GH pulses among all synthetic GHRPs. The D-2-MeTrp substitution contributes to its potency." },
      { title: "CD36 Receptor Cardiac Activity", body: "Hexarelin binds CD36, a scavenger receptor expressed on cardiomyocytes and macrophages. This GH-independent pathway contributes to cardioprotection, reducing ischemia-reperfusion injury in animal models." },
      { title: "Cortisol and Prolactin Elevation", body: "Unlike Ipamorelin, hexarelin significantly elevates cortisol and prolactin at research doses. This is a meaningful distinction limiting its use in sustained protocols." }
    ],
    research_applications: [
      { area: "Cardiac Protection", evidence: "Animal", description: "Hexarelin reduces infarct size, preserves cardiac function, and prevents cardiomyocyte apoptosis in rodent ischemia models via CD36-dependent and GH-dependent mechanisms." },
      { area: "Maximal GH Stimulation Testing", evidence: "Human", description: "Used in clinical research as a potent GH stimulation test agent. Produces reliably robust GH pulses, useful for GH axis assessment." }
    ],
    dosage: {
      disclaimer: "Hexarelin is a research compound. Cortisol and prolactin elevation limit long-term use. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "100–200 mcg", frequency: "1–2x daily", notes: "Desensitization occurs more rapidly than with Ipamorelin. Most protocols limit continuous use to 4–8 weeks. Combine with a GHRH analog for enhanced effect." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Cortisol elevation (distinguishes it from Ipamorelin)", "Prolactin elevation", "Water retention", "Rapid GHS-R1a desensitization with continuous use", "Hunger stimulation"],
      unknown_risks: ["Long-term cortisol elevation consequences with chronic use", "Cardiac effects in humans via CD36 are not well characterized", "GH axis suppression with prolonged high-dose protocols"]
    },
    studies: [
      { title: "Hexarelin, a growth hormone-releasing peptide, protects the heart against ischemia-reperfusion injury", authors: "Torsello A, et al.", year: 2003, journal: "Journal of Endocrinology", pmid: "12620438", url: "https://pubmed.ncbi.nlm.nih.gov/12620438/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/12620438/"]
  },

  {
    name: "Semax",
    full_name: "Semax (ACTH 4-7 Pro-Gly-Pro)",
    slug: "semax",
    tagline: "A neuropeptide analog of ACTH studied for cognitive enhancement, neuroprotection, and stroke recovery — widely used clinically in Russia.",
    aliases: ["ACTH 4-7 PGP", "Msemax"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~5–10 minutes",
    molecular_weight: "813.95 g/mol",
    sequence: "Met-Glu-His-Phe-Pro-Gly-Pro",
    overview: "Semax is a synthetic heptapeptide derived from the ACTH 4-7 fragment (Met-Glu-His-Phe), extended with a Pro-Gly-Pro sequence for metabolic stability. Developed at the Institute of Molecular Genetics of the Russian Academy of Sciences, it is approved in Russia and Ukraine as a nootropic and neuroprotective agent. Unlike standard ACTH analogs, semax lacks hormonal activity (no cortisol stimulation) but retains and enhances the peptide's neurotrophic and cognitive-enhancing properties. It significantly upregulates BDNF and activates serotonergic, dopaminergic, and cholinergic systems. Russian clinical use includes stroke rehabilitation, traumatic brain injury, and cognitive enhancement.",
    description: "ACTH 4-7 analog with BDNF upregulation, neuroprotection, and cognitive enhancement. Approved in Russia for stroke and TBI.",
    typical_dosage: "300–600 mcg intranasally daily",
    reconstitution_instructions: "Available as nasal drops in Russia. Research peptide: reconstitute in sterile saline for intranasal use (typical: 0.1% solution).",
    category: "healing",
    mechanism: [
      { title: "BDNF and NGF Upregulation", body: "Semax is one of the most potent known inducers of BDNF (brain-derived neurotrophic factor) and NGF (nerve growth factor) expression. These neurotrophins support neuronal survival, synaptic plasticity, and neurogenesis." },
      { title: "Dopaminergic and Serotonergic Modulation", body: "Semax enhances dopamine and serotonin release in the prefrontal cortex and limbic system, contributing to improved focus, motivation, and mood stabilization without stimulant-like overstimulation." },
      { title: "Anti-Apoptotic Neuroprotection", body: "In ischemia and TBI models, semax reduces neuronal apoptosis through multiple mechanisms including Bcl-2 upregulation, NMDA receptor modulation, and reduction of oxidative stress markers." }
    ],
    research_applications: [
      { area: "Stroke Rehabilitation", evidence: "Human", description: "Russian clinical trials demonstrate improved neurological recovery in ischemic stroke patients treated with semax nasal spray within 6 hours of onset. Used in standard neurological care in Russia." },
      { area: "Cognitive Enhancement", evidence: "Moderate", description: "Studies show improvements in attention, memory, and learning speed in both healthy subjects and those with cognitive impairment, attributed to BDNF upregulation and enhanced cholinergic transmission." },
      { area: "ADHD and Focus", evidence: "Early", description: "Anecdotal and preliminary research suggests benefits for ADHD-type attention deficits, possibly via dopaminergic effects in the prefrontal cortex." }
    ],
    dosage: {
      disclaimer: "Semax is not FDA-approved. Evidence is primarily from Russian clinical research. Not medical advice.",
      ranges: [
        { route: "Intranasal", range: "300–600 mcg", frequency: "1–2x daily", notes: "Most established route. Used in Russian clinical settings. Cognitive effects typically noted within 30–60 minutes. Cycle 2–4 weeks on, 2 weeks off." },
        { route: "Subcutaneous", range: "300–600 mcg", frequency: "Daily", notes: "Systemic administration for neuroprotective indication. More consistent but less convenient than intranasal." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Nasal irritation (intranasal route)", "Mild stimulatory effects at high doses", "Headache (infrequent)", "Anxiety in sensitive individuals at higher doses"],
      unknown_risks: ["Limited long-term safety data outside Russian clinical settings", "Interaction with psychiatric medications requires caution", "Effects on developing brains (pediatric use) not characterized"]
    },
    studies: [
      { title: "Semax, an analog of ACTH 4-7 with cognitive effects", authors: "Sebentsova EA, et al.", year: 2020, journal: "Current Pharmaceutical Design", pmid: "32031074", url: "https://pubmed.ncbi.nlm.nih.gov/32031074/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/32031074/"]
  },
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
