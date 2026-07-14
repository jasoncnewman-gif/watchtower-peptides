import { createClient } from '@supabase/supabase-js'

// ── Display types ────────────────────────────────────────────────────────────

export type VendorStatus = "recommended" | "caution" | "not-recommended" | "under-review";

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  website: string;
  overall_score: number;
  status: VendorStatus;
  location: string;
  has_coa: boolean;
  verified_domain?: boolean;
  last_reviewed: string;
  verdict: string;
  notes: string;
  scores: {
    lab_testing: number;
    purity_accuracy: number;
    transparency: number;
    pricing_reliability: number;
  };
  peptide_inventory: { name: string; price: string; in_stock: boolean }[];
  finnrick_rating?: string;
  finnrick_score?: number;
  finnrick_tests_count?: number;
  finnrick_url?: string;
  peptide_critic_rating?: number;
  peptide_critic_reviews_count?: number;
  peptide_critic_url?: string;
  country?: string;
  state?: string;
  city?: string;
  established_year?: number;
  shipping_flat_fee?: number;
  shipping_free_threshold?: number;
  ships_internationally?: boolean;
  credit_card_accepted?: boolean;
  crypto_accepted?: boolean;
  paypal_accepted?: boolean;
  average_price_per_unit?: number;
  total_products?: number;
  specialization?: string[];
  formats_available?: string[];
  is_gated?: boolean;
  gated_notes?: string;
  fda_warning?: boolean;
  fda_warning_date?: string;
  fda_notes?: string;
  reddit_sentiment?: "positive" | "neutral" | "mixed" | "negative";
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
  vendors: string[];
  category?: "healing" | "weight-loss" | "performance" | "sexual-health";
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── DB row shapes (flat columns, mirrors schema.sql) ─────────────────────

export interface DbVendor {
  id: string
  name: string
  slug: string | null
  website: string | null
  overall_score: number | null
  lab_testing_score: number | null
  purity_accuracy_score: number | null
  transparency_score: number | null
  community_reputation_score: number | null
  pricing_reliability_score: number | null
  status: 'active' | 'inactive' | 'closed' | 'flagged'
  verdict: string | null
  last_reviewed: string | null
  finnrick_rating: string | null
  finnrick_score: number | null
  finnrick_tests_count: number | null
  finnrick_url: string | null
  peptide_critic_rating: number | null
  peptide_critic_reviews_count: number | null
  peptide_critic_url: string | null
  country: string | null
  state: string | null
  city: string | null
  location: string | null
  shipping_flat_fee: number | null
  shipping_free_threshold: number | null
  ships_internationally: boolean
  credit_card_accepted: boolean
  crypto_accepted: boolean
  paypal_accepted: boolean
  average_price_per_unit: number | null
  total_products: number | null
  specialization: string[] | null
  formats_available: string[] | null
  has_coa: boolean
  verified_domain: boolean
  is_gated: boolean
  gated_notes: string | null
  fda_warning: boolean
  fda_warning_date: string | null
  fda_notes: string | null
  reddit_sentiment: string | null
  positive_review_summary: string | null
  negative_review_summary: string | null
  review_1: string | null
  review_2: string | null
  review_3: string | null
  coupon_code: string | null
  established_year: number | null
  notes: string | null
  date_added: string
  created_at: string
  updated_at: string
}

export interface DbPeptideMechanism {
  title: string
  body: string
}

export interface DbPeptideApplication {
  area: string
  evidence: string
  description: string
}

export interface DbPeptideDosageRange {
  route: string
  range: string
  frequency: string
  notes: string
}

export interface DbPeptideDosage {
  disclaimer: string
  ranges: DbPeptideDosageRange[]
}

export interface DbPeptideSafetyProfile {
  rating: string
  known_effects: string[]
  unknown_risks: string[]
}

export interface DbPeptideStudy {
  title: string
  authors: string
  year: number
  journal: string
  pmid: string
  url: string
}

export interface DbBlendComponent {
  name: string
  slug: string
  dose_mg: number | null
  contribution: string
}

export interface DbPeptide {
  id: string
  name: string
  full_name: string | null
  slug: string
  tagline: string | null
  aliases: string[] | null
  description: string | null
  what_it_does: string | null
  overview: string | null
  fda_status: 'approved' | 'not-approved' | 'research-only' | null
  research_status: string | null
  half_life: string | null
  molecular_weight: string | null
  sequence: string | null
  typical_dosage: string | null
  reconstitution_instructions: string | null
  research_links: string[] | null
  mechanism: DbPeptideMechanism[] | null
  research_applications: DbPeptideApplication[] | null
  dosage: DbPeptideDosage | null
  safety_profile: DbPeptideSafetyProfile | null
  studies: DbPeptideStudy[] | null
  blend_components: DbBlendComponent[] | null
  category: string | null
  created_at: string
  updated_at: string
}

