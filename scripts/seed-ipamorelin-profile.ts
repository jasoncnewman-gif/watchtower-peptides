/**
 * Seeds the full Ipamorelin profile into the peptides table.
 * Updates the existing row (slug: ipamorelin).
 *
 * PMID verification status (as of 2026-06-13):
 *   9849822  — Raun 1998, Eur J Endocrinol — CONFIRMED ✓
 *   9733495  — Ankersen 1998, J Med Chem — CONFIRMED ✓
 *  10496658  — Gobburu 1999, Pharm Res — CONFIRMED ✓ (human PK/PD)
 *  10373343  — Johansen 1999, GH IGF Res — CONFIRMED ✓
 *  11735244  — Andersen 2001, GH IGF Res — CONFIRMED ✓
 *  25331030  — Beck 2014, Int J Colorectal Dis — CONFIRMED ✓ (human trial, failed primary endpoint)
 *
 * Original DB PMIDs dropped (wrong papers):
 *   9703476  — resolved to benzene/leukemia paper (Smith & Zhang, Environ Health Perspect 1998)
 *   9386802  — resolved to HIV-1 virology paper (DiFronzo et al., AIDS 1997)
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-ipamorelin-profile.ts
 */
import { db } from './lib/client'

const profile = {
  slug: 'ipamorelin',
  name: 'Ipamorelin',
  full_name: 'Ipamorelin (NNC 26-0161)',
  aliases: ['NNC 26-0161', 'NNC-26-0161'],
  category: 'performance',
  fda_status: 'research-only',
  research_status: 'Limited',

  tagline: 'A selective GHS-R1a agonist that triggers pulsatile growth hormone release without elevating cortisol or prolactin — the cleanest receptor profile among GH secretagogues.',

  sequence: 'Aib-His-D-2-Nal-D-Phe-Lys-NH₂',
  molecular_weight: '711.85 g/mol',
  half_life: '~2 hours (subcutaneous; confirmed in human PK/PD study, Gobburu et al. 1999)',

  overview: `Ipamorelin is a synthetic pentapeptide developed by Novo Nordisk and characterized in 1998 as the first GH secretagogue to achieve selective GH release without meaningfully elevating cortisol, prolactin, or ACTH. It acts as an agonist at the GHS-R1a (ghrelin receptor) on pituitary somatotrophs, triggering endogenous GH pulses. Human pharmacokinetic data exists — a 1999 dose-escalation study in healthy male volunteers characterized its 2-hour half-life and dose-proportional GH response. The only completed human efficacy trial (Beck et al. 2014) tested ipamorelin for postoperative ileus and failed its primary endpoint. For the applications the community uses it for — body composition, GH axis optimization, recovery — no published human trial evidence exists. Evidence for those endpoints is entirely inferred from the GH response, which is real; translation to clinical outcomes in healthy adults is assumed, not demonstrated.`,

  mechanism: [
    {
      title: 'GHS-R1a Agonism — Primary Mechanism',
      body: 'Ipamorelin binds and activates the growth hormone secretagogue receptor type 1a (GHS-R1a), also known as the ghrelin receptor, on somatotroph cells in the anterior pituitary. Receptor activation triggers GH secretion via a calcium-dependent signaling cascade (IP3/DAG pathway). Ipamorelin has high selectivity for GHS-R1a over corticotropin, dopamine D1/D2, and other receptors that earlier GHRPs (GHRP-2, GHRP-6) activate, explaining its clean cortisol/prolactin profile. Source: Raun K, et al. (1998). PMID: 9849822.'
    },
    {
      title: 'Pulsatile GH Release — Physiological Pattern Preservation',
      body: 'Ipamorelin triggers GH in discrete pulses that mimic the body\'s natural episodic secretion pattern. Unlike exogenous recombinant GH — which creates sustained supraphysiological GH levels — pulsatile secretion reduces the risk of receptor downregulation and insulin resistance associated with continuous GH excess. This pulsatility is confirmed in the Gobburu human PK/PD study: GH peaked at 0.67 hours post-injection and returned to baseline, consistent with a single pulse. Source: Gobburu JV, et al. (1999). PMID: 10496658.'
    },
    {
      title: 'GHRH Receptor Independence — Mechanistic Basis for CJC-1295 Stacking',
      body: 'Ipamorelin works via the ghrelin receptor (GHS-R1a), not the GHRH receptor. CJC-1295 (a GHRH analog) activates the GHRH receptor on the same somatotroph cells. Co-administration triggers two independent GH-release pathways simultaneously, producing a supraadditive GH pulse — this is the mechanistic rationale for the CJC-1295 + Ipamorelin combination. Both pathways converge on adenylate cyclase and intracellular calcium, amplifying the pituitary response. The combination is mechanistically sound; it has not been studied in an RCT.'
    },
    {
      title: 'Downstream IGF-1 Elevation',
      body: 'GH released by ipamorelin stimulates hepatic production of IGF-1, which mediates downstream effects attributed to ipamorelin: lean mass support, fat metabolism, tissue repair, and bone density. The IGF-1 elevation from ipamorelin is secondary and more moderate than from exogenous recombinant GH, because endogenous pituitary GH output capacity is the limiting ceiling. In the Johansen 1999 rat study, ipamorelin increased bone IGF-1 content alongside longitudinal growth — evidence of the GH → IGF-1 → tissue growth axis in vivo. Source: Johansen PB, et al. (1999). PMID: 10373343.'
    }
  ],

  research_applications: [
    {
      area: 'Growth Hormone Axis Stimulation',
      evidence: 'Limited human evidence',
      description: 'The human PK/PD study (Gobburu 1999) confirmed dose-proportional GH release in 40 healthy male volunteers across 5 dose levels. This establishes the pharmacological mechanism in humans. It does not demonstrate any downstream clinical benefit — body composition, recovery, or performance outcomes were not measured.'
    },
    {
      area: 'Postoperative Ileus (GI Motility)',
      evidence: 'Limited human evidence — failed primary endpoint',
      description: 'Beck et al. (2014) conducted a multicenter, double-blind, placebo-controlled Phase 2 trial in bowel resection patients. Ipamorelin did not significantly reduce time to first tolerated meal vs. placebo (25.3h vs 32.6h, p=0.15). Trial failed. Helsinn Therapeutics subsequently discontinued the ipamorelin development program for this indication.'
    },
    {
      area: 'Body Composition (Healthy Adults)',
      evidence: 'Preclinical only',
      description: 'No published RCT or human observational study in healthy adults measuring fat mass, lean mass, or strength endpoints with ipamorelin. Community application is inferred from the GH → IGF-1 axis; the inference may be correct, but it is not confirmed by evidence.'
    },
    {
      area: 'Bone Density',
      evidence: 'Animal',
      description: 'Johansen et al. (1999) demonstrated dose-dependent longitudinal bone growth in adult female rats. Andersen et al. (2001) showed ipamorelin counteracted glucocorticoid-induced decrease in bone formation in rats — a relevant finding for athletes or patients on corticosteroids. No human bone density trial exists.'
    },
    {
      area: 'Recovery / Anti-Aging',
      evidence: 'Preclinical only',
      description: 'Community application without human trial support. GH axis decline with age is real (somatopause); whether periodic GHS-R1a stimulation meaningfully restores it or produces lasting benefit is uncharacterized in published human research.'
    }
  ],

  dosage: {
    disclaimer: 'Human dosing is supported by one PK/PD study (Gobburu 1999) and one failed clinical trial (Beck 2014, IV route, 0.03 mg/kg). The subcutaneous dosing ranges common in the community are extrapolated from these — the Gobburu study used IV infusion, not SC injection. No dose-optimization RCT in healthy adults exists for the community\'s intended endpoints.',
    ranges: [
      {
        route: 'Subcutaneous',
        range: '100–300 mcg',
        frequency: '1–3× daily, fasted or post-exercise',
        notes: 'Most common research protocol. The Gobburu human study used IV infusion (4.21–140.45 nmol/kg); SC doses of 100–300 mcg are community-extrapolated from the confirmed dose-response curve. Fasted or post-exercise timing aligns with periods of low somatostatin tone, potentially amplifying the GH pulse — mechanistically reasonable, not directly validated.'
      },
      {
        route: 'Intravenous',
        range: '0.03 mg/kg',
        frequency: 'Twice daily (clinical trial protocol)',
        notes: 'This is the exact dose and route from the Beck 2014 clinical trial. Not practical for community use; cited for reference only.'
      }
    ]
  },

  safety_profile: {
    rating: 'Known clean acute profile; long-term effects uncharacterized',
    known_effects: [
      'No clinically significant cortisol elevation at ≤300 mcg doses — confirmed in Raun 1998 and Gobburu 1999',
      'No clinically significant prolactin elevation — same sourcing',
      'Transient water retention at higher doses: mediated by GH\'s anti-natriuretic effect',
      'Mild transient hunger at higher doses: GHS-R1a activation stimulates appetite circuits; less prominent than GHRP-6 but present',
      'Injection site reactions: redness, mild swelling — common to all SC peptides',
      'Flushing or head rush immediately post-injection: transient, dose-dependent'
    ],
    unknown_risks: [
      'Long-term GH axis effects: chronic daily secretagogue use over months to years could alter baseline GH pulsatility, pituitary sensitivity, or somatostatin tone. Not studied in any duration relevant to community protocols.',
      'IGF-1 and cancer risk: chronically elevated IGF-1 (even at modest levels) is associated with increased cancer risk in epidemiological literature (colorectal, prostate, premenopausal breast). Whether ipamorelin-driven IGF-1 elevation reaches risk-relevant levels with chronic use is unknown. This risk applies regardless of whether GH comes from injection or pituitary stimulation.',
      'Insulin resistance: GH is counter-regulatory for insulin. High-frequency dosing protocols could push GH/IGF-1 above normal range consistently, contributing to insulin resistance over time.',
      'Pediatric use: contraindicated. Effects on growth plate closure are unstudied.',
      'Pregnancy and lactation: no data. Avoid.',
      'Drug interactions: none formally studied in humans.'
    ]
  },

  studies: [
    {
      pmid: '9849822',
      title: 'Ipamorelin, the first selective growth hormone secretagogue',
      authors: 'Raun K, Hansen BS, Johansen NL, Thøgersen H, Madsen K, Ankersen M, Andersen PH.',
      journal: 'European Journal of Endocrinology',
      year: 1998,
      url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
      summary: 'Landmark characterization paper from the Novo Nordisk group. Demonstrates ipamorelin\'s high selectivity for GHS-R1a, potent GH-releasing activity in rats and pigs comparable to GHRP-6, and critically, no elevation of cortisol, prolactin, or ACTH at doses producing maximal GH response. Establishes the selectivity profile that distinguishes ipamorelin from earlier GH secretagogues and underpins its clinical rationale.'
    },
    {
      pmid: '9733495',
      title: 'A new series of highly potent growth hormone-releasing peptides derived from ipamorelin',
      authors: 'Ankersen M, Johansen NL, Madsen K, Hansen BS, Raun K, Nielsen KK, Thøgersen H, Hansen TK, Peschke B, Lau J, Lundt BF, Andersen PH.',
      journal: 'Journal of Medicinal Chemistry',
      year: 1998,
      url: 'https://pubmed.ncbi.nlm.nih.gov/9733495/',
      summary: 'Structure-activity relationship follow-up from Novo Nordisk. Describes attempts to create orally bioavailable ipamorelin analogs by reducing molecular size. Provides mechanistic context for the GHS-R1a selectivity requirements and demonstrates that small structural changes to the ipamorelin scaffold substantially alter receptor binding — relevant for understanding why ipamorelin\'s specific sequence produces its clean profile.'
    },
    {
      pmid: '10496658',
      title: 'Pharmacokinetic-pharmacodynamic modeling of ipamorelin, a growth hormone releasing peptide, in human volunteers',
      authors: 'Gobburu JV, Agersø H, Jusko WJ, Ynddal L.',
      journal: 'Pharmaceutical Research',
      year: 1999,
      url: 'https://pubmed.ncbi.nlm.nih.gov/10496658/',
      summary: 'The primary human pharmacology paper for ipamorelin. Dose-escalation study in 40 healthy male volunteers (5 dose levels: 4.21 to 140.45 nmol/kg IV over 15 minutes, 8 subjects per dose). Key findings: terminal half-life ~2 hours, dose-proportional kinetics, GH peak at 0.67 hours post-injection with return to baseline — consistent with a single pulsatile release. Provides the PK/PD data that informs all dosing extrapolations. Note: IV route, not SC.'
    },
    {
      pmid: '10373343',
      title: 'Ipamorelin, a new growth-hormone-releasing peptide, induces longitudinal bone growth in rats',
      authors: 'Johansen PB, Nowak J, Skjaerbaek C, Flyvbjerg A, Andreassen TT, Wilken M, Orskov H.',
      journal: 'Growth Hormone & IGF Research',
      year: 1999,
      url: 'https://pubmed.ncbi.nlm.nih.gov/10373343/',
      summary: 'Demonstrates dose-dependent increases in longitudinal growth rate in adult female rats (44–52 µm/day vs 42 µm/day in controls, p<0.0001). Bone IGF-1 content increased in parallel, confirming the GH → hepatic IGF-1 → bone axis. Provides mechanistic basis for bone density applications. Animal study — no human bone endpoint data exists for ipamorelin.'
    },
    {
      pmid: '11735244',
      title: 'The growth hormone secretagogue ipamorelin counteracts glucocorticoid-induced decrease in bone formation of adult rats',
      authors: 'Andersen NB, Malmlöf K, Johansen PB, Andreassen TT, Ørtoft G, Oxlund H.',
      journal: 'Growth Hormone & IGF Research',
      year: 2001,
      url: 'https://pubmed.ncbi.nlm.nih.gov/11735244/',
      summary: '3-month study in adult female rats. Glucocorticoid (methylprednisolone 9 mg/kg/day) suppressed periosteal bone formation; co-administration of ipamorelin (100 µg/kg 3×/day SC) increased periosteal bone formation rate 4-fold vs glucocorticoid alone. Maximum tetanic tension also improved. Relevant context: athletes or post-surgical patients on corticosteroids may experience ipamorelin as a partial catabolic offset. Animal study only.'
    },
    {
      pmid: '25331030',
      title: 'Prospective, randomized, controlled, proof-of-concept study of the Ghrelin mimetic ipamorelin for the management of postoperative ileus in bowel resection patients',
      authors: 'Beck DE, Sweeney WB, McCarter MD; Ipamorelin 201 Study Group.',
      journal: 'International Journal of Colorectal Disease',
      year: 2014,
      url: 'https://pubmed.ncbi.nlm.nih.gov/25331030/',
      summary: 'The only completed published human efficacy trial of ipamorelin. Multicenter, double-blind, placebo-controlled Phase 2 study in bowel resection patients (IV ipamorelin 0.03 mg/kg twice daily vs placebo, POD 1–7). Primary endpoint: time to first tolerated meal. Result: no significant difference (25.3h ipamorelin vs 32.6h placebo, p=0.15). No significant differences in any secondary efficacy endpoint. Drug was well-tolerated. Helsinn Therapeutics subsequently discontinued development. Critical note: the failed endpoint was postoperative GI motility in a specific surgical population — this result does not directly address the body composition or GH optimization applications the community uses ipamorelin for.'
    }
  ],

  plain_english: `A synthetic peptide that tells the pituitary gland to release a pulse of growth hormone — without affecting cortisol or other stress hormones, which is what makes it unusual compared to older GH-releasing compounds. The GH it releases is your own pituitary's GH, not injected from outside. That GH triggers IGF-1 production, which is where most of the downstream effects (tissue repair, body composition changes) would come from, if they occur. The key word is "if": the only human clinical trial ever run with ipamorelin was for a gut motility problem after surgery, and it didn't work. No human trial has ever directly tested what the community uses it for — muscle, fat loss, recovery. That mechanism may still work; it just hasn't been tested the way you'd need to be confident about it.`
}

async function main() {
  const { error } = await db
    .from('peptides')
    .update(profile)
    .eq('slug', 'ipamorelin')

  if (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }

  console.log('✓ Ipamorelin profile updated successfully')
  console.log('  research_status: Limited (corrected from Strong)')
  console.log('  studies: 6 items — all PMIDs verified')
  console.log('  mechanism: 4 items')
  console.log('  safety_profile: long-term unknowns + IGF-1/cancer risk added')
  console.log('')
  console.log('PMID corrections applied:')
  console.log('  9703476 (benzene/leukemia paper) → 9733495 (Ankersen J Med Chem 1998)')
  console.log('  9386802 (HIV virology paper)     → 10496658 (Gobburu Pharm Res 1999, human)')
  console.log('New studies added:')
  console.log('  10373343 — Johansen 1999, bone growth in rats')
  console.log('  11735244 — Andersen 2001, glucocorticoid/bone in rats')
  console.log('  25331030 — Beck 2014, postoperative ileus Phase 2, failed primary endpoint')
}

main()
