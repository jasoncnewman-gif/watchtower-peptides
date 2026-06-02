export type VendorStatus = "recommended" | "caution" | "not-recommended" | "under-review";

export type Vendor = {
  // core identity
  id: string;
  slug: string;
  name: string;
  website: string;
  overall_score: number;
  status: VendorStatus;
  location: string;
  has_coa: boolean;
  last_reviewed: string;
  verdict: string;
  notes: string;

  // sub-scores (sum to overall_score)
  scores: {
    lab_testing: number;         // out of 30
    purity_accuracy: number;     // out of 25
    transparency: number;        // out of 20
    community_reputation: number; // out of 15
    pricing_reliability: number; // out of 10
  };

  // peptide inventory for display on vendor detail page
  peptide_inventory: { name: string; price: string; in_stock: boolean }[];

  // third-party ratings
  finnrick_rating?: string;
  finnrick_score?: number;
  finnrick_tests_count?: number;
  finnrick_url?: string;
  peptide_critic_rating?: number;
  peptide_critic_reviews_count?: number;
  peptide_critic_url?: string;

  // location details
  country?: string;
  state?: string;
  city?: string;
  established_year?: number;

  // shipping & payment
  shipping_free_threshold?: number;
  ships_internationally?: boolean;
  credit_card_accepted?: boolean;
  crypto_accepted?: boolean;
  paypal_accepted?: boolean;

  // product details
  average_price_per_unit?: number;
  total_products?: number;
  specialization?: string[];
  formats_available?: string[];

  // compliance & gating
  is_gated?: boolean;
  gated_notes?: string;
  fda_warning?: boolean;
  fda_warning_date?: string;
  fda_notes?: string;

  // community & reviews
  reddit_sentiment?: "positive" | "mixed" | "negative";
  positive_review_summary?: string;
  negative_review_summary?: string;
  review_1?: string;
  review_2?: string;
  review_3?: string;
  coupon_code?: string;
};

export type Peptide = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  description: string;
  what_it_does?: string;
  fda_status: "approved" | "not-approved" | "research-only";
  typical_dosage: string;
  reconstitution: string;
  studies: { title: string; url: string }[];
  vendors: string[]; // vendor slugs
  category?: "healing" | "weight-loss" | "performance" | "sexual-health";
};

