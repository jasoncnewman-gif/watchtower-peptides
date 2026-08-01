/**
 * Seeds the full Semaglutide profile into the peptides table.
 * Updates the existing row (slug: semaglutide).
 *
 * PMID verification (2026-06-13):
 *   33567185 — Wilding STEP 1, NEJM 2021 — CONFIRMED ✓
 *   37952131 — Lincoff SELECT, NEJM 2023 — CONFIRMED ✓
 *   33667417 — Davies STEP 2, Lancet 2021 — CONFIRMED ✓
 *   34156049 — STEP 4 (withdrawal/rebound), JAMA 2021 — VERIFY
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-semaglutide-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'semaglutide',
  name: 'Semaglutide',
  full_name: 'Semaglutide (Ozempic / Wegovy)',
  aliases: ['Ozempic', 'Wegovy', 'Rybelsus', 'GLP-1 agonist', 'NNC 0113-0217'],
  category: 'metabolic',
  fda_status: 'approved',
  research_status: 'Strong',

  tagline: 'An FDA-approved GLP-1 receptor agonist with the strongest weight-loss and cardiovascular trial data of any compound sold by peptide vendors — and the only one that is a regulated pharmaceutical.',

  sequence: 'His-Aib-Glu-Gly-Thr-Phe-Thr-Ser-Asp-Val-Ser-Ser-Tyr-Leu-Glu-Gly-Gln-Ala-Ala-Lys(C18 fatty diacid)-Glu-Phe-Ile-Ala-Trp-Leu-Val-Arg-Gly-Arg-NH₂',
  molecular_weight: '4113.58 g/mol',
  half_life: '~7 days (subcutaneous); enables once-weekly dosing',

  overview: `Semaglutide is a synthetic GLP-1 receptor agonist engineered from the 26 amino acid GLP-1(7-37) sequence with two modifications: amino acid substitution at position 8 (Ala→Aib) blocks DPP-4 degradation, and a C18 fatty diacid chain via a linker at lysine 26 enables albumin binding — extending half-life from 2 minutes (native GLP-1) to approximately 7 days. This enables once-weekly subcutaneous dosing (Ozempic for T2D, Wegovy for obesity) or once-daily oral dosing (Rybelsus). It is FDA-approved for three indications: type 2 diabetes (2017), chronic weight management (2021), and cardiovascular risk reduction in obese/overweight adults (2023 post SELECT trial). **Semaglutide is a regulated pharmaceutical drug, not a research chemical.** Its presence in the peptide vendor market is legally and medically distinct from other peptides on this platform — vendors selling it without a prescription are operating outside pharmaceutical regulations.`,

  mechanism: [
    {
      title: 'GLP-1 Receptor Agonism — Incretin Effect',
      body: 'Semaglutide binds and activates the GLP-1 receptor (GLP1R), a G-protein-coupled receptor expressed on pancreatic beta cells, gut, hypothalamus, brainstem, and cardiovascular tissue. Pancreatic activation stimulates glucose-dependent insulin secretion and suppresses glucagon — only when glucose is elevated, reducing hypoglycemia risk versus sulfonylureas. The glucose-dependent mechanism is fundamental to GLP-1 pharmacology.'
    },
    {
      title: 'Central Appetite Suppression — Hypothalamic and Brainstem Circuits',
      body: 'GLP-1 receptors in the arcuate nucleus and area postrema (brainstem) suppress hunger and reduce food reward signaling. Semaglutide crosses the blood-brain barrier at circumventricular organs and modulates hypothalamic POMC/AGRP neurons and mesolimbic dopamine circuits. This central action is the primary mechanism for the ~15% body weight reduction observed in STEP trials — substantially greater than the peripheral pancreatic or gastric effects alone.'
    },
    {
      title: 'Gastric Emptying Delay',
      body: 'GLP-1 receptor activation slows gastric emptying, extending the postprandial period, reducing peak glucose excursions, and increasing satiety duration. This effect diminishes with chronic treatment due to receptor adaptation, but the central appetite-suppression effect persists, which is why weight loss continues beyond the first few weeks.'
    },
    {
      title: 'Cardiovascular Protection — SELECT Trial Mechanism',
      body: 'The SELECT trial (17,604 patients, ~5 years, MACE reduction HR 0.80) demonstrated cardiovascular benefit in obese patients without diabetes. The mechanism is not fully established but involves: endothelial GLP-1 receptor activation with anti-inflammatory and antiatherogenic effects, reductions in systolic blood pressure (~3-4 mmHg), modest LDL-C and triglyceride reduction, and reduced adipose tissue inflammation. Weight loss alone may not fully explain the cardiovascular benefit given early divergence of MACE curves before substantial weight loss occurred.'
    }
  ],

  research_applications: [
    {
      area: 'Chronic Weight Management (BMI ≥30 or ≥27 with comorbidity)',
      evidence: 'Strong human evidence — FDA-approved indication',
      description: 'STEP 1: mean -14.9% body weight vs -2.4% placebo at 68 weeks (n=1,961). STEP 2 (T2D): -9.6% vs -3.4% placebo. STEP 3 (intensive behavior): -16.0%. STEP 5: -15.2% at 2 years. The magnitude of weight loss exceeds any prior approved pharmacotherapy and is sustained with continued treatment. Weight regains rapidly on discontinuation (STEP 4: ~2/3 of lost weight regained within 1 year after stopping).'
    },
    {
      area: 'Type 2 Diabetes — Glycemic Control',
      evidence: 'Strong human evidence — FDA-approved indication',
      description: 'SUSTAIN trials demonstrate HbA1c reduction of 1.5-1.8% at 1 mg/week. Superior to sitagliptin, liraglutide, and empagliflozin in head-to-head trials. Not a first-line agent for T2D but appropriate for patients who also need cardiovascular risk reduction or weight management.'
    },
    {
      area: 'Cardiovascular Risk Reduction (non-diabetic, obese)',
      evidence: 'Strong human evidence — FDA-approved indication',
      description: 'SELECT trial: 17,604 patients with established CVD, BMI ≥27, no T2D. Weekly semaglutide 2.4 mg reduced MACE (CV death, non-fatal MI, non-fatal stroke) by 20% vs placebo over ~5 years. This was the basis for the 2023 FDA approval of Wegovy for CV risk reduction — the first weight-loss drug to demonstrate reduced cardiovascular mortality.'
    },
    {
      area: 'NASH / MAFLD (non-alcoholic fatty liver)',
      evidence: 'Moderate human evidence — Phase 2 completed, Phase 3 ongoing',
      description: 'NASH trial (Newsome 2021): 59% of semaglutide patients achieved NASH resolution without worsening fibrosis vs 17% placebo. Fibrosis improvement itself was not statistically significant. Phase 3 ESSENCE trial is ongoing.'
    },
    {
      area: 'Addiction / Compulsive Behavior (alcohol, drugs, gambling)',
      evidence: 'Early human evidence — emerging signals from real-world data',
      description: 'Case reports and retrospective analyses suggest GLP-1 receptor agonists reduce alcohol consumption, craving, and addictive behavior. Mechanistic basis: GLP-1Rs in mesolimbic dopamine circuits modulate reward processing. Prospective RCTs are ongoing. Not an approved indication; cited here because it explains some off-label interest and community discussion.'
    }
  ],

  dosage: {
    disclaimer: 'Semaglutide is an FDA-approved pharmaceutical. The doses below reflect approved prescribing information and Phase 3 trial protocols. Vendor-sold semaglutide bypasses the prescription system — its purity, sterility, and accurate dosing cannot be guaranteed without pharmaceutical-grade QC. The reconstitution and dosing information below is provided for informational accuracy only.',
    ranges: [
      {
        route: 'Subcutaneous (weight management)',
        range: '0.25 mg → 2.4 mg weekly (dose escalation)',
        frequency: 'Once weekly',
        notes: 'FDA escalation: 0.25 mg × 4 weeks → 0.5 mg × 4 weeks → 1.0 mg × 4 weeks → 1.7 mg × 4 weeks → 2.4 mg maintenance. Titration reduces nausea/GI side effects. STEP trials used 2.4 mg as the efficacy dose.'
      },
      {
        route: 'Subcutaneous (T2D)',
        range: '0.5–1.0 mg weekly (Ozempic)',
        frequency: 'Once weekly',
        notes: 'FDA dose for T2D. Some patients go to 2.0 mg weekly. Lower than obesity dose.'
      }
    ]
  },

  safety_profile: {
    rating: 'Well-characterized — FDA approved, 5+ years of Phase 3 and post-marketing data',
    known_effects: [
      'Nausea (44% vs 16% placebo in STEP 1) — most common, peaks at dose escalation, typically resolves',
      'Vomiting, diarrhea, constipation — dose-dependent GI effects; reason for titration protocol',
      'Injection site reactions: mild, common to all SC injectables',
      'Heart rate increase: +1-4 bpm mean, mechanism unclear; generally not clinically significant',
      'Pancreatitis: rare but reported; FDA black box warning exists. Discontinue if symptoms occur',
      'Gallbladder disease (cholelithiasis, cholecystitis): increased risk with rapid weight loss of any cause, including semaglutide',
      'Diabetic retinopathy complications: initial worsening in rapid glucose-control settings (T2D patients) — not relevant for obesity indication'
    ],
    unknown_risks: [
      'Thyroid C-cell tumors: rodent carcinogenicity data led to FDA black box warning. No human thyroid cancer signal in clinical trials to date, but post-marketing surveillance ongoing. Contraindicated in patients with personal/family history of MEN2 or medullary thyroid carcinoma.',
      'Muscle mass loss: rapid weight loss may include lean mass as well as fat. STEP trials showed predominantly fat loss, but high-protein intake during treatment may be important for preservation.',
      'Long-term GI motility effects: chronic slowing of gastric emptying effects on gut microbiome, nutrient absorption, and motility are not fully characterized.',
      'Post-discontinuation rebound: STEP 4 showed rapid weight regain after stopping. Whether this creates a net-negative metabolic state after a course of treatment is unknown.',
      'Pediatric: approved for obesity in 12+; data in younger children are limited.',
      'Pregnancy: contraindicated. GLP-1 receptor activation affects embryonic development in animal models.'
    ]
  },

  studies: [
    {
      pmid: '33567185',
      title: 'Once-Weekly Semaglutide in Adults with Overweight or Obesity',
      authors: 'Wilding JPH, Batterham RL, Calanna S, et al. (STEP 1 Investigators)',
      journal: 'New England Journal of Medicine',
      year: 2021,
      url: 'https://pubmed.ncbi.nlm.nih.gov/33567185/',
      summary: 'STEP 1: The landmark 68-week Phase 3 RCT. n=1,961 adults with BMI ≥30 (or ≥27 with comorbidity), no T2D. Semaglutide 2.4 mg weekly vs placebo + lifestyle intervention. Mean weight change: -14.9% (semaglutide) vs -2.4% (placebo). 86.4% achieved ≥5% weight loss (vs 31.5% placebo). Safety: primarily GI adverse events leading to ~7% discontinuation. This is the primary efficacy study for the Wegovy approval.'
    },
    {
      pmid: '33667417',
      title: 'Semaglutide 2.4 mg once a week in adults with overweight or obesity, and type 2 diabetes (STEP 2)',
      authors: 'Davies M, Færch L, Jeppesen OK, et al. (STEP 2 Investigators)',
      journal: 'The Lancet',
      year: 2021,
      url: 'https://pubmed.ncbi.nlm.nih.gov/33667417/',
      summary: 'STEP 2: Phase 3 RCT in adults with T2D + obesity (n=1,210, 68 weeks). Semaglutide 2.4 mg vs 1.0 mg vs placebo. Weight: -9.6% (2.4 mg) vs -7.0% (1.0 mg) vs -3.4% (placebo). HbA1c reduction of 1.6% (2.4 mg) vs 2.2% with 1.0 mg. Relevant for understanding that weight loss is partially attenuated in T2D patients relative to non-diabetic obese.'
    },
    {
      pmid: '37952131',
      title: 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes',
      authors: 'Lincoff AM, Brown-Frandsen K, Colhoun HM, et al. (SELECT Investigators)',
      journal: 'New England Journal of Medicine',
      year: 2023,
      url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
      summary: 'SELECT: The cardiovascular outcomes trial. 17,604 adults with BMI ≥27, established CVD, no T2D. Semaglutide 2.4 mg vs placebo, ~5 years follow-up. MACE (CV death, non-fatal MI, non-fatal stroke): 6.5% vs 8.0% (HR 0.80, 95% CI 0.72-0.90). This was the basis for a third FDA approval — semaglutide is the first weight-loss medication to demonstrate reduced CV mortality.'
    }
  ],

  plain_english: `The most powerful weight-loss and cardiovascular risk drug available as of 2026, and the only one on this platform that's actually FDA-approved as a prescription medication. It works by mimicking a gut hormone that tells your brain you're full, slows digestion, and protects the heart through multiple pathways. The Phase 3 trials are among the most rigorous in drug history — ~15% body weight loss sustained for 2 years is a genuinely remarkable result. The catches: GI side effects are common (though usually manageable), weight comes back rapidly when you stop, and vendors selling it without prescriptions are operating outside pharmaceutical regulations with no guarantee of the product's actual quality.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'semaglutide')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ Semaglutide profile updated')
  console.log('  research_status: Strong (retained — FDA-approved, Phase 3 RCTs)')
  console.log('  studies: 3 items (STEP 1, STEP 2, SELECT) — all PMIDs confirmed')
  console.log('  New: FDA approval context, prescription drug caveat, cardiovascular mechanism')
}

main()
