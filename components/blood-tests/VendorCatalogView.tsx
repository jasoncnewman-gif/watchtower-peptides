'use client'

import { Fragment, useState, useMemo } from 'react'

interface CatalogProduct {
  id: string
  name: string
  productType: 'panel' | 'ala-carte'
  priceCents: number
  rawMarkerCount: number
  markers: string[]
}

function formatPrice(cents: number): string {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`
}

type SortKey = 'name' | 'priceCents' | 'rawMarkerCount'

export default function VendorCatalogView({ vendorName, products }: { vendorName: string; products: CatalogProduct[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const panels = useMemo(() => products.filter((p) => p.productType === 'panel'), [products])
  const alaCarte = useMemo(() => products.filter((p) => p.productType === 'ala-carte'), [products])

  const filteredSorted = useMemo(() => {
    const q = query.toLowerCase()
    let rows = alaCarte
    if (q) {
      rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.markers.some((m) => m.toLowerCase().includes(q)))
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string') return av.localeCompare(bv as string) * sortDir
      return ((av as number) - (bv as number)) * sortDir
    })
  }, [alaCarte, query, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(key)
      setSortDir(1)
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#186784' }}>
        Full Catalog
      </p>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1D1D1F' }}>
        Every test {vendorName} sells
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6E6E73' }}>
        The Cart Builder above picks the best combination automatically — this is the full underlying catalog, panels and à la carte both, for reference.
      </p>

      <h3 className="text-lg font-bold mb-3" style={{ color: '#1D1D1F' }}>Bundled Panels ({panels.length})</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {panels.map((p) => {
          const isOpen = openId === p.id
          return (
            <div key={p.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E7' }}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>{p.rawMarkerCount} markers</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#186784' }}>{formatPrice(p.priceCents)}</span>
                  <span style={{ color: '#C7C7CC', transform: isOpen ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s ease' }}>▸</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-xs leading-relaxed" style={{ color: '#6E6E73', borderTop: '1px solid #E5E5E7', paddingTop: '12px' }}>
                  {p.markers.join(', ')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <h3 className="text-lg font-bold mb-3" style={{ color: '#1D1D1F' }}>À La Carte Catalog ({alaCarte.length})</h3>
      <input
        type="text"
        placeholder="Search by test name or marker (e.g. &quot;cortisol&quot;, &quot;thyroid&quot;)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
        style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F', border: '1px solid #E5E5E7' }}
      />
      <p className="text-xs mb-3" style={{ color: '#6E6E73' }}>{filteredSorted.length} of {alaCarte.length}</p>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E5E7' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ backgroundColor: '#FFFFFF' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F5F7' }}>
                {([
                  ['name', 'Test'],
                  ['priceCents', 'Price'],
                  ['rawMarkerCount', 'Markers'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-4 py-3 font-semibold cursor-pointer select-none"
                    style={{ color: sortKey === key ? '#186784' : '#1D1D1F' }}
                  >
                    {label} {sortKey === key ? (sortDir === 1 ? '▾' : '▴') : ''}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#1D1D1F' }}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((p) => {
                const isOpen = openId === p.id
                const preview = p.markers.slice(0, 3).join(', ') + (p.markers.length > 3 ? `, +${p.markers.length - 3} more` : '')
                return (
                  <Fragment key={p.id}>
                    <tr
                      onClick={() => setOpenId(isOpen ? null : p.id)}
                      className="cursor-pointer"
                      style={{ borderTop: '1px solid #E5E5E7' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#1D1D1F' }}>{p.name}</td>
                      <td className="px-4 py-3" style={{ color: '#186784', fontWeight: 600 }}>{formatPrice(p.priceCents)}</td>
                      <td className="px-4 py-3" style={{ color: '#6E6E73' }}>{p.rawMarkerCount}</td>
                      <td className="px-4 py-3" style={{ color: '#6E6E73', fontSize: '12.5px' }}>{preview}</td>
                    </tr>
                    {isOpen && (
                      <tr style={{ backgroundColor: '#F5F5F7' }}>
                        <td colSpan={4} className="px-4 py-3 text-xs leading-relaxed" style={{ color: '#6E6E73' }}>
                          {p.markers.join(', ')}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
