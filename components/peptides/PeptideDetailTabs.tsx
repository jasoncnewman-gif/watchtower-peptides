'use client'

import { useState } from 'react'
import Link from 'next/link'
import EvidenceBadge from './EvidenceBadge'

// ── types ─────────────────────────────────────────────────────────────────

interface MechanismEntry   { title: string; body: string }
interface ApplicationEntry { area: string; evidence: string; description: string }
interface DosageRange      { route: string; range: string; frequency: string; notes: string }
interface StudyEntry       { title: string; authors: string; year: number; journal: string; pmid: string; url: string }
interface PriceEntry       { size: number; price: number; onSale: boolean; inStock: boolean; vialCount?: number }
interface BlendComponent   { name: string; slug: string; dose_mg: number | null; contribution: string }

interface VendorPriceRow {
  id: string
  name: string
  slug: string | null
  website: string | null
  overall_score: number | null
  status: string
  prices: PriceEntry[]
}

export interface PeptideDetailData {
  name: string
  full_name: string | null
  slug: string
  tagline: string | null
  fda_status: string | null
  research_status: string | null
  half_life: string | null
  molecular_weight: string | null
  sequence: string | null
  overview: string | null
  description: string | null
  aliases: string[] | null
  typical_dosage: string | null
  reconstitution_instructions: string | null
  mechanism: MechanismEntry[] | null
  research_applications: ApplicationEntry[] | null
  dosage: { disclaimer: string; ranges: DosageRange[] } | null
  safety_profile: { rating: string; known_effects: string[]; unknown_risks: string[] } | null
  studies: StudyEntry[] | null
  blend_components: BlendComponent[] | null
}

export interface VendorTabData {
  sizes: number[]
  vendors: VendorPriceRow[]
  sizeUnknown: number
}

// ── helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  recommended:       { label: 'Recommended',      bg: '#DCFCE7', text: '#16A34A' },
  caution:           { label: 'Use With Caution',  bg: '#FEF3C7', text: '#D97706' },
  'not-recommended': { label: 'Not Recommended',   bg: '#FEE2E2', text: '#DC2626' },
  'under-review':    { label: 'Under Review',      bg: '#EDE9FE', text: '#7C3AED' },
}

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: 'FDA Approved',  bg: '#DCFCE7', text: '#16A34A' },
  'not-approved':  { label: 'Not Approved',  bg: '#FEF3C7', text: '#D97706' },
  'research-only': { label: 'Research Only', bg: '#DBEAFE', text: '#2563EB' },
}

