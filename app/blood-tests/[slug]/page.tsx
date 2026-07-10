import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase, type DbLabVendor, type DbVendorTier } from "@/lib/supabase";
import type { CoverProduct } from "@/lib/set-cover";
import VendorCartBuilder from "@/components/blood-tests/VendorCartBuilder";
import VendorCatalogView from "@/components/blood-tests/VendorCatalogView";

const BUSINESS_MODEL_LABEL: Record<string, string> = {
  subscription: "Subscription", panel: "One-Time", "ala-carte": "À La Carte",
  hybrid: "Hybrid", clinic: "Managed Protocol",
};
const COLLECTION_METHOD_LABEL: Record<string, string> = {
  "venous-draw": "Venous Draw", fingerstick: "Fingerstick", "arm-device": "Arm Device",
  "at-home-kit": "At-Home Kit", "mobile-phlebotomist": "Mobile Draw",
  "clinic-draw": "Clinic Draw", multiple: "Multiple Options",
};
const STATUS_CONFIG: Record<string, { label: string; legend: string; bg: string; text: string }> = {
  included: { label: "✓", legend: "Included", bg: "#DCFCE7", text: "#16A34A" },
  addon: { label: "+", legend: "Available as add-on", bg: "#FEF3C7", text: "#D97706" },
  unavailable: { label: "✗", legend: "Not available", bg: "#FEE2E2", text: "#DC2626" },
  unconfirmed: { label: "?", legend: "Unconfirmed", bg: "#F5F5F7", text: "#6E6E73" },
};

const TIER_LABELS: Record<number, string> = {
  1: "Safety Markers",
  2: "Efficacy Markers",
  3: "Advanced / Nice-to-Have",
};

