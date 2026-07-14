import Link from 'next/link'
import type { LabVendor } from '@/lib/supabase'

const BUSINESS_MODEL_LABEL: Record<string, string> = {
  subscription: 'Subscription',
  panel: 'One-Time',
  'ala-carte': 'À La Carte',
  hybrid: 'Hybrid',
  clinic: 'Managed Protocol',
}

const COLLECTION_METHOD_LABEL: Record<string, string> = {
  'venous-draw': 'Venous Draw',
  fingerstick: 'Fingerstick',
  'arm-device': 'Arm Device',
  'at-home-kit': 'At-Home Kit',
  'mobile-phlebotomist': 'Mobile Draw',
  'clinic-draw': 'Clinic Draw',
  multiple: 'Multiple Options',
}

function formatPrice(cents: number | null): string {
  if (cents === null) return 'Price varies'
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`
}

export default function VendorCard({ vendor, entryTierPriceCents }: { vendor: LabVendor; entryTierPriceCents?: number | null }) {
  const businessLabel = vendor.businessModel ? BUSINESS_MODEL_LABEL[vendor.businessModel] : null
  const collectionLabel = vendor.collectionMethod ? COLLECTION_METHOD_LABEL[vendor.collectionMethod] : null
  // Prefer the cheapest named tier's price (parsed from a clean pricing table) over
  // lab_vendors.entry_price_cents, which was regex-extracted from free-text research notes
  // and can grab the wrong dollar figure (e.g. a monthly membership fee mentioned before
  // the actual panel price). Falls back to entry_price_cents only when no tier exists.
  const displayPriceCents = entryTierPriceCents ?? vendor.entryPriceCents

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link href={`/blood-tests/${vendor.slug}`} className="hover:opacity-80 transition-opacity">
          <h3 className="font-bold text-xl" style={{ color: '#1D1D1F' }}>{vendor.name}</h3>
        </Link>
        {vendor.audienceFitScore !== null && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
            title="Audience fit score — how well this vendor suits peptide researchers specifically, not a customer/quality rating"
          >
            {vendor.audienceFitScore}/10 Fit
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {businessLabel && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
            {businessLabel}
          </span>
        )}
        {collectionLabel && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F5F7', color: '#6E6E73' }}>
            {collectionLabel}
          </span>
        )}
        {vendor.cliaCertified && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
            CLIA Certified
          </span>
        )}
        {vendor.peptideRxOffered && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
            Peptide Rx
          </span>
        )}
      </div>

      <div className="mb-5">
        <p className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>{formatPrice(displayPriceCents)}</p>
        {vendor.trueAnnualCostCents !== null && vendor.trueAnnualCostCents !== displayPriceCents && (
          <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
            {vendor.trueAnnualCostCents === 0
              ? 'No recurring cost — one-time purchase'
              : `${formatPrice(vendor.trueAnnualCostCents)} true annual cost`}
          </p>
        )}
      </div>

      <Link
        href={`/blood-tests/${vendor.slug}`}
        className="block text-center text-sm font-semibold rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}
      >
        View Panel Details
      </Link>

      {vendor.affiliateProgram && (
        <p className="text-xs mt-3 text-center" style={{ color: '#C7C7CC' }}>
          Affiliate link — Watchtower may earn a referral fee
        </p>
      )}
    </div>
  )
}
