import Link from 'next/link'
import EvidenceBadge from './EvidenceBadge'

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: 'FDA Approved',  bg: '#DCFCE7', text: '#16A34A' },
  'not-approved':  { label: 'Not Approved',  bg: '#FEF3C7', text: '#D97706' },
  'research-only': { label: 'Research Only', bg: '#DBEAFE', text: '#2563EB' },
}

interface PeptideCardProps {
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

export default function PeptideCard({
  name, fullName, tagline, fdaStatus, researchStatus, slug, vendorCount, studyCount, category,
}: PeptideCardProps) {
  const isBlend = category === 'blend'
  const fda = !isBlend && fdaStatus ? FDA_CONFIG[fdaStatus] : null

  return (
    <Link
      href={`/peptides/${slug}`}
      className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-bold text-xl" style={{ color: '#1D1D1F' }}>{name}</h2>
        {isBlend ? (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}
          >
            Blend
          </span>
        ) : fda && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: fda.bg, color: fda.text }}
          >
            {fda.label}
          </span>
        )}
      </div>

      {fullName && (
        <p className="text-sm mb-2" style={{ color: '#6E6E73' }}>{fullName}</p>
      )}

      <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: '#6E6E73' }}>
        {tagline ?? `Compare prices from ${vendorCount} vendor${vendorCount !== 1 ? 's' : ''}.`}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {researchStatus && <EvidenceBadge level={researchStatus} />}
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
          {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
        </span>
        {studyCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
            {studyCount} {studyCount === 1 ? 'study' : 'studies'}
          </span>
        )}
      </div>
    </Link>
  )
}
