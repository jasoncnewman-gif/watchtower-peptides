'use client'

import { useState, useMemo } from 'react'
import PeptideCard from './PeptideCard'

interface PeptideItem {
  name: string
  fullName: string | null
  tagline: string | null
  fdaStatus: string | null
  researchStatus: string | null
  slug: string
  vendorCount: number
  studyCount: number
  category: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  healing:       'Healing',
  performance:   'Performance',
  'weight-loss': 'Weight Loss',
  'sexual-health': 'Sexual Health',
  blend:         'Blends',
}

const CATEGORY_ORDER = ['healing', 'performance', 'weight-loss', 'sexual-health', 'blend']

export default function PeptideLibraryClient({ peptides }: { peptides: PeptideItem[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const statuses = useMemo(() => {
    const set = new Set(peptides.map(p => p.researchStatus).filter(Boolean) as string[])
    return [...set].sort()
  }, [peptides])

  const availableCategories = useMemo(() => {
    const set = new Set(peptides.map(p => p.category).filter(Boolean) as string[])
    return CATEGORY_ORDER.filter(c => set.has(c))
  }, [peptides])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return peptides.filter(p => {
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.tagline?.toLowerCase().includes(q) ?? false) ||
        (p.fullName?.toLowerCase().includes(q) ?? false)
      const matchesStatus = !statusFilter || p.researchStatus === statusFilter
      const matchesCategory = !categoryFilter || p.category === categoryFilter
      return matchesQuery && matchesStatus && matchesCategory
    })
  }, [peptides, query, statusFilter, categoryFilter])

  return (
    <>
      {/* Category pills */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setCategoryFilter('')}
            className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
            style={
              !categoryFilter
                ? { backgroundColor: '#1D1D1F', color: '#FFFFFF' }
                : { backgroundColor: '#F5F5F7', color: '#6E6E73' }
            }
          >
            All
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
              className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
              style={
                categoryFilter === cat
                  ? { backgroundColor: '#186784', color: '#FFFFFF' }
                  : { backgroundColor: '#F5F5F7', color: '#6E6E73' }
              }
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Search + evidence filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search peptides…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F', border: '1px solid #E5E5E7' }}
        />
        {statuses.length > 0 && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: '#FFFFFF',
              color: statusFilter ? '#1D1D1F' : '#6E6E73',
              border: '1px solid #E5E5E7',
            }}
          >
            <option value="">All evidence levels</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => <PeptideCard key={p.slug} {...p} />)}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>No peptides found</p>
          <p className="text-sm" style={{ color: '#6E6E73' }}>Try adjusting your search or filter.</p>
        </div>
      )}
    </>
  )
}
