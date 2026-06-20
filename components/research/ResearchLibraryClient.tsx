'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const PEPTIDE_COLORS: Record<string, string> = {
  'BPC-157':          '#186784',
  'TB-500':           '#2D7A4F',
  'CJC-1295':         '#7B4F9E',
  'Ipamorelin':       '#7B4F9E',
  'GHK-Cu':           '#B8860B',
  'Sermorelin':       '#C0392B',
  'Tesamorelin':      '#C0392B',
  'NAD+':             '#1A6B5C',
  'PT-141':           '#D35400',
  'Thymosin Alpha-1': '#2980B9',
  'MOTS-c':           '#1A6B5C',
}

function peptideColor(peptide: string | null): string {
  if (!peptide) return '#6E6E73'
  return PEPTIDE_COLORS[peptide] ?? '#186784'
}

type Article = {
  slug: string
  title: string
  meta_description: string | null
  peptide: string | null
  reading_time_minutes: number | null
  published_at: string | null
}

export default function ResearchLibraryClient({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return articles
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.meta_description ?? '').toLowerCase().includes(q) ||
      (a.peptide ?? '').toLowerCase().includes(q)
    )
  }, [articles, query])

  return (
    <>
      {/* Search bar */}
      <div className="mb-8">
        <input
          type="search"
          placeholder="Search articles, peptides…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-md rounded-lg px-4 py-3 text-sm outline-none"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D1D6',
            color: '#1D1D1F',
          }}
        />
      </div>

      {!filtered.length ? (
        <p className="text-center py-16" style={{ color: '#6E6E73' }}>
          No articles match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Link key={a.slug} href={`/research/${a.slug}`}>
              <article
                className="h-full rounded-xl p-6 flex flex-col gap-3 transition-shadow hover:shadow-md"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E7' }}
              >
                {a.peptide && (
                  <span
                    className="text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-full w-fit"
                    style={{
                      backgroundColor: `${peptideColor(a.peptide)}18`,
                      color: peptideColor(a.peptide),
                    }}
                  >
                    {a.peptide}
                  </span>
                )}
                <h2 className="text-base font-semibold leading-snug" style={{ color: '#1D1D1F' }}>
                  {a.title}
                </h2>
                {a.meta_description && (
                  <p className="text-sm leading-relaxed flex-1" style={{ color: '#6E6E73' }}>
                    {a.meta_description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #E5E5E7' }}>
                  {a.reading_time_minutes && (
                    <span className="text-xs" style={{ color: '#6E6E73' }}>
                      {a.reading_time_minutes} min read
                    </span>
                  )}
                  {a.published_at && (
                    <span className="text-xs" style={{ color: '#6E6E73' }}>
                      {new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
