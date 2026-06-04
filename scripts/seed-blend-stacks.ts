/**
 * scripts/seed-blend-stacks.ts
 * Seeds generic GH secretagogue and healing blend profiles.
 * Slugs are chosen to match vendor product name slugs (after HTML entity fix + stripSizeSuffix).
 *
 * Run: npm run seed:blend-stacks
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-blend-stacks";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const BLENDS = [

  // ────────────────────────────────────────────────────────────────────────
  // GH Secretagogue Stacks
  // ────────────────────────────────────────────────────────────────────────

  {
    name: "CJC-1295 + Ipamorelin",
    full_name: "CJC-1295 / Ipamorelin Blend",
    slug: "cjc-1295-ipamorelin-blend",
    tagline: "The most widely used GH secretagogue stack — CJC-1295 extends GH release duration while Ipamorelin provides a clean, selective GH pulse without cortisol or prolactin elevation.",
    aliases: ["CJC Ipamorelin", "CJC/Ipa blend", "CJC + Ipa"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "CJC-1295 + Ipamorelin is the most commonly sold GH secretagogue stack in the research peptide market. CJC-1295 (either the DAC or No DAC form) acts on the GHRH receptor, extending the duration of GH release. Ipamorelin acts on the ghrelin/GHS receptor to provide a selective GH pulse that does not significantly raise cortisol or prolactin — a key advantage over GHRP-2 and GHRP-6. Together, they produce synergistic GH release: CJC-1295 provides the permissive elevated baseline and Ipamorelin triggers the pulse. The combination is favored in anti-aging, body recomposition, recovery, and sleep quality protocols.",
    description: "The standard GH secretagogue stack. CJC-1295 elevates baseline GH release; Ipamorelin adds a clean selective pulse. Widely used for recovery, body composition, and anti-aging.",
    typical_dosage: "100–300 mcg each, subcutaneous injection",
    reconstitution_instructions: "Reconstitute each peptide separately with bacteriostatic water, or use a pre-mixed vendor vial. Store refrigerated.",
    blend_components: [
      {
        name: "CJC-1295",
        slug: "cjc-1295",
        dose_mg: 0.1,
        contribution: "GHRH receptor agonist — extends duration of GH release and raises baseline GH levels. DAC form provides multi-day action; No DAC form has shorter half-life requiring more frequent dosing.",
      },
      {
        name: "Ipamorelin",
        slug: "ipamorelin",
        dose_mg: 0.1,
        contribution: "Selective GHS-R agonist — triggers a clean GH pulse without significant cortisol or prolactin elevation. Synergizes with CJC-1295 for amplified total GH release.",
      },
    ],
    mechanism: [
      { title: "Dual-Receptor GH Stimulation", body: "CJC-1295 activates the GHRH receptor on somatotroph cells, potentiating GH synthesis and release. Ipamorelin activates the GHS-R1a receptor via a separate pathway. The two signals converge to produce GH release greater than either alone — a well-characterized synergistic effect." },
      { title: "Clean Hormonal Profile", body: "Unlike GHRP-2 and GHRP-6, Ipamorelin does not significantly stimulate cortisol or prolactin at typical doses. This makes the CJC/Ipamorelin stack the preferred choice for extended protocols where stress hormone elevation would be undesirable." },
    ],
    research_applications: [
      { area: "Body Composition and Recovery", evidence: "Moderate", description: "GH elevation drives IGF-1 production, promoting lipolysis, lean muscle maintenance, and recovery from training or injury. CJC/Ipamorelin is the most commonly used protocol for these applications in research." },
      { area: "Anti-Aging and Sleep Quality", evidence: "Early", description: "Nocturnal GH pulsatility declines with age. CJC/Ipamorelin administered before sleep restores GH pulse amplitude and is associated with improved deep sleep in preclinical and anecdotal reports." },
    ],
    dosage: {
      disclaimer: "CJC-1295 + Ipamorelin is a research-only combination. GH axis manipulation carries risks including acromegaly with chronic high-dose use. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "100–300 mcg each", frequency: "1–3x daily; pre-sleep dosing common", notes: "Inject on an empty stomach or 2+ hours after meals for optimal GH response. Most protocols use once daily before sleep." },
      ],
    },
    safety_profile: {
      rating: "Moderate — Established Research Profile",
      known_effects: ["Increased appetite (mild)", "Water retention", "Tingling/numbness (carpal tunnel-like)", "Elevated IGF-1"],
      unknown_risks: ["Long-term GH axis effects not characterized in research populations", "Potential for insulin resistance with chronic elevated GH/IGF-1", "Cancer risk with sustained IGF-1 elevation is theoretically relevant"],
    },
    studies: [
      { title: "Ipamorelin, the first selective growth hormone secretagogue", authors: "Raun K, et al.", year: 1998, journal: "European Journal of Endocrinology", pmid: "9849822", url: "https://pubmed.ncbi.nlm.nih.gov/9849822/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/9849822/"],
  },

  {
    name: "CJC-1295 + GHRP-2",
    full_name: "CJC-1295 / GHRP-2 Blend",
    slug: "cjc-1295-ghrp-2-blend",
    tagline: "A potent GH secretagogue stack pairing CJC-1295's GHRH action with GHRP-2's strong GHS-R agonism — more GH output than CJC/Ipamorelin, but with greater cortisol and prolactin elevation.",
    aliases: ["CJC GHRP-2", "CJC/GHRP2 blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "CJC-1295 + GHRP-2 is a high-output GH secretagogue stack. GHRP-2 is one of the most potent GHS-R1a agonists available, producing substantially higher GH pulses than Ipamorelin. However, GHRP-2 also elevates cortisol and prolactin more significantly, which limits suitability for extended protocols. The CJC/GHRP-2 combination is often used when maximal GH stimulation is the priority — such as post-injury recovery, during cuts, or in short-term research protocols. It is considered the higher-intensity alternative to CJC/Ipamorelin.",
    description: "High-output GH stack. GHRP-2 produces stronger GH pulses than Ipamorelin but with more cortisol/prolactin elevation. Used when maximal GH stimulation is the goal.",
    typical_dosage: "100–300 mcg each, subcutaneous injection",
    reconstitution_instructions: "Reconstitute separately or use pre-mixed vial. Store refrigerated.",
    blend_components: [
      {
        name: "CJC-1295",
        slug: "cjc-1295",
        dose_mg: 0.1,
        contribution: "GHRH receptor agonist — establishes elevated GH baseline and synergizes with GHRP-2 for amplified GH release.",
      },
      {
        name: "GHRP-2",
        slug: "ghrp-2",
        dose_mg: 0.1,
        contribution: "Potent GHS-R1a agonist — triggers strong GH pulses. Greater GH output than Ipamorelin but also elevates cortisol and prolactin at higher doses.",
      },
    ],
    mechanism: [
      { title: "High-Amplitude GH Pulsatility", body: "GHRP-2 is among the most potent GHS-R agonists, generating larger GH pulses than Ipamorelin. Combined with CJC-1295's GHRH pathway activation, the result is markedly amplified GH secretion suitable for intensive recovery or body composition protocols." },
    ],
    research_applications: [
      { area: "Maximal GH Stimulation", evidence: "Moderate", description: "Used when GH output is prioritized over hormonal selectivity. Short-term intensive recovery protocols, cutting phases, or situations where the slightly higher cortisol is acceptable." },
    ],
    dosage: {
      disclaimer: "CJC-1295 + GHRP-2 stimulates cortisol and prolactin more than the Ipamorelin equivalent. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "100–300 mcg each", frequency: "2–3x daily or pre-sleep", notes: "Inject fasted. Higher doses increase GH but also cortisol/prolactin side effects more than Ipamorelin-based stacks." },
      ],
    },
    safety_profile: {
      rating: "Moderate — Established Profile with Known Side Effects",
      known_effects: ["Increased hunger (pronounced)", "Cortisol elevation", "Prolactin elevation", "Water retention", "Tingling/numbness"],
      unknown_risks: ["Long-term HPA axis effects with chronic cortisol elevation", "Sustained IGF-1/GH effects"],
    },
    studies: [
      { title: "Growth hormone-releasing peptide-2 stimulates GH secretion in GH-deficient patients", authors: "Ghigo E, et al.", year: 1994, journal: "Clinical Endocrinology", pmid: "7955444", url: "https://pubmed.ncbi.nlm.nih.gov/7955444/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/7955444/"],
  },

  {
    name: "CJC-1295 + GHRP-6",
    full_name: "CJC-1295 / GHRP-6 Blend",
    slug: "cjc-1295-ghrp-6-blend",
    tagline: "CJC-1295 paired with GHRP-6 — similar GH potency to the GHRP-2 stack but with a more pronounced appetite-stimulating effect, making it popular in mass-gaining and recovery contexts.",
    aliases: ["CJC GHRP-6", "CJC/GHRP6 blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "CJC-1295 + GHRP-6 is a GH secretagogue combination used similarly to CJC/GHRP-2 but with one notable difference: GHRP-6 produces a significantly stronger appetite stimulus than GHRP-2 or Ipamorelin, making this stack particularly popular in bulking and mass-gaining protocols where increased caloric intake is desirable. GH output is comparable to CJC/GHRP-2. Cortisol elevation is present but generally less pronounced than with GHRP-2.",
    description: "GH secretagogue stack with strong appetite stimulation. Popular in bulking protocols where GHRP-6's hunger effect is an advantage.",
    typical_dosage: "100–300 mcg each, subcutaneous injection",
    reconstitution_instructions: "Reconstitute separately or use pre-mixed vial. Store refrigerated.",
    blend_components: [
      {
        name: "CJC-1295",
        slug: "cjc-1295",
        dose_mg: 0.1,
        contribution: "GHRH receptor agonist — elevates baseline GH, synergizes with GHRP-6 for amplified GH release.",
      },
      {
        name: "GHRP-6",
        slug: "ghrp-6",
        dose_mg: 0.1,
        contribution: "GHS-R1a agonist — strong GH pulse stimulant with pronounced appetite stimulation via ghrelin-like activity. Preferred over GHRP-2 when hunger/caloric intake increase is a goal.",
      },
    ],
    mechanism: [
      { title: "GH Stimulation with Ghrelin-Like Appetite Drive", body: "GHRP-6 closely mimics ghrelin's orexigenic (appetite-stimulating) activity in addition to its GH-releasing effects. This makes CJC/GHRP-6 the stack of choice for mass-gaining protocols where increased food intake is desired alongside GH stimulation." },
    ],
    research_applications: [
      { area: "Mass Gaining and Recovery", evidence: "Moderate", description: "The appetite-stimulating effect of GHRP-6 combined with GH axis activation makes this the preferred stack for research protocols targeting muscle gain and aggressive recovery." },
    ],
    dosage: {
      disclaimer: "CJC-1295 + GHRP-6 substantially increases appetite. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "100–300 mcg each", frequency: "2–3x daily, pre-meal or pre-sleep", notes: "The appetite effect of GHRP-6 is pronounced — dosing around meals is often preferred to leverage increased hunger." },
      ],
    },
    safety_profile: {
      rating: "Moderate — Similar Profile to Other GH Secretagogue Stacks",
      known_effects: ["Pronounced appetite increase", "Water retention", "Cortisol elevation (moderate)", "Tingling/numbness"],
      unknown_risks: ["Same long-term GH/IGF-1 risks as other GH secretagogue combinations"],
    },
    studies: [
      { title: "Growth hormone-releasing peptides", authors: "Bowers CY.", year: 1998, journal: "Journal of Pediatric Endocrinology and Metabolism", pmid: "9657455", url: "https://pubmed.ncbi.nlm.nih.gov/9657455/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/9657455/"],
  },

  {
    name: "Sermorelin + Ipamorelin",
    full_name: "Sermorelin / Ipamorelin Blend",
    slug: "sermorelin-ipamorelin-blend",
    tagline: "A gentler GH secretagogue stack using Sermorelin's shorter GHRH action with Ipamorelin's clean GH pulse — favored for anti-aging protocols and long-term use where a milder GH stimulus is preferred.",
    aliases: ["Sermorelin Ipamorelin", "Serm/Ipa blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "Sermorelin + Ipamorelin is positioned as a more conservative GH secretagogue stack relative to CJC-1295-based combinations. Sermorelin is a truncated GHRH analog (the first 29 amino acids of GHRH) with a shorter half-life than CJC-1295, producing GH release that more closely mimics natural physiological patterns. Combined with Ipamorelin's clean, selective GH pulse, this stack is popular for anti-aging protocols, long-term GH axis support, and users who prefer to avoid the sustained GH elevation associated with CJC-1295 DAC. It produces less GH output than CJC-1295-based stacks but is considered more physiologically gentle.",
    description: "Conservative GH secretagogue stack. Sermorelin's shorter action produces more physiological GH patterns; Ipamorelin adds a clean pulse. Preferred for long-term anti-aging protocols.",
    typical_dosage: "200–500 mcg each, subcutaneous injection",
    reconstitution_instructions: "Reconstitute separately or use pre-mixed vial. Store refrigerated.",
    blend_components: [
      {
        name: "Sermorelin",
        slug: "sermorelin",
        dose_mg: 0.2,
        contribution: "Truncated GHRH analog — shorter half-life than CJC-1295, producing more pulsatile, physiological GH release patterns. FDA-approved history (withdrawn for commercial reasons).",
      },
      {
        name: "Ipamorelin",
        slug: "ipamorelin",
        dose_mg: 0.1,
        contribution: "Selective GHS-R agonist — adds a clean GH pulse without cortisol or prolactin elevation. Synergizes with Sermorelin for combined dual-receptor GH stimulation.",
      },
    ],
    mechanism: [
      { title: "Physiological GH Pulsatility", body: "Sermorelin's shorter duration of action means GH pulses return to baseline faster than with CJC-1295, more closely mimicking natural GH pulsatility. For long-term anti-aging protocols, this is considered preferable to sustained GH elevation." },
    ],
    research_applications: [
      { area: "Anti-Aging and Long-Term GH Support", evidence: "Moderate", description: "Sermorelin has the longest research history of any GH secretagogue and was previously FDA-approved. Combined with Ipamorelin for additive GH stimulation, this stack is the most conservative option for extended protocols." },
    ],
    dosage: {
      disclaimer: "Sermorelin + Ipamorelin is a research compound combination. Not medical advice. Not FDA approved in this combined form.",
      ranges: [
        { route: "Subcutaneous injection", range: "200–500 mcg Sermorelin + 100–200 mcg Ipamorelin", frequency: "1–2x daily, pre-sleep preferred", notes: "Higher doses of Sermorelin needed relative to CJC-1295 due to shorter half-life. Pre-sleep dosing aligns with natural GH pulsatility." },
      ],
    },
    safety_profile: {
      rating: "Good — Best-Established Safety Profile Among GH Secretagogue Stacks",
      known_effects: ["Mild water retention", "Headache (occasional)", "Injection site reactions"],
      unknown_risks: ["Long-term combined GH/IGF-1 effects in non-deficient populations"],
    },
    studies: [
      { title: "Sermorelin: a better approach to management of adult-onset growth hormone insufficiency?", authors: "Walker RF.", year: 2006, journal: "Clinical Interventions in Aging", pmid: "18046878", url: "https://pubmed.ncbi.nlm.nih.gov/18046878/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/18046878/"],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Healing Stacks
  // ────────────────────────────────────────────────────────────────────────

  {
    name: "BPC-157 + TB-500",
    full_name: "BPC-157 / TB-500 Healing Stack",
    slug: "bpc-157-tb-500-blend",
    tagline: "The foundational healing peptide stack — BPC-157's local tissue repair and angiogenesis paired with TB-500's systemic anti-inflammatory and cell migration effects.",
    aliases: ["Wolverine (basic)", "BPC TB stack", "BPC + TB-500"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "BPC-157 + TB-500 is the core two-peptide healing stack — the foundation beneath GLOW, KLOW, and Wolverine blends. BPC-157 works locally: it drives angiogenesis, upregulates growth factors (VEGF, EGF), and repairs tendon, muscle, ligament, and gut tissue at the site of injury. TB-500 (Thymosin Beta-4) acts more systemically: it regulates actin polymerization, promotes cell migration, and exerts broad anti-inflammatory effects. The complementary mechanisms — local growth factor upregulation from BPC-157 + systemic cell mobilization from TB-500 — make this stack greater than either peptide alone for tissue repair applications.",
    description: "The foundational healing stack. BPC-157 handles local tissue repair and angiogenesis; TB-500 provides systemic anti-inflammatory and cell migration support.",
    typical_dosage: "BPC-157: 250–500 mcg; TB-500: 2.5–5 mg",
    reconstitution_instructions: "Reconstitute separately with bacteriostatic water. Some vendors supply as a pre-mixed vial; verify total dose per vial.",
    blend_components: [
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 0.5,
        contribution: "Local tissue repair: angiogenesis, growth factor upregulation, tendon-to-bone healing, nitric oxide modulation, gut protection.",
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 5,
        contribution: "Systemic healing: actin regulation, cell migration into repair zones, anti-inflammatory via thymosin beta-4 activity, flexibility improvement.",
      },
    ],
    mechanism: [
      { title: "Complementary Tissue Repair Mechanisms", body: "BPC-157 increases local vascularization and growth factor expression at the injury site, creating the conditions for repair. TB-500 mobilizes circulating cells (stem cells, progenitor cells, inflammatory cells) and reduces systemic inflammation, supporting the repair environment. Together they address both local and systemic aspects of healing." },
    ],
    research_applications: [
      { area: "Musculoskeletal Injury Recovery", evidence: "Moderate", description: "The most common indication. Both peptides have strong independent preclinical evidence for tendon, muscle, and ligament repair. The combination is additive or synergistic in animal models." },
      { area: "Gut Health and GI Repair", evidence: "Moderate", description: "BPC-157 has extensive evidence for intestinal healing; TB-500's role in GI indications is less studied. The stack is sometimes used for gut-healing protocols driven primarily by BPC-157." },
    ],
    dosage: {
      disclaimer: "BPC-157 + TB-500 is a research compound combination. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "250–500 mcg BPC-157 + 2.5–5 mg TB-500", frequency: "BPC-157 daily or 2x daily; TB-500 2x weekly", notes: "BPC-157 is often injected near the injury site; TB-500 is typically systemic (remote injection site). Dosing frequencies differ between the two compounds." },
      ],
    },
    safety_profile: {
      rating: "Good — Both Compounds Have Established Preclinical Safety Data",
      known_effects: ["Injection site reactions", "Mild nausea (BPC-157, occasional)", "Water retention (TB-500)"],
      unknown_risks: ["Long-term combination effects not characterized", "Angiogenic activity is a theoretical concern in oncology patients"],
    },
    studies: [
      { title: "Stable gastric pentadecapeptide BPC 157 in trials for inflammatory bowel disease", authors: "Seiwerth S, et al.", year: 2018, journal: "Current Pharmaceutical Design", pmid: "29773027", url: "https://pubmed.ncbi.nlm.nih.gov/29773027/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/29773027/"],
  },

  {
    name: "BPC-157 + TB-500 + GHK-Cu",
    full_name: "BPC-157 / TB-500 / GHK-Cu — Unbranded GLOW Stack",
    slug: "bpc-157-tb-500-ghk-cu-blend",
    tagline: "The three-peptide healing stack sold under many names — most commonly the GLOW blend. BPC-157 and TB-500 for structural tissue repair, GHK-Cu for collagen, skin, and wound healing.",
    aliases: ["GLOW blend (unbranded)", "BPC TB GHK stack", "healing trinity"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "BPC-157 + TB-500 + GHK-Cu is a three-peptide healing combination sold under various brand names by research vendors — most notably the GLOW blend. It extends the BPC-157/TB-500 foundation by adding GHK-Cu (copper peptide), which promotes collagen synthesis, wound healing, skin regeneration, and has antioxidant properties. GHK-Cu adds a collagen/connective tissue dimension not present in the two-peptide stack, making this combination popular for comprehensive soft tissue recovery, skin quality, and joint health protocols. Standard GLOW blend composition is GHK-Cu 50mg + TB-500 10mg + BPC-157 10mg (70mg total vial).",
    description: "Three-peptide healing stack — the formula behind the GLOW blend. Adds GHK-Cu collagen and skin repair to the BPC-157/TB-500 healing foundation.",
    typical_dosage: "Full 70mg vial per dose (GHK-Cu 50mg + TB-500 10mg + BPC-157 10mg)",
    reconstitution_instructions: "Pre-mixed by vendor in 70mg total vials (typically 8mL bacteriostatic water). Reconstitute per vendor instructions.",
    blend_components: [
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 10,
        contribution: "Angiogenesis, tendon-to-bone healing, growth factor upregulation, gut protection.",
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 10,
        contribution: "Systemic actin regulation, cell migration, anti-inflammatory effects.",
      },
      {
        name: "GHK-Cu",
        slug: "ghk-cu",
        dose_mg: 50,
        contribution: "Copper peptide: stimulates collagen and elastin synthesis, promotes wound healing, skin regeneration, and antioxidant activity. The differentiating component vs. the two-peptide BPC/TB stack.",
      },
    ],
    mechanism: [
      { title: "Complete Soft Tissue Matrix Repair", body: "The three components address complementary repair mechanisms: BPC-157 for vascularization and growth factor signaling, TB-500 for cell mobilization and systemic inflammation control, and GHK-Cu for extracellular matrix reconstruction via collagen and elastin upregulation. Together they cover vascularity, inflammation, cellular repair, and structural matrix rebuilding." },
    ],
    research_applications: [
      { area: "Comprehensive Soft Tissue Recovery", evidence: "Moderate", description: "The canonical indication for this combination. Used for injury recovery across tendons, ligaments, muscles, and skin. GHK-Cu's collagen synthesis adds a skin/scar quality benefit not present in BPC/TB alone." },
      { area: "Skin Quality and Anti-Aging", evidence: "Moderate", description: "Driven primarily by GHK-Cu, which has clinical evidence for skin thickness, wrinkle reduction, and wound healing. The full blend benefits skin beyond what either peptide alone provides." },
    ],
    dosage: {
      disclaimer: "This combination is sold in pre-mixed vials by research vendors. Verify composition and dosing on your specific vial's COA. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "Full 70mg vial", frequency: "1–2x weekly", notes: "Standard GLOW blend protocol. Some vendors offer 50mg vials (Diamond Glow) with different component ratios — check the COA." },
      ],
    },
    safety_profile: {
      rating: "Good — All Three Components Have Individual Safety Data",
      known_effects: ["Injection site reactions", "Water retention (TB-500)", "Temporary skin darkening possible (GHK-Cu at high doses)", "Nausea (BPC-157, rare)"],
      unknown_risks: ["Long-term combination effects not characterized", "High GHK-Cu doses may activate melanocytes — monitor if used long-term"],
    },
    studies: [
      { title: "GHK and GHK-Cu: biological actions and therapeutic uses", authors: "Pickart L, Margolina A.", year: 2018, journal: "Biomolecules", pmid: "29937492", url: "https://pubmed.ncbi.nlm.nih.gov/29937492/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/29937492/"],
  },

  {
    name: "Mod GRF 1-29 + Ipamorelin",
    full_name: "Mod GRF 1-29 (CJC-1295 No DAC) / Ipamorelin Blend",
    slug: "mod-grf-1-29-ipamorelin-blend",
    tagline: "Functionally equivalent to CJC-1295 (No DAC) + Ipamorelin — vendors use 'Mod GRF 1-29' as the alternative name for CJC-1295 without DAC in this short-acting GH secretagogue stack.",
    aliases: ["Mod GRF Ipamorelin", "Modified GRF Ipamorelin", "CJC No DAC Ipamorelin"],
    fda_status: "research-only",
    research_status: "Moderate",
    category: "blend",
    overview: "Mod GRF 1-29 + Ipamorelin is sold under this name by vendors who use 'Modified GRF 1-29' as the preferred scientific name for CJC-1295 without the Drug Affinity Complex (DAC). Mod GRF 1-29 is identical in amino acid sequence to CJC-1295 No DAC — the short-acting GHRH analog with a half-life of approximately 30 minutes. The combination works identically to CJC-1295 (No DAC) + Ipamorelin: dual GHRH/GHS-R receptor stimulation producing synergistic GH release. More frequent dosing is required vs. CJC-1295 DAC variants due to the shorter half-life.",
    description: "The same stack as CJC-1295 (No DAC) + Ipamorelin — 'Mod GRF 1-29' is the scientific name for CJC-1295 without DAC. Short-acting, requiring more frequent dosing.",
    typical_dosage: "100 mcg each, subcutaneous injection",
    reconstitution_instructions: "Reconstitute separately or use pre-mixed vial. Administer within 30 minutes of desired GH effect due to short half-life.",
    blend_components: [
      {
        name: "CJC-1295 (No DAC)",
        slug: "cjc-1295-no-dac",
        dose_mg: 0.1,
        contribution: "Short-acting GHRH analog (Mod GRF 1-29). Activates GHRH receptor for synergistic GH release. 30-minute half-life requires 2–3x daily dosing for sustained effect.",
      },
      {
        name: "Ipamorelin",
        slug: "ipamorelin",
        dose_mg: 0.1,
        contribution: "Selective GHS-R1a agonist — clean GH pulse without cortisol or prolactin elevation. Synergizes with Mod GRF 1-29 for amplified GH release.",
      },
    ],
    mechanism: [
      { title: "Pulsatile GH Stimulation via Dual Receptor Activation", body: "Mod GRF 1-29's short half-life means GH pulses return to baseline within 1–2 hours of injection, producing discrete pulses rather than the sustained GH elevation of DAC-containing variants. This pulsatile pattern more closely mimics physiological GH secretion." },
    ],
    research_applications: [
      { area: "GH Axis Stimulation with Pulsatile Pattern", evidence: "Moderate", description: "Preferred over CJC-1295 DAC by researchers who want physiological GH pulse patterns. Requires 2–3x daily injections for equivalent total GH stimulation to a once-daily DAC formulation." },
    ],
    dosage: {
      disclaimer: "Mod GRF 1-29 = CJC-1295 No DAC. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous injection", range: "100 mcg each", frequency: "2–3x daily, fasted", notes: "Short half-life requires multiple daily doses. Pre-sleep + pre-workout + morning are typical timing points." },
      ],
    },
    safety_profile: {
      rating: "Good — Same Profile as CJC-1295 No DAC + Ipamorelin",
      known_effects: ["Mild water retention", "Tingling/numbness", "Appetite increase (mild)"],
      unknown_risks: ["Long-term GH axis effects with sustained use"],
    },
    studies: [
      { title: "Ipamorelin, the first selective growth hormone secretagogue", authors: "Raun K, et al.", year: 1998, journal: "European Journal of Endocrinology", pmid: "9849822", url: "https://pubmed.ncbi.nlm.nih.gov/9849822/" },
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/9849822/"],
  },

];

async function main() {
  log(`Seeding ${BLENDS.length} blend stack profiles…`);

  for (const blend of BLENDS) {
    const { error } = await db.from("peptides").upsert(blend, { onConflict: "slug" });
    if (error) {
      log(`ERROR seeding ${blend.name}: ${error.message}`);
    } else {
      log(`✓ ${blend.name} (${blend.slug})`);
    }
  }

  log("Done.");
}

main();
