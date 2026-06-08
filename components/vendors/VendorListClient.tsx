'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Vendor } from '@/lib/supabase'

const SCORE_MAXES: Record<string, number> = {
  lab_testing: 40, purity_accuracy: 25, transparency: 25, pricing_reliability: 10,
}

const FILTER_OPTIONS = [
  { value: '',           label: 'All vendors'        },
  { value: 'elite',      label: 'Elite (85+)'        },
  { value: 'trusted',    label: 'Trusted (70–84)'    },
  { value: 'acceptable', label: 'Acceptable (55–69)' },
  { value: 'watchlist',  label: 'Watchlist (45–54)'  },
  { value: 'avoid',      label: 'Avoid (below 45)'   },
]

function scoreTier(score: number): string {
  if (score >= 85) return 'elite'
  if (score >= 70) return 'trusted'
  if (score >= 55) return 'acceptable'
  if (score >= 45) return 'watchlist'
  return 'avoid'
}

function ratingBadge(score: number): { label: string; bg: string; text: string } {
  if (score >= 85) return { label: 'Elite',      bg: '#DCFCE7', text: '#16A34A' }
  if (score >= 70) return { label: 'Trusted',    bg: '#D1FAE5', text: '#059669' }
  if (score >= 55) return { label: 'Acceptable', bg: '#FEF3C7', text: '#D97706' }
  if (score >= 45) return { label: 'Watchlist',  bg: '#FED7AA', text: '#EA580C' }
  return                   { label: 'Avoid',      bg: '#FEE2E2', text: '#DC2626' }
}

function scoreColor(score: number) {
  if (score >= 70) return '#16A34A'
  if (score >= 45) return '#D97706'
  return '#DC2626'
}

export default function VendorListClient({ vendors }: { vendors: Vendor[] }) {
  const [query, setQuery]       = useState('')
  const [tierFilter, setTier]   = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return vendors.filter(v => {
      const matchesQuery = !q ||
        v.name.toLowerCase().includes(q) ||
        v.website.toLowerCase().includes(q) ||
        v.verdict.toLowerCase().includes(q)
      const matchesTier = !tierFilter || scoreTier(v.overall_score) === tierFilter
      return matchesQuery && matchesTier
    })
  }, [vendors, query, tierFilter])

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
        <input
          type="text"
          placeholder="Search vendors…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F', border: '1px solid #E5E5E7' }}
        />
        <select
          value={tierFilter}
          onChange={e => setTier(e.target.value)}
          className="rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            backgroundColor: '#FFFFFF',
            color: tierFilter ? '#1D1D1F' : '#6E6E73',
            border: '1px solid #E5E5E7',
          }}
        >
          {FILTER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(vendor => {
            const rating = ratingBadge(vendor.overall_score)
            const color  = scoreColor(vendor.overall_score)
            return (
              <Link
                key={vendor.slug}
                href={`/vendors/${vendor.slug}`}
                className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base truncate" style={{ color: '#1D1D1F' }}>
                      {vendor.name}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: '#6E6E73' }}>{vendor.website}</p>
                  </div>
                  <div className="text-center ml-3 shrink-0">
                    <div
                      className="text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}12`, color }}
                    >
                      {vendor.overall_score}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#6E6E73' }}>/ 100</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: rating.bg, color: rating.text }}
                  >
                    {rating.label}
                  </span>
                  {vendor.has_coa && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                      ✓ COA Verified
                    </span>
                  )}
                  {vendor.verified_domain && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                      ✓ Verified Domain
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
                    {vendor.location}
                  </span>
                  {vendor.shipping_free_threshold === 0 ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                      Free shipping
                    </span>
                  ) : vendor.shipping_free_threshold != null ? (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
                      Free ship ${vendor.shipping_free_threshold}+
                    </span>
                  ) : vendor.shipping_flat_fee != null ? (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
                      {vendor.shipping_flat_fee === 0 ? 'Free shipping' : `Ship $${vendor.shipping_flat_fee.toFixed(2)}`}
                    </span>
                  ) : null}
                </div>

                {/* Verdict */}
                <p className="text-sm mt-3 line-clamp-2 leading-relaxed" style={{ color: '#6E6E73' }}>
                  {vendor.verdict}
                </p>

                {/* Score mini-bars (4 sub-scores, community_reputation excluded) */}
                <div className="mt-4 flex gap-1">
                  {Object.entries(vendor.scores)
                    .filter(([key]) => key in SCORE_MAXES)
                    .map(([key, val]) => {
                      const pct = Math.min(100, (val / SCORE_MAXES[key]) * 100)
                      return (
                        <div key={key} className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#E5E5E7' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      )
                    })}
                </div>
                <p className="text-xs mt-2" style={{ color: '#6E6E73' }}>
                  Last reviewed:{' '}
                  {vendor.last_reviewed
                    ? new Date(vendor.last_reviewed).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>No vendors found</p>
          <p className="text-sm" style={{ color: '#6E6E73' }}>Try adjusting your search or filter.</p>
        </div>
      )}
    </>
  )
}
