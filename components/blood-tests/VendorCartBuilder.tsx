'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { greedySetCover, type CoverProduct } from '@/lib/set-cover'

interface PeptideOption {
  name: string
  slug: string
  category: string | null
}

function formatPrice(cents: number): string {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`
}

export default function VendorCartBuilder({
  vendorName,
  peptides,
  products,
}: {
  vendorName: string
  peptides: PeptideOption[]
  products: CoverProduct[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targetNames, setTargetNames] = useState<{ id: string; name: string }[] | null>(null)
  const [result, setResult] = useState<ReturnType<typeof greedySetCover> | null>(null)

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

  async function buildCart() {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_protocol_biomarkers', {
        peptide_slugs: [...selected],
      })
      if (rpcError) throw rpcError
      const rows = (data ?? []) as { biomarker_id: string; name: string }[]
      setTargetNames(rows.map((r) => ({ id: r.biomarker_id, name: r.name })))
      setResult(greedySetCover(rows.map((r) => r.biomarker_id), products))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong building your cart.')
    } finally {
      setLoading(false)
    }
  }

  const nameById = useMemo(() => new Map((targetNames ?? []).map((t) => [t.id, t.name])), [targetNames])

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E7' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#186784' }}>
        Cart Builder
      </p>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1D1D1F' }}>
        What should you actually buy from {vendorName}?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6E6E73' }}>
        Pick your peptides — we&apos;ll find the cheapest combination of {vendorName}&apos;s panels and à la carte tests that covers what you need to monitor.
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

      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          onClick={buildCart}
          disabled={selected.size === 0 || loading}
          className="text-sm font-semibold rounded-xl px-5 py-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
        >
          {loading ? 'Building…' : `Build My Cart (${selected.size} selected)`}
        </button>
        {error && <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>}
      </div>

      {result && (
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid #E5E5E7' }}>
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: '#1D1D1F' }}>Your Cart</h3>
            <p className="text-2xl font-bold" style={{ color: '#186784' }}>{formatPrice(result.totalCents)}</p>
          </div>

          {result.selected.length === 0 ? (
            <p className="text-sm" style={{ color: '#6E6E73' }}>
              {vendorName} doesn&apos;t sell any of the markers your selected peptides need.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {result.selected.map(({ product }, i) => (
                <div key={product.id} className="rounded-xl p-4" style={{ backgroundColor: '#F5F5F7' }}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                      {product.name}
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: product.productType === 'panel' ? '#EDE9FE' : '#DBEAFE', color: product.productType === 'panel' ? '#7C3AED' : '#2563EB' }}>
                        {product.productType === 'panel' ? 'Panel' : 'À La Carte'}
                      </span>
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>{formatPrice(product.priceCents)}</p>
                  </div>
                  <p className="text-xs" style={{ color: '#6E6E73' }}>
                    Covers {result.selected[i].newMarkersCovered.length} of your markers
                    {result.selected[i].newMarkersCovered.length <= 6 && (
                      <>: {result.selected[i].newMarkersCovered.map((id) => nameById.get(id) ?? id).join(', ')}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.missingBiomarkerIds.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FEE2E2' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#DC2626' }}>
                {vendorName} doesn&apos;t sell {result.missingBiomarkerIds.length} of your markers
              </p>
              <p className="text-sm" style={{ color: '#7F1D1D' }}>
                {result.missingBiomarkerIds.map((id) => nameById.get(id) ?? id).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
