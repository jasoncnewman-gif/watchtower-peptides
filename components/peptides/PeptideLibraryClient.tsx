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

export default function PeptideLibraryClient({ peptides }: { peptides: PeptideItem[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const statuses = useMemo(() => {
    const set = new Set(peptides.map(p => p.researchStatus).filter(Boolean) as string[])
    return [...set].sort()
  }, [peptides])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return peptides.filter(p => {
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.tagline?.toLowerCase().includes(q) ?? false) ||
        (p.fullName?.toLowerCase().includes(q) ?? false)
      const matchesStatus = !statusFilter || p.researchStatus === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [peptides, query, statusFilter])

  return (
    <>
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
