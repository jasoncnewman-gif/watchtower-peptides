/**
 * Adds VIP (Vasoactive Intestinal Peptide) to the peptide library.
 * Real gap found via scripts/debug-gaps.ts: 20+ vendor_peptides rows
 * (5mg/6mg/10mg vials) with no matching profile anywhere.
 *
 * VIP has real human clinical trial history as the synthetic form
 * Aviptadil (FDA Orphan Drug Designation for ARDS and pulmonary
 * hypertension; studied IV and inhaled in COVID-19 respiratory failure
 * and pulmonary hypertension trials) and as a 50mcg/spray nasal protocol
 * in CIRS/mold-illness clinical practice (Shoemaker protocol). The
 * subcutaneous, self-administered dosing below (what vendors here
 * actually sell as mg vials) is NOT the same evidence base as either of
 * those — it's sourced from compounding/community practice, flagged as
 * such in the disclaimer, same honest treatment as NAD+ and MOTS-c.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-vip-peptide.ts
 */
import { db } from './lib/client.js';

const row = {
  name: 'VIP',
  full_name: 'Vasoactive Intestinal Peptide',
  slug: 'vip',
  tagline: 'A 28-amino-acid neuropeptide studied for vasodilation and immune modulation, with real clinical trial history as the synthetic drug Aviptadil for respiratory and pulmonary conditions.',
  aliases: ['Vasoactive Intestinal Polypeptide', 'Aviptadil', 'VIP Peptide'],
  category: 'immune',
  fda_status: 'research-only',
  research_status: 'Moderate',
  overview:
    'VIP is a naturally occurring 28-amino-acid neuropeptide found throughout the brain, autonomic nervous system, pancreas, and gut, where it acts as a potent vasodilator and immune modulator. It has more real human clinical trial history than most compounds sold in this market: its synthetic form, Aviptadil, holds FDA Orphan Drug Designation for ARDS and pulmonary hypertension and was studied intravenously and by inhalation in COVID-19 respiratory failure and pulmonary hypertension trials. Separately, a standardized intranasal VIP protocol (50 mcg/spray) is used in clinical practice for Chronic Inflammatory Response Syndrome (CIRS) following mold/biotoxin exposure, under the Shoemaker protocol. The subcutaneous, self-administered mg-vial product sold by most vendors here is a different use case from either of those and does not carry the same clinical evidence.',
  what_it_does:
    'Binds VPAC1/VPAC2 receptors to trigger cAMP/cGMP-mediated vasodilation in systemic and pulmonary vasculature, and downregulates pro-inflammatory cytokines (including TNF-alpha) from macrophages and dendritic cells via cAMP/CREB signaling and NF-kB inhibition.',
  mechanism: [
    {
      title: 'Vasodilation',
      body: 'VIP activates VPAC1 and VPAC2 receptors coupled to adenylyl cyclase, raising cAMP and cGMP and opening K-ATP channels in vascular smooth muscle. In human pulmonary hypertension studies, inhaled VIP measurably reduced pulmonary vascular resistance without affecting systemic blood pressure.',
    },
    {
      title: 'Immune modulation',
      body: 'VIP downregulates pro-inflammatory cytokines (notably TNF-alpha) released by macrophages and dendritic cells, acting through cAMP-dependent CREB phosphorylation and inhibition of NF-kB. This is the basis for its clinical use in CIRS protocols and its research in sarcoidosis, MS, and other inflammatory conditions.',
    },
  ],
  research_applications: [
    {
      area: 'Pulmonary hypertension / respiratory failure (as Aviptadil)',
      evidence: 'Human RCT',
      description: 'The synthetic form Aviptadil has FDA Orphan Drug Designation and was studied IV and inhaled in human trials for ARDS/COVID-19 respiratory failure and pulmonary hypertension. This evidence applies to the studied IV/inhaled routes and doses, not to subcutaneous self-administration.',
    },
    {
      area: 'CIRS / mold-biotoxin illness (intranasal)',
      evidence: 'Clinical practice',
      description: 'A standardized 50 mcg/spray intranasal protocol is used as the final step of the Shoemaker CIRS treatment protocol, with pre/post inflammatory marker monitoring. This is established clinical practice, not a published RCT.',
    },
    {
      area: 'Subcutaneous/general research use',
      evidence: 'Not studied',
      description: 'No published human trial has evaluated the subcutaneous mg-vial dosing most vendors sell. Use reflects compounding and community practice, not research evidence.',
    },
  ],
  dosage: {
    disclaimer:
      'No human clinical trial has evaluated subcutaneous VIP dosing for general research use. The range below reflects compounding and community-reported practice, not the Aviptadil (IV/inhaled) or Shoemaker-protocol (intranasal) clinical evidence described above. Not medical advice.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '50–200 mcg',
        frequency: '1 to 2 times daily',
        notes:
          'Commonly reported practice starts around 50 mcg once daily and may increase toward 100–200 mcg, 1–2x daily, as tolerated. No human clinical trial has validated this dosing or frequency.',
      },
    ],
  },
  safety_profile: {
    rating: 'Limited Safety Data (subcutaneous route)',
    known_effects: [
      'Facial flushing, changes in heart rate, and blood pressure reduction reported with VIP infusion in clinical studies (IV route)',
      'Diarrhea reported more frequently with Aviptadil than placebo in a COVID-19 trial',
      'Injection site reactions reported anecdotally with subcutaneous use',
    ],
    unknown_risks: [
      'No human clinical trial safety data exists for the subcutaneous, self-administered route specifically',
      'VIP is a potent vasodilator; blood pressure effects at community-reported doses are not characterized',
      'Long-term effects of repeated subcutaneous dosing are not established in humans',
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
