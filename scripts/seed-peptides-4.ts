/**
 * scripts/seed-peptides-4.ts
 * New brain-longevity and immune peptides:
 * SS-31, Dihexa, Pinealon, DSIP, Thymulin
 *
 * Run: npm run seed:peptides4
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-peptides-4";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const PEPTIDES = [

  // ── Brain & Longevity ────────────────────────────────────────────────────

  {
    name: "SS-31",
    full_name: "SS-31 (Elamipretide / Bendavia)",
    slug: "ss-31",
    tagline: "A mitochondria-targeted tetrapeptide that concentrates in the inner mitochondrial membrane, reducing oxidative stress and restoring ATP production — researched for heart failure, ALS, and aging.",
    aliases: ["Elamipretide", "Bendavia", "MTP-131", "Szeto-Schiller 31"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~1–2 hours",
    molecular_weight: "638.8 g/mol",
    sequence: "D-Arg-Dmt-Lys-Phe-NH2",
    category: "brain-longevity",
    overview: "SS-31 (elamipretide) is a synthetic mitochondria-targeting tetrapeptide developed by Hazel Szeto and Peter Schiller. It carries a net positive charge that concentrates it selectively in the inner mitochondrial membrane (IMM), where it binds to cardiolipin — a phospholipid critical for the electron transport chain. By stabilizing cardiolipin and reducing electron leak, SS-31 decreases mitochondrial reactive oxygen species (ROS) production, preserves cristae structure, and restores ATP synthesis in stressed or aging mitochondria. Phase II clinical trials have investigated it for heart failure with preserved ejection fraction (HFpEF), mitochondrial myopathy, and Barth syndrome. It represents one of the most mechanistically credible longevity compounds currently in active clinical development.",
    description: "Mitochondria-targeted tetrapeptide that binds cardiolipin in the inner mitochondrial membrane, reduces ROS, and restores ATP production. Phase II data in heart failure.",
    typical_dosage: "0.05–0.25 mg/kg subcutaneous injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Store at -20°C. Sensitive to oxidation — use promptly after reconstitution.",
    mechanism: [
      { title: "Cardiolipin Binding and IMM Stabilization", body: "SS-31 selectively partitions into the inner mitochondrial membrane and binds cardiolipin with high affinity. Cardiolipin is essential for organizing the electron transport chain (ETC) complexes into supercomplexes. By preventing cardiolipin peroxidation under oxidative stress, SS-31 preserves ETC supercomplex structure and efficiency." },
      { title: "Reduction of Mitochondrial ROS", body: "Damaged mitochondria leak electrons from the ETC, generating superoxide. SS-31 reduces this leak by scavenging electrons and protecting ETC complex function, substantially reducing mitochondrial ROS without inhibiting normal respiration." },
      { title: "ATP Synthesis Restoration", body: "In aging and disease states where cardiolipin is peroxidized and ATP synthase becomes decoupled, SS-31 restores the proton gradient across the IMM, recovering ATP synthesis efficiency — addressing a core mechanism of mitochondrial aging." },
    ],
    research_applications: [
      { area: "Heart Failure (HFpEF)", evidence: "Moderate", description: "Phase II BESSST trial showed improvements in 6-minute walk test and peak VO2 in patients with heart failure with preserved ejection fraction. The mitochondrial dysfunction hypothesis for HFpEF makes SS-31 mechanistically compelling." },
      { area: "Mitochondrial Myopathy", evidence: "Moderate", description: "Clinical trial evidence in Barth syndrome and primary mitochondrial myopathy. Improvements in exercise tolerance and fatigue in early phase trials." },
      { area: "Aging and Longevity", evidence: "Early", description: "Preclinical evidence in aged mice shows improvements in muscle strength, endurance, and mitochondrial function. Rationale for anti-aging use is strong; human data is limited." },
      { area: "Ischemia-Reperfusion Injury", evidence: "Moderate", description: "Robust preclinical data showing protection against cardiac and renal ischemia-reperfusion injury. Multiple positive animal studies; human trials pending." },
    ],
    dosage: {
      disclaimer: "SS-31 is a research compound. Phase II trials used IV and SQ routes; research protocols use SQ injection. Not FDA approved outside clinical trials. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "0.05–0.25 mg/kg", frequency: "Daily", notes: "Research dosing range. Clinical trials used IV; SQ is preferred for research use. Lower end of range for general longevity protocols." },
      ],
    },
    safety_profile: {
      rating: "Good — Well Tolerated in Clinical Trials",
      known_effects: ["Injection site reactions", "Mild transient nausea", "Headache (rare)"],
      unknown_risks: ["Long-term effects in non-disease populations not characterized", "Interaction with mitochondria-active supplements (CoQ10, NAD+ precursors) unknown"],
    },
    studies: [
      { title: "Elamipretide improves mitochondrial function in the failing human heart", authors: "Chatfield KC, et al.", year: 2019, journal: "JACC: Basic to Translational Science", pmid: "31312766", url: "https://pubmed.ncbi.nlm.nih.gov/31312766/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/31312766/"],
  },

  {
    name: "Dihexa",
    full_name: "Dihexa (N-hexanoic-Tyr-Ile-(6) aminohexanoic amide)",
    slug: "dihexa",
    tagline: "A potent angiotensin IV analog that enhances hippocampal synaptogenesis — preclinical data suggests cognitive enhancement several orders of magnitude more potent than BDNF.",
    aliases: ["PNB-0408"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "~2–3 hours (estimated)",
    molecular_weight: "726.9 g/mol",
    sequence: "N-hexanoic-Tyr-Ile-(6)aminohexanoic amide",
    category: "brain-longevity",
    overview: "Dihexa is a small peptidomimetic compound derived from angiotensin IV (Ang IV), developed by researchers at Washington State University. It acts as an agonist at the hepatocyte growth factor (HGF)/c-Met signaling axis by potentiating HGF activity. In preclinical models, Dihexa enhanced the formation of new synaptic connections (synaptogenesis) in the hippocampus and prefrontal cortex, reversing cognitive deficits in rodent models of Alzheimer's disease. Researchers reported in vitro potency approximately 10 million times greater than BDNF for promoting synaptogenesis — a finding that generated significant interest in the nootropic and longevity research community. Human clinical data does not exist; all evidence is preclinical. The mechanism (HGF/c-Met potentiation driving synaptogenesis) is distinct from other cognitive peptides like Semax or Selank.",
    description: "Angiotensin IV analog that potentiates HGF/c-Met signaling to drive hippocampal synaptogenesis. Preclinical potency claims are striking; no human trial data exists.",
    typical_dosage: "10–30 mg transdermally or orally; 1–2 mg intranasal (estimated)",
    reconstitution_instructions: "Often used as a transdermal preparation due to poor aqueous solubility. Can be dissolved in DMSO for research use. Oral bioavailability data is limited.",
    mechanism: [
      { title: "HGF/c-Met Potentiation", body: "Dihexa binds to and potentiates hepatocyte growth factor (HGF) at its receptor c-Met. HGF/c-Met signaling drives dendritic spine formation, synaptogenesis, and neuronal survival. Dihexa amplifies HGF's pro-synaptogenic effects at sub-nanomolar concentrations." },
      { title: "Hippocampal Synaptogenesis", body: "In aged and cognitively impaired rodents, Dihexa restored dendritic spine density in the hippocampus and prefrontal cortex to near-youthful levels. This structural remodeling correlated with improvements in spatial learning and memory." },
    ],
    research_applications: [
      { area: "Cognitive Enhancement and Nootropic Use", evidence: "Early", description: "Preclinical data in rodent models of cognitive aging and Alzheimer's is compelling. Used by biohackers and researchers for nootropic purposes. No human clinical data." },
      { area: "Alzheimer's Disease / Neurodegeneration", evidence: "Early", description: "Original research context. Rodent models showed reversal of scopolamine-induced and age-related cognitive deficits. Mechanism via synaptogenesis is theoretically disease-modifying, not just symptomatic." },
    ],
    dosage: {
      disclaimer: "Dihexa has no human clinical trial data. Dosing protocols in use are extrapolated from preclinical work and anecdotal reports. The HGF/c-Met pathway has oncogenic potential — this compound should be used with extreme caution, if at all, in anyone with cancer history or elevated cancer risk. Research use only. Not medical advice.",
      ranges: [
        { route: "Transdermal (research)", range: "10–30 mg", frequency: "1–2x weekly", notes: "Most commonly used route due to solubility issues. DMSO carrier typically used. Start at the low end; effects are reported to be long-lasting." },
        { route: "Intranasal", range: "1–2 mg", frequency: "As needed", notes: "Some researchers use intranasal for more direct CNS delivery. Very limited data on optimal dosing by this route." },
      ],
    },
    safety_profile: {
      rating: "Unknown — No Human Safety Data",
      known_effects: ["No characterized adverse effects in human use (no trials)"],
      unknown_risks: ["HGF/c-Met is a proto-oncogene pathway — theoretical cancer risk with chronic potentiation requires serious consideration", "Long-term neuroplasticity effects unknown", "Drug interactions uncharacterized"],
    },
    studies: [
      { title: "Dihexa is a potent blood-brain barrier-permeable cognitive enhancer", authors: "McCoy AT, et al.", year: 2013, journal: "Journal of Pharmacology and Experimental Therapeutics", pmid: "23640048", url: "https://pubmed.ncbi.nlm.nih.gov/23640048/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/23640048/"],
  },

  {
    name: "Pinealon",
    full_name: "Pinealon (Glu-Asp-Arg)",
    slug: "pinealon",
    tagline: "A pineal gland-derived tripeptide bioregulator from the Khavinson group, researched for neuroprotection, circadian rhythm support, and cognitive aging.",
    aliases: ["EDR peptide", "Glu-Asp-Arg"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "Not well characterized",
    molecular_weight: "417.4 g/mol",
    sequence: "Glu-Asp-Arg",
    category: "brain-longevity",
    overview: "Pinealon is a synthetic tripeptide (Glu-Asp-Arg) developed by Vladimir Khavinson's group at the St. Petersburg Institute of Bioregulation and Gerontology — the same group behind Epithalon and Cartalax. While Epithalon was derived from the pineal peptide fraction Epiphamine, Pinealon was developed specifically as a neuroprotective peptide bioregulator. Preclinical research suggests it may penetrate the blood-brain barrier and exert neuroprotective effects in oxidative stress and hypoxia models. Studies from the Khavinson group report benefits in cognitive aging, hypoxic brain injury models, and circadian rhythm-related decline. Like other Khavinson bioregulators, the evidence base is almost entirely from the originating research group and has not been independently replicated.",
    description: "Khavinson-group tripeptide from pineal tissue research, studied for neuroprotection and cognitive aging. Evidence is preclinical and primarily from the originating lab.",
    typical_dosage: "5–10 mg subcutaneous injection or intranasal",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Store refrigerated. Use within 30 days.",
    mechanism: [
      { title: "Neuroprotective Gene Modulation", body: "As a Khavinson bioregulator, Pinealon is hypothesized to interact with promoter regions of neuroprotective genes, upregulating antioxidant defenses and anti-apoptotic pathways in neurons. The tripeptide sequence Glu-Asp-Arg may act as an epigenetic modulator in brain tissue." },
      { title: "BBB Penetration and CNS Activity", body: "Preclinical studies suggest Pinealon is capable of crossing the blood-brain barrier, allowing direct CNS activity. This is consistent with its small tripeptide structure, though independent verification is limited." },
    ],
    research_applications: [
      { area: "Cognitive Aging and Neuroprotection", evidence: "Early", description: "Primary indication from Khavinson group research. Preclinical models suggest protection against age-related cognitive decline and oxidative neuronal injury." },
      { area: "Hypoxia and Ischemic Brain Injury", evidence: "Early", description: "Animal models of hypoxia showed reduced neuronal loss with Pinealon pretreatment. Potential relevance to stroke neuroprotection." },
    ],
    dosage: {
      disclaimer: "Pinealon has very limited independent data. Evidence is almost entirely from a single research group. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "5–10 mg", frequency: "Daily for 10 days, then as needed", notes: "Typical protocol follows the Khavinson bioregulator pattern of short courses." },
      ],
    },
    safety_profile: {
      rating: "Unknown — Limited Independent Data",
      known_effects: ["Injection site reactions", "No systemic adverse effects reported in available literature"],
      unknown_risks: ["Long-term safety uncharacterized", "Independent replication of all claimed effects is lacking"],
    },
    studies: [
      { title: "Neuroprotective effects of short peptides — derivatives of the pineal hormone melatonin", authors: "Khavinson VKh, et al.", year: 2012, journal: "Doklady Biochemistry and Biophysics", pmid: "22677898", url: "https://pubmed.ncbi.nlm.nih.gov/22677898/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/22677898/"],
  },

  {
    name: "DSIP",
    full_name: "Delta Sleep-Inducing Peptide (DSIP)",
    slug: "dsip",
    tagline: "A naturally occurring nonapeptide originally isolated from rabbit cerebral venous blood during sleep — researched for sleep regulation, stress adaptation, and anti-aging properties.",
    aliases: ["Delta sleep peptide", "DSIP neuropeptide"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "~20–30 minutes",
    molecular_weight: "848.9 g/mol",
    sequence: "Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu",
    category: "brain-longevity",
    overview: "Delta Sleep-Inducing Peptide (DSIP) is a naturally occurring nonapeptide first isolated in 1977 by Schoenenberger and Monnier from the cerebral venous blood of rabbits in slow-wave sleep. It is found endogenously in the hypothalamus, pituitary, and peripheral tissues. DSIP has been studied for its effects on sleep architecture, GH release, cortisol regulation, and stress adaptation. Despite its name, DSIP does not consistently induce sleep in all experimental conditions — its effects on sleep appear to be modulatory rather than sedative. Russian research (Khavinson group) has investigated DSIP as an anti-aging bioregulator. Clinical data is limited; most evidence is from small trials or preclinical work. It remains of interest in longevity research for its endocrine-modulating and stress-buffering properties.",
    description: "Endogenous nonapeptide studied for sleep architecture modulation, GH/cortisol regulation, and stress adaptation. Interest in longevity contexts; evidence base is limited.",
    typical_dosage: "100–300 mcg subcutaneous injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water at 0.5–1 mg/mL. Store refrigerated. Use within 30 days.",
    mechanism: [
      { title: "Sleep Architecture Modulation", body: "DSIP is associated with increases in slow-wave (delta) sleep in some experimental models. The mechanism is not fully characterized — it may act via modulation of adenosine signaling, GABAergic pathways, or direct effects on sleep-regulatory nuclei in the hypothalamus." },
      { title: "GH and Cortisol Regulation", body: "DSIP appears to modulate the hypothalamic-pituitary axis. Some studies report GH pulse enhancement and cortisol normalization, particularly in stress states. These effects may underlie its proposed adaptogenic properties." },
      { title: "Antioxidant and Neuroprotective Effects", body: "In vitro and animal data suggest DSIP has antioxidant properties and may protect neurons from oxidative damage. The Khavinson group has studied it as a longevity peptide, reporting life-extension effects in aged animal cohorts." },
    ],
    research_applications: [
      { area: "Sleep Improvement", evidence: "Early", description: "Original indication. Some human studies report improved sleep quality in insomnia. Effects are inconsistent across trials, suggesting context-dependent activity rather than direct sedation." },
      { area: "Stress and HPA Axis Regulation", evidence: "Early", description: "May normalize elevated cortisol and reduce stress reactivity. Adaptogenic properties studied in both animal and limited human models." },
      { area: "Longevity and Anti-Aging", evidence: "Early", description: "Russian longevity research reports life-extension and improved health-span in aged rodent cohorts. Consistent with the Khavinson bioregulator hypothesis but not independently replicated." },
    ],
    dosage: {
      disclaimer: "DSIP has limited clinical data. Effects are variable across individuals. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "100–300 mcg", frequency: "Daily or as needed (30-day cycles typical)", notes: "Evening administration consistent with sleep-related indications. Start at 100 mcg to assess individual response." },
      ],
    },
    safety_profile: {
      rating: "Limited Data — Generally Well Tolerated in Available Studies",
      known_effects: ["Injection site reactions", "Possible sedation (variable)", "Mild hypotension reported in some studies"],
      unknown_risks: ["Long-term safety not characterized", "HPA axis effects with chronic use need monitoring"],
    },
    studies: [
      { title: "Delta sleep-inducing peptide — functional aspects", authors: "Graf MV, Kastin AJ.", year: 1986, journal: "Peptides", pmid: "3528175", url: "https://pubmed.ncbi.nlm.nih.gov/3528175/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/3528175/"],
  },

  // ── Immune & Protective ──────────────────────────────────────────────────

  {
    name: "Thymulin",
    full_name: "Thymulin (Facteur Thymique Sérique / FTS)",
    slug: "thymulin",
    tagline: "A thymic nonapeptide that requires zinc for activity — promotes T-cell differentiation and maturation, with documented decline with aging driving interest as an immune-longevity compound.",
    aliases: ["FTS", "Facteur Thymique Sérique", "Thymic Factor"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "~30 minutes",
    molecular_weight: "857.9 g/mol",
    sequence: "Pyr-Ala-Lys-Ser-Gln-Gly-Gly-Ser-Asn",
    category: "immune",
    overview: "Thymulin (formerly Facteur Thymique Sérique, FTS) is a naturally occurring thymic nonapeptide first characterized by Bach and Dardenne in 1977. Unlike most peptides, Thymulin is biologically active only when complexed with zinc — the zinc-bound form (Thymulin-Zn) binds to T-cell receptors and promotes T-cell differentiation, maturation, and cytokine production. Thymulin is produced by thymic epithelial cells and circulates in the blood bound to a carrier protein. Its serum concentration declines sharply with age in parallel with thymic involution — from peak levels in childhood to near-undetectable levels in elderly adults. This age-related decline has made Thymulin a focus of immune-aging research, with the hypothesis that restoring Thymulin levels could partially reverse age-related immune decline. Studies have also investigated Thymulin for anti-inflammatory effects, neuroprotection, and modulation of neuroimmune interactions.",
    description: "Zinc-dependent thymic nonapeptide that promotes T-cell maturation. Serum levels decline with age, making it a target for immune longevity research.",
    typical_dosage: "10–50 mcg subcutaneous injection",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Store refrigerated. Activity requires zinc — supplement with zinc-containing solutions or ensure adequate zinc status.",
    mechanism: [
      { title: "T-Cell Maturation via Zinc-Dependent Receptor Binding", body: "The zinc-Thymulin complex binds to specific receptors on immature T-cells (thymocytes), promoting differentiation into functional CD4+ and CD8+ T-cells. This is the primary immune mechanism. Without zinc chelation, Thymulin is biologically inert." },
      { title: "Anti-Inflammatory Neuroimmune Effects", body: "Beyond T-cell biology, Thymulin modulates cytokine production and has been studied for anti-inflammatory effects in the CNS. Animal models suggest neuroprotective effects via suppression of neuroinflammatory signaling." },
    ],
    research_applications: [
      { area: "Immune Aging and Thymic Restoration", evidence: "Early", description: "Primary longevity interest. Age-related thymulin decline parallels immune dysfunction. Preclinical studies show restored T-cell function with exogenous thymulin supplementation in aged animals." },
      { area: "Autoimmune and Inflammatory Conditions", evidence: "Early", description: "Animal models suggest Thymulin may modulate aberrant immune responses. Limited human data." },
    ],
    dosage: {
      disclaimer: "Thymulin has very limited human clinical data. Ensure adequate zinc status before use. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "10–50 mcg", frequency: "Daily for 10–30 day cycles", notes: "Low effective doses. Zinc co-administration (or adequate dietary zinc) is theoretically important for bioactivity." },
      ],
    },
    safety_profile: {
      rating: "Unknown — Very Limited Human Data",
      known_effects: ["Injection site reactions", "No serious adverse effects reported in available literature"],
      unknown_risks: ["Long-term immune modulation effects not characterized", "Potential for immune dysregulation with chronic use"],
    },
    studies: [
      { title: "Serum thymic factor (thymulin) in aging", authors: "Mocchegiani E, et al.", year: 1994, journal: "International Journal of Immunopharmacology", pmid: "7960084", url: "https://pubmed.ncbi.nlm.nih.gov/7960084/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/7960084/"],
  },

];

async function main() {
  log(`Seeding ${PEPTIDES.length} new peptides…`);

  for (const peptide of PEPTIDES) {
    const { error } = await db.from("peptides").upsert(peptide, { onConflict: "slug" });
    if (error) {
      log(`ERROR seeding ${peptide.name}: ${error.message}`);
    } else {
      log(`✓ ${peptide.name} (${peptide.category})`);
    }
  }

  log("Done.");
}

main();