export interface DbVendorPeptide {
  id: string
  vendor_id: string
  peptide_name: string
  size_mg: number | null
  list_price: number | null
  sale_price: number | null
  bulk_discount_details: string | null
  in_stock: boolean
  coa_available: boolean
  coa_url: string | null
  last_checked: string
  created_at: string
  updated_at: string
}

export interface DbLabTest {
  id: string
  vendor_id: string
  peptide_name: string | null
  lab_name: string | null
  test_type: string | null
  purity_result: number | null
  batch_number: string | null
  test_date: string | null
  verified: boolean
  janoshik_tested: boolean
  coa_url: string | null
  created_at: string
}

export interface DbAlert {
  id: string
  vendor_id: string
  alert_type: string | null
  message: string | null
  created_date: string
  resolved: boolean
  resolved_date: string | null
}

export interface DbLabVendor {
  id: string
  name: string
  slug: string
  url: string
  business_model: 'subscription' | 'panel' | 'ala-carte' | 'hybrid' | 'clinic' | null
  section: 'membership' | 'panel-package' | 'build-your-own' | 'special' | 'excluded'
  entry_price_cents: number | null
  true_annual_cost_cents: number | null
  billing_cycle: string | null
  collection_method: 'venous-draw' | 'fingerstick' | 'arm-device' | 'at-home-kit' | 'mobile-phlebotomist' | 'clinic-draw' | 'multiple' | null
  lab_partner: string | null
  clia_certified: boolean | null
  peptide_rx_offered: boolean
  affiliate_program: boolean | null
  affiliate_url: string | null
  affiliate_commission: string | null
  affiliate_network: string | null
  eligibility: 'INCLUDE' | 'INCLUDE-NICHE' | 'EXCLUDE'
  exclusion_reason: string | null
  ny_nj_surcharge: boolean | null
  ny_nj_surcharge_amount_cents: number | null
  state_restrictions: string | null
  hsa_fsa_eligible: boolean | null
  accuracy_flags: string | null
  audience_overlap_notes: string | null
  is_gated: boolean
  created_at: string
  updated_at: string
}

export interface DbVendorTier {
  id: string
  vendor_id: string
  tier_name: string
  price_cents: number | null
  billing_cycle: string | null
  biomarker_count: string | null
  tests_included: string | null
  hsa_fsa_eligible: string | null
  state_restrictions: string | null
  ny_nj_surcharge: string | null
  is_entry_tier: boolean
  created_at: string
}

// ── Display type ──────────────────────────────────────────────────────────

export type LabVendor = {
  id: string
  slug: string
  name: string
  url: string
  section: DbLabVendor['section']
  businessModel: DbLabVendor['business_model']
  entryPriceCents: number | null
  trueAnnualCostCents: number | null
  collectionMethod: DbLabVendor['collection_method']
  cliaCertified: boolean
  peptideRxOffered: boolean
  affiliateProgram: boolean
  affiliateUrl: string | null
}

export function dbLabVendorToLabVendor(db: DbLabVendor): LabVendor {
  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    url: db.url,
    section: db.section,
    businessModel: db.business_model,
    entryPriceCents: db.entry_price_cents,
    trueAnnualCostCents: db.true_annual_cost_cents,
    collectionMethod: db.collection_method,
    cliaCertified: db.clia_certified ?? false,
    peptideRxOffered: db.peptide_rx_offered,
    affiliateProgram: db.affiliate_program ?? false,
    affiliateUrl: db.affiliate_url,
  }
}

// ── DB → display mapping ─────────────────────────────────────────────────

// DB status values ('active','inactive','closed','flagged') don't map 1:1 to
// the display VendorStatus type. Active vendors are scored; others are flagged.
function dbStatusToDisplayStatus(dbStatus: DbVendor['status'], score: number | null): VendorStatus {
  if (dbStatus === 'flagged' || dbStatus === 'closed' || dbStatus === 'inactive') return 'not-recommended'
  if (score === null) return 'under-review'
  if (score >= 80) return 'recommended'
  if (score >= 55) return 'caution'
  return 'not-recommended'
}