function scoreColor(score: number) {
  if (score >= 75) return '#16A34A'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function displayStatus(status: string, score: number | null) {
  if (status === 'flagged' || status === 'closed') return 'not-recommended'
  if (status === 'inactive') return 'caution'
  if (score === null) return 'under-review'
  if (score >= 80) return 'recommended'
  if (score >= 55) return 'caution'
  return 'not-recommended'
}

function EmptyState({ message, browseLink }: { message: string; browseLink?: boolean }) {
  return (
    <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#F5F5F7' }}>
      <p className="text-sm" style={{ color: '#6E6E73' }}>
        {message}
        {browseLink && (
          <>
            {' '}or{' '}
            <Link href="/peptides" className="underline transition-opacity hover:opacity-70" style={{ color: '#186784' }}>
              browse completed profiles →
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

// ── tab panels ─────────────────────────────────────────────────────────────

function OverviewTab({ peptide }: { peptide: PeptideDetailData }) {
  const text = peptide.overview ?? peptide.description

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {(peptide.half_life || peptide.molecular_weight) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {peptide.half_life && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#F5F5F7' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#186784' }}>Half-Life</p>
              <p className="text-base font-medium" style={{ color: '#1D1D1F' }}>{peptide.half_life}</p>
            </div>
          )}
          {peptide.molecular_weight && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#F5F5F7' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#186784' }}>Molecular Weight</p>
              <p className="text-base font-medium" style={{ color: '#1D1D1F' }}>{peptide.molecular_weight}</p>
            </div>
          )}
        </div>
      )}

      {/* Overview text */}
      {text ? (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <p className="leading-relaxed" style={{ color: '#6E6E73' }}>{text}</p>
        </div>
      ) : (
        <EmptyState message="We're building this profile now. Check back soon," browseLink />
      )}

      {/* Aliases */}
      {(peptide.aliases ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#186784' }}>Also Known As</p>
          <div className="flex flex-wrap gap-2">
            {peptide.aliases!.map(a => (
              <span key={a} className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Amino acid sequence */}
      {peptide.sequence && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#186784' }}>Amino Acid Sequence</p>
          <div className="rounded-2xl p-4 overflow-x-auto" style={{ backgroundColor: '#1D1D1F' }}>
            <pre className="text-xs tracking-widest break-all whitespace-pre-wrap" style={{ color: '#E5E5E7', fontFamily: 'monospace' }}>
              {peptide.sequence}
            </pre>
          </div>
        </div>
      )}

      {/* Reconstitution link */}
      {peptide.reconstitution_instructions && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#F5F5F7' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#186784' }}>Reconstitution</p>
          <p className="text-sm mb-2" style={{ color: '#6E6E73' }}>{peptide.reconstitution_instructions}</p>
          <Link href="/calculator" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: '#186784' }}>
            Open Reconstitution Calculator →
          </Link>
        </div>
      )}
    </div>
  )
}

function MechanismTab({ entries }: { entries: MechanismEntry[] | null }) {
  if (!entries?.length) return <EmptyState message="We're building this profile now. Check back soon," browseLink />

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-5 rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
          >
            {i + 1}
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#1D1D1F' }}>{entry.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>{entry.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ResearchTab({ entries }: { entries: ApplicationEntry[] | null }) {
  if (!entries?.length) return <EmptyState message="We're building this profile now. Check back soon," browseLink />

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold" style={{ color: '#1D1D1F' }}>{entry.area}</h3>
            <EvidenceBadge level={entry.evidence} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>{entry.description}</p>
        </div>
      ))}
    </div>
  )
}

