/**
 * Seeds the full Sermorelin profile into the peptides table.
 * Updates the existing row (slug: sermorelin).
 *
 * PMID verification (2026-06-13):
 *   DB PMID 18047263 — WRONG (off by 355 — adjacent unrelated paper) → replaced with 18046908
 *   DB PMID 18020633 — WRONG (phthalocyanine spectroscopy paper) → removed entirely
 *   18046908 — Walker 2006, Clin Interv Aging — CONFIRMED ✓
 *
 *   1379256 — Corpas 1992, JCEM — CONFIRMED ✓ (GHRH(1-29) reversed GH/IGF-1 decline in old men)
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-sermorelin-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'sermorelin',
  name: 'Sermorelin',
  full_name: 'Sermorelin (GHRH 1-29)',
  aliases: ['GHRH(1-29)', 'GRF(1-29)', 'Geref', 'Serostim analog', 'Sermorelin acetate'],
  category: 'performance',
  fda_status: 'research-only',
  research_status: 'Moderate',

  tagline: 'The original GHRH analog — FDA-approved in the 1990s for pediatric GH deficiency diagnosis, commercially withdrawn in 2008 for business reasons, and now widely used off-label as a GH secretagogue with a real but modest human evidence base.',

  sequence: 'Tyr-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH₂ (first 29 amino acids of native human GHRH)',
  molecular_weight: '3357.93 g/mol',
  half_life: '~10–12 minutes (subcutaneous); DPP-IV sensitive — rapid enzymatic degradation, hence short but physiological pulse',

  overview: `Sermorelin is a synthetic 29-amino-acid peptide corresponding to the first 29 amino acids of native human GHRH(1-44). Unlike CJC-1295 (which has four amino acid substitutions that confer protease resistance), sermorelin has an unmodified sequence and is rapidly degraded by DPP-IV, producing a half-life of 10–12 minutes after subcutaneous injection. This brevity is not a flaw — it produces a single, physiologically brief GH pulse that mimics the natural GHRH-stimulated secretion rhythm. Sermorelin acetate was FDA-approved in the 1990s as Geref for two indications: pediatric GH deficiency testing (diagnostic), and GH insufficiency treatment in children. The brand was commercially withdrawn from the US market in 2008 — this withdrawal was driven by the manufacturer (Serono) exiting the market, not by safety findings or FDA action. Sermorelin itself remains an approved drug substance still available from compounding pharmacies under prescription. The community uses it for adult anti-aging/body composition purposes — this is off-label and has more modest evidence support than the original pediatric GH deficiency indication.`,

  mechanism: [
    {
      title: 'GHRH Receptor Agonism — Native Sequence Activity',
      body: 'Sermorelin corresponds to the biologically active fragment of GHRH required for full receptor binding. It binds and activates the GHRH receptor (GHRHR) on anterior pituitary somatotrophs with affinity comparable to native GHRH(1-44), stimulating GH synthesis and secretion via adenylyl cyclase/cAMP/PKA signaling. The 10-minute half-life produces a single GH pulse per injection — physiologically analogous to a natural GHRH pulse, and distinct from the sustained GH elevation of either exogenous rGH or CJC-1295 with DAC.'
    },
    {
      title: 'Somatostatin-Gated Secretion — Physiological Axis Preservation',
      body: 'Sermorelin stimulates GH release only when pituitary somatostatin tone allows it. Unlike exogenous GH injections (which bypass all regulatory feedback), sermorelin respects the hypothalamic-pituitary GH axis. When somatostatin is high (as it is during stress, hyperglycemia, or high GH states), sermorelin produces a blunted response. This is viewed as a safety feature — the axis cannot be "pushed past" physiological limits by GHRH agonism in the way exogenous GH can. Walker (2006) specifically cited this property as an argument for preferring sermorelin over exogenous GH for adult GH-restoration use.'
    },
    {
      title: 'GH Pulsatility Preservation',
      body: 'Daily or twice-daily sermorelin injections produce multiple discrete GH pulses rather than constant GH elevation. Pulsatile GH secretion is important for maintaining GH receptor sensitivity and the anabolic/lipolytic GH response pattern. Continuous GH elevation (as with high-dose rGH or CJC-1295 with DAC) leads to receptor downregulation. The short half-life of sermorelin makes it structurally suited for preserving the pulsatile pattern when dosed 1–2× daily.'
    }
  ],

  research_applications: [
    {
      area: 'GH Deficiency in Children (pediatric)',
      evidence: 'Strong human evidence — former FDA indication',
      description: 'Sermorelin was FDA-approved for pediatric GH insufficiency. Multiple clinical trials demonstrated efficacy in increasing GH secretion and improving growth velocity in GH-deficient children. This evidence does not directly translate to adult body composition use (different physiology, different endpoint, different population).'
    },
    {
      area: 'GH Restoration in Aging Adults (anti-aging/off-label)',
      evidence: 'Moderate human evidence',
      description: 'A limited body of human evidence supports GHRH-analog stimulation of GH/IGF-1 in aging men and women. Corpas et al. (1992) demonstrated that twice-daily subcutaneous GHRH(1-29) reversed the age-related decline in GH pulse amplitude and IGF-1 in older men. Walker (2006) reviewed the clinical literature and argued sermorelin has a more favorable safety profile than exogenous GH for adult anti-aging application. These studies are small, some used slightly different GHRH analogs, and none used sermorelin in a rigorous RCT with hard clinical endpoints (body composition, QoL, mortality). The "Moderate" evidence rating reflects real human data that falls short of the Phase 3 RCT standard.'
    },
    {
      area: 'Body Composition (muscle, fat)',
      evidence: 'Limited human evidence — inferred from GH literature',
      description: 'No RCT has specifically measured body composition outcomes with sermorelin as the intervention. The connection between sermorelin → GH/IGF-1 elevation → body composition improvement is inferred from the general GH secretagogue literature. This is a reasonable inference but is not specifically demonstrated for sermorelin.'
    }
  ],

  dosage: {
    disclaimer: 'Sermorelin has established pediatric dosing. Adult dosing is off-label and based on compounding pharmacy clinical experience and limited research protocols. No Phase 3 RCT for adult body composition or anti-aging has been conducted.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '200–500 mcg',
        frequency: 'Once daily (preferably at night, ~30–60 min before sleep)',
        notes: 'The bedtime injection timing exploits the natural nocturnal GH surge — the largest pulsatile GH release in healthy adults occurs 1–2 hours after sleep onset, and sermorelin amplifies this pulse rather than adding an artificial one. Most compounding pharmacy protocols use 200–300 mcg. Higher doses do not proportionally increase GH output due to somatostatin gating.'
      },
      {
        route: 'Subcutaneous (diagnostic use)',
        range: '1–3.3 mcg/kg',
        frequency: 'Single dose (stimulation test)',
        notes: 'Former FDA-approved use for GH deficiency testing. Much lower dose than therapeutic; administered under medical supervision with serum GH sampling.'
      }
    ]
  },

  safety_profile: {
    rating: 'Well-studied in pediatric populations; adult long-term safety not formally characterized',
    known_effects: [
      'Injection site reactions: redness, pain, local pruritus — most common adverse effect',
      'Flushing: transient, within 30 minutes of injection; more common at higher doses',
      'Headache: reported in ~10–15% in pediatric trials',
      'Dizziness and nausea: occasional',
      'Water retention: modest, GH-mediated; less pronounced than with exogenous GH because GH elevation is transient and self-limited'
    ],
    unknown_risks: [
      'Long-term effects in adults: no formal Phase 3 adult safety study. Pediatric safety data does not fully translate to adult use patterns (different duration, different indication).',
      'IGF-1 chronically elevated above normal range: long-term elevated IGF-1 carries theoretical oncological risk (same concern as with GH secretagogues in general). Routine IGF-1 monitoring is appropriate with extended use.',
      'Pituitary sensitization or desensitization: chronic daily GHRHR stimulation could alter receptor density. Not studied in clinically relevant durations for adult use.',
      'Interactions with somatostatin analogs or other GH axis medications: pharmacodynamic antagonism expected; combination not studied.',
      'Pregnancy and lactation: no data. Avoid.',
      'Antibody formation: anti-sermorelin antibodies were detected in some pediatric patients in long-term studies. Clinical significance unclear. May affect efficacy over time.'
    ]
  },

  studies: [
    {
      pmid: '1379256',
      title: 'Growth hormone (GH)-releasing hormone-(1-29) twice daily reverses the decreased GH and insulin-like growth factor-I levels in old men',
      authors: 'Corpas E, Harman SM, Piñeyro MA, Roberson R, Blackman MR.',
      journal: 'Journal of Clinical Endocrinology & Metabolism',
      year: 1992,
      url: 'https://pubmed.ncbi.nlm.nih.gov/1379256/',
      summary: 'RCT in old men (mean age ~70) from the National Institute on Aging. GHRH(1-29) 0.5 mg and 1.0 mg SC twice daily for 14 days. The 1.0 mg dose produced significant, dose-related increases in 24-hour mean GH, GH peak amplitude, and IGF-1 — reversing the age-related decline in both hormones toward younger-adult levels. Low dose (0.5 mg) showed non-significant trends. Key paper establishing that the aging-related decline in GH/IGF-1 is upstream at the hypothalamic GHRH level (not pituitary failure), making GHRH analogs mechanistically rational for age-related GH decline. Note: used GHRH(1-29) — the same sequence as sermorelin — for 14 days only; long-term body composition effects not measured.'
    },
    {
      pmid: '18046908',
      title: 'Sermorelin: a better approach to management of adult-onset growth hormone insufficiency?',
      authors: 'Walker RF.',
      journal: 'Clinical Interventions in Aging',
      year: 2006,
      url: 'https://pubmed.ncbi.nlm.nih.gov/18046908/',
      summary: 'Review article making the clinical case for sermorelin over exogenous recombinant GH for adult GH insufficiency. Key arguments: (1) sermorelin preserves axis feedback and pulsatility; (2) GH secretagogues cannot drive GH beyond physiological limits; (3) lower oncological and side-effect risk profile compared to exogenous GH. Reviews available clinical literature including GHRH studies in aging adults. Important context: this is an editorial/review, not a primary RCT. The arguments are mechanistically sound but the body composition/clinical outcomes evidence it cites is limited.'
    }
  ],

  plain_english: `The original GHRH-based GH stimulator — a direct copy of the first 29 amino acids of the brain's own "release GH" signal. It was actually FDA-approved for kids in the 1990s, then the manufacturer pulled it from the market in 2008 for business reasons (not safety). Doctors still prescribe it from compounding pharmacies. It works fast and clears fast (10 minutes), so each injection produces a single natural-looking GH pulse rather than a constant flood. The body's normal checks and balances still operate, which is the main argument for using it instead of injecting GH directly. Human evidence for adult anti-aging use exists but is small and old. Compare to CJC-1295 without DAC: effectively the same mechanism with similar half-life but CJC has four amino acid changes that make it marginally more protease-resistant, while sermorelin is the unmodified natural sequence.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'sermorelin')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ Sermorelin profile updated')
  console.log('  research_status: Moderate (corrected from Strong)')
  console.log('  studies: 2 items — both PMIDs verified')
  console.log('  DB PMID 18047263→18046908 (Walker 2006), DB PMID 18020633 removed (phthalocyanine)')
  console.log('  Corpas 1992 PMID 1379256 added — confirmed on PubMed 2026-06-13')
  console.log('  Key addition: FDA history, pediatric vs adult evidence distinction, Geref withdrawal context')
}

main()
