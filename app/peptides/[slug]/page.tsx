import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import PeptideDetailTabs, { type PeptideDetailData, type VendorTabData } from '@/components/peptides/PeptideDetailTabs'
import { supabase } from '@/lib/supabase'
import { generateSlug, stripSizeSuffix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from('peptides')
    .select('name, full_name, tagline, overview, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return { title: 'Peptide Not Found' }

  const title = data.full_name ? `${data.name} (${data.full_name})` : data.name
  const desc = (data.tagline ?? data.overview ?? data.description ?? '')
    .slice(0, 155)

  return {
    title,
    description: desc || `Research profile for ${data.name} — mechanisms, dosage, safety, clinical studies, and vendor price comparison.`,
    alternates: { canonical: `/peptides/${slug}` },
  }
}

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: 'FDA Approved',  bg: '#DCFCE7', text: '#16A34A' },
  'not-approved':  { label: 'Not Approved',  bg: '#FEF3C7', text: '#D97706' },
  'research-only': { label: 'Research Only', bg: '#DBEAFE', text: '#2563EB' },
}

export async function generateStaticParams() {
  const { data } = await supabase.from('peptides').select('slug').not('slug', 'is', null)
  return (data ?? []).map(p => ({ slug: p.slug as string }))
}

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch peptide profile + vendor pricing data in parallel
  const [{ data: peptideRow }, { data: vpAll }] = await Promise.all([
    supabase.from('peptides').select('*').eq('slug', slug).maybeSingle(),
    supabase
      .from('vendor_peptides')
      .select('vendor_id, peptide_name, size_mg, list_price, sale_price, in_stock')
      .not('list_price', 'is', null),
  ])

  if (!peptideRow) notFound()

  const isBlend = peptideRow.category === 'blend'

  // Match vendor_peptides: exact slug, size-stripped slug, or (for blends) prefix match
  const matchingRows = (vpAll ?? []).filter(r => {
    const vpSlug = generateSlug(r.peptide_name)
    if (vpSlug === slug) return true
    if (stripSizeSuffix(vpSlug) === slug) return true
    if (isBlend && vpSlug.startsWith(slug + '-')) return true
    return false
  })

  // Fetch vendor details for matched rows
  const vendorIds = [...new Set(matchingRows.map(r => r.vendor_id))]
  const { data: vendorsData } = vendorIds.length
    ? await supabase
        .from('vendors')
        .select('id, name, slug, website, overall_score, status')
        .in('id', vendorIds)
    : { data: [] }

  // Build vendor price rows; size -1 is a sentinel for rows with null size_mg
  const SIZE_UNKNOWN = -1
  type RawPriceEntry = { size: number; price: number; onSale: boolean; inStock: boolean }
  const pricesByVendor = new Map<string, Map<number, RawPriceEntry>>()
  for (const r of matchingRows) {
    if (!pricesByVendor.has(r.vendor_id)) pricesByVendor.set(r.vendor_id, new Map())
    const sizeMap = pricesByVendor.get(r.vendor_id)!
    const size = r.size_mg != null ? (r.size_mg as number) : SIZE_UNKNOWN
    const effective = r.sale_price ?? r.list_price!
    const existing = sizeMap.get(size)
    if (!existing || effective < existing.price) {
      sizeMap.set(size, { size, price: effective, onSale: r.sale_price != null, inStock: r.in_stock })
    }
  }

  const sizes = [...new Set(
    matchingRows.filter(r => r.size_mg != null).map(r => r.size_mg as number)
  )].sort((a, b) => a - b)

  const sortedVendors = [...(vendorsData ?? [])]
    .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
    .map(v => ({
      id: v.id,
      name: v.name,
      slug: v.slug ?? null,
      website: v.website ?? null,
      overall_score: v.overall_score ?? null,
      status: v.status,
      prices: [...(pricesByVendor.get(v.id)?.values() ?? [])],
    }))

  const vendorData: VendorTabData = { sizes, vendors: sortedVendors, sizeUnknown: SIZE_UNKNOWN }

  // Shape peptide data for the client component
  const peptide: PeptideDetailData = {
    name:                     peptideRow.name,
    full_name:                peptideRow.full_name ?? null,
    slug:                     peptideRow.slug,
    tagline:                  peptideRow.tagline ?? null,
    fda_status:               peptideRow.fda_status ?? null,
    research_status:          peptideRow.research_status ?? null,
    half_life:                peptideRow.half_life ?? null,
    molecular_weight:         peptideRow.molecular_weight ?? null,
    sequence:                 peptideRow.sequence ?? null,
    overview:                 peptideRow.overview ?? null,
    description:              peptideRow.description ?? null,
    aliases:                  peptideRow.aliases ?? null,
    typical_dosage:           peptideRow.typical_dosage ?? null,
    reconstitution_instructions: peptideRow.reconstitution_instructions ?? null,
    mechanism:                (peptideRow.mechanism as PeptideDetailData['mechanism']) ?? null,
    research_applications:    (peptideRow.research_applications as PeptideDetailData['research_applications']) ?? null,
    dosage:                   (peptideRow.dosage as PeptideDetailData['dosage']) ?? null,
    safety_profile:           (peptideRow.safety_profile as PeptideDetailData['safety_profile']) ?? null,
    studies:                  (peptideRow.studies as PeptideDetailData['studies']) ?? null,
    blend_components:         (peptideRow.blend_components as PeptideDetailData['blend_components']) ?? null,
  }

  const fda = peptide.fda_status ? FDA_CONFIG[peptide.fda_status] : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-10" style={{ color: '#6E6E73' }}>
            <Link href="/peptides" className="hover:text-black transition-colors">Peptide Library</Link>
            <span>›</span>
            <span style={{ color: '#1D1D1F' }}>{peptide.name}</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: '#F5F5F7' }}>
            <div className="flex items-start gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold" style={{ color: '#1D1D1F' }}>{peptide.name}</h1>
              {fda && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: fda.bg, color: fda.text }}>
                  {fda.label}
                </span>
              )}
              {peptide.research_status && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73', border: '1px solid #E5E5E7' }}>
                  {peptide.research_status} Evidence
                </span>
              )}
            </div>

            {peptide.full_name && (
              <p className="text-base mb-2" style={{ color: '#6E6E73' }}>{peptide.full_name}</p>
            )}

            {peptide.tagline && (
              <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>{peptide.tagline}</p>
            )}
          </div>

          {/* Tabs */}
          <PeptideDetailTabs peptide={peptide} vendorData={vendorData} />

          <Link
            href="/peptides"
            className="inline-flex items-center gap-2 text-sm font-medium mt-12 transition-opacity hover:opacity-70"
            style={{ color: '#1D1D1F' }}
          >
            ← Back to Peptide Library
          </Link>
        </div>
      </div>

      <Footer verseIndex={2} />
    </div>
  )
}
