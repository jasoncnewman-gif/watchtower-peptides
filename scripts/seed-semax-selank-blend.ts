/**
 * Adds the Semax/Selank Blend to the peptide library.
 * Real gap found via scripts/debug-gaps.ts: 5+ vendor_peptides rows
 * ("Semax/Selank", "Semax/Selank Blend", "Semax/Selank Blend - 10mg/10mg")
 * with no matching profile, while both individual components (semax,
 * selank) already have full, real profiles. Built from that existing,
 * already-verified component data, not re-researched from scratch.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-semax-selank-blend.ts
 */
import { db } from './lib/client.js';

const row = {
  name: 'Semax + Selank',
  // Slug matches generateSlug("Semax/Selank Blend") exactly -- the "/" vendors
  // use gets deleted, not hyphenated, so the real normalized form has no
  // separator between the two compound names. Verified against lib/utils.ts
  // before choosing this, not guessed.
  slug: 'semaxselank-blend',
  full_name: 'Semax / Selank Blend',
  aliases: ['Semax/Selank', 'Semax Selank Blend', 'Selank/Semax'],
  tagline: 'A combination of two Russian-developed nootropic peptides: Semax for cognitive enhancement and neuroprotection, Selank for anxiolytic and immune-modulating effects.',
  description: 'Pairs two structurally related, independently well-characterized Russian nootropic peptides sold together in one vial, most commonly for combined cognitive and anxiolytic research use.',
  fda_status: 'research-only',
  category: 'blend',
  research_status: 'Moderate',
  overview:
    'Semax and Selank are both synthetic peptides developed at the Institute of Molecular Genetics of the Russian Academy of Sciences, both built on a stabilizing Pro-Gly-Pro extension, and both used clinically in Russia (Semax as a nootropic/neuroprotective agent, Selank as a non-sedating anxiolytic). Vendors commonly sell them combined in a single vial, pairing Semax\'s cognitive and neurotrophic effects (BDNF upregulation, dopaminergic/serotonergic/cholinergic activation) with Selank\'s anxiolytic and immunomodulatory profile (GABA-A modulation without sedation or dependence). Evidence for the individual compounds comes primarily from Russian clinical research; no human trial has evaluated the two combined.',
  mechanism: [
    {
      title: 'Semax component — neurotrophic and cognitive',
      body: 'Semax is derived from the ACTH 4-7 fragment but lacks hormonal (cortisol-stimulating) activity. It upregulates BDNF and activates serotonergic, dopaminergic, and cholinergic systems, the basis for its Russian clinical use in stroke rehabilitation and cognitive enhancement.',
    },
    {
      title: 'Selank component — anxiolytic and immune',
      body: 'Selank is an analog of the immunomodulatory peptide Tuftsin. It modulates the GABA-A system without the sedation, tolerance, or dependence associated with benzodiazepines, and has documented immune-enhancing effects, particularly against stress-induced immunosuppression.',
    },
  ],
  research_applications: [
    {
      area: 'Cognitive performance and neuroprotection (Semax)',
      evidence: 'Moderate',
      description: 'Semax has real Russian clinical use in stroke rehabilitation and traumatic brain injury, and documented BDNF-upregulating effects. This evidence is for Semax alone, not the combination.',
    },
    {
      area: 'Anxiolytic and immune effects (Selank)',
      evidence: 'Moderate',
      description: 'Selank has documented anxiolytic effects without benzodiazepine-like sedation or dependence in Russian clinical research, plus effects on stress-induced immunosuppression. This evidence is for Selank alone, not the combination.',
    },
    {
      area: 'Combined Semax + Selank use',
      evidence: 'Not studied',
      description: 'No published trial, human or animal, has evaluated Semax and Selank administered together. The rationale for combining them is community and vendor practice, pairing a cognitive-focused peptide with an anxiolytic one.',
    },
  ],
  dosage: {
    disclaimer:
      'No human clinical trial has evaluated Semax and Selank in combination. The range below is drawn from each compound\'s individually studied/practiced dosing, not a combination-specific protocol. Not medical advice.',
    ranges: [
      {
        route: 'Intranasal',
        range: '250–500 mcg',
        frequency: '1 to 2 times daily',
        notes: 'Most common route for both individual components. Effects reported within 10-60 minutes. Cycling (e.g. a few weeks on, break) is common practice, mirroring individual Semax protocols.',
      },
      {
        route: 'Subcutaneous',
        range: '250–500 mcg',
        frequency: '1 to 2 times daily',
        notes: 'Injectable route reported to produce more consistent bioavailability than intranasal for both individual components, per their own profiles.',
      },
    ],
  },
  safety_profile: {
    rating: 'Limited Safety Data (as a combination)',
    known_effects: [
      'Individually, both Semax and Selank are described in Russian clinical use as well tolerated at studied doses',
      'Injection site reactions reported anecdotally with subcutaneous use',
    ],
    unknown_risks: [
      'No safety data exists for Semax and Selank administered together specifically',
      'Long-term effects of combined use are not established',
      'Evidence for each individual compound comes primarily from Russian clinical research, not Western-style RCTs',
    ],
  },
  studies: [],
  blend_components: [
    {
      name: 'Semax',
      slug: 'semax',
      dose_mg: 0.3,
      contribution: 'Neurotrophic/cognitive component — upregulates BDNF and activates serotonergic, dopaminergic, and cholinergic systems. Studied in Russian clinical practice for stroke rehabilitation and cognitive enhancement.',
    },
    {
      name: 'Selank',
      slug: 'selank',
      dose_mg: 0.3,
      contribution: 'Anxiolytic/immune component — modulates GABA-A signaling without sedation or dependence, and supports immune function under stress. A Tuftsin analog studied in Russian clinical practice.',
    },
  ],
  plain_english:
    'A combination vial pairing Semax (cognitive, neuroprotective) with Selank (anxiolytic, immune-supporting), two individually well-studied Russian nootropic peptides. No trial has tested them together; dosing here is extrapolated from each compound\'s own studied/practiced range.',
};

async function main() {
  const { error } = await db.from('peptides').upsert(row, { onConflict: 'slug' });
  if (error) { console.error('Failed:', error.message); process.exit(1); }
  console.log(`Seeded /peptides/${row.slug}`);
}

main();
