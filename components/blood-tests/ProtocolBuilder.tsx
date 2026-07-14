'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PeptideOption {
  name: string
  slug: string
  category: string | null
}

interface BiomarkerResult {
  biomarker_id: string
  name: string
  slug: string
  category: string
  monitoring_tier: 'safety' | 'efficacy' | 'advanced'
  appearance_count: number
  peptides_requiring: string[]
}

interface VendorResult {
  vendor_id: string
  name: string
  slug: string
  entry_price_cents: number | null
  true_annual_cost_cents: number | null
  collection_method: string | null
  clia_certified: boolean
  markers_covered: number
  coverage_pct: number
  missing_markers: string[]
  over_budget: boolean
  affiliate_url: string | null
  affiliate_program: boolean | null
}

const CATEGORY_LABELS: Record<string, string> = {
  healing: 'Healing & Recovery',
  hormones: 'Hormones & Performance',
  metabolic: 'Weight & Metabolic',
  'brain-longevity': 'Brain & Longevity',
  performance: 'Performance',
  'sexual-health': 'Sexual Health',
  immune: 'Immune & Protective',
  blend: 'Blends',
}

const TIER_LABELS: Record<string, string> = {
  safety: 'Safety Markers',
  efficacy: 'Efficacy Markers',
  advanced: 'Advanced / Nice-to-Have',
}

const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: 'any', label: 'Any budget' },
  { value: 'low', label: 'Under $200/yr' },
  { value: 'mid', label: '$200–$500/yr' },
]