export function dbVendorToVendor(db: DbVendor, peptideItems: DbVendorPeptide[] = []): Vendor {
  const locationParts = [db.city, db.state, db.country].filter(Boolean)
  return {
    id: db.id,
    slug: db.slug ?? db.id,
    name: db.name,
    website: db.website ?? '',
    overall_score: db.overall_score ?? 0,
    status: dbStatusToDisplayStatus(db.status, db.overall_score),
    location: db.location ?? locationParts.join(', '),
    has_coa: db.has_coa,
    verified_domain: db.verified_domain,
    last_reviewed: db.last_reviewed ?? '',
    verdict: db.verdict ?? '',
    notes: db.notes ?? '',
    scores: {
      lab_testing: db.lab_testing_score ?? 0,
      purity_accuracy: db.purity_accuracy_score ?? 0,
      transparency: db.transparency_score ?? 0,
      pricing_reliability: db.pricing_reliability_score ?? 0,
    },
    peptide_inventory: peptideItems.map((p) => ({
      name: p.peptide_name,
      price: p.sale_price != null
        ? `$${p.sale_price.toFixed(2)}`
        : p.list_price != null
          ? `$${p.list_price.toFixed(2)}`
          : 'N/A',
      in_stock: p.in_stock,
    })),
    finnrick_rating: db.finnrick_rating ?? undefined,
    finnrick_score: db.finnrick_score ?? undefined,
    finnrick_tests_count: db.finnrick_tests_count ?? undefined,
    finnrick_url: db.finnrick_url ?? undefined,
    peptide_critic_rating: db.peptide_critic_rating ?? undefined,
    peptide_critic_reviews_count: db.peptide_critic_reviews_count ?? undefined,
    peptide_critic_url: db.peptide_critic_url ?? undefined,
    country: db.country ?? undefined,
    state: db.state ?? undefined,
    city: db.city ?? undefined,
    established_year: db.established_year ?? undefined,
    shipping_flat_fee: db.shipping_flat_fee ?? undefined,
    shipping_free_threshold: db.shipping_free_threshold ?? undefined,
    ships_internationally: db.ships_internationally,
    credit_card_accepted: db.credit_card_accepted,
    crypto_accepted: db.crypto_accepted,
    paypal_accepted: db.paypal_accepted,
    average_price_per_unit: db.average_price_per_unit ?? undefined,
    total_products: db.total_products ?? undefined,
    specialization: db.specialization ?? undefined,
    formats_available: db.formats_available ?? undefined,
    is_gated: db.is_gated,
    gated_notes: db.gated_notes ?? undefined,
    fda_warning: db.fda_warning,
    fda_warning_date: db.fda_warning_date ?? undefined,
    fda_notes: db.fda_notes ?? undefined,
    reddit_sentiment: (db.reddit_sentiment as Vendor['reddit_sentiment']) ?? undefined,
    positive_review_summary: db.positive_review_summary ?? undefined,
    negative_review_summary: db.negative_review_summary ?? undefined,
    review_1: db.review_1 ?? undefined,
    review_2: db.review_2 ?? undefined,
    review_3: db.review_3 ?? undefined,
    coupon_code: db.coupon_code ?? undefined,
  }
}

export function dbPeptideToAppPeptide(db: DbPeptide): Peptide {
  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    aliases: db.aliases ?? [],
    description: db.description ?? '',
    what_it_does: db.what_it_does ?? undefined,
    fda_status: db.fda_status ?? 'research-only',
    typical_dosage: db.typical_dosage ?? '',
    reconstitution: db.reconstitution_instructions ?? '',
    // research_links are stored as plain URLs; map to { title, url } for display
    studies: (db.research_links ?? []).map((link) => ({ title: link, url: link })),
    vendors: [],
    category: (db.category as Peptide['category']) ?? undefined,
  }
}

// ── Query functions ──────────────────────────────────────────────────────

export async function getVendors(): Promise<DbVendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .order('overall_score', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getVendorBySlug(slug: string): Promise<DbVendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getVendorPeptides(vendorId: string): Promise<DbVendorPeptide[]> {
  const { data, error } = await supabase
    .from('vendor_peptides')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('peptide_name')
  if (error) throw error
  return data ?? []
}

export async function getPeptides(): Promise<DbPeptide[]> {
  const { data, error } = await supabase
    .from('peptides')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getPeptideBySlug(slug: string): Promise<DbPeptide | null> {
  const { data, error } = await supabase
    .from('peptides')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getLabTests(vendorId: string): Promise<DbLabTest[]> {
  const { data, error } = await supabase
    .from('lab_tests')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('test_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAlerts(vendorId?: string): Promise<DbAlert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_date', { ascending: false })
  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getLabVendors(): Promise<DbLabVendor[]> {
  const { data, error } = await supabase
    .from('lab_vendors')
    .select('*')
    .neq('eligibility', 'EXCLUDE')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getLabVendorBySlug(slug: string): Promise<DbLabVendor | null> {
  const { data, error } = await supabase
    .from('lab_vendors')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getVendorTiers(vendorId: string): Promise<DbVendorTier[]> {
  const { data, error } = await supabase
    .from('vendor_tiers')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('price_cents', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}
