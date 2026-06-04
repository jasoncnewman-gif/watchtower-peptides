/**
 * scripts/seed-cartalax.ts
 * Seeds the Cartalax standalone peptide profile.
 * Cartalax is referenced in the Deadpool blend; this fixes the /peptides/cartalax 404.
 *
 * Run: npm run seed:cartalax
 */

import { db } from "./lib/client.js";

const SCRIPT = "seed-cartalax";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

const cartalax = {
  name: "Cartalax",
  full_name: "Cartalax (Ala-Glu-Asp-Gly)",
  slug: "cartalax",
  tagline:
    "A cartilage-derived tetrapeptide bioregulator researched for chondrocyte stimulation and joint cartilage regeneration — the cartilage-targeted component in the Deadpool blend.",
  aliases: ["Cartalax peptide", "AEDG cartilage peptide"],
  fda_status: "research-only",
  research_status: "Early",
  half_life: "Not well characterized (estimated <30 min)",
  molecular_weight: "402.4 g/mol",
  sequence: "Ala-Glu-Asp-Gly",
  overview:
    "Cartalax is a synthetic tetrapeptide bioregulator (Ala-Glu-Asp-Gly) developed by the St. Petersburg Institute of Bioregulation and Gerontology — the same group behind Epithalon and other short-peptide bioregulators. While Epithalon was isolated from the pineal gland, Cartalax was derived from cartilage tissue and is hypothesized to act as a tissue-specific signaling peptide for the cartilage compartment. Preclinical research suggests Cartalax may stimulate chondrocyte proliferation, promote proteoglycan and collagen synthesis in articular cartilage, and support extracellular matrix remodeling in joint tissue. It is available from a small number of peptide research vendors, primarily as part of the Deadpool blend (BPC-157 + TB-500 + Cartalax) targeting joint and cartilage repair. Independent clinical data is scarce; its evidence base consists almost entirely of preclinical Russian-language studies from the Khavinson group.",
  description:
    "Cartilage-derived tetrapeptide bioregulator researched for chondrocyte proliferation and articular cartilage matrix synthesis. Differentiates the Deadpool blend from standard GLOW/KLOW.",
  typical_dosage: "5–10 mg subcutaneous injection, 2–3x weekly",
  reconstitution_instructions:
    "Reconstitute with 1–2 mL bacteriostatic water. Store refrigerated. Use within 30 days of reconstitution.",
  category: "healing",
  mechanism: [
    {
      title: "Chondrocyte Stimulation",
      body: "Cartalax is hypothesized to act as a tissue-specific bioregulator that signals chondrocytes (cartilage-producing cells) to upregulate proliferation and extracellular matrix synthesis. The proposed mechanism involves interaction with nuclear chromatin in cartilage cells, modulating gene expression toward anabolic cartilage repair.",
    },
    {
      title: "Proteoglycan and Collagen Synthesis",
      body: "Preclinical models suggest Cartalax increases synthesis of proteoglycans (aggrecan, versican) and type II collagen — the primary structural components of articular cartilage. This differentiates it from BPC-157 and TB-500, which primarily act on vascularization, inflammation, and soft tissue rather than cartilage matrix directly.",
    },
    {
      title: "Bioregulator Concept",
      body: "As a Khavinson-group peptide bioregulator, Cartalax is theorized to work via epigenetic mechanisms — short peptide sequences that bind to gene promoter regions and modulate transcription in a tissue-specific manner. This is distinct from receptor-mediated mechanisms typical of most research peptides.",
    },
  ],
  research_applications: [
    {
      area: "Joint and Articular Cartilage Repair",
      evidence: "Early",
      description:
        "Primary proposed indication. Preclinical studies from the St. Petersburg Institute suggest cartilage matrix improvements in animal models. No independent RCTs; data is almost entirely from the originating research group.",
    },
    {
      area: "Osteoarthritis",
      evidence: "Early",
      description:
        "Theorized to slow cartilage degradation in osteoarthritis by supporting chondrocyte anabolic activity. Preclinical only; no clinical validation in human osteoarthritis.",
    },
    {
      area: "Connective Tissue Aging",
      evidence: "Early",
      description:
        "As a bioregulator class peptide, Cartalax has been studied alongside Epithalon and others for tissue restoration in aged subjects. Anti-aging benefits in cartilage compartment are speculative.",
    },
  ],
  dosage: {
    disclaimer:
      "Cartalax has very limited independent clinical data. It is a research compound only. The evidence base comes primarily from a single research group. Not medical advice. Use in humans is not approved by any regulatory authority.",
    ranges: [
      {
        route: "Subcutaneous injection",
        range: "5–10 mg",
        frequency: "2–3x weekly",
        notes:
          "Limited dosing data available. Most vendor-sold Cartalax comes pre-formulated in the Deadpool blend (10 mg per vial). Standalone Cartalax dosing protocols are extrapolated from blend use and Russian research.",
      },
    ],
  },
  safety_profile: {
    rating: "Largely Unknown — Minimal Independent Safety Data",
    known_effects: ["Injection site reactions", "No systemic adverse effects reported in limited preclinical studies"],
    unknown_risks: [
      "Long-term safety completely uncharacterized in humans",
      "Interaction with other cartilage-active compounds unknown",
      "Potential for aberrant chondrocyte proliferation at high doses not studied",
      "Data almost entirely from a single research group — independent replication needed",
    ],
  },
  studies: [
    {
      title:
        "Peptide bioregulators: a new class of geroprotectors. Report on the results of 35 years of research",
      authors: "Khavinson VKh, et al.",
      year: 2013,
      journal: "Advances in Gerontology",
      pmid: null,
      url: "https://pubmed.ncbi.nlm.nih.gov/24479250/",
    },
  ],
  research_links: ["https://pubmed.ncbi.nlm.nih.gov/24479250/"],
};

async function main() {
  log("Upserting Cartalax profile…");

  const { error } = await db
    .from("peptides")
    .upsert(cartalax, { onConflict: "slug" });

  if (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }

  log("✓ Cartalax seeded successfully — /peptides/cartalax is now live");
}

main();
