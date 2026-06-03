/**
 * scripts/seed-peptides-3.ts
 * Batch 3 — new compounds + alternate-name alias profiles.
 * Safe to re-run — uses upsert on slug.
 *
 * Run: npm run seed:peptides3
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-peptides-3";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const PEPTIDES = [

  // ── New distinct compounds ───────────────────────────────────────────────

  {
    name: "Melanotan I",
    full_name: "Afamelanotide (Melanotan I)",
    slug: "melanotan-1",
    tagline: "FDA-approved synthetic α-MSH analog for erythropoietic protoporphyria — produces skin tanning via selective MC1R agonism without the sexual side effects of Melanotan II.",
    aliases: ["Afamelanotide", "Scenesse", "MT-1", "CUV1647"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~2 hours",
    molecular_weight: "1646.9 g/mol",
    sequence: "Ac-Ser-Tyr-Ser-Nle-Glu-His-D-Phe-Arg-Trp-Gly-Lys-Pro-Val-NH2",
    overview: "Melanotan I (afamelanotide) is a linear synthetic analog of alpha-melanocyte-stimulating hormone (α-MSH) FDA-approved as Scenesse (2019) for the prevention of phototoxicity in adults with erythropoietic protoporphyria (EPP) — a rare disorder causing extreme pain upon light exposure. Unlike Melanotan II (a cyclic analog), Melanotan I is more selective for MC1R over MC3R/MC4R, producing skin tanning without significant sexual arousal effects. It is administered as a subcutaneous implant for the EPP indication. In research contexts, injectable Melanotan I has been studied as a tanning agent and for photoprotection. Its receptor selectivity profile makes it meaningfully safer than Melanotan II for long-term tanning use, though risks around nevi activation remain.",
    description: "FDA-approved α-MSH analog for erythropoietic protoporphyria. More MC1R-selective than MT-2 — tanning without pronounced sexual side effects.",
    typical_dosage: "16 mg implant every 60 days (FDA-approved); injectable research: 0.5–1 mg/day",
    reconstitution_instructions: "FDA-approved Scenesse is a subcutaneous implant. Research injectable: reconstitute with bacteriostatic water.",
    category: "healing",
    mechanism: [
      { title: "Selective MC1R Agonism", body: "Melanotan I preferentially activates MC1R on melanocytes, stimulating eumelanin synthesis and skin darkening. Its reduced affinity for MC3R and MC4R compared to MT-2 means far less sexual arousal and appetite suppression." },
      { title: "Photoprotection via Eumelanin", body: "Eumelanin produced in response to MT-1 acts as a natural photoprotectant by absorbing and dissipating UV radiation. In EPP patients, this prevents the painful phototoxic reactions triggered by light exposure." }
    ],
    research_applications: [
      { area: "Erythropoietic Protoporphyria", evidence: "Strong", description: "FDA-approved (Scenesse). Phase III trials demonstrated significantly increased pain-free light exposure time in EPP patients, with a meaningful improvement in quality of life." },
      { area: "Tanning & Photoprotection", evidence: "Moderate", description: "Clinical trials in healthy volunteers confirm skin darkening over 2–4 weeks. Studied as a preventive agent for sun damage and skin cancer in high-risk populations." }
    ],
    dosage: {
      disclaimer: "FDA-approved Melanotan I (Scenesse) is indicated for EPP only and must be prescribed and implanted by a physician. Injectable research versions are not FDA-approved. Skin monitoring for nevi changes is essential. Not medical advice.",
      ranges: [
        { route: "Subcutaneous implant (FDA-approved)", range: "16 mg", frequency: "Every 60 days", notes: "Approved protocol for EPP. Implant placed above the anterior superior iliac spine." },
        { route: "Subcutaneous injection (research)", range: "0.5–1 mg", frequency: "Daily loading, then as needed", notes: "Research injectable protocols; not FDA-approved. Start low to assess nausea tolerance." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved for EPP)",
      known_effects: ["Nausea (common at initiation)", "Skin hyperpigmentation", "Darkening of existing nevi", "Implant site reactions", "Headache", "Fatigue"],
      unknown_risks: ["Melanoma risk from sustained melanocyte activation — requires ongoing dermatological monitoring", "Long-term effects in non-EPP populations not fully characterized", "Nevi changes require regular skin checks"]
    },
    studies: [
      { title: "Afamelanotide for erythropoietic protoporphyria", authors: "Langendonk JG, et al.", year: 2015, journal: "New England Journal of Medicine", pmid: "26244308", url: "https://pubmed.ncbi.nlm.nih.gov/26244308/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/26244308/"]
  },

  {
    name: "N-Acetyl Semax",
    full_name: "N-Acetyl Semax (Acetylated Semax)",
    slug: "n-acetyl-semax",
    tagline: "An acetylated form of Semax with enhanced stability and potency — the preferred nootropic form for intranasal administration.",
    aliases: ["NA-Semax", "Acetyl Semax"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "Slightly longer than Semax (~10–15 minutes)",
    molecular_weight: "855.98 g/mol",
    sequence: "N-Acetyl-Met-Glu-His-Phe-Pro-Gly-Pro",
    overview: "N-Acetyl Semax is the N-terminally acetylated form of Semax. The acetyl group at the N-terminus confers greater resistance to aminopeptidase degradation, extending the peptide's active half-life and increasing its potency relative to unmodified Semax. It is considered the superior form for intranasal delivery where rapid enzymatic degradation in nasal mucosa can limit standard Semax's effectiveness. Users and researchers generally report N-Acetyl Semax as more potent milligram-for-milligram, with more pronounced nootropic and anxiolytic effects. The underlying pharmacology is identical to Semax — BDNF upregulation, serotonergic/dopaminergic modulation, and neuroprotection.",
    description: "N-terminally acetylated Semax with enhanced enzymatic stability and potency. Preferred form for intranasal nootropic use.",
    typical_dosage: "100–300 mcg intranasally 1–2x daily",
    reconstitution_instructions: "Reconstitute with sterile saline at 0.1% concentration. Slightly lower doses needed vs. standard Semax due to higher potency.",
    category: "healing",
    mechanism: [
      { title: "Enhanced Stability via N-Acetylation", body: "Acetylation of the N-terminus blocks cleavage by leucine aminopeptidase and other N-terminal exopeptidases, significantly extending the peptide's active lifespan at the site of administration." },
      { title: "Same Mechanism as Semax", body: "N-Acetyl Semax shares Semax's core mechanisms: robust BDNF and NGF upregulation in the hippocampus and prefrontal cortex, dopaminergic/serotonergic modulation, and neuroprotective anti-apoptotic activity." }
    ],
    research_applications: [
      { area: "Cognitive Enhancement", evidence: "Moderate", description: "Considered more potent than standard Semax for nootropic applications at equivalent doses. Human research is primarily from Russian clinical literature." },
      { area: "Neuroprotection", evidence: "Moderate", description: "Expected to share Semax's neuroprotective benefits in stroke and TBI models, with potentially greater efficacy due to improved stability." }
    ],
    dosage: {
      disclaimer: "N-Acetyl Semax is a research compound not approved in the US. More potent than standard Semax — start at lower doses. Not medical advice.",
      ranges: [
        { route: "Intranasal", range: "100–300 mcg", frequency: "1–2x daily", notes: "Start at 100 mcg to assess tolerance. Roughly 2–3x more potent than standard Semax by some accounts — adjust dose accordingly. Cycle 2–4 weeks on, 2 weeks off." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Nasal irritation", "Mild stimulatory effects", "Headache at higher doses", "Anxiety in sensitive individuals"],
      unknown_risks: ["Same unknown risks as standard Semax", "Limited independent safety data", "Long-term neurological effects not characterized"]
    },
    studies: [
      { title: "Neuroprotective effects of Semax in patients with ischemic stroke", authors: "Gusev EI, Skvortsova VI, et al.", year: 1997, journal: "Zhurnal Nevrologii i Psikhiatrii", pmid: "9181625", url: "https://pubmed.ncbi.nlm.nih.gov/9181625/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/9181625/"]
  },

  {
    name: "N-Acetyl Selank",
    full_name: "N-Acetyl Selank (Acetylated Selank)",
    slug: "n-acetyl-selank",
    tagline: "An acetylated form of Selank with greater enzymatic stability — used for the same anxiolytic and nootropic applications with potentially enhanced potency.",
    aliases: ["NA-Selank", "Acetyl Selank"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "Slightly longer than Selank",
    molecular_weight: "793.91 g/mol",
    sequence: "N-Acetyl-Thr-Lys-Pro-Arg-Pro-Gly-Pro",
    overview: "N-Acetyl Selank is the N-terminally acetylated analog of Selank. Like N-Acetyl Semax vs. Semax, the acetylation improves resistance to N-terminal proteolytic degradation, enhancing bioavailability and potency when administered intranasally. N-Acetyl Selank is reported by users to produce more pronounced anxiolytic effects at lower doses than standard Selank. The pharmacological profile is otherwise the same: GABAergic modulation without benzodiazepine receptor binding, BDNF upregulation, and immunomodulatory effects derived from the Tuftsin parent peptide.",
    description: "Acetylated Selank with enhanced nasal bioavailability. Same anxiolytic and immunomodulatory profile as Selank with greater stability.",
    typical_dosage: "250–500 mcg intranasally 1–2x daily",
    reconstitution_instructions: "Reconstitute with sterile saline. Start at low concentrations due to enhanced potency.",
    category: "healing",
    mechanism: [
      { title: "N-Terminal Acetylation for Stability", body: "Acetylation protects against N-terminal exopeptidase cleavage, extending duration of activity at the intranasal mucosa and in the CNS." },
      { title: "Same Mechanism as Selank", body: "Indirect GABAergic enhancement without benzodiazepine receptor binding, enkephalinase inhibition, BDNF upregulation, and Tuftsin-derived immunomodulation." }
    ],
    research_applications: [
      { area: "Anxiety Reduction", evidence: "Moderate", description: "Considered more potent than standard Selank. Anecdotal reports and limited research suggest enhanced anxiolytic response at lower doses." },
      { area: "Cognitive Enhancement", evidence: "Moderate", description: "Same nootropic profile as Selank — improved memory, attention, and stress resilience — with potentially superior intranasal bioavailability." }
    ],
    dosage: {
      disclaimer: "N-Acetyl Selank is a research compound. More potent than standard Selank — start at lower doses. Not medical advice.",
      ranges: [
        { route: "Intranasal", range: "250–500 mcg", frequency: "1–2x daily", notes: "May be more potent than standard Selank; start at 250 mcg. Effects onset within 10–15 minutes. Cycle to avoid potential receptor adaptation." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Nasal irritation", "Mild sedation at higher doses", "Transient lightheadedness"],
      unknown_risks: ["Same unknown risks as standard Selank", "Limited independent safety data", "Long-term neurological effects not characterized"]
    },
    studies: [
      { title: "Selank and Semax: comparative study of anxiolytic activity", authors: "Semenova TP, et al.", year: 2010, journal: "Zhurnal Vysshei Nervnoi Deyatelnosti", pmid: "20886792", url: "https://pubmed.ncbi.nlm.nih.gov/20886792/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/20886792/"]
  },

  {
    name: "Humanin",
    full_name: "Humanin (HN)",
    slug: "humanin",
    tagline: "A mitochondrial-derived peptide with neuroprotective, cardioprotective, and anti-aging properties — encoded in the 16S rRNA region of mitochondrial DNA.",
    aliases: ["HN", "Humanin-G (HNG)", "S14G-Humanin"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "Not well established",
    molecular_weight: "2887.4 g/mol",
    sequence: "Met-Ala-Pro-Arg-Gly-Phe-Ser-Cys-Leu-Leu-Leu-Thr-Ser-Glu-Ile-Asp-Leu-Pro-Val-Lys-Arg-Arg-Ala",
    overview: "Humanin is a 21-amino-acid peptide encoded in the 16S ribosomal RNA region of the mitochondrial genome, discovered in 2001 in a screen for factors that protect neurons against Alzheimer's disease-associated toxicity. Like MOTS-c, it represents the class of mitochondrial-derived peptides (MDPs) — retrograde signals from mitochondria that regulate systemic physiology. Circulating humanin levels decline with age and in multiple disease states. It protects neurons and cardiomyocytes against apoptosis, reduces insulin resistance, and has anti-inflammatory properties. HNG (S14G-Humanin), in which serine at position 14 is substituted with glycine, is approximately 1000x more potent than native humanin and is the form typically used in research.",
    description: "Mitochondrial-derived neuroprotective peptide with anti-Alzheimer, cardioprotective, and anti-aging properties. Levels decline with age.",
    typical_dosage: "2–4 mg subcutaneously (HNG form); dosing protocols not established",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. HNG (S14G-Humanin) is used at much lower doses than native humanin.",
    category: "healing",
    mechanism: [
      { title: "FPRL1/CXCR4 Receptor Signaling", body: "Humanin binds formyl peptide receptor-like 1 (FPRL1) and CXCR4 receptors, activating JAK2/STAT3 and PI3K/Akt survival pathways that protect neurons and cardiomyocytes against apoptotic stimuli." },
      { title: "Alzheimer Pathology Antagonism", body: "Humanin directly neutralizes the cytotoxic effects of amyloid-beta (Aβ) and mutant APP/PS1 proteins that drive Alzheimer's neurodegeneration, suggesting it may be an endogenous protective response to Alzheimer pathology." },
      { title: "Insulin Sensitization", body: "Humanin activates STAT3 in insulin-sensitive tissues, improving glucose uptake and insulin signaling — a mechanism independent of its neuroprotective activity." }
    ],
    research_applications: [
      { area: "Alzheimer's Disease", evidence: "Animal", description: "Multiple rodent models show humanin and HNG reduce amyloid-beta toxicity, cognitive decline, and neuronal apoptosis. Human clinical evidence is absent." },
      { area: "Cardiac Protection", evidence: "Animal", description: "Humanin reduces cardiomyocyte apoptosis after ischemia-reperfusion in rodent models, with potential for cardiac preservation." },
      { area: "Anti-Aging / Longevity", evidence: "Early", description: "Circulating humanin correlates with healthspan in human population studies. Centenarians have higher humanin levels. Supplementation extends lifespan in C. elegans and improves metabolic function in aged mice." }
    ],
    dosage: {
      disclaimer: "Humanin is a research compound with no human clinical trials for therapeutic use. Dosing is highly experimental. Not medical advice.",
      ranges: [
        { route: "Subcutaneous (HNG form)", range: "2–4 mg", frequency: "Daily to 3x weekly", notes: "Most research uses the HNG (S14G) analog which is ~1000x more potent than native humanin. Dosing is not well established in humans." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data",
      known_effects: ["Injection site reactions", "Limited human exposure data available"],
      unknown_risks: ["No human clinical safety trials conducted", "Long-term effects on mitochondrial signaling", "Interaction with cancer biology (STAT3 pathway) requires investigation", "Effects on cardiovascular system with sustained use"]
    },
    studies: [
      { title: "Humanin: a newly identified neuroprotective factor", authors: "Hashimoto Y, et al.", year: 2001, journal: "Annals of the New York Academy of Sciences", pmid: "11800213", url: "https://pubmed.ncbi.nlm.nih.gov/11800213/" },
      { title: "The mitochondrial-derived peptide humanin is a regulator of lifespan and healthspan", authors: "Lee C, et al.", year: 2013, journal: "Science Signaling", pmid: "24085993", url: "https://pubmed.ncbi.nlm.nih.gov/24085993/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/11800213/"]
  },

  // ── Alternate-name aliases ────────────────────────────────────────────────
  // These are the same compounds as existing profiles, profiled again under
  // the vendor naming convention so the Vendors tab matches correctly.

  {
    name: "Melanotan II",
    full_name: "Melanotan II (MT-2)",
    slug: "melanotan-2",
    tagline: "A cyclic analog of alpha-MSH studied for skin tanning, erectile function, and appetite suppression — not FDA-approved and associated with significant risks.",
    aliases: ["MT-2", "MT2", "Melanotan 2", "Melanotan II"],
    fda_status: "not-approved",
    research_status: "Moderate",
    half_life: "~1 hour",
    molecular_weight: "1024.2 g/mol",
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
    overview: "Melanotan II (MT-2) is a cyclic analog of alpha-MSH producing skin tanning, sexual arousal, and appetite suppression via broad melanocortin receptor agonism (MC1R, MC3R, MC4R). Not FDA-approved. Significant safety concerns exist around uncontrolled melanocyte activation and nevi changes. See full profile under Melanotan II for complete details.",
    description: "Cyclic α-MSH analog with tanning, sexual arousal, and appetite effects. Same compound as Melanotan II — alternate vendor naming.",
    typical_dosage: "0.5–1 mg subcutaneously as needed",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Very potent — handle carefully.",
    category: "sexual-health",
    mechanism: [
      { title: "Broad Melanocortin Receptor Agonism", body: "Activates MC1R (tanning), MC3R and MC4R (sexual arousal and appetite suppression). Non-selective profile distinguishes MT-2 from the more selective PT-141." }
    ],
    research_applications: [
      { area: "Tanning / Photoprotection", evidence: "Human", description: "Phase I trials confirmed skin darkening without UV. Development halted due to nevi safety concerns." },
      { area: "Erectile Dysfunction", evidence: "Human", description: "Effective for erectile dysfunction. PT-141 (bremelanotide) was developed as the safer, more selective alternative." }
    ],
    dosage: {
      disclaimer: "Melanotan II is NOT FDA-approved and carries significant risks including uncontrolled melanocyte activation. We do not endorse its use. This is harm-reduction information only.",
      ranges: [
        { route: "Subcutaneous", range: "0.25–1 mg", frequency: "As needed", notes: "Start at 0.25 mg. Regular dermatological skin checks are essential. Never exceed 1 mg/dose." }
      ]
    },
    safety_profile: {
      rating: "High Caution Required",
      known_effects: ["Nausea (often severe)", "Flushing", "Spontaneous erections", "Darkening of moles"],
      unknown_risks: ["Melanoma risk from uncontrolled melanocyte activation", "Nevi changes require dermatological monitoring", "Cardiovascular blood pressure elevation"]
    },
    studies: [
      { title: "Melanotan II causes spontaneous erections in men", authors: "Dorr RT, et al.", year: 1996, journal: "Journal of Urology", pmid: "8609361", url: "https://pubmed.ncbi.nlm.nih.gov/8609361/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/8609361/"]
  },

  {
    name: "Melanotan I",
    full_name: "Afamelanotide (Melanotan I)",
    slug: "melanotan-i",
    tagline: "FDA-approved synthetic α-MSH analog for erythropoietic protoporphyria — same compound as Melanotan 1, alternate vendor naming.",
    aliases: ["Afamelanotide", "Scenesse", "MT-1", "Melanotan 1"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~2 hours",
    molecular_weight: "1646.9 g/mol",
    sequence: "Ac-Ser-Tyr-Ser-Nle-Glu-His-D-Phe-Arg-Trp-Gly-Lys-Pro-Val-NH2",
    overview: "Same compound as Melanotan 1 (Afamelanotide). Some vendors list this as 'Melanotan I' using roman numeral notation. FDA-approved as Scenesse for erythropoietic protoporphyria. Selective MC1R agonist producing skin tanning without significant sexual side effects. See Melanotan 1 profile for full details.",
    description: "FDA-approved α-MSH analog for EPP. Same compound as Melanotan 1 — roman numeral variant of vendor naming.",
    typical_dosage: "16 mg implant every 60 days (FDA); 0.5–1 mg/day injectable (research)",
    reconstitution_instructions: "Research injectable: reconstitute with bacteriostatic water.",
    category: "healing",
    mechanism: [
      { title: "Selective MC1R Agonism", body: "Preferentially activates MC1R on melanocytes, stimulating eumelanin synthesis and skin darkening with minimal MC3R/MC4R activity." }
    ],
    research_applications: [
      { area: "Erythropoietic Protoporphyria", evidence: "Strong", description: "FDA-approved (Scenesse). Significantly increases pain-free light exposure time in EPP patients." },
      { area: "Photoprotection", evidence: "Moderate", description: "Studied as a preventive tanning agent for sun damage and skin cancer in high-risk populations." }
    ],
    dosage: {
      disclaimer: "FDA-approved form must be prescribed. Injectable research versions are not FDA-approved. Regular skin monitoring required. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection (research)", range: "0.5–1 mg", frequency: "Daily loading", notes: "Start low to assess nausea. Conduct regular dermatological monitoring for nevi changes." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved for EPP)",
      known_effects: ["Nausea", "Skin hyperpigmentation", "Darkening of existing nevi", "Headache"],
      unknown_risks: ["Melanoma risk from melanocyte activation requires monitoring", "Long-term effects in non-EPP populations"]
    },
    studies: [
      { title: "Afamelanotide for erythropoietic protoporphyria", authors: "Langendonk JG, et al.", year: 2015, journal: "New England Journal of Medicine", pmid: "26244308", url: "https://pubmed.ncbi.nlm.nih.gov/26244308/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/26244308/"]
  },

  {
    name: "Kisspeptin",
    full_name: "Kisspeptin-10 (KP-10)",
    slug: "kisspeptin",
    tagline: "The active decapeptide fragment of the KISS1 gene product — master regulator of reproductive hormone pulsatility. Same compound as Kisspeptin-10.",
    aliases: ["KP-10", "Kisspeptin-10", "Metastin 45-54"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~4 minutes",
    molecular_weight: "1302.5 g/mol",
    sequence: "Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2",
    overview: "Kisspeptin (as listed by most vendors) refers to Kisspeptin-10 (KP-10), the biologically active C-terminal decapeptide of the KISS1 gene product. It is the master regulator of GnRH pulsatility and the HPG reproductive axis. Used in clinical research for hypogonadism diagnosis and fertility treatment. See Kisspeptin-10 profile for full details.",
    description: "KISS1R agonist and master regulator of reproductive hormones. Same compound as Kisspeptin-10 — standard vendor naming convention.",
    typical_dosage: "1–10 mcg/kg by injection (clinical research)",
    reconstitution_instructions: "Reconstitute with sterile saline. Very potent — accurate low-dose dilution required.",
    category: "performance",
    mechanism: [
      { title: "KISS1R (GPR54) Agonism", body: "Binds the KISS1R receptor on GnRH neurons, triggering pulsatile GnRH secretion and downstream LH/FSH/testosterone release." }
    ],
    research_applications: [
      { area: "Hypogonadotropic Hypogonadism", evidence: "Human", description: "Restores pulsatile LH secretion and gonadal steroidogenesis in patients with HPG axis dysfunction." },
      { area: "Female Fertility (IVF)", evidence: "Human", description: "Used as an oocyte maturation trigger in IVF with lower OHSS risk than hCG." }
    ],
    dosage: {
      disclaimer: "Kisspeptin directly affects the reproductive hormone axis. Not for use without physician oversight. Not medical advice.",
      ranges: [
        { route: "Subcutaneous or IV", range: "1–10 mcg/kg", frequency: "Pulsatile or single trigger dose", notes: "Clinical research uses pulsatile protocols. Requires precise dosing due to high potency." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["LH/FSH surge", "Hot flashes in women", "Transient nausea at high doses"],
      unknown_risks: ["HPG axis desensitization with continuous administration", "Contraindicated in hormone-sensitive cancers"]
    },
    studies: [
      { title: "Kisspeptin-10 in men with hypogonadotropic hypogonadism", authors: "Dhillo WS, et al.", year: 2005, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "16159940", url: "https://pubmed.ncbi.nlm.nih.gov/16159940/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/16159940/"]
  },

  {
    name: "CJC-1295 (No DAC)",
    full_name: "CJC-1295 Without Drug Affinity Complex (Modified GRF 1-29)",
    slug: "cjc-1295-no-dac",
    tagline: "The pulsatile GHRH analog — same compound as CJC-1295. Vendor naming convention specifying the absence of the albumin-binding DAC modification.",
    aliases: ["Modified GRF 1-29", "Mod GRF 1-29", "CJC-1295", "CJC-1295 without DAC"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~30 minutes",
    molecular_weight: "3367.9 g/mol",
    sequence: "Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg-NH2",
    overview: "CJC-1295 (No DAC) is the same compound as CJC-1295 — a modified GHRH analog also known as Modified GRF 1-29. The '(No DAC)' designation specifies it does NOT contain the Drug Affinity Complex (maleimide-lysine albumin-binding modification) present in CJC-1295 DAC. This results in a ~30-minute half-life vs. 6–8 days for the DAC version. Used in pulsatile GH release protocols when combined with a GHRP. See CJC-1295 profile for full details.",
    description: "Modified GHRH analog for pulsatile GH release. Same as CJC-1295 — vendor naming clarifying absence of DAC modification.",
    typical_dosage: "100 mcg subcutaneously combined with 100–300 mcg Ipamorelin",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "GHRH Receptor Agonism (Pulsatile)", body: "Binds pituitary GHRH receptors, amplifying GH pulses when co-administered with a GHRP. ~30-minute half-life produces physiological GH pulsatility unlike the sustained bleed of CJC-1295 DAC." }
    ],
    research_applications: [
      { area: "GH Pulse Amplification", evidence: "Moderate", description: "Combined with a GHRP (e.g., Ipamorelin) for synergistic GH pulses. Standard anti-aging and body composition research protocol." }
    ],
    dosage: {
      disclaimer: "Research compound. Not medical advice. Always combine with a GHRP for meaningful GH effect.",
      ranges: [
        { route: "Subcutaneous (with GHRP)", range: "100 mcg", frequency: "1–3x daily", notes: "Inject fasted with co-administered GHRP. 100 mcg CJC-1295 + 200 mcg Ipamorelin is the standard stack." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Water retention", "Transient flushing", "Mild fatigue post-injection"],
      unknown_risks: ["Long-term GH axis effects", "IGF-1 elevation cancer risk concerns with chronic use"]
    },
    studies: [
      { title: "CJC-1295 stimulates GH and IGF-1 secretion for extended periods", authors: "Jetté L, et al.", year: 2005, journal: "Journal of Endocrinology", pmid: "15755685", url: "https://pubmed.ncbi.nlm.nih.gov/15755685/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/15755685/"]
  },

  {
    name: "CJC-1295 (With DAC)",
    full_name: "CJC-1295 With Drug Affinity Complex",
    slug: "cjc-1295-with-dac",
    tagline: "Long-acting GHRH analog with albumin-binding DAC modification for weekly dosing. Same compound as CJC-1295 DAC — alternate vendor naming.",
    aliases: ["CJC-1295 DAC", "DAC:GRF", "CJC-1295 with DAC"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~6–8 days",
    molecular_weight: "3647.3 g/mol",
    sequence: "Modified GRF 1-29 with maleimide-lysine DAC albumin-binding modification",
    overview: "CJC-1295 (With DAC) is the same compound as CJC-1295 DAC — the long-acting GHRH analog with a Drug Affinity Complex modification enabling albumin binding and a 6–8 day half-life. The '(With DAC)' notation is an alternate vendor naming convention. Produces sustained GH and IGF-1 elevation with once-weekly dosing. See CJC-1295 DAC profile for full details.",
    description: "Same as CJC-1295 DAC — long-acting albumin-bound GHRH analog with weekly dosing. Alternate vendor naming convention.",
    typical_dosage: "1–2 mg subcutaneously once weekly",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1–2 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "Albumin-Bound Long-Acting GHRH Agonism", body: "DAC modification enables covalent albumin binding, extending half-life to 6–8 days for sustained GH/IGF-1 elevation with weekly dosing." }
    ],
    research_applications: [
      { area: "GH and IGF-1 Elevation", evidence: "Human", description: "Confirmed sustained GH and IGF-1 elevation for up to 14 days post-injection in clinical studies." }
    ],
    dosage: {
      disclaimer: "Produces continuous non-pulsatile GH elevation. Different risk profile than CJC-1295 (no DAC). Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "1–2 mg", frequency: "Once weekly", notes: "No need for GHRP co-administration. Monitor for water retention and insulin resistance." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Water retention", "Insulin resistance from sustained GH", "Carpal tunnel at higher doses", "Numbness/tingling"],
      unknown_risks: ["GHRH receptor desensitization", "Sustained IGF-1 elevation cancer risk", "Cardiovascular effects of chronic supra-physiological GH"]
    },
    studies: [
      { title: "Long-acting CJC-1295 stimulates GH and IGF-1 for extended periods", authors: "Jetté L, et al.", year: 2005, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "15899949", url: "https://pubmed.ncbi.nlm.nih.gov/15899949/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/15899949/"]
  },

  {
    name: "PT-141 Bremelanotide",
    full_name: "Bremelanotide (PT-141)",
    slug: "pt-141-bremelanotide",
    tagline: "Same compound as PT-141 — some vendors list bremelanotide's generic name. FDA-approved for HSDD in premenopausal women.",
    aliases: ["PT-141", "Bremelanotide", "Vyleesi"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~2.7 hours",
    molecular_weight: "1025.2 g/mol",
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
    overview: "PT-141 Bremelanotide is the same compound as PT-141 — some vendors list both names. Bremelanotide is the generic (INN) name; PT-141 is the research designation. FDA-approved as Vyleesi for hypoactive sexual desire disorder (HSDD) in premenopausal women. Acts centrally through MC3R/MC4R to enhance sexual motivation. See PT-141 profile for full details.",
    description: "Same compound as PT-141. Bremelanotide is the generic name; some vendors list both names. FDA-approved for HSDD.",
    typical_dosage: "1.75 mg subcutaneously 45 minutes before sexual activity",
    reconstitution_instructions: "Available as Vyleesi autoinjector. Research peptide: reconstitute with bacteriostatic water.",
    category: "sexual-health",
    mechanism: [
      { title: "Central MC3R/MC4R Agonism", body: "Activates hypothalamic melanocortin receptors to enhance sexual motivation and arousal via CNS pathways, independent of vascular mechanisms." }
    ],
    research_applications: [
      { area: "Hypoactive Sexual Desire Disorder (Women)", evidence: "Strong", description: "FDA-approved. Phase III trials showed significant improvement in satisfying sexual events and desire." },
      { area: "Erectile Dysfunction (Men)", evidence: "Human", description: "Phase II trials demonstrated efficacy including in sildenafil non-responders." }
    ],
    dosage: {
      disclaimer: "FDA-approved only for HSDD in premenopausal women. Off-label use in men requires physician oversight. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "1–1.75 mg", frequency: "As needed, max 1x/24h", notes: "Inject 45 min before activity. Start at 1 mg for tolerability. Max 8 doses/month per FDA labeling." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea (~40%)", "Flushing", "Headache", "Transient blood pressure elevation", "Hyperpigmentation with repeated use"],
      unknown_risks: ["Cardiovascular monitoring required", "Contraindicated in uncontrolled hypertension"]
    },
    studies: [
      { title: "Bremelanotide for HSDD in Premenopausal Women", authors: "Simon JA, et al.", year: 2019, journal: "Obstetrics & Gynecology", pmid: "31348226", url: "https://pubmed.ncbi.nlm.nih.gov/31348226/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/31348226/"]
  },

  // ── GLP vendor shorthand profiles ────────────────────────────────────────

  {
    name: "GLP-1 (S)",
    full_name: "Semaglutide — GLP-1 Receptor Agonist",
    slug: "glp-1-s",
    tagline: "Vendor shorthand for Semaglutide — a long-acting GLP-1 receptor agonist FDA-approved as Ozempic and Wegovy.",
    aliases: ["GLP-1 S", "Semaglutide", "Ozempic", "Wegovy"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~1 week",
    molecular_weight: "4113.6 g/mol",
    sequence: "Modified GLP-1 analog with C18 fatty diacid conjugation",
    overview: "GLP-1 (S) is a vendor shorthand designation for Semaglutide, where 'S' refers to Semaglutide. GLP-1 is the incretin hormone that semaglutide mimics. FDA-approved as Ozempic (type 2 diabetes, cardiovascular risk reduction) and Wegovy (chronic weight management). The STEP trials demonstrated ~15% mean weight reduction; the SELECT trial showed 20% reduction in major cardiovascular events in non-diabetic obese adults. See Semaglutide profile for complete details.",
    description: "Vendor shorthand for Semaglutide (Ozempic/Wegovy). GLP-1 receptor agonist FDA-approved for diabetes and weight management.",
    typical_dosage: "0.25 mg weekly → titrate to 1–2.4 mg weekly",
    reconstitution_instructions: "See Semaglutide profile. Research peptide: reconstitute with bacteriostatic water.",
    category: "weight-loss",
    mechanism: [
      { title: "GLP-1 Receptor Agonism", body: "Activates GLP-1 receptors in pancreas (insulin secretion), hypothalamus (appetite suppression), stomach (gastric emptying delay), and cardiovascular tissue (cardioprotection)." }
    ],
    research_applications: [
      { area: "Type 2 Diabetes", evidence: "Strong", description: "FDA-approved. SUSTAIN trials: HbA1c reduction 1.2–1.8%, significant cardiovascular risk reduction." },
      { area: "Chronic Weight Management", evidence: "Strong", description: "FDA-approved (Wegovy 2.4 mg). STEP-1: ~15% mean body weight reduction at 68 weeks." }
    ],
    dosage: {
      disclaimer: "FDA-approved semaglutide requires a prescription. Research peptide is not FDA-approved pharmaceutical semaglutide. Always consult a physician.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "0.25 mg → 2.4 mg", frequency: "Once weekly", notes: "Titrate slowly to minimize GI side effects. See Semaglutide profile for full titration schedule." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea", "Vomiting", "Diarrhea", "Decreased appetite", "Gallstones"],
      unknown_risks: ["Thyroid C-cell tumors (black box)", "Pancreatitis", "Rebound weight gain after discontinuation"]
    },
    studies: [
      { title: "Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)", authors: "Wilding JPH, et al.", year: 2021, journal: "New England Journal of Medicine", pmid: "33567185", url: "https://pubmed.ncbi.nlm.nih.gov/33567185/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/33567185/"]
  },

  {
    name: "GLP-2 (T)",
    full_name: "Tirzepatide — GLP-1/GIP Dual Agonist",
    slug: "glp-2-t",
    tagline: "Vendor shorthand for Tirzepatide — FDA-approved dual GLP-1/GIP agonist achieving ~22% weight reduction.",
    aliases: ["GLP-2 T", "Tirzepatide", "Mounjaro", "Zepbound"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~5 days",
    molecular_weight: "4813.5 g/mol",
    sequence: "Modified GLP-1/GIP hybrid with C20 fatty diacid",
    overview: "GLP-2 (T) is a vendor shorthand for Tirzepatide, where 'T' refers to Tirzepatide. FDA-approved as Mounjaro (type 2 diabetes) and Zepbound (weight management). The SURMOUNT-1 trial showed ~22.5% mean body weight reduction at 72 weeks — the highest pharmacological weight loss efficacy ever recorded. Tirzepatide is a dual GLP-1/GIP agonist; the 'GLP-2' in the vendor designation is a shorthand code, not a reference to biological GLP-2 hormone. See Tirzepatide profile for full details.",
    description: "Vendor shorthand for Tirzepatide (Mounjaro/Zepbound). Dual GLP-1/GIP agonist FDA-approved for diabetes and weight management.",
    typical_dosage: "2.5 mg weekly → titrate to 5–15 mg weekly",
    reconstitution_instructions: "See Tirzepatide profile. FDA-approved versions are pre-filled pens.",
    category: "weight-loss",
    mechanism: [
      { title: "Dual GLP-1R and GIPR Agonism", body: "Co-activation of GLP-1R (appetite suppression, glucose control) and GIPR (fat lipolysis, insulin sensitization) produces superior weight loss vs. GLP-1 agonists alone." }
    ],
    research_applications: [
      { area: "Type 2 Diabetes", evidence: "Strong", description: "FDA-approved (Mounjaro). SURPASS-2: superior to semaglutide on HbA1c and weight reduction." },
      { area: "Chronic Weight Management", evidence: "Strong", description: "FDA-approved (Zepbound). SURMOUNT-1: 22.5% mean weight loss — highest pharmacological efficacy on record." }
    ],
    dosage: {
      disclaimer: "FDA-approved tirzepatide requires a prescription. Research peptide is not equivalent to pharmaceutical Mounjaro/Zepbound. Always consult a physician.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "2.5 mg → 15 mg", frequency: "Once weekly", notes: "Titrate 4 weeks at each dose level. Maximum 15 mg/week." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea", "Vomiting", "Diarrhea", "Decreased appetite", "Gallstones"],
      unknown_risks: ["Thyroid C-cell tumors (black box)", "Pancreatitis", "Muscle mass loss with aggressive weight loss"]
    },
    studies: [
      { title: "Tirzepatide for the Treatment of Obesity (SURMOUNT-1)", authors: "Jastreboff AM, et al.", year: 2022, journal: "New England Journal of Medicine", pmid: "35658024", url: "https://pubmed.ncbi.nlm.nih.gov/35658024/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/35658024/"]
  },

  {
    name: "GLP-3 (R)",
    full_name: "Retatrutide — GLP-1/GIP/Glucagon Triple Agonist",
    slug: "glp-3-r",
    tagline: "Vendor shorthand for Retatrutide — the first triple incretin agonist with ~24% weight loss in Phase II trials.",
    aliases: ["GLP-3 R", "Retatrutide", "LY3437943"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~6 days",
    molecular_weight: "~5000 g/mol",
    sequence: "Proprietary Eli Lilly GLP-1/GIP/GCG hybrid peptide",
    overview: "GLP-3 (R) is a vendor shorthand for Retatrutide, where 'R' refers to Retatrutide. The 'GLP-3' in the vendor designation is a shorthand code — retatrutide is a triple agonist of GLP-1R, GIPR, and glucagon receptor (GCGR). Not FDA-approved; in Phase III clinical trials. Phase II NEJM data: 24.2% mean weight reduction at 48 weeks — the highest ever reported. See Retatrutide profile for full details.",
    description: "Vendor shorthand for Retatrutide. Triple GLP-1/GIP/glucagon agonist in Phase III with record-breaking 24% weight loss in Phase II.",
    typical_dosage: "Phase III ongoing — not established for general use",
    reconstitution_instructions: "Research peptide: reconstitute with bacteriostatic water. Extremely potent — precise dosing essential.",
    category: "weight-loss",
    mechanism: [
      { title: "Triple Incretin Receptor Agonism", body: "Combines GLP-1R (appetite suppression), GIPR (fat lipolysis, insulin sensitization), and GCGR (thermogenesis, hepatic fat reduction) agonism for synergistic metabolic effects." }
    ],
    research_applications: [
      { area: "Obesity / Weight Management", evidence: "Human", description: "Phase II (NEJM 2023): 24.2% body weight reduction at 48 weeks — exceeds all prior pharmacological data. Phase III ongoing." }
    ],
    dosage: {
      disclaimer: "Retatrutide is NOT FDA-approved. Phase III trials ongoing. Research peptide is not pharmaceutical-grade. Extreme caution — potency exceeds tirzepatide. Not medical advice.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "1–12 mg", frequency: "Once weekly", notes: "Phase II titration protocol. Extremely potent — titrate very slowly. Monitor closely for tachycardia." }
      ]
    },
    safety_profile: {
      rating: "Emerging Safety Profile (Phase III)",
      known_effects: ["Nausea and vomiting", "Tachycardia (glucagon effect)", "Diarrhea", "Decreased appetite"],
      unknown_risks: ["Phase III safety incomplete", "Tachycardia risk requires cardiac monitoring", "Long-term oncologic safety not established"]
    },
    studies: [
      { title: "Retatrutide Phase 2 obesity trial with 24% weight loss", authors: "Jastreboff AM, et al.", year: 2023, journal: "New England Journal of Medicine", pmid: "37345879", url: "https://pubmed.ncbi.nlm.nih.gov/37345879/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/37345879/"]
  },

];

// ── Upsert ─────────────────────────────────────────────────────────────────

async function main() {
  log(`Upserting ${PEPTIDES.length} peptides…`);

  const { error } = await db
    .from("peptides")
    .upsert(PEPTIDES, { onConflict: "slug" });

  if (error) {
    console.error(`[${SCRIPT}] ERROR:`, error.message);
    process.exit(1);
  }

  log(`Done. ${PEPTIDES.length} peptides upserted.`);
}

main();