function formatPrice(cents: number | null): string {
  if (cents === null) return "Price varies";
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

interface CoverageRow {
  status: string;
  specimen_type: string;
  accuracy_flag: string | null;
  tier_price_cents: number | null;
  addon_cost_cents: number | null;
  biomarkers: { name: string; slug: string; category: string; tier: number } | null;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("lab_vendors")
    .select("slug")
    .neq("eligibility", "EXCLUDE");
  return (data ?? []).map((v) => ({ slug: v.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("lab_vendors")
    .select("name, audience_fit_score")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { title: "Vendor Not Found" };

  return {
    title: `${data.name} Review — Blood Testing for Peptide Researchers | Watchtower`,
    description: `${data.name}'s blood testing panels scored against the biomarkers peptide researchers actually need to monitor. Audience fit: ${data.audience_fit_score ?? "unrated"}/10.`,
    alternates: { canonical: `/blood-tests/${slug}` },
  };
}

export default async function LabVendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: vendor } = await supabase
    .from("lab_vendors")
    .select("*")
    .eq("slug", slug)
    .single<DbLabVendor>();

  if (!vendor) notFound();

  const [{ data: tiers }, { data: coverage }, { data: products }, { data: peptideRows }] = await Promise.all([
    supabase
      .from("vendor_tiers")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("price_cents", { ascending: true, nullsFirst: false }),
    supabase
      .from("vendor_biomarker_coverage")
      .select("status, specimen_type, accuracy_flag, tier_price_cents, addon_cost_cents, biomarkers(name, slug, category, tier)")
      .eq("vendor_id", vendor.id),
    supabase
      .from("vendor_test_products")
      .select("id, name, product_type, price_cents, raw_marker_count, vendor_test_product_markers(raw_marker_name, biomarker_id)")
      .eq("vendor_id", vendor.id),
    supabase.from("peptides").select("name, slug, category").order("name"),
  ]);

  const tierRows = (tiers ?? []) as DbVendorTier[];
  // Same preference as the list page: entry-tier price (from the clean pricing table) over
  // entry_price_cents (regex-extracted from free-text notes, can grab the wrong figure).
  const entryTierPrice = tierRows.find((t) => t.is_entry_tier)?.price_cents ?? vendor.entry_price_cents;
  const coverageRows = ((coverage ?? []) as unknown as CoverageRow[])
    .filter((r) => r.biomarkers)
    .sort((a, b) => (a.biomarkers!.tier - b.biomarkers!.tier) || a.biomarkers!.name.localeCompare(b.biomarkers!.name));

  const coveredCount = coverageRows.filter((r) => r.status === "included").length;
  const businessLabel = vendor.business_model ? BUSINESS_MODEL_LABEL[vendor.business_model] : null;
  const collectionLabel = vendor.collection_method ? COLLECTION_METHOD_LABEL[vendor.collection_method] : null;

  // Cart Builder + Catalog View: only vendors migrated to the products model (Goodlabs first)
  // have this data. Dedupe biomarker_ids per product -- multiple raw vendor marker names can
  // map to the same canonical biomarker (e.g. all 17 CBC components collapse to one
  // "CBC with Differential" id).
  const cartProducts: CoverProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    priceCents: p.price_cents,
    productType: p.product_type as "panel" | "ala-carte",
    biomarkerIds: [...new Set((p.vendor_test_product_markers ?? []).map((m) => m.biomarker_id).filter((id): id is string => id !== null))],
    rawMarkerNames: (p.vendor_test_product_markers ?? []).map((m) => m.raw_marker_name),
  }));

  const catalogProducts = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    productType: p.product_type as "panel" | "ala-carte",
    priceCents: p.price_cents,
    rawMarkerCount: p.raw_marker_count,
    markers: (p.vendor_test_product_markers ?? []).map((m) => m.raw_marker_name),
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-16" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm mb-6" style={{ color: "#6E6E73" }}>
              <Link href="/" className="hover:opacity-70">Home</Link> {" › "}
              <Link href="/blood-tests" className="hover:opacity-70">Blood Tests</Link> {" › "}
              {vendor.name}
            </p>

            <h1 className="text-4xl font-bold mb-4" style={{ color: "#1D1D1F" }}>{vendor.name}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {businessLabel && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FFFFFF", color: "#6E6E73" }}>{businessLabel}</span>
              )}
              {collectionLabel && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FFFFFF", color: "#6E6E73" }}>{collectionLabel}</span>
              )}
              {vendor.clia_certified && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>CLIA Certified</span>
              )}
              {vendor.peptide_rx_offered && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>Peptide Rx</span>
              )}
              {vendor.hsa_fsa_eligible && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}>HSA/FSA Eligible</span>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold" style={{ color: "#1D1D1F" }}>{formatPrice(entryTierPrice)}</p>
                {vendor.true_annual_cost_cents !== null && vendor.true_annual_cost_cents !== entryTierPrice && (
                  <p className="text-sm" style={{ color: "#6E6E73" }}>
                    {vendor.true_annual_cost_cents === 0
                      ? "No recurring cost — one-time purchase"
                      : `${formatPrice(vendor.true_annual_cost_cents)} true annual cost`}
                  </p>
                )}
              </div>
              {vendor.audience_fit_score !== null && (
                <div>
                  <p className="text-3xl font-bold" style={{ color: "#186784" }}>{vendor.audience_fit_score}/10</p>
                  <p className="text-sm" style={{ color: "#6E6E73" }}>Audience fit score</p>
                </div>
              )}
            </div>

            <a
              href={vendor.affiliate_program && vendor.affiliate_url ? vendor.affiliate_url : vendor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold rounded-xl px-5 py-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1D1D1F", color: "#FFFFFF" }}
            >
              Visit {vendor.name} ↗
            </a>
            {vendor.affiliate_program && (
              <p className="text-xs mt-2" style={{ color: "#6E6E73" }}>Affiliate link</p>
            )}
          </div>
        </section>

        {cartProducts.length > 0 && (
          <>
            <section className="px-6 py-16">
              <div className="max-w-4xl mx-auto">
                <VendorCartBuilder vendorName={vendor.name} peptides={peptideRows ?? []} products={cartProducts} />
              </div>
            </section>
            <section className="px-6 py-16">
              <div className="max-w-4xl mx-auto">
                <VendorCatalogView vendorName={vendor.name} products={catalogProducts} />
              </div>
            </section>
          </>
        )}

        {cartProducts.length === 0 && (
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#1D1D1F" }}>Peptide-Critical Biomarker Coverage</h2>
            <p className="text-sm mb-4" style={{ color: "#6E6E73" }}>
              Covers {coveredCount} of {coverageRows.length} peptide-critical markers
            </p>
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "#F5F5F7" }}>
              <div
                className="h-full rounded-full"
                style={{ backgroundColor: "#186784", width: `${(coveredCount / coverageRows.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-8">
              {Object.values(STATUS_CONFIG).map((cfg) => (
                <div key={cfg.legend} className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                    {cfg.label}
                  </span>
                  <span className="text-xs" style={{ color: "#6E6E73" }}>{cfg.legend}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #E5E5E7" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F5F5F7" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#1D1D1F" }}>Marker</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#1D1D1F" }}>Status</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#1D1D1F" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let lastTier: number | null = null;
                    return coverageRows.map((row) => {
                      const b = row.biomarkers!;
                      const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.unconfirmed;
                      const price = row.tier_price_cents ?? row.addon_cost_cents;
                      const showTierHeader = b.tier !== lastTier;
                      lastTier = b.tier;
                      return (
                        <Fragment key={b.slug}>
                          {showTierHeader && (
                            <tr key={`tier-${b.tier}`} style={{ borderTop: "1px solid #E5E5E7" }}>
                              <td colSpan={3} className="px-4 py-2 text-xs font-semibold tracking-widest uppercase" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}>
                                {TIER_LABELS[b.tier] ?? `Tier ${b.tier}`}
                              </td>
                            </tr>
                          )}
                          <tr key={b.slug} style={{ borderTop: "1px solid #E5E5E7" }}>
                            <td className="px-4 py-3" style={{ color: "#1D1D1F" }}>
                              {b.name}
                              {row.specimen_type !== "blood" && (
                                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                                  {row.specimen_type}
                                </span>
                              )}
                              {row.accuracy_flag === "CAP" && (
                                <span
                                  className="ml-2 text-xs"
                                  style={{ color: "#D97706" }}
                                  title="Capillary/fingerstick collection — accuracy vs. venous draw may vary for this marker"
                                >
                                  ⚠
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3" style={{ color: "#6E6E73" }}>
                              {price !== null && price !== undefined ? formatPrice(price) : "—"}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {tierRows.length > 0 && (
          <section className="px-6 py-16" style={{ backgroundColor: "#F5F5F7" }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6" style={{ color: "#1D1D1F" }}>Pricing & Plans</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {tierRows.map((tier) => (
                  <div key={tier.id} className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-lg" style={{ color: "#1D1D1F" }}>{tier.tier_name}</h3>
                      {tier.is_entry_tier && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>Entry</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-3" style={{ color: "#1D1D1F" }}>{formatPrice(tier.price_cents)}</p>
                    {tier.tests_included && (
                      <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>{tier.tests_included}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
              Watchtower Peptides may earn a referral commission if you purchase through links on this page.
              This does not affect our scoring or editorial coverage.
            </p>
          </div>
        </section>
      </div>

      <Footer verseIndex={5} />
    </div>
  );
}