export const mockVendors: Vendor[] = [
  {
    id: "1",
    slug: "peptide-partners",
    name: "Peptide Partners",
    website: "peptide.partners",
    overall_score: 87,
    status: "recommended",
    location: "USA",
    has_coa: true,
    last_reviewed: "2026-05-15",
    verdict: "Peptide Partners is our top-rated domestic vendor. With 74 independently verified samples and testing from four separate labs, they have the most comprehensive quality assurance program we have reviewed. Minor deductions for Trustpilot removal and inconsistent TB-500 stock.",
    scores: { lab_testing: 27, purity_accuracy: 22, transparency: 18, community_reputation: 13, pricing_reliability: 7 },
    peptide_inventory: [
      { name: "BPC-157", price: "$106", in_stock: true },
      { name: "TB-500", price: "$130", in_stock: false },
      { name: "Sermorelin", price: "$115", in_stock: true },
      { name: "CJC-1295", price: "$89", in_stock: true },
    ],
    notes: "Finnrick A-rated (74 tests). COAs from TrustPointe, BioRegen, Chromate, Kovera.",
    finnrick_rating: "A",
    finnrick_score: 4.7,
    finnrick_tests_count: 74,
    established_year: 2018,
    country: "US",
    state: "FL",
    ships_internationally: false,
    credit_card_accepted: true,
    crypto_accepted: true,
    paypal_accepted: false,
    shipping_free_threshold: 150,
    total_products: 42,
    specialization: ["peptides"],
    formats_available: ["lyophilized"],
    is_gated: false,
    fda_warning: false,
    reddit_sentiment: "positive",
    positive_review_summary: "Consistently praised for fast domestic shipping, detailed COAs from multiple labs, and responsive customer service.",
    negative_review_summary: "Some users report intermittent TB-500 stock issues. Trustpilot reviews were removed, reducing third-party review visibility.",
    review_1: "Best COAs I've seen from any peptide vendor. TrustPointe and BioRegen both came back 99%+ purity.",
    review_2: "Shipping was fast (3 days to midwest). Packaging was discreet and professional.",
    review_3: "Their BPC-157 is legit. I've tried 4 vendors and this one has the most consistent effects.",
  },
  {
    id: "2",
    slug: "ion-peptide",
    name: "Ion Peptide",
    website: "ionpeptide.com",
    overall_score: 74,
    status: "recommended",
    location: "USA",
    has_coa: true,
    last_reviewed: "2026-05-10",
    verdict: "Ion Peptide earns a Recommended rating with strong third-party testing through Freedom Diagnostics and competitive pricing. Trustpilot rating of 3.7/5 keeps the score from reaching the top tier.",
    scores: { lab_testing: 22, purity_accuracy: 19, transparency: 15, community_reputation: 11, pricing_reliability: 7 },
    peptide_inventory: [
      { name: "BPC-157", price: "$39.95", in_stock: true },
      { name: "TB-500", price: "$49.00", in_stock: true },
      { name: "Sermorelin", price: "$45.00", in_stock: true },
      { name: "PT-141", price: "$52.00", in_stock: true },
    ],
    notes: "Freedom Diagnostics lab: NMR, HPLC, LC-MS, GC-MS. 15,000+ COA archive.",
    finnrick_rating: "B+",
    finnrick_score: 3.8,
    finnrick_tests_count: 38,
    established_year: 2020,
    country: "US",
    ships_internationally: false,
    credit_card_accepted: true,
    crypto_accepted: false,
    paypal_accepted: false,
    shipping_free_threshold: 100,
    total_products: 35,
    specialization: ["peptides"],
    formats_available: ["lyophilized"],
    is_gated: false,
    fda_warning: false,
    reddit_sentiment: "positive",
    positive_review_summary: "Praised for competitive pricing, Freedom Diagnostics testing, and a large publicly accessible COA archive.",
    negative_review_summary: "Customer support response times noted as slow by some users. Trustpilot rating of 3.7/5 reflects mixed experiences.",
    review_1: "COA archive is impressive — every batch I've ordered has a matching test result I can pull up instantly.",
    review_2: "Pricing is unbeatable for the quality. BPC-157 at $39.95 is hard to beat with real lab testing.",
    review_3: "Had one order take 8 days. Support was slow to respond but the issue was eventually resolved.",
  },
  {
    id: "3",
    slug: "core-peptides",
    name: "Core Peptides",
    website: "corepeptides.com",
    overall_score: 63,
    status: "caution",
    location: "USA",
    has_coa: true,
    last_reviewed: "2026-04-28",
    verdict: "Core Peptides offers competitive pricing and US-synthesized products but lacks a named independent lab. Quality control claims are in-house only. Use with caution until independent verification improves.",
    scores: { lab_testing: 16, purity_accuracy: 17, transparency: 13, community_reputation: 10, pricing_reliability: 7 },
    peptide_inventory: [
      { name: "BPC-157", price: "$52.00", in_stock: true },
      { name: "TB-500", price: "$78.00", in_stock: true },
      { name: "Sermorelin", price: "$48.00", in_stock: true },
      { name: "Semaglutide", price: "$145.00", in_stock: true },
    ],
    notes: "In-house QC claimed. No named third-party lab. Free shipping $200+.",
    established_year: 2019,
    country: "US",
    ships_internationally: false,
    credit_card_accepted: true,
    crypto_accepted: false,
    paypal_accepted: false,
    shipping_free_threshold: 200,
    total_products: 28,
    specialization: ["peptides"],
    formats_available: ["lyophilized"],
    is_gated: false,
    fda_warning: false,
    reddit_sentiment: "mixed",
    positive_review_summary: "US-synthesized products at competitive price points. Good selection including GLP-1 peptides.",
    negative_review_summary: "No named third-party lab cited. In-house QC claims are unverifiable. Community trust is moderate.",
    review_1: "Good prices and fast shipping. Wish they had independent lab testing — would trust them more.",
    review_2: "Semaglutide is stocked when no one else has it. That's a plus for me.",
    review_3: "Quality seems fine but there's no way to verify it without a named lab. Buyer be aware.",
  },
  {
    id: "4",
    slug: "swisschems",
    name: "SwissChems",
    website: "swisschems.is",
    overall_score: 49,
    status: "caution",
    location: "International",
    has_coa: false,
    last_reviewed: "2026-04-15",
    verdict: "SwissChems has a wide product catalog and competitive capsule pricing but earns a Finnrick C-E rating across multiple products. COAs are not consistently published. Not recommended as a primary vendor.",
    scores: { lab_testing: 11, purity_accuracy: 13, transparency: 10, community_reputation: 8, pricing_reliability: 7 },
    peptide_inventory: [
      { name: "BPC-157", price: "$85.95", in_stock: true },
      { name: "TB-500", price: "$107.95", in_stock: true },
      { name: "Sermorelin", price: "$25.95", in_stock: true },
      { name: "PT-141", price: "$79.95", in_stock: false },
    ],
    notes: "Finnrick C-E rated. Capsule/blend formats primarily. No consistent COA publication.",
    finnrick_rating: "C",
    finnrick_score: 2.4,
    finnrick_tests_count: 15,
    established_year: 2017,
    country: "International",
    ships_internationally: true,
    credit_card_accepted: true,
    crypto_accepted: true,
    paypal_accepted: false,
    shipping_free_threshold: 200,
    total_products: 120,
    specialization: ["peptides", "sarms"],
    formats_available: ["lyophilized", "capsule"],
    is_gated: false,
    fda_warning: false,
    reddit_sentiment: "mixed",
    positive_review_summary: "Wide product selection including SARMs and blends. International shipping available. Capsule formats convenient for some users.",
    negative_review_summary: "Multiple products rated C-E by Finnrick. COA publication is inconsistent. International shipping adds customs risk.",
    review_1: "Huge selection but quality is hit or miss depending on the product. Stick to their more popular items.",
    review_2: "International orders arrived fine but took 3 weeks. No tracking update for first 10 days.",
    review_3: "Their capsule formats are convenient but the Finnrick ratings on some products are concerning.",
  },
  {
    id: "5",
    slug: "amino-asylum",
    name: "Amino Asylum",
    website: "aminoasylum-llc.com",
    overall_score: 41,
    status: "not-recommended",
    location: "USA (TX/DE)",
    has_coa: false,
    last_reviewed: "2026-04-01",
    verdict: "Amino Asylum references HPLC reports but does not name a third-party lab or publish accessible COAs. Finnrick rating of A-C reflects inconsistent product performance. Not recommended until testing transparency improves.",
    scores: { lab_testing: 10, purity_accuracy: 11, transparency: 8, community_reputation: 7, pricing_reliability: 5 },
    peptide_inventory: [
      { name: "BPC-157", price: "$34.99", in_stock: true },
      { name: "TB-500", price: "$39.99", in_stock: true },
      { name: "CJC-1295", price: "$29.99", in_stock: true },
    ],
    notes: "HPLC referenced but no named lab. Finnrick A-C rated. Coupon: ASYLUM (5%).",
    finnrick_rating: "B-",
    finnrick_score: 2.1,
    finnrick_tests_count: 12,
    established_year: 2019,
    country: "US",
    state: "TX",
    ships_internationally: false,
    credit_card_accepted: true,
    crypto_accepted: false,
    paypal_accepted: false,
    shipping_free_threshold: 150,
    total_products: 55,
    specialization: ["peptides", "sarms", "prohormones"],
    formats_available: ["lyophilized", "capsule", "nasal"],
    is_gated: false,
    fda_warning: false,
    reddit_sentiment: "mixed",
    positive_review_summary: "Broad product catalog at budget-friendly pricing. One of the cheaper sources for common peptides.",
    negative_review_summary: "HPLC referenced but lab not named. Inconsistent product quality across the catalog. Some items Finnrick-rated low.",
    review_1: "Prices are great but you get what you pay for. Some batches seem underdosed.",
    review_2: "Budget option but I've had better results with higher-rated vendors. Not my first choice anymore.",
    review_3: "Customer service is responsive. Quality is inconsistent.",
    coupon_code: "ASYLUM",
  },
];

