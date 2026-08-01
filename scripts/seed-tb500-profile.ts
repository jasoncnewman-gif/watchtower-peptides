/**
 * Seeds the full TB-500 profile into the peptides table.
 * Updates the existing row (slug: tb-500).
 *
 * All PMIDs verified on PubMed 2026-06-13.
 * Corrects: 22107110 → 22074294, 15286668 → 15565145 (both were wrong in original DB)
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-tb500-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'tb-500',
  name: 'TB-500',
  full_name: 'Thymosin Beta-4 Fragment (17–23)',
  aliases: ['Thymosin Beta-4', 'Tβ4', 'TB4', 'Thymosin B4'],
  category: 'healing',
  fda_status: 'research-only',
  research_status: 'Limited',  // corrected: human trials exist only for full Tβ4 topical ophthalmic, not injectable fragment
  tagline: 'A synthetic fragment of Thymosin Beta-4 researched for tissue repair, cell migration, and anti-inflammatory activity — most evidence is from animal models, with human trials limited to topical ophthalmic use of the full protein.',
  sequence: 'Ac-Lys-Pro-Asp-Met-Ala-Glu-Ile (Fragment 17–23 core; full Tβ4: 43 aa)',
  molecular_weight: '895 Da (fragment) / 4963 Da (full Tβ4)',
  half_life: 'Not established for injectable fragment in humans. One Phase I study of full injectable Tβ4 showed dose-proportional PK with no accumulation at repeated dosing (PMID: 34346165).',

  overview: `TB-500 is a synthetic peptide corresponding to the actin-binding fragment of Thymosin Beta-4 (Tβ4), a naturally occurring 43-amino-acid protein found in high concentrations in platelets and wound fluid. The fragment retains the actin-sequestration domain of full Tβ4 and is researched for tissue repair, cell migration, and anti-inflammatory activity — primarily in rodent models. Human clinical trials exist for full Tβ4 administered topically for corneal conditions; no published human trials exist for injectable TB-500 fragment for musculoskeletal or systemic use. The two are not interchangeable: TB-500 is a fragment (~895 Da), Tβ4 is the full protein (~4963 Da). Many vendors sell either interchangeably under the "TB-500" label — the COA molecular weight distinguishes them.`,

  mechanism: [
    {
      title: 'Actin Sequestration — Primary Mechanism',
      body: 'Tβ4 and its fragment bind monomeric G-actin with high affinity, sequestering it from polymerization into filamentous F-actin. This regulation of the G-actin pool controls cell shape, motility, and cytokinesis — processes foundational to wound healing and tissue repair. TB-500 retains this actin-binding domain. Source: Cassimeris L, Safer D, Nachmias VT, Zigmond SH. (1992). PMID: 1447300.'
    },
    {
      title: 'Integrin-Linked Kinase (ILK) Activation and Cell Survival',
      body: 'Tβ4 forms a functional complex with PINCH and ILK, activating the downstream survival kinase Akt. In a mouse myocardial infarction model, Tβ4 treatment activated ILK, reduced cardiomyocyte apoptosis, promoted progenitor cell migration into the infarcted zone, and improved cardiac function. The ILK-Akt pathway represents a mechanism independent of actin dynamics. Source: Bock-Marquette I, Saxena A, White MD, Dimaio JM, Srivastava D. (2004). Nature. PMID: 15565145.'
    },
    {
      title: 'NF-κB Inhibition and Anti-inflammatory Activity',
      body: 'Tβ4 downregulates NF-κB, reducing pro-inflammatory cytokine expression (TNF-α, IL-1β, IL-8). Active sites research demonstrated that short peptide sequences derived from Tβ4, including the actin-binding region, retain anti-inflammatory activity — providing some mechanistic basis for TB-500 fragment specifically. This effect is mechanistically distinct from COX-pathway anti-inflammatories and does not suppress the anabolic phases of healing. Source: Sosne G, Qiu P, Goldstein AL, Wheater M. (2010). FASEB J. PMID: 20179146.'
    },
    {
      title: 'VEGF-Dependent Angiogenesis',
      body: 'Tβ4 enhances endothelial cell differentiation and tube formation in vitro and promotes vascular sprouting in ex vivo coronary artery ring assays. The mechanism involves VEGF upregulation and is shared conceptually with BPC-157, though the upstream signals differ. This is the basis for the theoretical cancer-risk concern: VEGF supports both therapeutic angiogenesis in injured tissue and tumor vascularization. Source: Grant DS, Rose W, Yaen C, Goldstein A, Martinez J, Kleinman H. (1999). Angiogenesis. PMID: 14517430.'
    },
    {
      title: 'Directed Endothelial Cell Migration',
      body: 'Tβ4 acts as a chemoattractant for human umbilical vein endothelial cells, stimulating directional migration 4–6× over baseline in chamber assays. This effect complements VEGF-driven angiogenesis by guiding endothelial cells toward injury sites. Source: Malinda KM, Goldstein AL, Kleinman HK. (1997). FASEB J. PMID: 9194528.'
    }
  ],

  research_applications: [
    {
      area: 'Corneal Wound Healing (Full Tβ4, Topical)',
      evidence: 'Moderate',
      description: 'Phase I/II clinical trials of full Tβ4 administered as ophthalmic drops demonstrated accelerated corneal re-epithelialization and reduced dry eye symptoms. This is the strongest human evidence for any Tβ4/TB-500 application — but it involves the full protein, topical administration, and a fundamentally different mechanism context than injectable systemic use.'
    },
    {
      area: 'Tendon & Muscle Repair',
      evidence: 'Animal',
      description: 'Rodent injury models show improved tissue healing, reduced fibrosis, and enhanced functional recovery. No published human injectable trial exists for either TB-500 or full Tβ4 in musculoskeletal applications.'
    },
    {
      area: 'Cardiac Repair',
      evidence: 'Animal',
      description: 'Multiple rodent MI models show Tβ4 reduces infarct size, promotes cardiomyocyte survival, and improves ejection fraction post-infarction via ILK/Akt. One Phase I injectable Tβ4 human study (PMID: 34346165) enrolled 84 healthy volunteers to evaluate PK/safety as a precursor to cardiac trials — no efficacy endpoint for cardiac repair was assessed.'
    },
    {
      area: 'Wound Healing (Dermal)',
      evidence: 'Limited',
      description: 'Phase I data for Tβ4 in dermal wound healing exists but is limited (small studies, full protein). Some in vivo animal data for TB-500 fragment specifically in wound closure.'
    },
    {
      area: 'Neuroprotection',
      evidence: 'Animal',
      description: 'Rodent stroke and TBI models show Tβ4 reduces neurological deficit. Limited data, no human trials.'
    }
  ],

  dosage: {
    disclaimer: 'No human dosing for injectable TB-500 fragment has been established in published research. The community protocol is derived entirely from anecdote and animal study extrapolation. One Phase I study of full recombinant Tβ4 injectable used doses of 0.05–25 µg/kg in humans (max ~1.75 mg at 70 kg) — the community 2–2.5 mg protocol is at or slightly above the top of this range. This is for the full protein; the fragment is a different molecule with different PK. These figures are for research context only.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '2–2.5 mg',
        frequency: 'Twice per week (loading)',
        notes: 'Community loading protocol. No published human injectable source for this dose. Allometric scaling from animal data suggests ~0.08–0.23 mg/dose; the community dose is 10–30× higher. The one injectable Tβ4 human study used up to 25 µg/kg (~1.75 mg in 70 kg person) — applicable to full Tβ4, not confirmed for fragment. [UNSOURCED HUMAN RANGE]'
      },
      {
        route: 'Intramuscular',
        range: '2–2.5 mg',
        frequency: 'Twice per week (loading)',
        notes: 'Sometimes preferred for muscle-specific injuries. Same sourcing caveats as SC. [UNSOURCED HUMAN RANGE]'
      },
      {
        route: 'Subcutaneous (maintenance)',
        range: '1–2 mg',
        frequency: 'Once per week',
        notes: 'Post-loading maintenance. No published source. [UNSOURCED HUMAN RANGE]'
      }
    ],
    loading_phase: {
      range: '2–2.5 mg',
      frequency: 'Twice per week',
      duration_weeks: { min: 4, max: 6 }
    },
    maintenance_phase: {
      range: '1–2 mg',
      frequency: 'Once per week'
    }
  },

  safety_profile: {
    rating: 'Unknown in Humans for Injectable Use',
    known_effects: [
      'Injection site reactions: redness, mild swelling, transient discomfort (animal studies and community reports)',
      'Fatigue reported anecdotally post-injection, particularly during loading phase',
      'One Phase I study of injectable full Tβ4 (84 healthy volunteers, doses up to 25 µg/kg): adverse events were mild to moderate, no dose-limiting toxicities, no serious adverse events (PMID: 34346165) — but this is for the full protein, not TB-500 fragment'
    ],
    unknown_risks: [
      'Human pharmacokinetics for injectable TB-500 fragment: entirely uncharacterized. The one injectable Tβ4 human study was for the full 43-aa protein at lower doses than community protocol.',
      'VEGF-dependent angiogenesis creates the same theoretical oncological risk as BPC-157: elevated VEGF could support tumor vascularization in persons with occult malignancy. Not a confirmed risk, but a legitimate mechanistic concern. Applies with equal force to BPC-157+TB-500 stacks.',
      'Cardiac remodeling in healthy individuals: Tβ4\'s ILK/Akt cardiac effects are studied in ischemic hearts. Whether activating this pathway chronically in a non-ischemic heart has neutral or adverse effects is uncharacterized.',
      'Long-term effects: no chronic injectable study in humans for either TB-500 fragment or full Tβ4 in musculoskeletal applications.',
      'Immunogenicity: repeated synthetic peptide injection can generate antibody responses. Not characterized for TB-500 fragment.',
      'Drug interactions: none studied in humans.',
      'Safety in pregnancy and lactation: no data. Avoid.',
      'Cancer patients: contraindicated in theory due to VEGF/ILK upregulation. No clinical guidance.'
    ]
  },

  studies: [
    {
      pmid: '22074294',
      title: 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
      authors: 'Goldstein AL, Hannappel E, Sosne G, Kleinman HK.',
      journal: 'Expert Opinion on Biological Therapy',
      year: 2012,
      url: 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
      summary: 'Comprehensive review of Tβ4\'s mechanisms, tissue repair applications, and clinical development history through 2012. Documents OPERA corneal trials and the cardiac program. Key reference for distinguishing full Tβ4 evidence from TB-500 fragment claims. Note: review article — individual mechanistic claims require primary source tracing.'
    },
    {
      pmid: '15565145',
      title: 'Thymosin beta4 activates integrin-linked kinase and promotes cardiac cell migration, survival and cardiac repair',
      authors: 'Bock-Marquette I, Saxena A, White MD, Dimaio JM, Srivastava D.',
      journal: 'Nature',
      year: 2004,
      url: 'https://pubmed.ncbi.nlm.nih.gov/15565145/',
      summary: 'Landmark mechanistic paper. Tβ4 forms a PINCH-ILK complex, activates Akt, and after coronary artery ligation in mice, reduces cardiomyocyte apoptosis and improves cardiac function. Direct evidence for the ILK-Akt survival pathway. Published in Nature — the most rigorous preclinical study in the Tβ4 literature.'
    },
    {
      pmid: '1447300',
      title: 'Thymosin beta 4 sequesters the majority of G-actin in resting human polymorphonuclear leukocytes',
      authors: 'Cassimeris L, Safer D, Nachmias VT, Zigmond SH.',
      journal: 'Journal of Cell Biology',
      year: 1992,
      url: 'https://pubmed.ncbi.nlm.nih.gov/1447300/',
      summary: 'Primary mechanistic paper establishing Tβ4 as the principal G-actin sequestering protein in human immune cells. Foundation for all actin dynamics mechanism claims. Seminal paper by the Zigmond group at Penn.'
    },
    {
      pmid: '20179146',
      title: 'Biological activities of thymosin beta4 defined by active sites in short peptide sequences',
      authors: 'Sosne G, Qiu P, Goldstein AL, Wheater M.',
      journal: 'FASEB Journal',
      year: 2010,
      url: 'https://pubmed.ncbi.nlm.nih.gov/20179146/',
      summary: 'Critical for understanding TB-500 specifically: demonstrates that short peptide fragments of Tβ4, including the actin-binding and N-terminal regions, retain specific biological activities. Identifies which fragment retains anti-inflammatory activity. Directly supports the claim that TB-500 fragment can replicate some (not all) Tβ4 functions.'
    },
    {
      pmid: '14517430',
      title: 'Thymosin beta4 enhances endothelial cell differentiation and angiogenesis',
      authors: 'Grant DS, Rose W, Yaen C, Goldstein A, Martinez J, Kleinman H.',
      journal: 'Angiogenesis',
      year: 1999,
      url: 'https://pubmed.ncbi.nlm.nih.gov/14517430/',
      summary: 'Demonstrates Tβ4 induces tube formation in HUVECs and promotes vascular sprouting in coronary artery ring assay. Primary evidence for VEGF-dependent angiogenic mechanism — also the basis for the theoretical cancer-risk concern.'
    },
    {
      pmid: '9194528',
      title: 'Thymosin beta 4 stimulates directional migration of human umbilical vein endothelial cells',
      authors: 'Malinda KM, Goldstein AL, Kleinman HK.',
      journal: 'FASEB Journal',
      year: 1997,
      url: 'https://pubmed.ncbi.nlm.nih.gov/9194528/',
      summary: 'Tβ4 acts as a chemoattractant for endothelial cells (4–6× migration increase over baseline). Mechanistic evidence that Tβ4 guides vascular cell movement — complementary to VEGF-driven proliferation.'
    },
    {
      pmid: '34346165',
      title: 'A first-in-human, randomized, double-blind, single- and multiple-dose, phase I study of recombinant human thymosin β4 in healthy Chinese volunteers',
      authors: 'Wang X, Liu L, Qi L, et al.',
      journal: 'Journal of Cellular and Molecular Medicine',
      year: 2021,
      url: 'https://pubmed.ncbi.nlm.nih.gov/34346165/',
      summary: 'The only published Phase I human study of injectable Tβ4 (84 healthy volunteers, doses 0.05–25 µg/kg). Found dose-proportional PK, no accumulation with repeated dosing, and mild-to-moderate adverse events only — no dose-limiting toxicities. Maximum dose ~1.75 mg in a 70 kg person. IMPORTANT CAVEAT: this is for full 43-aa recombinant Tβ4, not the TB-500 fragment. PK and safety data cannot be directly extrapolated to the fragment.'
    }
  ],

  plain_english: `A synthetic fragment of Thymosin Beta-4, a protein found in nearly every cell in the body and released in high concentrations at wound sites. Studied for tissue repair, reducing inflammation, and promoting new blood vessel growth into injured areas. The rodent evidence for healing is solid. Human trials exist for the full protein administered as eye drops — not for the injectable fragment used by researchers. Often paired with BPC-157 because they act through different but complementary pathways. The same VEGF/cancer concern that applies to BPC-157 applies here.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'tb-500')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ TB-500 profile updated successfully')
  console.log('  research_status: Limited (corrected from Moderate)')
  console.log('  mechanism: 5 items (expanded from 3)')
  console.log('  studies: 7 items — all PMIDs verified on PubMed 2026-06-13')
  console.log('  safety_profile: VEGF/ILK cancer risk added')
  console.log('  loading_phase / maintenance_phase preserved from Session 14')
  console.log('')
  console.log('PMID corrections:')
  console.log('  22107110 (asthma adherence paper) → 22074294 (Goldstein Tβ4 review)')
  console.log('  15286668 (brimonidine eye paper) → 15565145 (Bock-Marquette Nature 2004)')
  console.log('New additions (all verified):')
  console.log('  1447300 — Cassimeris G-actin sequestration, J Cell Biol 1992')
  console.log('  20179146 — Sosne active sites in short peptides, FASEB J 2010')
  console.log('  14517430 — Grant angiogenesis, Angiogenesis 1999')
  console.log('  9194528  — Malinda endothelial migration, FASEB J 1997')
  console.log('  34346165 — Wang Phase I injectable Tβ4 human study, 2021')
}

main()
