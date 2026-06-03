import type { Metadata } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: "Peptide Library — Research Profiles & Price Comparison",
  description: "Independent research profiles for BPC-157, TB-500, Ipamorelin, and more — mechanisms, dosage, safety, clinical studies, and live vendor price comparison.",
  alternates: { canonical: "/peptides" },
}
import Footer from '@/components/Footer'
import PeptideLibraryClient from '@/components/peptides/PeptideLibraryClient'
import { supabase } from '@/lib/supabase'
import { generateSlug, stripSizeSuffix } from '@/lib/utils'

export default async function PeptidesPage() {
  const [{ data: peptideRows }, { data: vpRows }] = await Promise.all([
    supabase
      .from('peptides')
      .select('id, name, slug, full_name, tagline, fda_status, research_status, studies')
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
  }))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#186784' }}>
              Peptide Library
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#1D1D1F' }}>Research Peptides</h1>
            <p className="text-xl" style={{ color: '#6E6E73' }}>
              Independent profiles on every peptide we track — mechanisms, research, dosage, and price comparison across verified vendors.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="max-w-6xl mx-auto pt-8">
            <PeptideLibraryClient peptides={peptides} />
          </div>
        </section>
      </div>

      <Footer verseIndex={1} />
    </div>
  )
}
