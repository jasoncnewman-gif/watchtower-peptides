/**
 * Adds NAD+ to the peptides table so it's selectable in the Calculator
 * (Reconstitution Calculator / Dosage Planner) and gets a real profile page.
 *
 * Scope note: this is the injectable/subcutaneous reconstituted-vial product
 * vendors actually sell (68 vendor_peptides rows, mg-per-vial lyophilized
 * powder — same shape as BPC-157/TB-500), NOT the oral NMN/NR capsule
 * products covered in the /research/nad-for-aging-and-energy article. IV
 * NAD+ is out of scope per that article and is not covered here either.
 *
 * Dosage is sourced from clinic/compounding and community protocol
 * guidance, not a human RCT — none exists for subcutaneous NAD+ dosing,
 * same honest gap the article already states. Framed the same way MOTS-c's
 * community-protocol dosing is: a real range, clearly labeled as
 * extrapolated practice, not an established clinical dose.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-nad-peptide.ts
 */
import { db } from './lib/client.js';

const row = {
  name: 'NAD+',
  full_name: 'Nicotinamide Adenine Dinucleotide',
  slug: 'nad',
  tagline: 'A coenzyme central to cellular energy production and DNA repair, sold as an injectable, reconstituted vial product for subcutaneous use.',
  aliases: ['NAD', 'Nicotinamide Adenine Dinucleotide', 'NADH precursor'],
  category: 'brain-longevity',
  fda_status: 'research-only',
  research_status: 'Moderate',
  overview:
    'NAD+ is a coenzyme, not a peptide, that every cell uses to shuttle electrons during energy production and that two key enzyme families (sirtuins and PARP DNA-repair enzymes) require as a substrate to function. Tissue NAD+ levels decline measurably with age, which is the basis for interest in raising it. Most human clinical research on raising NAD+ has studied oral precursors (NMN, NR), not the injectable vial product sold here — see our full research writeup for the human trial data. Injectable/subcutaneous NAD+ has essentially no published human dosing research; what follows is sourced from clinical and compounding practice, not clinical trials.',
  what_it_does:
    'Participates in the redox reactions that convert food into ATP, and acts as the required substrate for sirtuin and PARP enzyme activity (gene regulation, mitochondrial function, and DNA repair).',
  mechanism: [
    {
      title: 'Cellular energy production',
      body: 'NAD+ and its reduced form NADH cycle continuously in mitochondria, carrying electrons through the reactions that produce ATP. Without functioning NAD+/NADH cycling, ATP production stops.',
    },
    {
      title: 'Sirtuin and PARP enzyme activity',
      body: 'Sirtuins (gene regulation, mitochondrial function, stress response) and PARP enzymes (DNA repair) both consume NAD+ as a substrate. Lower NAD+ availability means lower activity in both enzyme families, which is the core mechanistic argument for why age-related NAD+ decline might matter.',
    },
    {
      title: 'Age-related decline',
      body: 'Tissue NAD+ levels drop substantially between young adulthood and old age. Research points to the enzyme CD38, which breaks down NAD+ and becomes more active with age, as a major driver of this decline.',
    },
  ],
  research_applications: [
    {
      area: 'Cellular energy / mitochondrial function',
      evidence: 'Mechanistic',
      description: 'NAD+ is required for the core biochemical pathway that produces ATP; this is established biochemistry, not a clinical trial finding specific to supplementation.',
    },
    {
      area: 'Metabolic health (via oral precursors)',
      evidence: 'Early human data',
      description: 'A 2021 human trial of oral NMN found improved muscle insulin sensitivity in prediabetic women. Other human trials of oral NR found no improvement in insulin sensitivity or glucose metabolism in different populations. See the full research article for details — this evidence concerns oral precursors, not the injectable product.',
    },
    {
      area: 'Injectable/subcutaneous use specifically',
      evidence: 'Not studied',
      description: 'No published human clinical trials have evaluated subcutaneous or IM NAD+ dosing, safety, or efficacy. Use reflects clinical/compounding and community practice, not research evidence.',
    },
  ],
  dosage: {
    disclaimer:
      'No human clinical trial has established a standardized subcutaneous NAD+ dose. The range below reflects clinical/compounding and community-reported practice, not a research-derived protocol. Not medical advice.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '50–100 mg',
        frequency: '1 to 3 times weekly',
        notes:
          'Commonly reported practice starts around 20–50 mg per injection and titrates toward 50–100 mg as tolerated. Some protocols use a short daily loading period before stepping down to this weekly range. Injection volume is typically 0.5–1 mL. No human clinical trial has validated this dosing.',
      },
    ],
  },
  safety_profile: {
    rating: 'Limited Safety Data (injectable route)',
    known_effects: [
      'Injection site reactions (redness, mild discomfort) reported anecdotally',
      'Flushing or warmth sensation reported with faster injection/higher concentration',
      'Oral precursor trials (NMN, NR) report mild nausea, headache, and GI discomfort at low rates, not statistically different from placebo',
    ],
    unknown_risks: [
      'No human clinical trial safety data exists for the subcutaneous/injectable route specifically',
      'Long-term effects of sustained NAD+ elevation are not established in humans',
      'NAD+ is mechanistically tied to PARP-dependent DNA repair, which is also active in cancer cells — a theoretical concern discussed in our full research article, not an established human risk',
      'Anyone with a personal or family history of cancer, who is pregnant or breastfeeding, or who takes other medications should talk to a doctor before use',
    ],
  },
  studies: [],
};

async function main() {
  const { error } = await db.from('peptides').upsert(row, { onConflict: 'slug' });
  if (error) { console.error('Failed:', error.message); process.exit(1); }
  console.log(`Seeded /peptides/${row.slug}`);
}

main();
