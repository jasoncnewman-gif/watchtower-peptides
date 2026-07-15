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

export default function VendorCard({ vendor }: { vendor: LabVendor }) {
  const businessLabel = vendor.businessModel ? BUSINESS_MODEL_LABEL[vendor.businessModel] : null
  const collectionLabel = vendor.collectionMethod ? COLLECTION_METHOD_LABEL[vendor.collectionMethod] : null

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="mb-3">
        <Link href={`/blood-tests/${vendor.slug}`} className="hover:opacity-80 transition-opacity">
          <h3 className="font-bold text-xl" style={{ color: '#1D1D1F' }}>{vendor.name}</h3>
        </Link>
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