export const mockPeptides: Peptide[] = [
  {
    id: "1",
    slug: "bpc-157",
    name: "BPC-157",
    aliases: ["Body Protection Compound 157", "PL-10", "Bepecin"],
    description: "BPC-157 is a synthetic peptide derived from a protective protein found in gastric juice. It is primarily researched for its potential role in accelerating wound healing, tendon and ligament repair, and gut health. It has shown remarkable results in animal studies but lacks human clinical trials.",
    what_it_does: "Accelerates healing of tendons, ligaments, muscle, and gut tissue by upregulating growth factor signaling and promoting angiogenesis.",
    fda_status: "research-only",
    category: "healing",
    typical_dosage: "200–500 mcg per day, subcutaneous or intramuscular injection. Typically administered in 1–2 divided doses.",
    reconstitution: "Reconstitute with 1–2 mL bacteriostatic water. For a 5 mg vial with 1 mL BAC water: each 0.01 mL (10 units on a U-100 syringe) = 50 mcg.",
    studies: [
      { title: "Stable gastric pentadecapeptide BPC 157 in trials for inflammatory bowel disease", url: "https://pubmed.ncbi.nlm.nih.gov/15110404/" },
      { title: "BPC 157 and tendon healing", url: "https://pubmed.ncbi.nlm.nih.gov/20225054/" },
    ],
    vendors: ["peptide-partners", "ion-peptide", "core-peptides", "swisschems", "amino-asylum"],
  },
  {
    id: "2",
    slug: "tb-500",
    name: "TB-500",
    aliases: ["Thymosin Beta-4", "Tβ4", "TB4"],
    description: "TB-500 is a synthetic version of the naturally occurring peptide Thymosin Beta-4. It is researched for its role in cellular migration, blood vessel development, and tissue regeneration. Often stacked with BPC-157 in research protocols targeting systemic recovery.",
    what_it_does: "Promotes cellular migration and tissue repair through actin regulation; reduces inflammation and supports systemic recovery.",
    fda_status: "research-only",
    category: "healing",
    typical_dosage: "2–2.5 mg twice weekly during loading phase (4–6 weeks), then 2 mg every 2 weeks for maintenance. Subcutaneous or intramuscular.",
    reconstitution: "Reconstitute with 1–2 mL bacteriostatic water. For a 5 mg vial with 1 mL BAC water: each 0.01 mL = 50 mcg.",
    studies: [
      { title: "Thymosin beta 4 and cardiac repair", url: "https://pubmed.ncbi.nlm.nih.gov/17942520/" },
      { title: "Thymosin beta-4 accelerates wound healing", url: "https://pubmed.ncbi.nlm.nih.gov/10366736/" },
    ],
    vendors: ["peptide-partners", "ion-peptide", "core-peptides", "swisschems", "amino-asylum"],
  },
  {
    id: "3",
    slug: "semaglutide",
    name: "Semaglutide",
    aliases: ["Ozempic", "Wegovy", "Rybelsus", "GLP-1 agonist"],
    description: "Semaglutide is a GLP-1 receptor agonist approved by the FDA for type 2 diabetes management (Ozempic) and chronic weight management (Wegovy). It works by mimicking the GLP-1 hormone, slowing gastric emptying and reducing appetite. One of the most studied and clinically validated peptides available.",
    what_it_does: "Mimics GLP-1 to suppress appetite, slow gastric emptying, and improve insulin sensitivity — driving significant and sustained fat loss.",
    fda_status: "approved",
    category: "weight-loss",
    typical_dosage: "Prescription doses: 0.25 mg weekly for 4 weeks, titrating up to 2.4 mg weekly for weight loss. Research peptide doses vary significantly — consult clinical guidance.",
    reconstitution: "Reconstitute with 1 mL sterile or bacteriostatic water. For a 5 mg vial: each 0.01 mL = 50 mcg.",
    studies: [
      { title: "SUSTAIN-6: Semaglutide and cardiovascular outcomes", url: "https://pubmed.ncbi.nlm.nih.gov/27633186/" },
      { title: "STEP 1: Semaglutide for weight management", url: "https://pubmed.ncbi.nlm.nih.gov/33567185/" },
    ],
    vendors: ["core-peptides"],
  },
  {
    id: "4",
    slug: "cjc-1295",
    name: "CJC-1295",
    aliases: ["CJC1295", "Drug Affinity Complex: GRF 1-29", "DAC:GRF"],
    description: "CJC-1295 is a synthetic analog of growth hormone-releasing hormone (GHRH). It stimulates the pituitary gland to release growth hormone in a sustained manner. Often combined with Ipamorelin for synergistic GH release. Primarily researched for anti-aging, muscle growth, and fat loss applications.",
    what_it_does: "Stimulates pituitary GH release in sustained pulses, supporting muscle growth, fat metabolism, and recovery.",
    fda_status: "research-only",
    category: "performance",
    typical_dosage: "1–2 mg per week subcutaneous injection. Often dosed 2–3x weekly. Frequently combined with Ipamorelin at 100–300 mcg per injection.",
    reconstitution: "Reconstitute with 2 mL bacteriostatic water. For a 2 mg vial with 2 mL BAC water: each 0.1 mL = 100 mcg.",
    studies: [
      { title: "CJC-1295 increases GH and IGF-1 in healthy adults", url: "https://pubmed.ncbi.nlm.nih.gov/17084991/" },
    ],
    vendors: ["peptide-partners", "ion-peptide", "amino-asylum"],
  },
  {
    id: "5",
    slug: "pt-141",
    name: "PT-141",
    aliases: ["Bremelanotide", "Vyleesi"],
    description: "PT-141 (Bremelanotide) is an FDA-approved melanocortin receptor agonist originally developed from Melanotan II. It is approved as Vyleesi for hypoactive sexual desire disorder (HSDD) in premenopausal women. It works centrally through the nervous system rather than vascular mechanisms.",
    what_it_does: "Activates melanocortin receptors in the CNS to enhance sexual arousal and desire, independent of vascular mechanisms.",
    fda_status: "approved",
    category: "sexual-health",
    typical_dosage: "Approved dose: 1.75 mg subcutaneous injection 45 minutes before activity, no more than once per 24 hours. Maximum 1 dose per 8 hours in research settings.",
    reconstitution: "Reconstitute with 1 mL bacteriostatic water. For a 10 mg vial with 10 mL BAC water: each 0.1 mL = 100 mcg.",
    studies: [
      { title: "Bremelanotide for HSDD in premenopausal women", url: "https://pubmed.ncbi.nlm.nih.gov/30551133/" },
    ],
    vendors: ["ion-peptide", "swisschems"],
  },
];
