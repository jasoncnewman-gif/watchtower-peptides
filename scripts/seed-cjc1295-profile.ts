/**
 * Seeds the full CJC-1295 profile into the peptides table.
 * Updates the existing row (slug: cjc-1295).
 *
 * PMID verification (2026-06-13):
 *   15755685 — WRONG (CB1/Parkinson's paper) → replaced with 16352683
 *   16352683 — Teichman 2006, JCEM — CONFIRMED ✓ (human study, CJC-1295 WITH DAC)
 *
 * Critical note: PMID 16352683 studied CJC-1295 WITH DAC (the long-acting 8-day half-life form).
 * Most community use is CJC-1295 WITHOUT DAC (Modified GRF 1-29, ~30 min half-life).
 * These are different compounds. The human data applies directly only to the WITH-DAC form.
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-cjc1295-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'cjc-1295',
  name: 'CJC-1295',
  full_name: 'CJC-1295 (With and Without DAC)',
  aliases: ['Modified GRF 1-29', 'Mod GRF 1-29', 'CJC-1295 No DAC', 'CJC-1295 with DAC', 'GRF(1-29)', 'Drug Affinity Complex'],
  category: 'performance',
  fda_status: 'research-only',
  research_status: 'Limited',

  tagline: 'A GHRH analog that comes in two fundamentally different versions: a pulse-mimicking 30-minute form (no DAC) and a long-acting 8-day form (with DAC) — and most vendors sell both under the same name.',

  sequence: 'Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH₂ (29 amino acids; four substitutions from native GHRH(1-29))',
  molecular_weight: '3367.97 g/mol (without DAC); 3647.15 g/mol (with DAC)',
  half_life: '~30 minutes (without DAC); ~8 days (with DAC — documented in human Teichman 2006 study)',

  overview: `CJC-1295 is a synthetic 29-amino-acid GHRH analog with four amino acid substitutions from native GHRH(1-29) (Ala2→D-Ala, Gln8→Ala, Ala15→Ala, Leu27→Leu) that confer resistance to DPP-IV enzymatic degradation and DPPIII cleavage, extending activity from the ~2-minute half-life of native GHRH. The "without DAC" form (also called Modified GRF 1-29) has a half-life of ~30 minutes — sufficient for a single GH pulse when injected. The "with DAC" form (using a Drug Affinity Complex/maleimidoproprionic acid linker that covalently binds to albumin) extends the half-life to ~8 days — producing a sustained GH elevation more analogous to continuous GH infusion than natural pulsatile GH secretion. **This distinction matters clinically**: the community primarily uses CJC-1295 without DAC to produce physiological GH pulses (stacked with Ipamorelin). CJC-1295 with DAC produces blunted continuous GH elevation and may desensitize pituitary GH release. The human evidence (Teichman 2006) was conducted with the WITH-DAC version only.`,

  mechanism: [
    {
      title: 'GHRH Receptor Agonism with Extended Activity',
      body: 'CJC-1295 binds and activates the GHRH receptor (GHRHR) on anterior pituitary somatotrophs, stimulating GH synthesis and secretion. The four amino acid substitutions vs native GHRH(1-29) do not alter receptor binding affinity but prevent rapid enzymatic degradation, extending the period of receptor stimulation. Without DAC: single injection → single GH pulse over ~30–60 minutes. With DAC: single injection → elevated GH/IGF-1 for 6-11+ days. Source: Teichman SL, et al. (2006). PMID: 16352683.'
    },
    {
      title: 'Synergistic Action with GHRPs (CJC + Ipamorelin)',
      body: 'CJC-1295 (GHRHR agonist) and ghrelin-receptor agonists like Ipamorelin (GHS-R1a) work via independent receptor pathways on the same somatotroph cells. Co-administration activates both pathways simultaneously, producing a supraadditive GH pulse. This mechanistic synergy is the basis for the ubiquitous CJC-1295/Ipamorelin stack. The combination is mechanistically rational; no published human RCT compares the combination against individual components with clinical endpoints.'
    },
    {
      title: 'With DAC vs Without DAC — Pulsatility vs Sustained Elevation',
      body: 'Natural GH physiology is pulsatile: 4-8 pulses/day with troughs near zero. Pulsatility is important for GH receptor sensitivity maintenance — continuous GH elevation (as with exogenous rGH) leads to receptor downregulation and insulin resistance. CJC-1295 without DAC preserves pulsatility; CJC-1295 with DAC blunts it. The Teichman 2006 trial showed 2-10× mean GH elevation for 6+ days after a single injection of the DAC form — this is a departure from physiological pulsatility, similar in profile to what the community criticizes about exogenous rGH.'
    }
  ],

  research_applications: [
    {
      area: 'GH Pulse Amplification (CJC without DAC)',
      evidence: 'Limited human evidence',
      description: 'No dedicated human RCT for CJC-1295 without DAC as a standalone compound. The human data comes from the Teichman 2006 trial of the WITH-DAC form. CJC without DAC is inferred to produce GH pulses of intermediate duration between sermorelin (~10 min) and CJC with DAC (~8 days) based on half-life extrapolation. No published PK/PD study for the without-DAC form in humans.'
    },
    {
      area: 'GH/IGF-1 Elevation for Body Composition',
      evidence: 'Preclinical only (for human body composition endpoints)',
      description: 'The Teichman 2006 study confirmed GH and IGF-1 elevation in humans. It was not designed to measure body composition, performance, or recovery endpoints. No published RCT has measured these outcomes for CJC-1295 in healthy adults. The connection between GH/IGF-1 elevation and body composition improvements is inferred from the GH pharmacology literature, not demonstrated specifically for CJC-1295.'
    }
  ],

  dosage: {
    disclaimer: 'CJC-1295 without DAC (Mod GRF 1-29) has no published human dose-optimization study. CJC-1295 with DAC doses are from the Teichman 2006 human pharmacology study. Community doses for without-DAC are extrapolated by analogy to sermorelin dosing.',
    ranges: [
      {
        route: 'Subcutaneous — CJC WITHOUT DAC (Mod GRF 1-29)',
        range: '100–300 mcg',
        frequency: '1–3× daily, fasted or post-exercise',
        notes: 'Community protocol. Injected simultaneously with GHRP (usually Ipamorelin). No published human dose-response study for this form. The 100-300 mcg range is by analogy to sermorelin/GHRH studies. Dose accuracy critical at these small volumes — use 1 mg/mL working concentration.'
      },
      {
        route: 'Subcutaneous — CJC WITH DAC',
        range: '1–2 mg',
        frequency: 'Once weekly or every 2 weeks',
        notes: 'Based on Teichman 2006 trial doses (ranging from 30 mcg/kg to 60 mcg/kg in a 70 kg adult = 2.1–4.2 mg; community doses lower). With DAC produces sustained multi-day GH elevation. Consider that pulsatility is lost with this form — implications for long-term receptor sensitivity are not studied.'
      }
    ]
  },

  safety_profile: {
    rating: 'Limited acute human safety data from one trial; long-term effects uncharacterized',
    known_effects: [
      'Injection site reactions: redness, mild swelling — common to all SC peptides',
      'Water retention at higher doses (GH-mediated)',
      'Transient flushing shortly post-injection',
      'With DAC: prolonged GH elevation for 6-11 days after a single dose — any GH-related side effects (water retention, joint aches, paresthesias) would persist for the full duration'
    ],
    unknown_risks: [
      'Long-term GH axis effects: chronic secretagogue use could alter pituitary GHRH receptor density, somatostatin tone, or natural GH pulsatility. Not studied in durations relevant to community use.',
      'With DAC — desensitization risk: sustained GHRHR activation may downregulate receptor expression on somatotrophs, reducing subsequent endogenous GHRH responsiveness. Not characterized in humans.',
      'IGF-1 and cancer: chronically elevated IGF-1 (particularly with the continuous elevation from DAC form) may have cumulative oncological risk. Applies regardless of GH source.',
      'Insulin resistance: GH is counter-regulatory to insulin. Sustained GH elevation (especially with DAC form) may chronically impair insulin sensitivity.',
      'Pregnancy and lactation: no data. Avoid.',
      'Drug interactions: none formally studied.'
    ]
  },

  studies: [
    {
      pmid: '16352683',
      title: 'Prolonged Stimulation of Growth Hormone (GH) and Insulin-Like Growth Factor I Secretion by CJC-1295, a Long-Acting Analog of GH-Releasing Hormone, in Healthy Adults',
      authors: 'Teichman SL, Neale A, Lawrence B, Gagnon C, Castaigne JP, Frohman LA.',
      journal: 'Journal of Clinical Endocrinology & Metabolism',
      year: 2006,
      url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
      summary: 'The only published human pharmacology study for CJC-1295. Studied the WITH-DAC form (covalent albumin binding). Single injections (30, 60, 125, 250 mcg/kg) produced 2- to 10-fold increases in mean GH for 6+ days and 1.5- to 3-fold IGF-1 elevation for 9-11 days. Estimated half-life 5.8-8.1 days. Multiple doses maintained elevated IGF-1 for up to 28 days. Well-tolerated; no serious adverse events. Critical limitation: this data applies to CJC-1295 WITH DAC only, not the without-DAC form used in most community stacks.'
    }
  ],

  plain_english: `A modified version of the body's own "release GH now" signal hormone. Two versions exist with completely different behaviors: one (without DAC) causes a single pulse and clears in 30 minutes — the kind you'd use alongside Ipamorelin to mimic a natural GH pulse. The other (with DAC) stays active for 8 days after one injection, keeping GH elevated the whole time — which sounds good but may actually blunt the natural pulsatile pattern that GH receptors need to stay sensitive. The human research only studied the long-acting version. The short-acting version everyone stacks with Ipamorelin has essentially no direct human trial data.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'cjc-1295')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ CJC-1295 profile updated')
  console.log('  research_status: Limited (corrected from Moderate)')
  console.log('  studies: 1 item — PMID corrected (15755685→16352683)')
  console.log('  Key addition: with-DAC vs without-DAC distinction throughout')
  console.log('  Key addition: Teichman 2006 data applies to WITH-DAC only (critical caveat)')
}

main()
