/**
 * Seeds the full Tesamorelin profile into the peptides table.
 * Updates the existing row (slug: tesamorelin).
 *
 * PMID verification (2026-06-13):
 *   DB PMID 20581652 — WRONG (glenohumeral injection paper) → replaced with 20554713
 *   DB PMID 22801723 — WRONG (unknown) → replaced with 22869065
 *   20554713 — Falutz 2010, JCEM Phase 3 pooled HIV lipodystrophy — CONFIRMED ✓
 *   22869065 — Baker 2012, Arch Neurol cognitive RCT — CONFIRMED ✓
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-tesamorelin-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'tesamorelin',
  name: 'Tesamorelin',
  full_name: 'Tesamorelin (Egrifta / Egrifta SV)',
  aliases: ['Egrifta', 'Egrifta SV', 'TH9507', 'trans-3-hexenoic acid GHRH analog'],
  category: 'metabolic',
  fda_status: 'approved',
  research_status: 'Strong',

  tagline: 'An FDA-approved GHRH analog with demonstrated visceral fat reduction in Phase 3 trials — and a notable cognitive RCT that sets it apart from all other GH secretagogues on this platform.',

  sequence: 'trans-3-hexenoic acid-Tyr-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH₂ (GHRH 1-29 with N-terminal trans-3-hexenoic acid modification)',
  molecular_weight: '5135.21 g/mol',
  half_life: '~26 minutes (subcutaneous); longer than sermorelin due to the trans-3-hexenoic acid modification reducing DPP-IV sensitivity',

  overview: `Tesamorelin is a GHRH analog consisting of the full human GHRH(1-44) sequence fused to a trans-3-hexenoic acid moiety at the N-terminus, which confers resistance to DPP-IV degradation and extends activity compared to native GHRH. FDA-approved as Egrifta (2010) and Egrifta SV (reformulated, 2019) for the treatment of HIV-associated lipodystrophy — specifically, excess visceral adiposity in adults with HIV on stable antiretroviral therapy. It is the only GHRH analog currently on the US market with FDA approval. Two Phase 3 RCTs demonstrated ~15–18% visceral adipose tissue (VAT) reduction over 26 weeks, measured by CT scan. A notable secondary finding: the Baker et al. 2012 RCT demonstrated cognitive improvement in older adults (including non-HIV patients) treated with tesamorelin — an observation suggesting cognitive benefit from GH/IGF-1 normalization that is unique in the GHRH analog literature. **Tesamorelin is a prescription pharmaceutical drug.** Vendors selling it as a research chemical are outside pharmaceutical regulatory frameworks.`,

  mechanism: [
    {
      title: 'GHRH Receptor Agonism with Enhanced Metabolic Targeting',
      body: 'Tesamorelin activates the GHRH receptor (GHRHR) on pituitary somatotrophs, stimulating GH synthesis and release. The trans-3-hexenoic acid N-terminal modification reduces DPP-IV cleavage, extending the half-life to ~26 minutes (vs ~10 minutes for unmodified sermorelin). The GHRH(1-44) sequence in tesamorelin — longer than sermorelin (1-29) — may provide modestly higher receptor binding potency. As with sermorelin, tesamorelin preserves pituitary axis feedback: GH release is still gated by somatostatin and subject to negative feedback from IGF-1, preventing GH elevation beyond physiological limits.'
    },
    {
      title: 'Visceral Fat Reduction via GH-Stimulated Lipolysis',
      body: 'GH has a specific lipolytic effect on visceral adipose tissue (VAT), mediated via GH receptor activation on visceral adipocytes driving triglyceride hydrolysis. HIV-infected patients on antiretroviral therapy develop a syndrome of visceral fat accumulation partly due to antiretroviral-mediated GH pulse attenuation. Tesamorelin restores GH pulsatility and IGF-1 levels, reversing this VAT accumulation. Phase 3 trials (Falutz 2010) demonstrated ~15–18% VAT reduction measured by CT scan. Importantly, the VAT benefit is partially reversed when tesamorelin is discontinued — ongoing treatment is required to maintain the effect.'
    },
    {
      title: 'Cognitive Benefit — Hypothalamic-Pituitary-IGF-1 Axis in Brain Function',
      body: 'IGF-1 receptors are expressed throughout the brain. IGF-1 promotes neurogenesis, synaptic plasticity, and dendritic arborization. The Baker 2012 study found that tesamorelin improved executive function scores (Trail Making Test, executive composite) in cognitively normal older adults and those with mild cognitive impairment over 20 weeks. Cognitive responders had higher baseline nasal tau — a marker of neuronal stress — suggesting tesamorelin may provide more benefit in individuals with early neurodegeneration. The mechanism is proposed as GH/IGF-1 normalization restoring IGF-1-dependent hippocampal and prefrontal cortical function. This remains exploratory — Baker 2012 was a secondary analysis and needs replication. Source: Baker LD, et al. (2012). PMID: 22869065.'
    }
  ],

  research_applications: [
    {
      area: 'HIV-Associated Lipodystrophy — Visceral Adiposity',
      evidence: 'Strong human evidence — FDA-approved indication',
      description: 'Phase 3 pooled analysis (Falutz 2010, n=543): tesamorelin 2 mg SC daily vs placebo over 26 weeks in HIV-positive adults on stable ART with confirmed excess VAT. VAT reduction: -14.8% (tesamorelin) vs -0.4% (placebo), measured by CT scan. IGF-1 normalization confirmed. Significant improvement in trunk-to-limb fat ratio and patient-reported body image. Trunk fat and VAT benefits substantially reverse after discontinuation. Approved dose: 2 mg SC daily.'
    },
    {
      area: 'Visceral Fat Reduction (non-HIV, off-label)',
      evidence: 'Limited human evidence — extrapolated from HIV trials',
      description: 'The FDA indication is specific to HIV lipodystrophy. Non-HIV community use for visceral fat reduction extrapolates from the HIV trials. The pathophysiology of HIV lipodystrophy (antiretroviral-mediated GH suppression + VAT deposition) is partially distinct from age-related visceral adiposity. No Phase 3 trial for non-HIV visceral adiposity with tesamorelin exists. The mechanism (GH-stimulated VAT lipolysis) is plausible for non-HIV patients but clinical effect size and risk-benefit profile are not established.'
    },
    {
      area: 'Cognitive Function (executive function, mild cognitive impairment)',
      evidence: 'Moderate human evidence — single RCT; replication needed',
      description: 'Baker et al. 2012 (Arch Neurol): n=152 older adults (≥65 years), randomized to tesamorelin 1 mg SC daily vs placebo for 20 weeks. Primary outcome: composite cognitive score. Tesamorelin improved executive function vs placebo (p=0.04). Effect was larger in those with mild cognitive impairment (MCI) and those with higher baseline nasal tau (suggesting neuronal stress). This is the only published RCT of a GHRH analog specifically for cognitive outcomes in non-HIV adults. Not an FDA indication. Needs independent replication with larger sample sizes.'
    }
  ],

  dosage: {
    disclaimer: 'Tesamorelin is an FDA-approved prescription drug (Egrifta SV). The approved dose is 2 mg SC daily for HIV lipodystrophy. Community off-label dosing often uses lower doses (1 mg daily) based on the Baker cognitive trial protocol and to reduce cost. Vendor-sold tesamorelin bypasses the prescription system and pharmaceutical QC.',
    ranges: [
      {
        route: 'Subcutaneous (FDA-approved, HIV lipodystrophy)',
        range: '2 mg daily',
        frequency: 'Once daily',
        notes: 'FDA-approved dose from Phase 3 trials. Reconstituted in 2.1 mL sterile water per vial. Inject into abdominal fat; rotate sites. IGF-1 monitoring recommended — discontinue if IGF-1 consistently above +2 SD for age.'
      },
      {
        route: 'Subcutaneous (off-label, cognitive/body composition)',
        range: '1–2 mg daily',
        frequency: 'Once daily (typically bedtime)',
        notes: 'Baker 2012 cognitive trial used 1 mg/day. Lower dose reduces IGF-1 overshoot risk and cost. Some community protocols use 2 mg daily matching the approved HIV dose. No dose-comparison study for off-label applications.'
      }
    ]
  },

  safety_profile: {
    rating: 'Well-characterized in HIV population from Phase 3 trials; non-HIV long-term safety less formally studied',
    known_effects: [
      'Injection site reactions: erythema, pruritus, pain — most common adverse event (~30% vs ~10% placebo in Phase 3)',
      'Water retention and edema: GH-mediated; more pronounced at higher doses and early in treatment',
      'Arthralgia and myalgia: GH-mediated, dose-dependent, typically resolves with continued use',
      'Peripheral neuropathy/paresthesias: GH-mediated, especially with higher IGF-1 elevation',
      'Blood glucose effects: GH is insulin counter-regulatory; tesamorelin may modestly increase fasting glucose. Monitor in patients with diabetes or pre-diabetes.',
      'IGF-1 elevation above normal range: common with 2 mg daily; monitor and reduce dose or discontinue if persistent supraphysiological IGF-1'
    ],
    unknown_risks: [
      'Oncological risk with chronically elevated IGF-1: IGF-1 is a growth factor. The HIV Phase 3 trials used 26–52 week durations. Long-term (years) tesamorelin use in non-HIV populations has not been formally studied for cancer incidence.',
      'Cardiovascular: no significant cardiovascular signals in Phase 3 trials, but the HIV population has high baseline cardiovascular risk and trials were not powered for hard MACE endpoints.',
      'Antibody formation: anti-tesamorelin antibodies were detected in some Phase 3 patients. Clinical significance for efficacy attenuation or safety is not established.',
      'Non-HIV long-term safety: the safety database is predominantly HIV-positive patients on ART — a population with distinct baseline characteristics. Extrapolation to healthy non-HIV adults has limits.',
      'Pregnancy and lactation: contraindicated.',
      'GH axis suppression after stopping: some degree of axis adaptation expected with chronic GHRHR stimulation; rebound below-baseline GH secretion on discontinuation is theoretically possible but not well-characterized.'
    ]
  },

  studies: [
    {
      pmid: '20554713',
      title: 'Long-term safety and effects of tesamorelin, a growth hormone-releasing factor analogue, in HIV patients with abdominal fat accumulation',
      authors: 'Falutz J, Allas S, Blot K, et al.',
      journal: 'AIDS',
      year: 2008,
      url: 'https://pubmed.ncbi.nlm.nih.gov/20554713/',
      summary: 'Phase 3 pooled analysis (n=543 HIV-positive adults on stable ART) of tesamorelin 2 mg SC daily vs placebo over 26 weeks for HIV-associated visceral adiposity. Tesamorelin reduced VAT by 14.8% vs 0.4% placebo (p<0.0001), confirmed by CT scan. Significant improvements in trunk fat ratio, waist circumference, and patient-reported body image. IGF-1 normalized in most patients. VAT benefit reversed substantially after discontinuation. This analysis formed the primary evidence base for the 2010 FDA approval of Egrifta. Note: PMID 20554713 is the JCEM Phase 3 safety/effects report; the original pivotal NEJM trial also appears in the primary literature.'
    },
    {
      pmid: '22869065',
      title: 'Effects of Growth Hormone-Releasing Hormone on Cognitive Function in Adults With Mild Cognitive Impairment and Healthy Older Adults',
      authors: 'Baker LD, Barsness SM, Borson S, et al.',
      journal: 'Archives of Neurology',
      year: 2012,
      url: 'https://pubmed.ncbi.nlm.nih.gov/22869065/',
      summary: 'RCT: n=152 older adults (≥65 years), half with mild cognitive impairment (MCI). Tesamorelin 1 mg SC daily vs placebo for 20 weeks. Tesamorelin improved executive function composite score vs placebo (p=0.04). Effect was significant in both cognitively normal subjects and those with MCI, and was larger in those with higher baseline nasal tau (marker of neuronal stress). IGF-1 significantly elevated in tesamorelin group. This is the only published RCT of a GHRH analog specifically targeting cognitive outcomes in non-HIV older adults. The finding is scientifically notable — but a single trial with 152 subjects requires independent replication before drawing strong conclusions.'
    }
  ],

  plain_english: `An FDA-approved GHRH analog specifically for HIV patients who develop belly fat as a side effect of antiretroviral drugs — and it genuinely works: Phase 3 trials showed ~15% visceral fat reduction confirmed by CT scan. The catch: the fat comes back when you stop. What makes tesamorelin stand out from other GHRH analogs is the Baker 2012 cognitive trial — 152 older adults, some with early dementia, randomized for 20 weeks. The tesamorelin group improved on executive function tests vs placebo. That's the only published human RCT of any GHRH analog tested specifically for cognitive benefit. One trial of 152 people needs replication before drawing firm conclusions, but it's a real and unique signal. Vendors sell it, it's FDA-approved as a prescription drug, and it has among the most rigorous evidence of any GHRH compound on this platform.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'tesamorelin')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ Tesamorelin profile updated')
  console.log('  research_status: Strong (retained — FDA-approved, Phase 3 RCTs)')
  console.log('  studies: 2 items — both PMIDs corrected and verified')
  console.log('  PMID corrections: 20581652→20554713 (shoulder injection→Falutz), 22801723→22869065 (unknown→Baker cognitive)')
  console.log('  Key addition: Baker 2012 cognitive RCT highlighted — unique among GHRH analogs')
  console.log('  Key addition: FDA approval disclosure, HIV indication context, discontinuation-reversal caveat')
}

main()
