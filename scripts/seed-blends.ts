/**
 * scripts/seed-blends.ts
 * Seeds proprietary-name blend profiles — compounds with brand names that
 * don't make their ingredients obvious (GLOW, KLOW, Wolverine-Cu, etc.).
 * Safe to re-run — upserts on slug.
 *
 * Run: npm run seed:blends
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-blends";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const BLENDS = [

  {
    name: "GLOW Blend",
    full_name: "GLOW — GHK-Cu / TB-500 / BPC-157",
    slug: "glow-blend",
    tagline: "A three-peptide healing stack combining GHK-Cu's skin and collagen repair with TB-500's anti-inflammatory tissue healing and BPC-157's regenerative effects.",
    aliases: ["GLOW", "Glow Stack", "Glow Peptide Blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    overview: "GLOW is a proprietary-name peptide blend sold by multiple vendors, typically formulated as GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg) for a 70mg total vial. The name is a vendor marketing designation — the compound list makes the rationale clear: GHK-Cu drives collagen and elastin synthesis, TB-500 reduces inflammation and promotes cell migration, and BPC-157 provides systemic tissue repair signaling. Together they are marketed as a skin rejuvenation, wound healing, and connective tissue recovery stack. Exact formulations vary by vendor — the 70mg and 50mg ('GLOW 50') versions differ in GHK-Cu dose. Always verify COAs for your specific batch.",
    description: "Proprietary blend of GHK-Cu + TB-500 + BPC-157. Marketed for skin rejuvenation, collagen synthesis, and connective tissue healing.",
    category: "blend",
    blend_components: [
      {
        name: "GHK-Cu",
        slug: "ghk-cu",
        dose_mg: 50,
        contribution: "Drives collagen and elastin synthesis, modulates gene expression toward repair and regeneration, promotes angiogenesis and wound contraction."
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 10,
        contribution: "Reduces inflammation, promotes cell migration and wound closure via actin regulation, supports systemic tissue healing and flexibility."
      },
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 10,
        contribution: "Stimulates angiogenesis, upregulates growth factors, promotes tendon-to-bone healing and gastrointestinal repair via nitric oxide modulation."
      }
    ],
    mechanism: [
      { title: "Synergistic Tissue Repair", body: "Each component targets a distinct phase of tissue repair: BPC-157 initiates angiogenesis and growth factor cascades; TB-500 drives cell migration and inflammation resolution; GHK-Cu remodels extracellular matrix and restores structural proteins. Used together, they are hypothesized to address repair more comprehensively than any single agent." },
      { title: "Collagen and Extracellular Matrix Remodeling", body: "GHK-Cu is the dominant driver of collagen synthesis in this blend, upregulating type I collagen, decorin, and elastin gene expression. TB-500 and BPC-157 support the vascular infrastructure needed to deliver nutrients to remodeling tissue." }
    ],
    research_applications: [
      { area: "Skin Rejuvenation & Anti-Aging", evidence: "Moderate", description: "GHK-Cu's well-documented skin benefits form the basis of GLOW's marketing. Combined with BPC-157's regenerative signaling, the stack is used by researchers investigating photoaging and wound-induced skin repair." },
      { area: "Connective Tissue Healing", evidence: "Moderate", description: "All three components have evidence for accelerating tendon, ligament, and muscle repair in animal models. Combination use is anecdotally popular in sports medicine research settings." },
      { area: "Wound Healing", evidence: "Moderate", description: "TB-500 and BPC-157 both independently accelerate wound closure in preclinical models. GHK-Cu adds matrix remodeling and reduces scarring. The combination targets multiple healing pathways simultaneously." }
    ],
    dosage: {
      disclaimer: "GLOW is a multi-peptide research blend. All components are research-only. Formulations vary by vendor — confirm exact doses from the COA. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (70mg)", frequency: "1–2x weekly", notes: "Vendor protocols vary. Some use daily injection during a loading phase. Reconstitute the full vial per vendor instructions and dose accordingly. Always verify COA." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Injection site reactions", "Mild water retention (TB-500)", "Skin hyperpigmentation possible (GHK-Cu topically; less common injectable)", "Nausea (rare)"],
      unknown_risks: ["Safety of chronic combination use is not characterized in clinical research", "Angiogenic effects from combined BPC-157 + GHK-Cu in oncology patients are a concern", "Batch quality and sterility vary significantly between vendors — verify COA"]
    },
    studies: [
      { title: "GHK-Cu modulates multiple cellular pathways in skin regeneration", authors: "Pickart L, et al.", year: 2015, journal: "BioMed Research International", pmid: "26065009", url: "https://pubmed.ncbi.nlm.nih.gov/26065009/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/26065009/"]
  },

  {
    name: "Diamond Glow",
    full_name: "Diamond Glow — GHK-Cu / TB-500 / BPC-157",
    slug: "diamond-glow",
    tagline: "A vendor-branded name for the GLOW formulation — GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg) in a 70mg vial.",
    aliases: ["Diamond Glow 70mg"],
    fda_status: "research-only",
    research_status: "Moderate",
    overview: "Diamond Glow is a vendor-specific brand name for the standard GLOW peptide blend: GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg). The formulation and rationale are identical to GLOW — the name is a product differentiation choice by the vendor. See the GLOW Blend profile for complete mechanism, research, and dosage information.",
    description: "Vendor brand name for the GLOW blend — GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg). Same formulation as GLOW.",
    category: "blend",
    blend_components: [
      { name: "GHK-Cu", slug: "ghk-cu", dose_mg: 50, contribution: "Collagen synthesis, extracellular matrix remodeling, wound healing gene regulation." },
      { name: "TB-500", slug: "tb-500", dose_mg: 10, contribution: "Anti-inflammatory, cell migration, systemic tissue repair via actin modulation." },
      { name: "BPC-157", slug: "bpc-157", dose_mg: 10, contribution: "Angiogenesis, growth factor upregulation, tendon and GI healing." }
    ],
    mechanism: [
      { title: "Same Mechanism as GLOW Blend", body: "Diamond Glow uses the same three-component formula as GLOW. Refer to the GLOW Blend profile for full mechanism details on GHK-Cu, TB-500, and BPC-157." }
    ],
    research_applications: [
      { area: "Skin Rejuvenation & Connective Tissue Healing", evidence: "Moderate", description: "Same applications as GLOW Blend. See GLOW profile for full details." }
    ],
    dosage: {
      disclaimer: "Same formulation as GLOW Blend. See GLOW profile for dosage notes. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (70mg)", frequency: "1–2x weekly", notes: "See GLOW Blend profile for detailed protocols." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Same as GLOW Blend — see full profile"],
      unknown_risks: ["Same as GLOW Blend — see full profile", "Verify vendor COA for batch-specific quality"]
    },
    studies: [],
    research_links: []
  },

  {
    name: "KLOW Blend",
    full_name: "KLOW — GHK-Cu / KPV / TB-500 / BPC-157",
    slug: "klow-blend",
    tagline: "A four-peptide healing stack that adds KPV's targeted anti-inflammatory action to the GLOW formula — designed for inflammation-driven conditions.",
    aliases: ["KLOW", "KLOW Stack", "KLOW Peptide Blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    overview: "KLOW is GLOW plus KPV — the four-peptide formulation typically contains GHK-Cu (50mg) + KPV (10mg) + TB-500 (10mg) + BPC-157 (10mg) for 80mg total. KPV (Lys-Pro-Val) is a tripeptide fragment of alpha-MSH with potent NF-κB inhibitory activity — it adds targeted anti-inflammatory modulation to the repair-focused GLOW stack. KLOW is marketed toward conditions with a stronger inflammatory component, such as inflammatory bowel disease, autoimmune flares, joint inflammation, and post-surgical recovery. The 'K' in KLOW is understood to represent KPV, though vendor naming conventions vary.",
    description: "GLOW plus KPV — four-peptide blend adding NF-κB anti-inflammatory activity to the GHK-Cu/TB-500/BPC-157 healing stack.",
    category: "blend",
    blend_components: [
      {
        name: "GHK-Cu",
        slug: "ghk-cu",
        dose_mg: 50,
        contribution: "Drives collagen and elastin synthesis, regulates gene expression toward tissue repair, promotes angiogenesis and wound contraction."
      },
      {
        name: "KPV",
        slug: "kpv",
        dose_mg: 10,
        contribution: "Inhibits NF-κB signaling to reduce inflammatory cytokine production (TNF-α, IL-6, IL-1β). Protects intestinal epithelial barrier. The differentiating component vs. GLOW."
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 10,
        contribution: "Reduces inflammation, promotes cell migration via actin regulation, supports systemic tissue healing."
      },
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 10,
        contribution: "Angiogenesis, growth factor upregulation, tendon-to-bone healing, gastrointestinal repair."
      }
    ],
    mechanism: [
      { title: "Enhanced Anti-Inflammatory Action via KPV", body: "KPV's NF-κB inhibition adds a molecular brake on inflammatory signaling not present in GLOW. This is particularly relevant for conditions where inflammation is the primary driver of tissue damage — IBD, autoimmune arthritis, and chronic wound environments with high TNF-α." },
      { title: "Multi-Layer Tissue Repair", body: "KLOW addresses tissue repair across four pathways: inflammatory resolution (KPV + TB-500), matrix remodeling (GHK-Cu), vascularization (BPC-157 + GHK-Cu), and cellular migration (TB-500). Together they are hypothesized to cover more of the healing cascade than any two-compound stack." }
    ],
    research_applications: [
      { area: "Inflammatory Gut Conditions (IBD, Leaky Gut)", evidence: "Early", description: "KPV's anti-inflammatory activity in intestinal tissue, combined with BPC-157's established GI healing effects, makes KLOW particularly relevant for gut-directed research." },
      { area: "Joint and Connective Tissue Inflammation", evidence: "Moderate", description: "All four components have preclinical evidence relevant to articular inflammation and connective tissue repair. The stack is used in research contexts for osteoarthritis and post-injury recovery." },
      { area: "Skin Rejuvenation", evidence: "Moderate", description: "Same skin applications as GLOW with added anti-inflammatory benefit from KPV, potentially useful in inflammatory skin conditions like psoriasis or eczema." }
    ],
    dosage: {
      disclaimer: "KLOW is a multi-peptide research blend. Formulations vary by vendor — verify the exact doses on the COA. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (80mg)", frequency: "1–2x weekly", notes: "Some protocols use daily injection during a loading phase. Confirm the KPV dose on the COA — it drives the blend's anti-inflammatory differentiation from GLOW." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Injection site reactions", "Water retention (TB-500)", "GI effects possible (KPV may shift gut microbiome)"],
      unknown_risks: ["Combined NF-κB suppression from KPV + other anti-inflammatory effects may blunt acute immune responses", "Angiogenic activity from BPC-157 + GHK-Cu concerns in oncology patients", "Formulation quality varies significantly — COA verification essential"]
    },
    studies: [
      { title: "KPV anti-inflammatory properties in IBD models", authors: "Brzoska T, et al.", year: 2008, journal: "Journal of Investigative Dermatology", pmid: "17943185", url: "https://pubmed.ncbi.nlm.nih.gov/17943185/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/17943185/"]
  },

  {
    name: "Nova KLOW",
    full_name: "Nova KLOW — GHK-Cu / TB-500 / BPC-157 / KPV",
    slug: "nova-klow",
    tagline: "A vendor-branded name for the KLOW formulation — GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg) + KPV (10mg) in an 80mg vial.",
    aliases: ["Nova KLOW 80mg"],
    fda_status: "research-only",
    research_status: "Moderate",
    overview: "Nova KLOW is a vendor-specific brand name for the standard KLOW peptide blend: GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg) + KPV (10mg). The formulation and rationale are identical to KLOW. See the KLOW Blend profile for full mechanism, research, and dosage details.",
    description: "Vendor brand name for the KLOW blend — GHK-Cu + TB-500 + BPC-157 + KPV. Same formulation as KLOW.",
    category: "blend",
    blend_components: [
      { name: "GHK-Cu", slug: "ghk-cu", dose_mg: 50, contribution: "Collagen synthesis, extracellular matrix remodeling, wound healing gene regulation." },
      { name: "KPV", slug: "kpv", dose_mg: 10, contribution: "NF-κB inhibition, anti-inflammatory cytokine suppression, gut barrier protection." },
      { name: "TB-500", slug: "tb-500", dose_mg: 10, contribution: "Anti-inflammatory, cell migration, systemic tissue repair." },
      { name: "BPC-157", slug: "bpc-157", dose_mg: 10, contribution: "Angiogenesis, growth factor upregulation, GI and tendon healing." }
    ],
    mechanism: [
      { title: "Same Mechanism as KLOW Blend", body: "Nova KLOW uses the same four-component formula as KLOW. See the KLOW Blend profile for full mechanism details." }
    ],
    research_applications: [
      { area: "Healing and Anti-Inflammatory", evidence: "Moderate", description: "Same applications as KLOW Blend. See KLOW profile for full details." }
    ],
    dosage: {
      disclaimer: "Same formulation as KLOW Blend. See KLOW profile for dosage notes. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (80mg)", frequency: "1–2x weekly", notes: "See KLOW Blend profile for detailed protocols." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Same as KLOW Blend — see full profile"],
      unknown_risks: ["Same as KLOW Blend — see full profile", "Verify vendor COA for batch-specific quality"]
    },
    studies: [],
    research_links: []
  },

  {
    name: "Wolverine-Cu Blend",
    full_name: "Wolverine-Cu — GHK-Cu / BPC-157 / TB-500 / KPV",
    slug: "wolverine-cu-blend",
    tagline: "A four-peptide healing blend identical in composition to KLOW — GHK-Cu + BPC-157 + TB-500 + KPV — under a different vendor brand name.",
    aliases: ["Wolverine Cu", "Wolverine-Cu", "Wolverine Cu Blend"],
    fda_status: "research-only",
    research_status: "Moderate",
    overview: "Wolverine-Cu is a vendor brand name for a peptide blend containing GHK-Cu (50mg) + BPC-157 (10mg) + TB-500 (10mg) + KPV (10mg) — an 80mg total formulation identical in composition to KLOW. The 'Cu' in the name refers to the copper in GHK-Cu, and 'Wolverine' likely evokes rapid regeneration. The formula and rationale are the same as KLOW. Note: a simpler 'Wolverine Blend' exists (BPC-157 5mg + TB-500 5mg only) which is self-explanatory and different from this product.",
    description: "Vendor brand for a four-peptide blend: GHK-Cu (50mg) + BPC-157 (10mg) + TB-500 (10mg) + KPV (10mg). Same composition as KLOW.",
    category: "blend",
    blend_components: [
      { name: "GHK-Cu", slug: "ghk-cu", dose_mg: 50, contribution: "Collagen synthesis, matrix remodeling, angiogenesis, wound healing gene regulation." },
      { name: "BPC-157", slug: "bpc-157", dose_mg: 10, contribution: "Angiogenesis, growth factor upregulation, tendon and GI healing." },
      { name: "TB-500", slug: "tb-500", dose_mg: 10, contribution: "Cell migration, anti-inflammatory, systemic tissue repair via actin modulation." },
      { name: "KPV", slug: "kpv", dose_mg: 10, contribution: "NF-κB inhibition, anti-inflammatory cytokine suppression, gut epithelial barrier protection." }
    ],
    mechanism: [
      { title: "Same Mechanism as KLOW", body: "Wolverine-Cu contains the same four components as KLOW in the same doses. See the KLOW Blend profile for complete mechanism details." }
    ],
    research_applications: [
      { area: "Tissue Healing and Anti-Inflammatory", evidence: "Moderate", description: "Same applications as KLOW Blend — connective tissue repair, gut health, skin rejuvenation, anti-inflammatory." }
    ],
    dosage: {
      disclaimer: "Same formulation as KLOW. Research use only. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (80mg)", frequency: "1–2x weekly", notes: "Protocol identical to KLOW. Verify COA for exact component doses." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Same as KLOW — see full profile"],
      unknown_risks: ["Same as KLOW — see full profile"]
    },
    studies: [],
    research_links: []
  },

  {
    name: "Deadpool Blend",
    full_name: "Deadpool — BPC-157 / Thymosin Beta-4 / Cartalax",
    slug: "deadpool-blend",
    tagline: "A three-peptide blend combining BPC-157 and TB-500 with Cartalax — a cartilage-derived peptide researched for joint and cartilage repair.",
    aliases: ["Deadpool", "Deadpool Stack"],
    fda_status: "research-only",
    research_status: "Early",
    overview: "Deadpool is a vendor-branded peptide blend containing BPC-157 (10mg) + Thymosin Beta-4/TB-500 (10mg) + Cartalax (10mg) for 30mg total. BPC-157 and TB-500 are familiar healing peptides; the differentiating component is Cartalax — a synthetic tetrapeptide derived from cartilage matrix, developed by the same Russian research group (St. Petersburg Institute of Bioregulation and Gerontology) as Epithalon. Cartalax is researched for cartilage regeneration and joint health. The Deadpool blend is specifically marketed toward joint, cartilage, and connective tissue recovery, where Cartalax adds a cartilage-targeted mechanism not present in GLOW or KLOW.",
    description: "BPC-157 + TB-500 + Cartalax blend targeting joint and cartilage repair. Cartalax is the differentiating component from standard healing blends.",
    category: "blend",
    blend_components: [
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 10,
        contribution: "Angiogenesis, tendon-to-bone healing, growth factor upregulation, nitric oxide modulation for tissue repair."
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 10,
        contribution: "Actin regulation, cell migration, anti-inflammatory effects, systemic tissue healing and flexibility."
      },
      {
        name: "Cartalax",
        slug: "cartalax",
        dose_mg: 10,
        contribution: "Cartilage-derived tetrapeptide researched for chondrocyte stimulation, proteoglycan synthesis, and joint cartilage regeneration."
      }
    ],
    mechanism: [
      { title: "Cartilage-Targeted Repair via Cartalax", body: "Cartalax (Ala-Glu-Asp-Gly — same sequence as Epithalon but derived from cartilage rather than pineal tissue) is hypothesized to stimulate chondrocyte proliferation and extracellular matrix synthesis in articular cartilage, addressing the joint component that BPC-157 and TB-500 don't specifically target." },
      { title: "Combined Angiogenesis and Tissue Remodeling", body: "BPC-157 drives vascularization of damaged joint tissue; TB-500 reduces inflammation and promotes cellular migration into the repair zone; Cartalax addresses the cartilage matrix directly. The three-component strategy covers vascularity, inflammation, and matrix simultaneously." }
    ],
    research_applications: [
      { area: "Joint and Cartilage Repair", evidence: "Early", description: "The primary indication for Deadpool over GLOW/KLOW. Cartalax adds a cartilage-specific mechanism. Preclinical evidence for each component individually; no combination RCTs exist." },
      { area: "Tendon and Connective Tissue Recovery", evidence: "Moderate", description: "BPC-157 and TB-500 have strong preclinical evidence for tendon healing. Cartalax may extend these benefits to the cartilage component of tendon insertion sites." }
    ],
    dosage: {
      disclaimer: "Deadpool is a research blend containing Cartalax, a compound with very limited clinical data. Research use only. Not medical advice. Verify COA for your specific batch.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (30mg)", frequency: "1–2x weekly", notes: "Smaller total dose than GLOW/KLOW. Some protocols use daily injection for acute joint injury. Cartalax data is sparse — monitor for unexpected effects." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Cartalax Largely Unstudied)",
      known_effects: ["Injection site reactions", "Water retention (TB-500)", "Nausea (rare, BPC-157)"],
      unknown_risks: ["Cartalax has very limited independent safety data outside Russian research", "Long-term effects of combined use not characterized", "Angiogenic activity in oncology patients is a concern for BPC-157 component"]
    },
    studies: [
      { title: "BPC-157 tendon healing in Achilles transection models", authors: "Chang CH, et al.", year: 2011, journal: "Molecules", pmid: "21245816", url: "https://pubmed.ncbi.nlm.nih.gov/21245816/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/21245816/"]
  },

  {
    name: "ISOFLOW",
    full_name: "ISOFLOW — KPV / TB-500 / BPC-157",
    slug: "isoflow",
    tagline: "A three-peptide anti-inflammatory and healing blend pairing KPV's NF-κB inhibition with TB-500 and BPC-157 — without GHK-Cu.",
    aliases: ["IsoFlow", "ISO Flow"],
    fda_status: "research-only",
    research_status: "Early",
    overview: "ISOFLOW is a vendor blend containing KPV (10mg) + TB-500 (10mg) + BPC-157 (10mg) for 30mg total. It can be understood as KLOW without GHK-Cu — swapping the collagen/matrix focus of GHK-Cu for a more targeted anti-inflammatory approach. The three-component stack combines KPV's direct NF-κB inhibition with TB-500's actin-mediated cell migration and BPC-157's broad repair signaling. ISOFLOW is marketed toward gut inflammation, systemic anti-inflammatory research, and conditions where the skin and collagen focus of GHK-Cu is less relevant. The smaller total volume (30mg vs. 80mg) may also make reconstitution more practical for some protocols.",
    description: "KPV + TB-500 + BPC-157 blend — anti-inflammatory and healing stack without GHK-Cu. Lower total dose than KLOW, targeted toward gut and systemic inflammation.",
    category: "blend",
    blend_components: [
      {
        name: "KPV",
        slug: "kpv",
        dose_mg: 10,
        contribution: "NF-κB inhibition, reduction of TNF-α and IL-6, intestinal epithelial barrier protection. The primary anti-inflammatory driver."
      },
      {
        name: "TB-500",
        slug: "tb-500",
        dose_mg: 10,
        contribution: "Cell migration via actin modulation, anti-inflammatory effects, systemic tissue healing and wound closure."
      },
      {
        name: "BPC-157",
        slug: "bpc-157",
        dose_mg: 10,
        contribution: "Angiogenesis, gastrointestinal mucosal healing, growth factor upregulation, nitric oxide modulation."
      }
    ],
    mechanism: [
      { title: "NF-κB Inhibition as Primary Anti-Inflammatory", body: "KPV is the dominant anti-inflammatory agent in ISOFLOW, directly suppressing the master inflammatory transcription factor NF-κB. This reduces production of multiple pro-inflammatory cytokines simultaneously, unlike TB-500 and BPC-157 which act more through growth factor and structural pathways." },
      { title: "Gut-Directed Healing Rationale", body: "BPC-157's documented gastric acid stability and GI repair activity, combined with KPV's intestinal epithelial barrier effects, make ISOFLOW particularly relevant for gut-targeted research. TB-500 adds systemic healing support." }
    ],
    research_applications: [
      { area: "Gut Inflammation and IBD", evidence: "Early", description: "KPV + BPC-157 together target both the inflammatory and structural aspects of gut injury. This combination is a logical research stack for IBD, colitis, and leaky gut protocols." },
      { area: "Systemic Anti-Inflammatory", evidence: "Moderate", description: "Without GHK-Cu's collagen focus, ISOFLOW is suited for broader anti-inflammatory research where skin and matrix remodeling are secondary concerns." }
    ],
    dosage: {
      disclaimer: "ISOFLOW is a research blend. All three components are research-only. Formulations vary by vendor — verify COA. Not medical advice.",
      ranges: [
        { route: "Subcutaneous", range: "Full vial (30mg)", frequency: "Daily to 3x weekly", notes: "Smaller vial size than GLOW/KLOW allows more flexible dosing. Some protocols inject daily for gut healing protocols." }
      ]
    },
    safety_profile: {
      rating: "Limited Safety Data (Combination Use)",
      known_effects: ["Injection site reactions", "GI effects possible (KPV + BPC-157 both affect gut)"],
      unknown_risks: ["Combined NF-κB suppression may blunt acute immune responses", "BPC-157 angiogenic activity in cancer patients is a concern", "Long-term combined use not characterized"]
    },
    studies: [
      { title: "BPC 157 and gastrointestinal healing", authors: "Sikiric P, et al.", year: 2006, journal: "Current Pharmaceutical Design", pmid: "16918442", url: "https://pubmed.ncbi.nlm.nih.gov/16918442/" }
    ],
    research_links: ["https://pubmed.ncbi.nlm.nih.gov/16918442/"]
  },

];

// ── Upsert ─────────────────────────────────────────────────────────────────

async function main() {
  log(`Upserting ${BLENDS.length} blend profiles…`);

  const { error } = await db
    .from("peptides")
    .upsert(BLENDS, { onConflict: "slug" });

  if (error) {
    console.error(`[${SCRIPT}] ERROR:`, error.message);
    process.exit(1);
  }

  log(`Done. ${BLENDS.length} blend profiles upserted.`);
}

main();
