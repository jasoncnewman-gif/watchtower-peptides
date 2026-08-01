/**
 * Seeds the full GHK-Cu profile into the peptides table.
 * Updates the existing row (slug: ghk-cu).
 *
 * PMID verification (2026-06-13):
 *   26065009 — WRONG (fish vaccine paper) → replaced with 26236730
 *   29765469 — LIKELY WRONG → replaced with 22666519
 *   26236730 — Pickart 2015, BioMed Res Int — CONFIRMED ✓
 *   22666519 — Pickart 2012, Oxid Med Cell Longev — CONFIRMED ✓
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-ghkcu-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'ghk-cu',
  name: 'GHK-Cu',
  full_name: 'GHK-Cu (Glycyl-L-Histidyl-L-Lysine Copper Complex)',
  aliases: ['GHK', 'Copper Peptide', 'Copper Tripeptide-1', 'GHK-Copper'],
  category: 'healing',
  fda_status: 'research-only',
  research_status: 'Limited',

  tagline: 'A naturally occurring tripeptide-copper complex that declines with age, with decades of in vitro and animal evidence for wound healing and gene regulation — and almost no injectable human trial data.',

  sequence: 'Gly-His-Lys·Cu²⁺',
  molecular_weight: '340.38 g/mol (GHK free peptide); ~403 g/mol as copper complex',
  half_life: 'Not established in humans. Topical half-life varies by formulation. No published injectable human PK data.',

  overview: `GHK-Cu is a naturally occurring tripeptide (glycyl-L-histidyl-L-lysine) that forms a high-affinity complex with copper(II) ions. Discovered in 1973 by Loren Pickart as an activity in human albumin that caused old liver tissue to behave like young tissue, it is found in human plasma (~200 ng/mL at age 20, declining to ~80 ng/mL by age 60), saliva, and urine. It has high copper-binding affinity (Kd ~10⁻¹⁴ M) and functions as a physiological copper delivery vehicle. The primary evidence base spans four decades of in vitro and animal studies documenting wound healing, collagen synthesis, anti-inflammatory gene modulation, and hair growth effects. **The critical limitation for injectable systemic use:** human evidence is almost entirely from topical cosmetic studies and in vitro cell experiments. No published RCT exists for injectable GHK-Cu in any indication. The formulation sold by peptide vendors (injectable lyophilized powder) has a different bioavailability, distribution, and risk profile than topical application, and has not been characterized in published human research.`,

  mechanism: [
    {
      title: 'Gene Expression Modulation — Large-Scale Transcriptomic Effects',
      body: 'GHK-Cu modulates expression of >31,000 genes according to database analyses by Pickart and colleagues. Key regulated pathways include collagen synthesis (upregulated), matrix metalloproteinases (bidirectionally regulated for tissue remodeling), anti-inflammatory cytokines (IL-6, TNF-α downregulation), and antioxidant genes (SOD1, catalase upregulation). The breadth of these transcriptomic effects has made GHK-Cu of interest in longevity research, but the in vivo significance of most observations in this list is not established in humans. Source: Pickart L, et al. (2015). PMID: 26236730.'
    },
    {
      title: 'Copper Chaperone Activity — Physiological Copper Delivery',
      body: 'As a high-affinity copper(II) chelator, GHK-Cu serves as a physiological copper transport molecule. Copper is an essential cofactor for lysyl oxidase (collagen and elastin crosslinking), SOD1 (antioxidant defense), cytochrome c oxidase (mitochondrial respiration), and tyrosinase (melanin synthesis). Age-related decline in GHK plasma concentrations correlates with disrupted copper homeostasis. GHK-Cu can donate copper to copper-dependent enzymes, potentially restoring their activity in copper-deficient states. Source: Pickart L, et al. (2012). PMID: 22666519.'
    },
    {
      title: 'Wound Contraction and Angiogenesis',
      body: 'GHK-Cu stimulates vascular endothelial growth factor (VEGF) expression and promotes angiogenesis into healing tissue. In animal wound models, GHK-Cu accelerates wound closure, increases tensile strength, and improves histological organization. It also activates fibronectin synthesis and stimulates wound contraction via fibroblast migration. Human evidence for this mechanism comes from topical wound care studies, not injectable systemic administration. The VEGF upregulation, as with BPC-157, carries a theoretical oncological concern (tumor vascularization risk with uncontrolled VEGF elevation).'
    },
    {
      title: 'Anti-Inflammatory Gene Regulation',
      body: 'GHK-Cu downregulates NF-κB pathway activation, reducing expression of TNF-α, IL-1β, IL-6, and other pro-inflammatory cytokines. Simultaneously it upregulates anti-inflammatory mediators. This bidirectional regulation is proposed as a key mechanism for its tissue-protective effects. Demonstrated primarily in cell culture models; in vivo anti-inflammatory potency in humans at injectable doses is uncharacterized.'
    }
  ],

  research_applications: [
    {
      area: 'Wound Healing (Topical)',
      evidence: 'Moderate human evidence',
      description: 'Multiple clinical studies and case series document accelerated wound healing with topical GHK-Cu in post-surgical wounds, burns, and chronic ulcers. Approved ingredients in topical wound care formulations. This is the strongest human evidence for GHK-Cu and applies specifically to topical, not injectable, administration.'
    },
    {
      area: 'Skin Anti-Aging (Topical)',
      evidence: 'Limited human evidence',
      description: 'Small controlled trials show topical GHK-Cu improves skin laxity, fine lines, and collagen density. Effect size is modest. The robust cosmetic evidence base exists specifically for topical formulations at specific concentrations. Injectable use for skin anti-aging extrapolates from topical data — the bioavailability and target tissue concentrations are entirely different.'
    },
    {
      area: 'Injectable/Systemic Use (Community application)',
      evidence: 'Preclinical only',
      description: 'No published human RCT or clinical study for injectable/subcutaneous GHK-Cu exists. Systemic bioavailability, PK parameters, target tissue distribution, and safety of injectable GHK-Cu in humans are uncharacterized. All injectable-use claims are extrapolations from topical or in vitro evidence.'
    },
    {
      area: 'Hair Growth (Topical)',
      evidence: 'Limited human evidence',
      description: 'Small studies show topical GHK-Cu in minoxidil formulations enhances hair density and thickness. No RCT for standalone injectable GHK-Cu for hair growth. Effect is attributed to enhanced follicle blood supply and anti-inflammatory microenvironment in the scalp.'
    },
    {
      area: 'Anti-Inflammatory Systemic Effects',
      evidence: 'Preclinical only',
      description: 'Strong in vitro NF-κB suppression data. Animal models show reduced inflammation in various tissue injury models. No published human systemic anti-inflammatory RCT for injectable GHK-Cu.'
    }
  ],

  dosage: {
    disclaimer: 'No human dosing has been established for injectable GHK-Cu. All ranges below are community-derived with no clinical trial basis for subcutaneous/intramuscular administration.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '1–3 mg',
        frequency: 'Once daily or every other day',
        notes: 'Community protocol — entirely extrapolated from topical and animal literature. No human PK/PD data exists for this route. There is no basis for selecting these numbers over any other dosing range.'
      },
      {
        route: 'Topical (established)',
        range: '0.1–2% concentration in formulation',
        frequency: 'As directed by topical product',
        notes: 'The evidence-supported application. Topical human data exists for wound healing and anti-aging. This is fundamentally different from injectable use.'
      }
    ]
  },

  safety_profile: {
    rating: 'Topical safety well-established; injectable safety uncharacterized in humans',
    known_effects: [
      'Topical: well-tolerated at cosmetic concentrations; mild irritation possible at high concentrations',
      'Injectable: injection site reactions (redness, swelling) — consistent with any SC injection',
      'Copper overload (theoretical at high injectable doses): copper is an essential but potentially toxic metal at excess concentrations. The body has robust copper homeostasis mechanisms, but these are calibrated for dietary copper intake. Repeated high-dose injectable copper delivery bypasses gut-regulated copper absorption.'
    ],
    unknown_risks: [
      'Injectable human safety: entirely uncharacterized. No published human pharmacokinetics, no organ-level toxicity data, no dose-escalation study.',
      'VEGF upregulation risk: as with BPC-157, GHK-Cu stimulates VEGF expression. Theoretical oncological concern in patients with occult malignancies. Not a confirmed risk but a mechanistic concern that is absent from most vendor disclosures.',
      'Copper accumulation with chronic use: repeated injectable dosing may elevate systemic copper above physiological levels. Wilson disease patients and those with impaired copper metabolism are at heightened risk. Even in healthy individuals, chronic copper excess is hepatotoxic.',
      'Long-term effects: no studies. No data on chronic injectable use over months to years.',
      'Pregnancy and lactation: no data. Avoid.',
      'Drug interactions: copper chelation could interact with other metal-binding compounds or medications.'
    ]
  },

  studies: [
    {
      pmid: '26236730',
      title: 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
      authors: 'Pickart L, Vasquez-Soltero JM, Margolina A.',
      journal: 'BioMed Research International',
      year: 2015,
      url: 'https://pubmed.ncbi.nlm.nih.gov/26236730/',
      summary: 'Comprehensive review of GHK-Cu mechanisms in skin biology. Covers gene expression modulation, collagen synthesis, angiogenesis, anti-inflammatory pathways, and copper homeostasis. Documents transcriptomic analyses showing >31,000 genes affected by GHK. Key context: this is a review authored by the leading GHK-Cu researcher (Pickart, who discovered GHK in 1973). Review articles carry lower evidence weight than primary trials, and many claims reference in vitro or animal studies.'
    },
    {
      pmid: '22666519',
      title: 'The Human Tripeptide GHK-Cu in Prevention of Oxidative Stress and Degenerative Conditions of Aging: Implications for Cognitive Health',
      authors: 'Pickart L, Vasquez-Soltero JM, Margolina A.',
      journal: 'Oxidative Medicine and Cellular Longevity',
      year: 2012,
      url: 'https://pubmed.ncbi.nlm.nih.gov/22666519/',
      summary: 'Review article proposing GHK-Cu as a candidate neuroprotective/anti-aging agent based on its antioxidant gene regulation, copper homeostasis effects, and anti-neuroinflammatory properties. Discusses the age-related decline in plasma GHK concentrations and proposes a mechanistic link to reduced tissue repair capacity. Note: no clinical human outcome data for cognitive endpoints; all proposed mechanisms are in vitro or extrapolated.'
    }
  ],

  plain_english: `A tiny three-amino-acid copper-carrying molecule that your body naturally makes and that declines as you age. It's been studied since the 1970s for wound healing and skin repair — but almost all the research is on putting it directly on skin (topical), where it genuinely does help wounds heal. The injectable version sold by peptide vendors is a completely different story: there are no human trials for injecting it, no data on what happens when it enters your bloodstream, and no established dose. What works when you rub it on a wound does not automatically work — or have the same safety profile — when you inject it into your body.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'ghk-cu')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ GHK-Cu profile updated')
  console.log('  research_status: Limited (corrected from Moderate)')
  console.log('  studies: 2 items — both PMIDs corrected and verified')
  console.log('  PMID corrections: 26065009→26236730, 29765469→22666519')
  console.log('  Key addition: injectable vs topical evidence distinction throughout')
}

main()
