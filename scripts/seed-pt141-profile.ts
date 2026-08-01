/**
 * Seeds the full PT-141 (Bremelanotide) profile into the peptides table.
 * Updates the existing row (slug: pt-141).
 *
 * PMID verification (2026-06-13):
 *   DB PMID 14504454 — WRONG (pathological gambling paper) → replaced with 12851303
 *   DB PMID 31348226 — unverified (captcha-blocked) → replaced with 31599840
 *   12851303 — Molinoff 2003, Ann NY Acad Sci — CONFIRMED ✓
 *   31599840 — Kingsberg 2019 RECONNECT, Obstet Gynecol — CONFIRMED ✓
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-pt141-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'pt-141',
  name: 'PT-141',
  full_name: 'PT-141 / Bremelanotide',
  aliases: ['Bremelanotide', 'Vyleesi', 'PL-6983', 'Melanocortin agonist'],
  category: 'sexual-health',
  fda_status: 'approved',
  research_status: 'Strong',

  tagline: 'The only centrally-acting FDA-approved treatment for female hypoactive sexual desire disorder — and the first peptide-based sexual-health drug, approved 2019, now sold freely by peptide vendors.',

  sequence: 'Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH (cyclic 7-amino acid peptide; cyclized via lactam bridge between Asp and Lys side chains)',
  molecular_weight: '1025.19 g/mol',
  half_life: '~2.7 hours (subcutaneous, human PK data from clinical trials)',

  overview: `PT-141 (bremelanotide) is a cyclic heptapeptide melanocortin receptor agonist derived from the tanning peptide Melanotan II. Where Melanotan II (a linear peptide) was noted to cause spontaneous erections in early studies, a cyclic analog was developed specifically for sexual dysfunction. PT-141 binds MC3R and MC4R receptors in the central nervous system — primarily in the hypothalamus — activating brain-based sexual arousal pathways rather than acting on peripheral vasculature (as PDE5 inhibitors like sildenafil do). It received FDA approval in June 2019 as Vyleesi (1.75 mg SC) for acquired, generalized hypoactive sexual desire disorder (HSDD) in premenopausal women. **PT-141/bremelanotide is an FDA-approved prescription drug.** Vendors selling it as a research peptide are operating outside pharmaceutical regulations. For men, bremelanotide has completed Phase 2 trials showing efficacy in erectile dysfunction, but has not received FDA approval for this indication — that use is off-label.`,

  mechanism: [
    {
      title: 'Central Melanocortin Receptor Agonism — MC3R and MC4R',
      body: 'PT-141 crosses the blood-brain barrier and binds MC3R and MC4R receptors in the medial preoptic area (MPOA) and other hypothalamic regions. MC4R activation in the MPOA and paraventricular nucleus (PVN) is the primary driver of sexual arousal in preclinical models. Unlike peripheral vasodilators (PDE5 inhibitors), the mechanism is entirely central — generating the subjective experience of sexual desire rather than just enabling physiological response. This is clinically important: PT-141 is effective even when reduced desire (not erectile or lubrication mechanics) is the core problem. Source: Molinoff PB, et al. (2003). PMID: 12851303.'
    },
    {
      title: 'Dopaminergic and Noradrenergic Pathway Modulation',
      body: 'MC4R activation in hypothalamic nuclei secondarily modulates dopaminergic mesolimbic circuits and noradrenergic activity, producing the motivational and reward components of sexual desire. This is distinct from testosterone-dependent libido circuits, explaining why PT-141 can be effective in patients with normal testosterone but central HSDD.'
    },
    {
      title: 'No Direct Vascular Mechanism — Critical Distinction from PDE5 Inhibitors',
      body: 'PDE5 inhibitors (sildenafil, tadalafil) work by relaxing vascular smooth muscle to increase blood flow to erectile tissue. PT-141 does not share this mechanism and is not a blood pressure drug. It lacks direct vasodilatory effects at clinical doses. Blood pressure elevation seen at higher doses (above FDA-approved 1.75 mg) appears to be secondary to central sympathetic activation — this is a dose-dependent adverse effect, not a therapeutic mechanism.'
    }
  ],

  research_applications: [
    {
      area: 'Female HSDD — Acquired, Generalized (Premenopausal)',
      evidence: 'Strong human evidence — FDA-approved indication',
      description: 'RECONNECT trials (two identical Phase 3 RCTs, Kingsberg 2019, n=1,247 total): bremelanotide 1.75 mg SC vs placebo taken as needed. Primary endpoints: change in FSDS-R score (sexual distress) and change in FSFI desire domain. Co-primary endpoints both met. Significant improvement in FSDS-R (desire-related distress) and FSFI desire score. Number of satisfying sexual events: +0.5 vs +0.2 (placebo). The absolute effect size is modest — this is important context. Nausea (40%) and flushing (20%) are common.'
    },
    {
      area: 'Male Erectile Dysfunction (off-label)',
      evidence: 'Moderate human evidence — Phase 2 completed, no FDA approval',
      description: 'Phase 2 studies including Diamond et al. 2004 (n=65) demonstrated dose-dependent improvement in erectile function in men with ED, including those who had not responded to sildenafil. Mechanism (central MC4R) is complementary to PDE5 inhibitors rather than redundant — some men respond to PT-141 + PDE5i combination when neither alone is sufficient. No Phase 3 trial has been completed for male ED. FDA approval for this indication has not been sought.'
    },
    {
      area: 'Postmenopausal Women with HSDD',
      evidence: 'Limited human evidence',
      description: 'RECONNECT trials enrolled premenopausal women only. Postmenopausal data is limited and the FDA approval does not cover this population. Some observational and off-label prescribing data exist but no Phase 3 RCT in postmenopausal women has been completed.'
    }
  ],

  dosage: {
    disclaimer: 'PT-141/bremelanotide is an FDA-approved prescription drug. The FDA-approved dose is 1.75 mg SC. Community protocols often use lower doses to reduce nausea. Vendor-sold PT-141 bypasses the prescription system and pharmaceutical QC.',
    ranges: [
      {
        route: 'Subcutaneous (FDA-approved, female HSDD)',
        range: '1.75 mg',
        frequency: 'As needed, ≥45 minutes before anticipated sexual activity; maximum 1× per 24 hours, ≤8 doses/month',
        notes: 'FDA-approved dose from RECONNECT trials. Inject into abdomen or thigh. Maximum monthly frequency limit is set due to focal hyperpigmentation with chronic use (see safety). Onset 45 minutes, peak ~1-4 hours.'
      },
      {
        route: 'Subcutaneous (community — male ED, titrated)',
        range: '0.5–2.0 mg',
        frequency: 'As needed, 45–90 minutes before activity',
        notes: 'Community protocols often start at 0.5–1.0 mg to assess nausea tolerance, titrating up as tolerated. The nausea rate is strongly dose-dependent — 1.0 mg has substantially less nausea than 1.75 mg or 2.0 mg. No human dose-response optimization study for male ED.'
      }
    ]
  },

  safety_profile: {
    rating: 'Well-characterized from Phase 3 trials; primary concern is nausea and focal hyperpigmentation',
    known_effects: [
      'Nausea: 40% at 1.75 mg in RECONNECT (vs 1% placebo). Most common reason for discontinuation. Dose-dependent. Significantly higher at 2.0 mg+.',
      'Flushing: 20% at 1.75 mg. Transient, onset within 30-60 min of injection.',
      'Blood pressure increase: transient mean +6-8 mmHg systolic, +2-3 mmHg diastolic at 1.75 mg. Clinically significant at higher doses. FDA contraindicates use with nitrates (additive hypotension risk is theoretical; actual concern is BP elevation, not lowering, at clinical doses).',
      'Focal hyperpigmentation: darkening of face, breasts, and gums with repeated doses. Mechanism: MC1R activation in melanocytes. More common in patients with dark skin. The FDA dose-frequency limit (≤8 doses/month) was partly set to minimize this risk. Typically reversible after stopping.',
      'Injection site reactions: mild, common'
    ],
    unknown_risks: [
      'Long-term hyperpigmentation: the 8-per-month limit is empirical; long-term accumulation with higher-frequency use (common in community protocols) has not been studied.',
      'Cardiovascular contraindication: PT-141 is contraindicated in patients with cardiovascular disease. The BP transient elevation is not trivial in patients with uncontrolled hypertension or CVD.',
      'Male fertility: effects on spermatogenesis or reproductive axis with chronic use are not characterized.',
      'Drug interactions: SSRI-treated HSDD patients (a common comorbidity) may have reduced response due to serotonergic suppression of dopaminergic reward circuits. No drug-interaction RCT exists.',
      'Long-term CNS effects: chronic melanocortin receptor agonism in the hypothalamus beyond 8-12 week clinical trials has not been studied.',
      'Pregnancy and lactation: contraindicated. MC4R signaling plays roles in fetal development and maternal metabolism.'
    ]
  },

  studies: [
    {
      pmid: '12851303',
      title: 'PT-141: a melanocortin agonist for the treatment of sexual dysfunction',
      authors: 'Molinoff PB, Shadiack AM, Earle D, Diamond LE, Quon CY.',
      journal: 'Annals of the New York Academy of Sciences',
      year: 2003,
      url: 'https://pubmed.ncbi.nlm.nih.gov/12851303/',
      summary: 'Early mechanistic and Phase 1/2 characterization of PT-141. Describes the central melanocortin mechanism (MC3R/MC4R agonism in hypothalamic nuclei), pharmacokinetics of the cyclic peptide, and early efficacy signals in both male ED and female sexual dysfunction. Establishes the key differentiator from PDE5 inhibitors: central vs peripheral mechanism. Historical importance — this is the foundational clinical paper establishing PT-141 as a viable drug candidate.'
    },
    {
      pmid: '31599840',
      title: 'Bremelanotide for Female Sexual Dysfunctions in Premenopausal Women: A Randomized, Placebo-Controlled Dose-Finding Trial (RECONNECT)',
      authors: 'Kingsberg SA, Clayton AH, Portman D, et al.',
      journal: 'Obstetrics & Gynecology',
      year: 2019,
      url: 'https://pubmed.ncbi.nlm.nih.gov/31599840/',
      summary: 'RECONNECT Phase 3 RCTs — the pivotal trials for FDA approval. Two identical trials: n=1,247 premenopausal women with acquired generalized HSDD. Bremelanotide 1.75 mg SC as-needed vs placebo. Both trials met co-primary endpoints (FSDS-R desire distress score and FSFI desire domain). Key finding: statistically significant but modest absolute effect size — +0.5 satisfying sexual events/month vs +0.2 placebo. Nausea (40%) and flushing (20%) were the primary adverse events. Formed basis of the June 2019 FDA approval of Vyleesi.'
    }
  ],

  plain_english: `The first drug to treat low sexual desire by acting on the brain rather than the genitals — and FDA-approved for women with HSDD since 2019. It works on the same central circuits that make you want sex in the first place, not on blood flow (that's what Viagra does). The Phase 3 trials showed real but modest benefit — about half an extra satisfying sexual encounter per month compared to placebo. The main downside is nausea, which affects 40% of users and is dose-dependent. Men use it off-label for ED, with reasonable Phase 2 evidence. The chronic-use concern worth taking seriously: repeated doses cause focal skin darkening (hyperpigmentation), which is why the FDA limits it to 8 times per month. Vendors sell it as a research peptide, but it's a real prescription drug with a real approval — and real side effects.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'pt-141')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ PT-141 profile updated')
  console.log('  research_status: Strong (retained — FDA-approved, Phase 3 RCTs)')
  console.log('  studies: 2 items — both PMIDs corrected and verified')
  console.log('  PMID corrections: 14504454→12851303 (gambling→Molinoff), 31348226→31599840 (unverified→Kingsberg RECONNECT)')
  console.log('  Key addition: FDA approval disclosure throughout, hyperpigmentation risk, male off-label distinction')
}

main()
