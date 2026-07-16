import type { Metadata } from 'next'
import Image from 'next/image'
import Nav from '@/components/Nav'

export const revalidate = 0

const title = "Peptide Library — Research Profiles & Price Comparison"
const description = "Independent research profiles for BPC-157, TB-500, Ipamorelin, and more — mechanisms, dosage, safety, clinical studies, and live vendor price comparison."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/peptides" },
  openGraph: { title, description, images: [{ url: "/images/peptide-library.png" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/peptide-library.png"] },
}
import Footer from '@/components/Footer'
import PeptideLibraryClient from '@/components/peptides/PeptideLibraryClient'
import { supabase } from '@/lib/supabase'
import { generateSlug, stripSizeSuffix } from '@/lib/utils'

export default async function PeptidesPage() {
  const [{ data: peptideRows }, { data: vpRows }] = await Promise.all([
    supabase
      .from('peptides')
      .select('id, name, slug, full_name, tagline, fda_status, research_status, studies, category')
      .order('name'),
    supabase
      .from('vendor_peptides')
      .select('peptide_name, vendor_id'),
  ])

  // Build vendor count map: normalise size suffixes so "ipamorelin-10mg" → "ipamorelin"
  const vendorsBySlug = new Map<string, Set<string>>()
  for (const row of vpRows ?? []) {
    const raw = generateSlug(row.peptide_name)
    const slug = stripSizeSuffix(raw)
    if (!vendorsBySlug.has(slug)) vendorsBySlug.set(slug, new Set())
    vendorsBySlug.get(slug)!.add(row.vendor_id)
    // also index the raw slug so exact matches still work
    if (slug !== raw) {
      if (!vendorsBySlug.has(raw)) vendorsBySlug.set(raw, new Set())
      vendorsBySlug.get(raw)!.add(row.vendor_id)
    }
  }

  const peptides = (peptideRows ?? []).map(p => ({
    name: p.name as string,
    fullName: (p.full_name as string | null) ?? null,
    tagline: (p.tagline as string | null) ?? null,
    fdaStatus: (p.fda_status as string | null) ?? null,
    researchStatus: (p.research_status as string | null) ?? null,
    slug: p.slug as string,
    vendorCount: vendorsBySlug.get(p.slug as string)?.size ?? 0,
    studyCount: Array.isArray(p.studies) ? (p.studies as unknown[]).length : 0,
    category: (p.category as string | null) ?? null,
  }))

  const visiblePeptides = peptides.filter(p => p.vendorCount > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      <Nav />

      <div className="pt-20">
        <section className="relative" style={{ minHeight: '320px' }}>
          <Image
            src="/images/peptide-library.png"
            alt="Peptide Library"
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)' }} />
          <div className="relative z-10 px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#5BA4C4' }}>
                Peptide Library
              </p>
              <h1 className="text-5xl font-bold mb-4" style={{ color: '#FFFFFF' }}>Peptide Research Profiles</h1>
              <p className="text-xl" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Mechanisms, dosage summaries, safety data, and current pricing across independently scored vendors.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="max-w-6xl mx-auto pt-8">
            <PeptideLibraryClient peptides={visiblePeptides} />
          </div>
        </section>
      </div>

      <Footer verseIndex={1} />
    </div>
  )
}
