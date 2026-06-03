/**
 * scripts/seed-peptides-2.ts
 * Seeds batch 3 — new distinct compounds identified from vendor_peptides data.
 * Safe to re-run — uses upsert on slug.
 *
 * Run: npm run seed:peptides2
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-peptides-2";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const PEPTIDES = [

  {
    name: "MOTS-c",
    full_name: "Mitochondrial Open Reading Frame of the 12S rRNA-c",
    slug: "mots-c",
    tagline: "A mitochondrial-derived peptide that regulates metabolic homeostasis, insulin sensitivity, and exercise capacity.",
    aliases: ["Mitochondrial Peptide MOTS-c"],
    fda_status: "research-only",
    research_status: "Early",
    half_life: "Not well established",
    molecular_weight: "2174.5 g/mol",
    sequence: "Tyr-Arg-Trp-Leu-Thr-Met-Pro-Gln-Arg-Asn-Ser-Val-Ser-Arg-Thr-Arg-Ala-Ala-Val-Arg-Asp-Gly-Ile-Ser-His-Ala-Arg-His-Val-Arg",
    overview: "MOTS-c is a 16-amino-acid peptide encoded within the mitochondrial genome — specifically the 12S ribosomal RNA gene. Discovered in 2015 by researchers at USC, it represents a new class of mitochondrial-derived peptides (MDPs) that regulate systemic metabolic function. MOTS-c acts as a retrograde signal from mitochondria to the nucleus, regulating gene expression involved in glucose metabolism, fatty acid oxidation, and insulin sensitivity. Circulating MOTS-c levels decline with age and in metabolic disease, positioning it as a potential therapeutic target for age-related metabolic decline. It has demonstrated remarkable exercise-mimicking effects in rodent models.",
    description: "Mitochondria-derived signaling peptide regulating glucose metabolism, fatty acid oxidation, and insulin sensitivity.",
    typical_dosage: "5–10 mg subcutaneously per day",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 5 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "AMPK Activation", body: "MOTS-c activates AMP-activated protein kinase (AMPK), the master energy sensor of the cell. AMPK activation promotes glucose uptake, fatty acid oxidation, and mitochondrial biogenesis — effects that mirror aerobic exercise." },
      { title: "Folate Cycle and Methionine Metabolism", body: "MOTS-c regulates the folate cycle by inhibiting AICAR transformylase, increasing AICAR (an AMPK activator) and diverting metabolic flux away from de novo purine synthesis toward energy production." },
      { title: "Nuclear Translocation Under Stress", body: "Under metabolic stress, MOTS-c translocates from mitochondria to the nucleus where it regulates nuclear gene expression — a unique bidirectional mito-nuclear communication mechanism." }
    ],
    research_applications: [
      { area: "Metabolic Syndrome & Insulin Resistance", evidence: "Animal", description: "Rodent studies demonstrate MOTS-c administration reverses diet-induced insulin resistance and obesity, with improved glucose tolerance and reduced adiposity." },
      { area: "Exercise Mimetics", evidence: "Animal", description: "MOTS-c administration in sedentary mice produces exercise-like adaptations in skeletal muscle, improving endurance capacity and metabolism without physical activity." },
      { area: "Aging & Longevity", evidence: "Early", description: "MOTS-c levels decline with age; supplementation in aged mice improves physical performance and metabolic function, suggesting a role in age-related metabolic decline." }
    ],
    dosage: {
      disclaimer: "MOTS-c is a research compound with no human clinical trials completed. All protocols are extrapolated from animal research. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "5–10 mg", frequency: "Daily", notes: "Research protocols vary widely. Most animal studies use weight-based dosing (0.5 mg/kg/day). Human equivalent dosing is not established." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data",
      known_effects: ["Injection site reactions", "Transient fatigue or lethargy reported anecdotally"],
      unknown_risks: ["No human clinical trial safety data", "Long-term effects on mitochondrial signaling with exogenous administration are unknown", "Interaction with existing metabolic medications requires caution"]
    },
    studies: [
      { title: "MOTS-c is an exercise-induced mitochondrial-encoded regulator of age-dependent physical decline and muscle homeostasis", authors: "Reynolds JC, et al.", year: 2021, journal: "Nature Communications", pmid: "33990565", url: "https://pubmed.ncbi.nlm.nih.gov/33990565/" },
      { title: "The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance", authors: "Lee C, et al.", year: 2015, journal: "Cell Metabolism", pmid: "25738459", url: "https://pubmed.ncbi.nlm.nih.gov/25738459/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/25738459/"]
  },

  {
    name: "LL-37",
    full_name: "Cathelicidin Antimicrobial Peptide LL-37",
    slug: "ll-37",
    tagline: "The only known human cathelicidin — a multifunctional antimicrobial peptide with immune modulation, wound healing, and anti-biofilm activity.",
    aliases: ["hCAP18/LL-37", "Cathelicidin", "CAMP"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~30 minutes",
    molecular_weight: "4493.4 g/mol",
    sequence: "Leu-Leu-Gly-Asp-Phe-Phe-Arg-Lys-Ser-Lys-Glu-Lys-Ile-Gly-Lys-Glu-Phe-Lys-Arg-Ile-Val-Gln-Arg-Ile-Lys-Asp-Phe-Leu-Arg-Asn-Leu-Val-Pro-Arg-Thr-Glu-Ser",
    overview: "LL-37 is the only member of the cathelicidin family of antimicrobial peptides expressed in humans. It is derived from the C-terminal cleavage of the precursor protein hCAP18, which is stored in neutrophil granules and secreted by epithelial cells in response to infection or injury. LL-37 kills bacteria by disrupting their membranes while simultaneously modulating the host immune response — promoting wound healing, angiogenesis, and suppressing excessive inflammation. Its activity against biofilm-forming bacteria, including antibiotic-resistant strains, has generated significant interest as a novel anti-infective. LL-37 levels are reduced in patients with chronic wounds, atopic dermatitis, and certain infections.",
    description: "Human cathelicidin with antimicrobial, wound healing, and immunomodulatory properties. Active against biofilms and antibiotic-resistant bacteria.",
    typical_dosage: "1–5 mg locally or systemically, protocols vary by indication",
    reconstitution_instructions: "Reconstitute with sterile saline. Use fresh — LL-37 is susceptible to proteolytic degradation.",
    category: "healing",
    mechanism: [
      { title: "Membrane Disruption (Antimicrobial)", body: "LL-37 adopts an amphipathic alpha-helical structure that inserts into and disrupts bacterial membranes, causing depolarization and cell death. This mechanism is effective against Gram-positive, Gram-negative, and fungal pathogens." },
      { title: "Biofilm Disruption", body: "LL-37 penetrates and disrupts biofilms formed by pathogens including P. aeruginosa and S. aureus — a key advantage over conventional antibiotics which cannot penetrate established biofilms." },
      { title: "Immune Modulation and Wound Healing", body: "LL-37 activates formyl peptide receptors (FPRs), EGFR, and P2X7 receptors on host cells, promoting angiogenesis, keratinocyte migration, and controlled inflammation resolution." }
    ],
    research_applications: [
      { area: "Wound Healing", evidence: "Moderate", description: "Topical LL-37 accelerates healing in diabetic and chronic wounds in animal models. Clinical studies in chronic leg ulcers show improved healing rates." },
      { area: "Antimicrobial / Anti-Biofilm", evidence: "Strong", description: "In vitro and animal studies consistently demonstrate broad-spectrum antimicrobial activity, including against MRSA, VRE, and P. aeruginosa biofilms." },
      { area: "Atopic Dermatitis & Psoriasis", evidence: "Moderate", description: "LL-37 is deficient in atopic dermatitis skin, contributing to susceptibility to S. aureus. Supplementation restores barrier defense. Paradoxically, LL-37 is elevated in psoriasis where it may amplify inflammation." }
    ],
    dosage: {
      disclaimer: "LL-37 is a research compound. No standardized clinical dosing exists. Systemic use requires extreme caution — LL-37 can be pro-inflammatory at high systemic concentrations. Not medical advice.",
      ranges: [
        { route: "Topical / Local", range: "1–5 mg in carrier", frequency: "1–2x daily", notes: "Most clinical research uses topical application for wound healing. Concentration and vehicle matter significantly for bioavailability." },
        { route: "Subcutaneous", range: "1–2 mg", frequency: "2–3x weekly", notes: "Systemic injection protocols are anecdotal. Systemic LL-37 can trigger inflammatory responses — start low and monitor carefully." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Injection site inflammation", "Pro-inflammatory response at high systemic doses", "Potential mast cell activation and histamine release"],
      unknown_risks: ["Systemic pro-inflammatory effects at supraphysiological doses are concerning", "Interaction with autoimmune conditions (LL-37 is an autoantigen in lupus)", "Long-term effects on microbiome with topical use"]
    },
    studies: [
      { title: "Human cathelicidin, hCAP-18, is processed to the antimicrobial peptide LL-37 by extracellular cleavage with proteinase 3", authors: "Sørensen OE, et al.", year: 2001, journal: "Blood", pmid: "11181773", url: "https://pubmed.ncbi.nlm.nih.gov/11181773/" },
      { title: "LL-37 in wound healing: clinical trial", authors: "Rivas-Santiago B, et al.", year: 2013, journal: "PLoS ONE", pmid: "24058443", url: "https://pubmed.ncbi.nlm.nih.gov/24058443/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/11181773/"]
  },

  {
    name: "Oxytocin",
    full_name: "Oxytocin (Synthetic)",
    slug: "oxytocin",
    tagline: "The 'bonding hormone' — a naturally occurring nonapeptide studied for social behavior, anxiety reduction, wound healing, and metabolic effects.",
    aliases: ["OT", "Pitocin", "Syntocinon"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~1–6 minutes (IV); ~30 minutes (intranasal)",
    molecular_weight: "1007.2 g/mol",
    sequence: "Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH2 (disulfide bond between Cys1-Cys6)",
    overview: "Oxytocin is a nine-amino-acid neuropeptide produced in the hypothalamus and released by the posterior pituitary. It is best known for its role in childbirth (uterine contractions) and lactation, but research has revealed a far broader role in social bonding, trust, anxiety modulation, and metabolic function. FDA-approved as Pitocin for obstetric use, intranasal oxytocin has been extensively studied in psychiatric research for autism spectrum disorder, social anxiety, and PTSD. More recent research has identified roles in wound healing, bone density, and adiposity regulation.",
    description: "Endogenous nonapeptide with FDA-approved obstetric uses. Extensively studied for social anxiety, autism, PTSD, and metabolic effects.",
    typical_dosage: "24–40 IU intranasally as needed",
    reconstitution_instructions: "Available as nasal spray. Research peptide: reconstitute in sterile saline at 40 IU/mL (1 IU ≈ 1.68 mcg).",
    category: "healing",
    mechanism: [
      { title: "Oxytocin Receptor Agonism (OXTR)", body: "Oxytocin binds G-protein coupled oxytocin receptors distributed throughout the brain (amygdala, hypothalamus, nucleus accumbens) and periphery. Central OXTR signaling modulates social reward, fear conditioning, and stress responses." },
      { title: "Amygdala Fear Response Dampening", body: "Oxytocin reduces amygdala activation in response to social threats and fearful faces, reducing social anxiety while preserving threat detection to non-social dangers." },
      { title: "HPA Axis Modulation", body: "Oxytocin inhibits the hypothalamic-pituitary-adrenal (HPA) axis, reducing cortisol secretion and dampening physiological stress responses." }
    ],
    research_applications: [
      { area: "Autism Spectrum Disorder", evidence: "Moderate", description: "Multiple RCTs have investigated intranasal oxytocin for improving social cognition in ASD. Results are mixed — some studies show improved social recognition, others show no benefit. Active area of research." },
      { area: "Social Anxiety Disorder", evidence: "Moderate", description: "Studies demonstrate reduced anxiety in social situations and improved eye contact and social engagement with intranasal oxytocin." },
      { area: "PTSD", evidence: "Early", description: "Pilot studies suggest oxytocin may reduce fear extinction consolidation and PTSD symptoms when combined with trauma-focused therapy." },
      { area: "Metabolic Effects", evidence: "Early", description: "Animal studies and small human trials suggest oxytocin reduces food intake, adiposity, and improves insulin sensitivity — positioning it as a potential anti-obesity peptide." }
    ],
    dosage: {
      disclaimer: "Intranasal oxytocin is used off-label for psychiatric indications. FDA-approved oxytocin is for obstetric/lactation use only. Not medical advice. Use in pregnancy is contraindicated outside clinical settings.",
      ranges: [
        { route: "Intranasal", range: "24–40 IU (12–20 IU per nostril)", frequency: "As needed, 15–45 min before social interaction", notes: "Most psychiatric research uses 24–40 IU doses. Effects last 30–90 minutes. Not for daily continuous use — receptor desensitization may occur." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Mild headache", "Transient nausea", "Water retention at higher doses", "Potential for increased trust/social vulnerability (use with caution in adversarial situations)"],
      unknown_risks: ["Long-term intranasal use effects on endogenous oxytocin system not characterized", "Potential blunting of natural social reward with chronic exogenous administration", "Interactions with psychiatric medications require monitoring"]
    },
    studies: [
      { title: "Oxytocin increases trust in humans", authors: "Kosfeld M, Heinrichs M, Zak PJ, et al.", year: 2005, journal: "Nature", pmid: "15931222", url: "https://pubmed.ncbi.nlm.nih.gov/15931222/" },
      { title: "Intranasal oxytocin in autism spectrum disorder", authors: "Guastella AJ, et al.", year: 2010, journal: "Biological Psychiatry", pmid: "19897177", url: "https://pubmed.ncbi.nlm.nih.gov/19897177/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/15931222/"]
  },

  {
    name: "Melanotan II",
    full_name: "Melanotan II (MT-2)",
    slug: "melanotan-ii",
    tagline: "A cyclic analog of alpha-MSH studied for skin tanning, erectile function, and appetite suppression — not FDA-approved and associated with significant risks.",
    aliases: ["MT-2", "MT2", "Melanotan 2"],
    fda_status: "not-approved",
    research_status: "Moderate",
    half_life: "~1 hour",
    molecular_weight: "1024.2 g/mol",
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
    overview: "Melanotan II is a cyclic analog of alpha-melanocyte-stimulating hormone (α-MSH) developed at the University of Arizona in the 1980s as a potential tanning agent. By activating melanocortin receptors, it stimulates melanogenesis (skin darkening) without UV radiation, while simultaneously producing potent sexual arousal effects (the basis for PT-141's development) and appetite suppression. Melanotan II was never approved for medical use due to safety concerns — principally uncontrolled melanocyte activation, cardiovascular effects, and unknown long-term risks of nevi (mole) changes. It is nonetheless widely used recreationally for tanning and sexual enhancement, often by individuals unaware of its risks.",
    description: "Cyclic α-MSH analog producing skin tanning, sexual arousal, and appetite suppression via melanocortin receptors. Not FDA-approved; significant safety concerns.",
    typical_dosage: "0.5–1 mg subcutaneously",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Store refrigerated. Very potent — handle low-dose reconstitutions carefully.",
    category: "sexual-health",
    mechanism: [
      { title: "Broad Melanocortin Receptor Agonism", body: "MT-2 is a non-selective melanocortin receptor agonist, activating MC1R (melanogenesis), MC3R and MC4R (sexual arousal, appetite), and MC5R. This broad activity produces multiple simultaneous effects — a key difference from the more selective PT-141 (bremelanotide)." },
      { title: "Melanogenesis via MC1R", body: "MC1R activation on melanocytes triggers eumelanin production, causing skin darkening. This occurs systemically, including in existing nevi (moles), raising dermatological safety concerns." },
      { title: "Central Sexual Arousal via MC4R", body: "Hypothalamic MC4R activation drives dopamine-dependent sexual arousal — the same mechanism exploited by PT-141, which is the more selective and FDA-approved evolution of MT-2." }
    ],
    research_applications: [
      { area: "Tanning / Photoprotection", evidence: "Human", description: "Phase I trials confirmed skin darkening without UV. Development halted due to safety concerns about uncontrolled melanocyte activation and nevi changes." },
      { area: "Erectile Dysfunction", evidence: "Human", description: "Clinical trials demonstrated efficacy for erectile dysfunction, including in non-responders to sildenafil. PT-141 was subsequently developed as a safer, more selective alternative." },
      { area: "Appetite Suppression", evidence: "Animal", description: "MT-2 reduces food intake in rodent models via MC4R activation. Not pursued clinically for obesity due to safety profile." }
    ],
    dosage: {
      disclaimer: "Melanotan II is NOT FDA-approved and has significant safety risks including uncontrolled nevi changes, cardiovascular effects, and unknown long-term risks. This information is for harm reduction only. We do not endorse its use.",
      ranges: [
        { route: "Subcutaneous", range: "0.25–1 mg", frequency: "As needed (tanning: daily until desired color; ED: as needed)", notes: "Start at 0.25 mg to assess nausea tolerance. Loading phase for tanning: 0.5 mg/day for 1–2 weeks. Never exceed 1 mg/dose. Conduct regular skin checks for nevi changes." }
      ]
    },
    safety_profile: {
      rating: "High Caution Required",
      known_effects: ["Nausea (very common, often severe at higher doses)", "Facial flushing", "Spontaneous penile erections", "Yawning", "Stretching", "Fatigue", "Darkening of existing moles (significant concern)"],
      unknown_risks: ["Melanoma risk from uncontrolled melanocyte activation — theoretical but serious", "Cardiovascular: transient blood pressure elevation", "New nevi formation and existing nevi changes require dermatological monitoring", "Long-term endocrine effects of chronic MC receptor stimulation", "Contraindicated in anyone with history of melanoma or dysplastic nevi"]
    },
    studies: [
      { title: "Melanotan II, a potent tanning agent, causes spontaneous erections in men", authors: "Dorr RT, et al.", year: 1996, journal: "Journal of Urology", pmid: "8609361", url: "https://pubmed.ncbi.nlm.nih.gov/8609361/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/8609361/"]
  },

  {
    name: "Kisspeptin-10",
    full_name: "Kisspeptin-10 (KP-10)",
    slug: "kisspeptin-10",
    tagline: "The C-terminal decapeptide of kisspeptin — a key regulator of reproductive hormones and GnRH pulsatility, studied for fertility and hypogonadism.",
    aliases: ["KP-10", "Metastin 45-54"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~4 minutes",
    molecular_weight: "1302.5 g/mol",
    sequence: "Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2",
    overview: "Kisspeptin-10 is the biologically active C-terminal decapeptide of kisspeptin (also called metastin), encoded by the KISS1 gene. Kisspeptin acts as the master regulator of the hypothalamic-pituitary-gonadal (HPG) axis, binding the KISS1R receptor (GPR54) to trigger pulsatile GnRH secretion, which in turn stimulates LH and FSH release. It is essential for puberty onset and reproductive function — loss-of-function mutations in KISS1R cause hypogonadotropic hypogonadism. Kisspeptin-10 is the shortest active fragment, retaining full KISS1R binding activity while being the most feasible for therapeutic use. Clinical applications include fertility treatment and the diagnosis and management of hypogonadism.",
    description: "Active fragment of the KISS1 gene product — the master regulator of GnRH pulsatility and reproductive hormone axis.",
    typical_dosage: "1–10 mcg/kg by injection (clinical research)",
    reconstitution_instructions: "Reconstitute with sterile saline. Very potent — accurate dosing requires precise dilution.",
    category: "performance",
    mechanism: [
      { title: "KISS1R (GPR54) Agonism", body: "Kisspeptin-10 binds the KISS1R receptor on GnRH neurons in the hypothalamus, triggering calcium influx and pulsatile GnRH secretion. This activates the entire HPG axis downstream, stimulating LH and FSH release from the pituitary." },
      { title: "LH Pulse Amplification", body: "In hypogonadal men and women with intact pituitary function, exogenous kisspeptin-10 produces robust LH pulses, restoring downstream testosterone/estrogen production — making it a potential alternative to GnRH pump therapy." }
    ],
    research_applications: [
      { area: "Hypogonadotropic Hypogonadism", evidence: "Human", description: "Clinical trials demonstrate kisspeptin-10 restores pulsatile LH secretion and gonadal steroidogenesis in patients with hypogonadotropic hypogonadism, including Kallmann syndrome." },
      { area: "Female Fertility (IVF)", evidence: "Human", description: "Phase II trials show kisspeptin-10 can trigger oocyte maturation in IVF cycles with a lower risk of ovarian hyperstimulation syndrome (OHSS) compared to hCG triggers." },
      { area: "Male Reproductive Health", evidence: "Moderate", description: "Studies demonstrate kisspeptin-10 increases testosterone pulsatility in healthy men and those with low testosterone, with potential applications in hypogonadism and post-TRT recovery." }
    ],
    dosage: {
      disclaimer: "Kisspeptin-10 is a research compound affecting the reproductive hormone axis. Dosing is highly weight-dependent and indication-specific. Not for use without physician oversight. Not medical advice.",
      ranges: [
        { route: "Subcutaneous or IV (clinical)", range: "1–10 mcg/kg", frequency: "Pulsatile (every 90–120 min) or single trigger dose", notes: "Clinical research uses pulsatile infusion protocols. Single doses of 0.1–1 nmol/kg produce acute LH pulses for diagnostic or trigger purposes." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["LH/FSH surge (intended effect)", "Transient nausea at high doses", "Hot flashes in women (from estrogen surge)"],
      unknown_risks: ["Long-term effects on HPG axis regulation with chronic use not characterized", "Potential KISS1R desensitization with continuous administration", "Use in hormone-sensitive cancers is contraindicated"]
    },
    studies: [
      { title: "Kisspeptin-10 in men with hypogonadotropic hypogonadism", authors: "Dhillo WS, et al.", year: 2005, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "16159940", url: "https://pubmed.ncbi.nlm.nih.gov/16159940/" },
      { title: "Kisspeptin-54 as a novel trigger of oocyte maturation in IVF", authors: "Jayasena CN, et al.", year: 2014, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "24780047", url: "https://pubmed.ncbi.nlm.nih.gov/24780047/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/16159940/"]
  },

  {
    name: "GHRP-2",
    full_name: "Growth Hormone Releasing Peptide-2",
    slug: "ghrp-2",
    tagline: "A potent synthetic GH secretagogue with moderate cortisol and prolactin elevation — stronger than Ipamorelin, less than Hexarelin.",
    aliases: ["Pralmorelin", "KP-102"],
    fda_status: "not-approved",
    research_status: "Strong",
    half_life: "~30 minutes",
    molecular_weight: "817.94 g/mol",
    sequence: "D-Ala-D-βNal-Ala-Trp-D-Phe-Lys-NH2",
    overview: "GHRP-2 (pralmorelin) is a synthetic hexapeptide that acts as a potent ghrelin receptor (GHS-R1a) agonist. It produces strong GH pulses comparable to Hexarelin, with moderate cortisol and prolactin elevation — more than Ipamorelin but less than Hexarelin or GHRP-6. GHRP-2 was studied extensively in clinical trials, including a Phase III trial for GH deficiency assessment, and is approved as a diagnostic agent in Japan. It represents a middle ground in the GHRP family: potent GH release without GHRP-6's pronounced hunger stimulation or Hexarelin's rapid desensitization.",
    description: "Potent synthetic hexapeptide GH secretagogue — approved as a diagnostic agent in Japan, widely used in research.",
    typical_dosage: "100–300 mcg subcutaneously, 1–3x daily",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1–2 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "GHS-R1a Agonism", body: "GHRP-2 binds the ghrelin receptor (GHS-R1a) in the pituitary and hypothalamus, triggering GH release. Its potency at GHS-R1a exceeds Ipamorelin while producing less off-target receptor activity than GHRP-6." },
      { title: "Cortisol and Prolactin Elevation", body: "Unlike Ipamorelin, GHRP-2 produces dose-dependent elevations in cortisol and prolactin. This limits its suitability for long-term protocols but makes it a useful diagnostic tool for GH axis assessment." }
    ],
    research_applications: [
      { area: "GH Deficiency Diagnosis", evidence: "Strong", description: "Approved in Japan for GH stimulation testing. Multiple clinical trials confirm GHRP-2 as a reliable provocative test for GH secretory capacity." },
      { area: "GH Optimization", evidence: "Moderate", description: "Used in combination with GHRH analogs (CJC-1295, Sermorelin) for synergistic GH pulse amplification in anti-aging and body composition protocols." }
    ],
    dosage: {
      disclaimer: "GHRP-2 is a research compound. Cortisol elevation with repeated dosing is a meaningful concern for long-term use. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "100–300 mcg", frequency: "1–3x daily", notes: "Combine with a GHRH analog for synergistic effect. Inject fasted. Bedtime injection preferred for GH's anabolic nocturnal release. Cycle 8–12 weeks maximum." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Cortisol elevation (dose-dependent)", "Prolactin elevation", "Water retention", "Increased appetite (less than GHRP-6)", "Fatigue", "GHS-R1a desensitization with continuous use"],
      unknown_risks: ["Long-term cortisol effects with sustained use", "IGF-1 elevation and cancer risk with chronic supraphysiological GH", "Effects in oncology patients contraindicated"]
    },
    studies: [
      { title: "Growth hormone-releasing peptide-2 stimulates GH secretion in GH-deficient patients", authors: "Bowers CY, et al.", year: 1990, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "2172258", url: "https://pubmed.ncbi.nlm.nih.gov/2172258/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/2172258/"]
  },

  {
    name: "GHRP-6",
    full_name: "Growth Hormone Releasing Peptide-6",
    slug: "ghrp-6",
    tagline: "The original synthetic GHRP — produces strong GH release with pronounced hunger stimulation, making it popular for bulking and bodybuilding research.",
    aliases: ["SK&F-110679", "GHRP6"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~15–60 minutes",
    molecular_weight: "873.03 g/mol",
    sequence: "His-D-Trp-Ala-Trp-D-Phe-Lys-NH2",
    overview: "GHRP-6 was one of the first synthetic GH secretagogues developed, originally synthesized in the 1980s. It produces potent GH release through GHS-R1a agonism but is distinguished from other GHRPs by its marked stimulation of appetite and hunger — an effect mediated through ghrelin receptor activation in the hypothalamus and vagus nerve. This hunger-stimulating property has made it popular in bodybuilding research for mass-gaining protocols, while limiting its appeal for body composition-focused use. Like other GHRPs, it elevates cortisol and prolactin at research doses.",
    description: "First-generation synthetic GHRP with strong GH release and pronounced ghrelin-mediated appetite stimulation.",
    typical_dosage: "100–300 mcg subcutaneously, 1–3x daily",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1–2 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "GHS-R1a Agonism with Hunger Stimulation", body: "GHRP-6 mimics ghrelin's full agonist activity at GHS-R1a — stimulating both GH release from the pituitary AND hunger/appetite in the hypothalamus and gut-brain axis. This dual activity distinguishes it from more selective GHRPs." },
      { title: "Gastric Motility Enhancement", body: "Ghrelin receptors in the gastrointestinal tract mediate GHRP-6's effects on gastric emptying and appetite. Enhanced gastric motility may improve nutrient absorption." }
    ],
    research_applications: [
      { area: "GH Secretion Research", evidence: "Strong", description: "GHRP-6 has been extensively used as a research tool to characterize the GHS-R1a receptor system and validate GH-secretagogue pharmacology." },
      { area: "Appetite Stimulation", evidence: "Strong", description: "Consistently produces significant hunger stimulation in clinical studies — used as a positive control in appetite research and investigated for cachexia/wasting conditions." }
    ],
    dosage: {
      disclaimer: "GHRP-6 is a research compound. Hunger stimulation can be intense. Cortisol elevation limits long-term use. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "100–300 mcg", frequency: "1–3x daily", notes: "Inject fasted. Prepare for significant hunger 20–30 minutes post-injection. Combine with GHRH analog for synergistic GH effect. Cycle 8–12 weeks." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Intense hunger (most common and notable effect)", "Cortisol elevation", "Prolactin elevation", "Water retention", "Fatigue", "Insulin resistance at high doses (via cortisol)"],
      unknown_risks: ["Long-term hyperphagia and metabolic consequences with chronic use", "GH-axis desensitization with continuous administration", "IGF-1 elevation and cancer risk concerns"]
    },
    studies: [
      { title: "GHRP-6 stimulates GH release via a novel mechanism distinct from GHRH", authors: "Bowers CY, et al.", year: 1991, journal: "Journal of Endocrinology", pmid: "2061497", url: "https://pubmed.ncbi.nlm.nih.gov/2061497/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/2061497/"]
  },

  {
    name: "KPV",
    full_name: "KPV Tripeptide (Lys-Pro-Val)",
    slug: "kpv",
    tagline: "A C-terminal fragment of alpha-MSH with potent anti-inflammatory and gut-healing properties — studied for IBD, skin inflammation, and wound repair.",
    aliases: ["α-MSH (11-13)", "Lys-Pro-Val"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "Very short (minutes); stability enhanced by oral/topical delivery",
    molecular_weight: "339.4 g/mol",
    sequence: "Lys-Pro-Val",
    overview: "KPV is a tripeptide (Lys-Pro-Val) corresponding to the C-terminal sequence of alpha-melanocyte-stimulating hormone (α-MSH). While α-MSH itself has a broad spectrum of melanocortin receptor activities, KPV retains the anti-inflammatory core activity with a dramatically simplified structure. KPV inhibits NF-κB signaling and pro-inflammatory cytokine production, producing potent anti-inflammatory effects particularly in intestinal epithelial and immune cells. Its small size enables oral bioavailability when formulated appropriately — a significant advantage for gut-targeted applications. Research has focused primarily on inflammatory bowel disease, colitis, and wound healing.",
    description: "Tripeptide fragment of α-MSH with potent NF-κB inhibitory and anti-inflammatory activity. Orally bioavailable for gut-directed applications.",
    typical_dosage: "500 mcg – 1 mg subcutaneously, or oral formulations",
    reconstitution_instructions: "Reconstitute with sterile saline. Stable at room temperature in solution for short periods.",
    category: "healing",
    mechanism: [
      { title: "NF-κB Pathway Inhibition", body: "KPV inhibits NF-κB nuclear translocation in macrophages, dendritic cells, and intestinal epithelial cells — reducing expression of TNF-α, IL-6, IL-1β, and other pro-inflammatory mediators." },
      { title: "Intestinal Epithelial Barrier Protection", body: "KPV promotes tight junction protein expression and reduces intestinal permeability ('leaky gut'), relevant to IBD and systemic inflammation driven by gut barrier dysfunction." },
      { title: "Melanocortin Receptor-Independent Anti-Inflammation", body: "Unlike larger MSH peptides, KPV's anti-inflammatory activity appears partially independent of canonical melanocortin receptor binding, acting through intracellular pathways that may explain its activity in cells with low MC receptor expression." }
    ],
    research_applications: [
      { area: "Inflammatory Bowel Disease", evidence: "Animal", description: "Multiple rodent models of colitis (DSS, TNBS) show KPV significantly reduces intestinal inflammation and mucosal injury. Oral delivery using nanoparticle formulations has shown promising colon targeting." },
      { area: "Wound Healing", evidence: "Animal", description: "Topical and systemic KPV accelerates wound closure and reduces scar formation in rodent wound models, attributed to both anti-inflammatory and pro-regenerative effects." },
      { area: "Skin Inflammation", evidence: "Early", description: "Small studies suggest topical KPV may reduce psoriasis and atopic dermatitis-like inflammation by suppressing local cytokine production." }
    ],
    dosage: {
      disclaimer: "KPV is a research compound with no approved clinical dosing. Evidence is primarily preclinical. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "500 mcg – 1 mg", frequency: "Daily", notes: "Most common research protocol for systemic anti-inflammatory effects." },
        { route: "Oral", range: "1–5 mg", frequency: "Daily", notes: "Oral bioavailability is limited but may be sufficient for gut-directed effects, especially in inflamed tissue. Nanoparticle formulations increase efficacy in research settings." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Injection site reactions (mild)", "GI effects (rare)"],
      unknown_risks: ["Very limited human safety data", "Long-term immunosuppressive effects are not characterized", "Interaction with existing IBD medications requires caution"]
    },
    studies: [
      { title: "The tripeptide KPV and inflammation: anti-inflammatory properties and mechanisms of action", authors: "Brzoska T, et al.", year: 2008, journal: "Journal of Investigative Dermatology", pmid: "17943185", url: "https://pubmed.ncbi.nlm.nih.gov/17943185/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/17943185/"]
  },

  {
    name: "hGH Fragment 176-191",
    full_name: "Human Growth Hormone Fragment 176-191",
    slug: "fragment-176-191",
    tagline: "The C-terminal lipolytic fragment of human growth hormone — isolated fat-burning activity without GH's growth-promoting or insulin-disrupting effects.",
    aliases: ["HGH Frag 176-191", "GH Frag", "hGH (176-191)"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~30 minutes",
    molecular_weight: "1817.1 g/mol",
    sequence: "Tyr-Leu-Arg-Ile-Val-Gln-Cys-Arg-Ser-Val-Glu-Gly-Ser-Cys-Gly-Phe-NH2",
    overview: "hGH Fragment 176-191 is the C-terminal 16-amino-acid segment of human growth hormone (hGH), corresponding to the same region modified in AOD-9604. The key structural difference: AOD-9604 has an N-terminal tyrosine substituted with a modified residue for improved stability, while Fragment 176-191 is the unmodified native sequence. Both act through similar beta-3 adrenergic receptor mechanisms to promote lipolysis, but AOD-9604 is generally considered more stable and potent. Fragment 176-191 has been studied in obese rodents and human cell cultures as a mechanism for isolating GH's fat-burning activity from its growth-promoting (and insulin-disrupting) effects.",
    description: "Native C-terminal hGH fragment promoting lipolysis via beta-3 adrenergic receptors without GH's systemic growth or insulin effects.",
    typical_dosage: "500 mcg – 1 mg subcutaneously, 1–2x daily",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1 mg/mL.",
    category: "weight-loss",
    mechanism: [
      { title: "Beta-3 Adrenergic Receptor Agonism", body: "Fragment 176-191 activates beta-3 adrenergic receptors on adipocytes, activating hormone-sensitive lipase and triggering breakdown of stored triglycerides into free fatty acids for oxidation." },
      { title: "No GH Receptor Binding", body: "Unlike intact hGH, this fragment does not bind the GH receptor, producing no IGF-1 elevation, no glucose intolerance, and no growth promotion — isolating the lipolytic effect." }
    ],
    research_applications: [
      { area: "Fat Metabolism", evidence: "Moderate", description: "Animal and in vitro studies confirm selective lipolytic activity. Clinical evidence for significant fat loss in humans is limited, with modestly less data than AOD-9604." }
    ],
    dosage: {
      disclaimer: "hGH Fragment 176-191 is a research compound. Protocols are derived from animal studies and anecdotal data. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "500 mcg – 1 mg", frequency: "1–2x daily (fasted)", notes: "Inject in the morning on an empty stomach or pre-workout. Some protocols use 500 mcg 2–3x daily for enhanced effect." }
      ]
    },
    safety_profile: {
      rating: "Generally Well Tolerated",
      known_effects: ["Injection site reactions", "Mild headache", "Fatigue (infrequent)"],
      unknown_risks: ["Limited long-term human data", "Effects in diabetic or insulin-resistant populations require study", "Interaction with thyroid and adrenal function is not characterized"]
    },
    studies: [
      { title: "Growth hormone-lipolytic activity resides in its C-terminal domain", authors: "Ng FM, et al.", year: 1990, journal: "FEBS Letters", pmid: "2390529", url: "https://pubmed.ncbi.nlm.nih.gov/2390529/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/2390529/"]
  },

  {
    name: "Tirzepatide",
    full_name: "Tirzepatide (GLP-1/GIP Dual Agonist)",
    slug: "tirzepatide",
    tagline: "FDA-approved dual GLP-1 and GIP receptor agonist (Mounjaro/Zepbound) achieving up to 22% body weight reduction — the most effective pharmacological weight loss agent yet studied.",
    aliases: ["Mounjaro", "Zepbound", "LY3298176"],
    fda_status: "approved",
    research_status: "Strong",
    half_life: "~5 days (weekly dosing)",
    molecular_weight: "4813.5 g/mol",
    sequence: "Modified GLP-1/GIP hybrid peptide with C20 fatty diacid conjugation for albumin binding",
    overview: "Tirzepatide is a synthetic 39-amino-acid peptide that is the first-in-class dual agonist of both the GLP-1 (glucagon-like peptide-1) and GIP (glucose-dependent insulinotropic polypeptide) receptors. FDA-approved as Mounjaro (2022) for type 2 diabetes and Zepbound (2023) for chronic weight management. In the SURMOUNT trials, tirzepatide 15 mg produced mean body weight reduction of ~22.5% — surpassing semaglutide and approaching the efficacy of bariatric surgery. Its dual mechanism activates both incretin pathways synergistically, with GIP agonism potentially enhancing fat cell lipolysis and reducing GLP-1-mediated nausea. Research peptide versions are not FDA-approved pharmaceutical tirzepatide.",
    description: "FDA-approved dual GLP-1/GIP agonist achieving up to 22% weight loss — most effective pharmacological weight loss agent in clinical history.",
    typical_dosage: "2.5 mg weekly (starting); titrate to 5–15 mg weekly",
    reconstitution_instructions: "FDA-approved versions are pre-filled pens. Research peptide: reconstitute with bacteriostatic water at 2–5 mg/mL. Titrate slowly.",
    category: "weight-loss",
    mechanism: [
      { title: "Dual GLP-1 and GIP Receptor Agonism", body: "Tirzepatide activates both GLP-1R and GIPR with comparable potency. GLP-1R activation suppresses appetite and slows gastric emptying; GIPR activation on adipocytes and brain neurons may enhance fat lipolysis, improve insulin sensitivity, and reduce the nausea associated with pure GLP-1 agonists." },
      { title: "Synergistic Incretin Effects", body: "Co-activation of both incretin receptors produces greater metabolic benefits than either agonist alone. GIP potentiates GLP-1-mediated insulin secretion while contributing independently to appetite regulation and adipose tissue metabolism." },
      { title: "Central Appetite Suppression", body: "Like semaglutide, tirzepatide acts on hypothalamic and brainstem receptors to reduce food intake, increase satiety, and alter food preferences — contributing to the dramatic weight loss seen in SURMOUNT trials." }
    ],
    research_applications: [
      { area: "Type 2 Diabetes", evidence: "Strong", description: "FDA-approved (Mounjaro). SURPASS trials demonstrated HbA1c reductions of 1.9–2.6% and 15–21% weight reduction — superior to all approved comparators including semaglutide." },
      { area: "Chronic Weight Management", evidence: "Strong", description: "FDA-approved (Zepbound). SURMOUNT-1 trial: tirzepatide 15 mg produced 22.5% mean weight reduction at 72 weeks in non-diabetic obese adults — surpassing all prior pharmacological interventions." },
      { area: "Heart Failure with Preserved EF", evidence: "Strong", description: "SUMMIT trial demonstrated tirzepatide significantly improved exercise capacity and quality of life in HFpEF patients with obesity — a first pharmacological breakthrough for this condition." },
      { area: "Sleep Apnea", evidence: "Strong", description: "SURMOUNT-OSA trial demonstrated ~62% reduction in apnea-hypopnea index with tirzepatide in obese patients with moderate-to-severe OSA." }
    ],
    dosage: {
      disclaimer: "FDA-approved tirzepatide (Mounjaro/Zepbound) must be prescribed by a physician. Research peptide tirzepatide is NOT the same as pharmaceutical tirzepatide and is not FDA-approved. Always consult a physician.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "2.5 mg → 15 mg", frequency: "Once weekly", notes: "Start at 2.5 mg/week for 4 weeks, then 5 mg, 7.5 mg, 10 mg, 12.5 mg, 15 mg — 4 weeks at each step. Maximum dose 15 mg/week. Slow titration is critical to minimize GI side effects." }
      ]
    },
    safety_profile: {
      rating: "Well Characterized (FDA-Approved)",
      known_effects: ["Nausea (common at initiation, typically resolves)", "Vomiting", "Diarrhea", "Constipation", "Injection site reactions", "Decreased appetite", "Fatigue at initiation", "Gallstones"],
      unknown_risks: ["Thyroid C-cell tumors (black box warning — murine data, not confirmed in humans)", "Pancreatitis (rare)", "Muscle mass loss with aggressive weight loss", "Long-term effects beyond 3-year trials", "Rebound weight gain after discontinuation"]
    },
    studies: [
      { title: "Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes (SURPASS-2)", authors: "Frías JP, et al.", year: 2021, journal: "New England Journal of Medicine", pmid: "34170647", url: "https://pubmed.ncbi.nlm.nih.gov/34170647/" },
      { title: "Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1)", authors: "Jastreboff AM, et al.", year: 2022, journal: "New England Journal of Medicine", pmid: "35658024", url: "https://pubmed.ncbi.nlm.nih.gov/35658024/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/34170647/", "https://pubmed.ncbi.nlm.nih.gov/35658024/"]
  },

  {
    name: "Retatrutide",
    full_name: "Retatrutide (GLP-1/GIP/Glucagon Triple Agonist)",
    slug: "retatrutide",
    tagline: "The first triple incretin agonist (GLP-1/GIP/Glucagon) in late-stage trials — Phase II data shows ~24% weight reduction, potentially surpassing tirzepatide.",
    aliases: ["LY3437943", "Triple G agonist"],
    fda_status: "research-only",
    research_status: "Strong",
    half_life: "~6 days (weekly dosing)",
    molecular_weight: "~5000 g/mol (estimated)",
    sequence: "Proprietary Eli Lilly sequence — modified GLP-1/GIP/GCG hybrid with fatty acid conjugation",
    overview: "Retatrutide (LY3437943) is a first-in-class triagonist simultaneously activating GLP-1, GIP, and glucagon receptors. Adding glucagon receptor agonism to the dual GLP-1/GIP mechanism of tirzepatide theoretically enhances energy expenditure (via glucagon's thermogenic and lipolytic effects) while maintaining GLP-1-mediated appetite suppression and GIP-mediated insulin sensitization. Phase II results (NEJM, 2023) showed 24.2% mean body weight reduction at 48 weeks — the largest pharmacological weight loss ever reported in a clinical trial. Phase III trials are ongoing. Not yet FDA-approved.",
    description: "First triple incretin agonist in Phase III trials. Phase II data: 24% mean weight loss — highest pharmacological efficacy on record.",
    typical_dosage: "Not established — Phase III ongoing",
    reconstitution_instructions: "Research peptide: reconstitute with bacteriostatic water. Precise dosing is critical given potency.",
    category: "weight-loss",
    mechanism: [
      { title: "Triple Incretin Receptor Agonism", body: "Retatrutide combines GLP-1R agonism (appetite suppression, glucose control), GIPR agonism (fat lipolysis, insulin sensitization), and GCGR agonism (thermogenesis, hepatic fat reduction, energy expenditure). The glucagon component adds a metabolic axis not present in semaglutide or tirzepatide." },
      { title: "Enhanced Energy Expenditure", body: "Glucagon receptor activation increases basal metabolic rate and thermogenesis — an advantage over GLP-1-only or GLP-1/GIP agents, which primarily reduce caloric intake without substantially increasing energy expenditure." }
    ],
    research_applications: [
      { area: "Obesity / Weight Management", evidence: "Human", description: "Phase II trial (NEJM 2023, n=338): retatrutide 12 mg produced 24.2% body weight reduction at 48 weeks — exceeding all prior pharmacological data. Phase III trials ongoing." },
      { area: "Type 2 Diabetes", evidence: "Moderate", description: "Phase II data show significant HbA1c reduction alongside weight loss, with Phase III diabetes trials ongoing." },
      { area: "Metabolic-Associated Fatty Liver Disease", evidence: "Early", description: "Glucagon receptor agonism reduces hepatic fat; Phase II liver imaging data show significant steatosis reduction." }
    ],
    dosage: {
      disclaimer: "Retatrutide is NOT FDA-approved and is in Phase III clinical trials. Research peptide retatrutide is not equivalent to pharmaceutical-grade material. This is emerging research. Not medical advice.",
      ranges: [
        { route: "Subcutaneous (Weekly)", range: "1–12 mg (Phase II protocol)", frequency: "Once weekly", notes: "Phase II used a titration protocol from 1 mg to a maximum of 12 mg over several weeks. Titrate extremely slowly — potency exceeds tirzepatide." }
      ]
    },
    safety_profile: {
      rating: "Emerging Safety Profile (Phase III)",
      known_effects: ["Nausea and vomiting (common at initiation)", "Diarrhea", "Tachycardia (from glucagon receptor activity)", "Decreased appetite", "Injection site reactions"],
      unknown_risks: ["Tachycardia risk from glucagon agonism requires cardiac monitoring", "Bone density effects not fully characterized (glucagon effects on bone)", "Long-term oncologic safety not established", "Phase III safety profile not yet complete"]
    },
    studies: [
      { title: "Retatrutide, a GIP, GLP-1 and glucagon receptor agonist, for people with type 2 diabetes (Phase 2)", authors: "Rosenstock J, et al.", year: 2023, journal: "Lancet", pmid: "37385275", url: "https://pubmed.ncbi.nlm.nih.gov/37385275/" },
      { title: "Retatrutide Phase 2 obesity trial with 24% weight loss", authors: "Jastreboff AM, et al.", year: 2023, journal: "New England Journal of Medicine", pmid: "37345879", url: "https://pubmed.ncbi.nlm.nih.gov/37345879/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/37345879/"]
  },

  {
    name: "CJC-1295 DAC",
    full_name: "CJC-1295 With Drug Affinity Complex (DAC)",
    slug: "cjc-1295-dac",
    tagline: "A long-acting GHRH analog that binds albumin for a ~8-day half-life — providing sustained GH elevation distinct from the pulsatile effect of CJC-1295 (no DAC).",
    aliases: ["CJC-1295 with DAC", "DAC:GRF", "CJC-1295 DAC"],
    fda_status: "research-only",
    research_status: "Moderate",
    half_life: "~6–8 days",
    molecular_weight: "3647.3 g/mol",
    sequence: "Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg-Lys(maleimidopropionate)-NH2",
    overview: "CJC-1295 with DAC (Drug Affinity Complex) is a GHRH analog that incorporates a lysine-maleimide DAC modification allowing covalent binding to circulating albumin. This binding extends its half-life to approximately 6–8 days, enabling once- or twice-weekly dosing. Unlike CJC-1295 without DAC (which produces pulsatile GH release when combined with a GHRP), CJC-1295 DAC produces sustained, elevated GH and IGF-1 levels throughout the week — a 'GH bleed' rather than discrete pulses. This distinction is important: continuous GH elevation mimics the pharmacology of exogenous GH more than physiological GH secretion, raising questions about receptor desensitization and differing risk profiles.",
    description: "Long-acting GHRH analog with albumin-binding DAC modification producing sustained weekly GH and IGF-1 elevation.",
    typical_dosage: "1–2 mg once or twice weekly subcutaneously",
    reconstitution_instructions: "Reconstitute with bacteriostatic water. Typical concentration: 1–2 mg/mL.",
    category: "performance",
    mechanism: [
      { title: "Albumin-Bound Long-Acting GHRH Agonism", body: "The DAC (maleimide-lysine) modification reacts with Cys34 of albumin, forming a stable covalent bond. Albumin-bound CJC-1295 circulates for days, continuously activating pituitary GHRH receptors and maintaining elevated GH/IGF-1 levels." },
      { title: "Sustained vs. Pulsatile GH Elevation", body: "CJC-1295 DAC produces a continuous 'GH bleed' rather than physiological pulses. This distincts its pharmacology from CJC-1295 (no DAC) + GHRP combinations, which better mimic natural GH pulsatility." }
    ],
    research_applications: [
      { area: "GH and IGF-1 Elevation", evidence: "Human", description: "Clinical studies confirm CJC-1295 DAC produces sustained GH and IGF-1 elevation for up to 14 days after a single injection, with dose-dependent magnitude." },
      { area: "Body Composition", evidence: "Moderate", description: "Sustained GH/IGF-1 elevation supports lean mass and fat metabolism, though the non-pulsatile pattern may produce more side effects (water retention, insulin resistance) than pulsatile protocols." }
    ],
    dosage: {
      disclaimer: "CJC-1295 DAC produces continuous GH elevation that differs fundamentally from physiological GH pulsatility. IGF-1 elevation and associated risks require consideration. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "1–2 mg", frequency: "Once weekly or every 2 weeks", notes: "Unlike CJC-1295 (no DAC), does not need to be paired with a GHRP. Once-weekly dosing produces sustained IGF-1 elevation. Some protocols use 2 mg biweekly." }
      ]
    },
    safety_profile: {
      rating: "Moderate Caution Required",
      known_effects: ["Water retention (often significant)", "Insulin resistance from sustained GH elevation", "Carpal tunnel syndrome at higher doses", "Numbness/tingling", "Fatigue"],
      unknown_risks: ["GHRH receptor desensitization with continuous stimulation", "Sustained IGF-1 elevation and cancer risk with long-term use", "Cardiovascular effects of chronic supra-physiological GH", "Long-term HPA axis effects"]
    },
    studies: [
      { title: "A long-acting version of CJC-1295 stimulates GH and IGF-1 secretion for extended periods", authors: "Jetté L, et al.", year: 2005, journal: "Journal of Clinical Endocrinology & Metabolism", pmid: "15899949", url: "https://pubmed.ncbi.nlm.nih.gov/15899949/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/15899949/"]
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