function DosageTab({ dosage, typical }: { dosage: PeptideDetailData['dosage']; typical: string | null }) {
  return (
    <div className="space-y-6">
      {/* Disclaimer — always shown */}
      <div className="rounded-2xl p-5 flex gap-4" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
        <span className="text-lg shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: '#92400E' }}>Research Use Only</p>
          <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>
            {dosage?.disclaimer ?? 'These dosages are for research purposes only and do not constitute medical advice. Consult a qualified healthcare professional before use.'}
          </p>
        </div>
      </div>

      {dosage?.ranges?.length ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {dosage.ranges.map((r, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#186784' }}>{r.route}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6E6E73' }}>Range</span>
                  <span className="font-medium" style={{ color: '#1D1D1F' }}>{r.range}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6E6E73' }}>Frequency</span>
                  <span className="font-medium" style={{ color: '#1D1D1F' }}>{r.frequency}</span>
                </div>
                {r.notes && (
                  <p className="text-xs pt-2 leading-relaxed" style={{ color: '#6E6E73', borderTop: '1px solid #E5E5E7' }}>{r.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : typical ? (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#186784' }}>Typical Dosage</p>
          <p className="text-sm" style={{ color: '#6E6E73' }}>{typical}</p>
        </div>
      ) : (
        <EmptyState message="We're building this profile now. Check back soon," browseLink />
      )}
    </div>
  )
}

function SafetyTab({ profile }: { profile: PeptideDetailData['safety_profile'] }) {
  if (!profile) return <EmptyState message="We're building this profile now. Check back soon," browseLink />

  return (
    <div className="space-y-6">
      {profile.rating && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: '#6E6E73' }}>Overall Safety Rating</span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F' }}>
            {profile.rating}
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#186784' }}>
            Observed Effects
          </p>
          {profile.known_effects?.length ? (
            <ul className="space-y-2">
              {profile.known_effects.map((effect, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#6E6E73' }}>
                  <span className="mt-1 shrink-0" style={{ color: '#16A34A' }}>•</span>
                  {effect}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: '#6E6E73' }}>No data available.</p>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FEE2E2' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#DC2626' }}>
            Unknown Risks
          </p>
          {profile.unknown_risks?.length ? (
            <ul className="space-y-2">
              {profile.unknown_risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7F1D1D' }}>
                  <span className="mt-1 shrink-0">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: '#7F1D1D' }}>No specific risks documented.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StudiesTab({ studies }: { studies: StudyEntry[] | null }) {
  if (!studies?.length) return <EmptyState message="No studies have been added yet." />

  return (
    <div className="space-y-4">
      {studies.map((s, i) => (
        <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-semibold leading-snug" style={{ color: '#1D1D1F' }}>{s.title}</h3>
            {s.pmid && (
              <span className="text-xs font-medium px-2 py-1 rounded shrink-0" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                PMID {s.pmid}
              </span>
            )}
          </div>
          <p className="text-sm mb-1" style={{ color: '#6E6E73' }}>
            {s.authors} · {s.year} · <em>{s.journal}</em>
          </p>
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: '#186784' }}
            >
              View on PubMed ↗
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function VendorsTab({ vendorData }: { vendorData: VendorTabData }) {
  const { sizes, vendors, sizeUnknown } = vendorData
  const hasUnknownSizePricing = vendors.some(v => v.prices.some(p => p.size === sizeUnknown))

  return (
    <div className="space-y-6">
      {/* Independence disclaimer */}
      <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: '#F5F5F7', border: '1px solid #E5E5E7' }}>
        <span className="text-sm shrink-0">⚑</span>
        <p className="text-sm" style={{ color: '#6E6E73' }}>
          Scores are based on independently verified lab data, purity records, and transparency signals.
          No vendor pays for placement or score improvement.
        </p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState message="No vendors are currently carrying this peptide." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: '#F5F5F7' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E5E7' }}>
                  <th className="text-left px-5 py-4 font-semibold" style={{ color: '#1D1D1F', minWidth: '180px' }}>Vendor</th>
                  <th className="text-center px-4 py-4 font-semibold" style={{ color: '#1D1D1F' }}>Score</th>
                  <th className="text-left px-4 py-4 font-semibold" style={{ color: '#1D1D1F' }}>Status</th>
                  {sizes.map(mg => (
                    <th key={mg} className="text-right px-4 py-4 font-semibold" style={{ color: '#1D1D1F' }}>
                      {mg}mg
                    </th>
                  ))}
                  {hasUnknownSizePricing && (
                    <th className="text-right px-4 py-4 font-semibold" style={{ color: '#1D1D1F' }}>Price</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor, i) => {
                  const ds = displayStatus(vendor.status, vendor.overall_score)
                  const sc = STATUS_CONFIG[ds] ?? STATUS_CONFIG['under-review']
                  const score = vendor.overall_score ?? 0
                  const color = scoreColor(score)
                  const priceBySize = new Map(vendor.prices.map(p => [p.size, p]))

                  return (
                    <tr
                      key={vendor.id}
                      style={{ borderBottom: i < vendors.length - 1 ? '1px solid #E5E5E7' : undefined, backgroundColor: '#FFFFFF' }}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/vendors/${vendor.slug ?? vendor.id}`}
                          className="font-medium hover:underline"
                          style={{ color: '#1D1D1F' }}
                        >
                          {vendor.name}
                        </Link>
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs mt-0.5 hover:underline block"
                            style={{ color: '#6E6E73' }}
                          >
                            {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {score}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      {sizes.map(mg => {
                        const entry = priceBySize.get(mg)
                        return (
                          <td key={mg} className="px-4 py-4 text-right">
                            {entry ? (
                              <span style={{ color: entry.onSale ? '#16A34A' : '#1D1D1F', fontWeight: entry.onSale ? 600 : 400 }}>
                                ${entry.price.toFixed(2)}
                                {entry.vialCount && entry.vialCount > 1 && <span className="ml-1 text-xs" style={{ color: '#6E6E73' }}>({entry.vialCount} vials)</span>}
                                {!entry.inStock && <span className="ml-1 text-xs" style={{ color: '#6E6E73' }}>(OOS)</span>}
                              </span>
                            ) : (
                              <span style={{ color: '#C7C7CC' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      {hasUnknownSizePricing && (() => {
                        const entry = priceBySize.get(sizeUnknown)
                        return (
                          <td className="px-4 py-4 text-right">
                            {entry ? (
                              <span style={{ color: entry.onSale ? '#16A34A' : '#1D1D1F', fontWeight: entry.onSale ? 600 : 400 }}>
                                ${entry.price.toFixed(2)}
                                {entry.vialCount && entry.vialCount > 1 && <span className="ml-1 text-xs" style={{ color: '#6E6E73' }}>({entry.vialCount} vials)</span>}
                                {!entry.inStock && <span className="ml-1 text-xs" style={{ color: '#6E6E73' }}>(OOS)</span>}
                              </span>
                            ) : (
                              <span style={{ color: '#C7C7CC' }}>—</span>
                            )}
                          </td>
                        )
                      })()}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: '#6E6E73' }}>
            Green prices indicate a current sale. OOS = out of stock. Vendor scores are out of 100.
          </p>
        </>
      )}
    </div>
  )
}

function ComponentsTab({ components }: { components: BlendComponent[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: '#F5F5F7', border: '1px solid #E5E5E7' }}>
        <span className="text-sm shrink-0">ℹ️</span>
        <p className="text-sm" style={{ color: '#6E6E73' }}>
          Exact formulations may vary by vendor. Always verify the Certificate of Analysis for the specific
          batch you receive. Click any ingredient to read its full research profile.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {components.map((c, i) => (
          <Link
            key={i}
            href={`/peptides/${c.slug}`}
            className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
            style={{ backgroundColor: '#F5F5F7' }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-base" style={{ color: '#1D1D1F' }}>{c.name}</h3>
              {c.dose_mg != null && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
                >
                  {c.dose_mg}mg
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>{c.contribution}</p>
            <p className="text-xs font-medium mt-3" style={{ color: '#186784' }}>
              View full profile →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────

const BASE_TABS = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'mechanism',  label: 'Mechanism'  },
  { id: 'research',   label: 'Research'   },
  { id: 'dosage',     label: 'Dosage'     },
  { id: 'safety',     label: 'Safety'     },
  { id: 'studies',    label: 'Studies'    },
  { id: 'vendors',    label: 'Vendors'    },
]

export default function PeptideDetailTabs({
  peptide,
  vendorData,
}: {
  peptide: PeptideDetailData
  vendorData: VendorTabData
}) {
  const hasComponents = (peptide.blend_components?.length ?? 0) > 0

  const TABS = hasComponents
    ? [
        { id: 'overview',    label: 'Overview'    },
        { id: 'components',  label: 'Components'  },
        ...BASE_TABS.slice(1),
      ]
    : BASE_TABS

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <>
      {/* Tab bar */}
      <div className="overflow-x-auto mb-8" style={{ borderBottom: '1px solid #E5E5E7' }}>
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                color: activeTab === tab.id ? '#1D1D1F' : '#6E6E73',
                borderBottom: activeTab === tab.id ? '2px solid #186784' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview'   && <OverviewTab      peptide={peptide} />}
      {activeTab === 'components' && <ComponentsTab    components={peptide.blend_components ?? []} />}
      {activeTab === 'mechanism'  && <MechanismTab entries={peptide.mechanism} />}
      {activeTab === 'research'  && <ResearchTab  entries={peptide.research_applications} />}
      {activeTab === 'dosage'    && <DosageTab    dosage={peptide.dosage} typical={peptide.typical_dosage} />}
      {activeTab === 'safety'    && <SafetyTab    profile={peptide.safety_profile} />}
      {activeTab === 'studies'   && <StudiesTab   studies={peptide.studies} />}
      {activeTab === 'vendors'   && <VendorsTab   vendorData={vendorData} />}
    </>
  )
}