function formatPrice(cents: number | null): string {
  if (cents === null) return 'Price varies'
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`
}

export default function ProtocolBuilder({
  peptides,
  entryTierPrices,
}: {
  peptides: PeptideOption[]
  // vendor_id -> entry-tier price_cents, keyed off vendor_tiers.is_entry_tier. Preferred over
  // get_vendor_coverage's own entry_price_cents, which is regex-extracted from free-text notes
  // and can grab the wrong dollar figure (same issue fixed in VendorCard.tsx).
  entryTierPrices: Record<string, number>
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [budgetTier, setBudgetTier] = useState('any')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [biomarkers, setBiomarkers] = useState<BiomarkerResult[] | null>(null)
  const [vendors, setVendors] = useState<VendorResult[] | null>(null)

  const filteredPeptides = useMemo(() => {
    const q = query.toLowerCase()
    return peptides.filter((p) => !q || p.name.toLowerCase().includes(q))
  }, [peptides, query])

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function buildPanel() {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)
    try {
      const { data: bmData, error: bmError } = await supabase.rpc('get_protocol_biomarkers', {
        peptide_slugs: [...selected],
      })
      if (bmError) throw bmError
      const bmRows = (bmData ?? []) as BiomarkerResult[]
      setBiomarkers(bmRows)

      const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_coverage', {
        biomarker_ids: bmRows.map((b) => b.biomarker_id),
        budget_tier: budgetTier,
      })
      if (vendorError) throw vendorError
      setVendors((vendorData ?? []) as VendorResult[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong building your panel.')
    } finally {
      setLoading(false)
    }
  }

  const groupedBiomarkers = useMemo(() => {
    if (!biomarkers) return null
    const groups: Record<string, BiomarkerResult[]> = { safety: [], efficacy: [], advanced: [] }
    for (const b of biomarkers) groups[b.monitoring_tier]?.push(b)
    return groups
  }, [biomarkers])

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E7' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#186784' }}>
        Protocol Builder
      </p>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1D1D1F' }}>
        Pick your peptides. We&apos;ll tell you what to monitor and who covers it.
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6E6E73' }}>
        Select the peptides in your protocol to get a ranked biomarker list and the vendors that cover it best.
      </p>

      <input
        type="text"
        placeholder="Search peptides…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
        style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F', border: '1px solid #E5E5E7' }}
      />

      <div className="flex flex-wrap gap-2 mb-6 max-h-56 overflow-y-auto pr-1">
        {filteredPeptides.map((p) => {
          const isSelected = selected.has(p.slug)
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggle(p.slug)}
              className="text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors"
              style={
                isSelected
                  ? { backgroundColor: '#186784', color: '#FFFFFF' }
                  : { backgroundColor: '#F5F5F7', color: '#6E6E73' }
              }
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>Budget:</span>
        {BUDGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setBudgetTier(opt.value)}
            className="text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors"
            style={
              budgetTier === opt.value
                ? { backgroundColor: '#1D1D1F', color: '#FFFFFF' }
                : { backgroundColor: '#F5F5F7', color: '#6E6E73' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          onClick={buildPanel}
          disabled={selected.size === 0 || loading}
          className="text-sm font-semibold rounded-xl px-5 py-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
        >
          {loading ? 'Building…' : `Build My Panel (${selected.size} selected)`}
        </button>
        {error && <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>}
      </div>

      {groupedBiomarkers && (
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid #E5E5E7' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1D1D1F' }}>What to Monitor</h3>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {(['safety', 'efficacy', 'advanced'] as const).map((tier) => (
              <div key={tier}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#6E6E73' }}>
                  {TIER_LABELS[tier]} ({groupedBiomarkers[tier].length})
                </p>
                <div className="space-y-2">
                  {groupedBiomarkers[tier].map((b) => (
                    <div key={b.biomarker_id} className="rounded-xl px-3 py-2" style={{ backgroundColor: '#F5F5F7' }}>
                      <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{b.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                        {CATEGORY_LABELS[b.category] ?? b.category} · needed for {b.peptides_requiring.join(', ')}
                      </p>
                    </div>
                  ))}
                  {groupedBiomarkers[tier].length === 0 && (
                    <p className="text-xs" style={{ color: '#C7C7CC' }}>None for this selection.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold mb-4" style={{ color: '#1D1D1F' }}>Best Vendors for This Panel</h3>
          <div className="space-y-3">
            {(vendors ?? []).map((v) => (
              <div
                key={v.vendor_id}
                className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                style={{ backgroundColor: '#F5F5F7' }}
              >
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <Link href={`/blood-tests/${v.slug}`} className="hover:opacity-80 transition-opacity">
                      <p className="font-semibold" style={{ color: '#1D1D1F' }}>{v.name}</p>
                    </Link>
                    {v.over_budget && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        Over Budget
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                    {formatPrice(entryTierPrices[v.vendor_id] ?? v.entry_price_cents)}
                    {v.clia_certified && ' · CLIA Certified'}
                  </p>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#6E6E73' }}>
                    <span>{v.markers_covered}/{biomarkers?.length ?? 0} markers</span>
                    <span>{v.coverage_pct}%</span>
                  </div>
                  <div className="rounded-full h-1.5" style={{ backgroundColor: '#E5E5E7' }}>
                    <div
                      className="rounded-full h-1.5"
                      style={{ width: `${v.coverage_pct}%`, backgroundColor: v.coverage_pct >= 90 ? '#16A34A' : v.coverage_pct >= 70 ? '#D97706' : '#DC2626' }}
                    />
                  </div>
                  {v.missing_markers.length > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: '#C7C7CC' }}>
                      Missing: {v.missing_markers.slice(0, 3).join(', ')}{v.missing_markers.length > 3 ? ` +${v.missing_markers.length - 3} more` : ''}
                    </p>
                  )}
                </div>
                <Link
                  href={`/blood-tests/${v.slug}`}
                  className="text-sm font-semibold rounded-xl px-4 py-2.5 transition-opacity hover:opacity-90 shrink-0"
                  style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}
                >
                  View Details
                </Link>
              </div>
            ))}
            {vendors && vendors.length === 0 && (
              <p className="text-sm" style={{ color: '#6E6E73' }}>No vendors found for this selection.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
