import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase, dbVendorToVendor, type DbVendor, type DbVendorPeptide, type VendorStatus } from "@/lib/supabase";

// Photo assigned per vendor based on dominant product category.
// Replace any value with a vendor-specific image path when available.
const VENDOR_PHOTOS: Record<string, string> = {
  "aavant-research":        "/images/category-hormones.png",
  "alpha-biomed-labs":      "/images/slide-1.png",
  "ascension-peptides":     "/images/category-healing.png",
  "astro-peptides":         "/images/slide-2.png",
  "biotech-peptides":       "/images/category-hormones.png",
  "bulk-peptide-supply":    "/images/category-healing.png",
  "cernum-biosciences":     "/images/category-hormones.png",
  "core-peptides":          "/images/category-hormones.png",
  "crush-research":         "/images/slide-3.png",
  "dynamic-peptide":        "/images/category-healing.png",
  "ez-peptides":            "/images/category-healing.png",
  "felix-chemical-supply":  "/images/slide-1.png",
  "glacier-aminos":         "/images/category-metabolic.png",
  "healthgevity":           "/images/slide-2.png",
  "ion-peptide":            "/images/category-healing.png",
  "limitless-biotech":      "/images/slide-3.png",
  "loti-labs":              "/images/category-healing.png",
  "lvlup-health":           "/images/slide-1.png",
  "mile-high-compounds":    "/images/category-healing.png",
  "nexaph":                 "/images/category-hormones.png",
  "nextechlabs":            "/images/category-healing.png",
  "nuscience-peptides":     "/images/category-hormones.png",
  "omegamino":              "/images/slide-2.png",
  "orbitrex-peptides":      "/images/slide-3.png",
  "paramount-peptides":     "/images/category-hormones.png",
  "penguin-peptides":       "/images/category-hormones.png",
  "peptide-crafters":       "/images/category-healing.png",
  "peptide-partners":       "/images/category-healing.png",
  "peptidology":            "/images/category-healing.png",
  "polaris-peptides":       "/images/category-metabolic.png",
  "pure-rawz":              "/images/category-healing.png",
  "simple-peptide":         "/images/category-hormones.png",
  "skye-peptides":          "/images/category-hormones.png",
  "southern-peptides":      "/images/category-metabolic.png",
  "sports-technology-labs": "/images/category-healing.png",
  "swiss-chems":            "/images/category-healing.png",
  "verified-peptides":      "/images/category-healing.png",
  "certified-pep":          "/images/category-hormones.png",
  "perfect-peptides":       "/images/category-healing.png",
  "licensed-peptides":      "/images/category-healing.png",
  "maxx-research-supply":   "/images/slide-3.png",
  "ruo-science":            "/images/category-hormones.png",
  "true-research-labs":     "/images/category-healing.png",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("vendors")
    .select("name, verdict, overall_score")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { title: "Vendor Not Found" };

  const score = data.overall_score != null ? ` — Score: ${data.overall_score}/100` : "";
  const desc = data.verdict
    ? data.verdict.slice(0, 155)
    : `Independent review of ${data.name}${score}. Lab verification, product quality, transparency, and customer experience scores.`;

  return {
    title: `${data.name} Review`,
    description: desc,
    alternates: { canonical: `/vendors/${slug}` },
  };
}

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  recommended:       { label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
};

const SCORE_LABELS: Record<string, { label: string; max: number }> = {
  lab_testing:         { label: "Lab Verification",    max: 40 },
  purity_accuracy:     { label: "Product Quality",     max: 25 },
  transparency:        { label: "Transparency",        max: 25 },
  pricing_reliability: { label: "Customer Experience", max: 10 },
};

function scoreColor(score: number) {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function ratingLabel(score: number): string {
  if (score >= 85) return "Elite";
  if (score >= 70) return "Trusted";
  if (score >= 55) return "Acceptable";
  if (score >= 45) return "Watchlist";
  return "High Risk";
}

function batchGrade(purity: number): { grade: string; color: string } {
  if (purity >= 98) return { grade: "A", color: "#16A34A" };
  if (purity >= 95) return { grade: "B", color: "#16A34A" };
  if (purity >= 90) return { grade: "C", color: "#D97706" };
  return { grade: "F", color: "#DC2626" };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("vendors")
    .select("slug")
    .eq("status", "active")
    .not("slug", "is", null);
  return (data ?? []).map((v) => ({ slug: v.slug as string }));
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: vendorRow } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!vendorRow) notFound();

  const { data: peptideRows } = await supabase
    .from("vendor_peptides")
    .select("*")
    .eq("vendor_id", vendorRow.id)
    .order("peptide_name");

  const { data: latestTestRow } = await supabase
    .from("lab_tests")
    .select("peptide_name, purity_result, test_date")
    .eq("vendor_id", vendorRow.id)
    .not("purity_result", "is", null)
    .not("test_date", "is", null)
    .neq("test_type", "Endotoxin")
    .order("test_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vendor = dbVendorToVendor(vendorRow as DbVendor, (peptideRows ?? []) as DbVendorPeptide[]);
  const status = STATUS_CONFIG[vendor.status];
  const color = scoreColor(vendor.overall_score);

  const latestPurity = latestTestRow?.purity_result ?? null;
  const batchInfo = latestPurity != null ? batchGrade(latestPurity) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "#6E6E73" }}>
            <Link href="/vendors" className="hover:text-black transition-colors">Vendor Reviews</Link>
            <span>›</span>
            <span style={{ color: "#1D1D1F" }}>{vendor.name}</span>
          </div>

          {/* Photo header */}
          <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ minHeight: '200px' }}>
            <Image
              src={VENDOR_PHOTOS[vendor.slug] ?? "/images/slide-2.png"}
              alt={vendor.name}
              fill
              priority
              style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 100%)' }}
            />
            <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center gap-6" style={{ minHeight: '200px' }}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold" style={{ color: "#FFFFFF" }}>{vendor.name}</h1>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                  {vendor.has_coa && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(220,252,231,0.90)", color: "#16A34A" }}
                    >
                      ✓ COA Verified
                    </span>
                  )}
                  {vendor.verified_domain && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(219,234,254,0.90)", color: "#1D4ED8" }}
                    >
                      ✓ Verified Domain
                    </span>
                  )}
                </div>

                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: "#5BA4C4" }}
                  >
                    {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                  </a>
                )}

                <div className="flex flex-wrap gap-5 mt-3 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
                  <span>📍 {vendor.location}</span>
                  <span>
                    Last reviewed{" "}
                    {vendor.last_reviewed
                      ? new Date(vendor.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Score circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF", border: `2px solid ${color}` }}
                >
                  {vendor.overall_score}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color }}>
                  {status.label}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>out of 100</div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          {vendor.verdict && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-3" style={{ color: "#1D1D1F" }}>Our Verdict</h2>
              <p className="leading-relaxed" style={{ color: "#6E6E73" }}>{vendor.verdict}</p>
              {vendor.notes && (
                <p className="text-sm leading-relaxed mt-3" style={{ color: "#6E6E73" }}>{vendor.notes}</p>
              )}
            </div>
          )}

          {/* Latest Lab Results */}
          {latestTestRow && batchInfo && latestPurity != null && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-4" style={{ color: "#1D1D1F" }}>Latest Lab Results</h2>
              <table className="w-full text-sm mb-4">
                <tbody>
                  <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
                    <td className="py-3 font-medium" style={{ color: "#6E6E73" }}>Vendor Score</td>
                    <td className="py-3 text-right font-semibold" style={{ color }}>
                      {vendor.overall_score}/100 ({ratingLabel(vendor.overall_score)})
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
                    <td className="py-3 font-medium" style={{ color: "#6E6E73" }}>
                      Latest Tested Batch
                      {latestTestRow.test_date && (
                        <span className="ml-1 font-normal" style={{ color: "#9CA3AF" }}>
                          ({new Date(latestTestRow.test_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })})
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right" style={{ color: "#1D1D1F" }}>
                      {latestTestRow.peptide_name} — {latestPurity.toFixed(1)}% Purity
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium" style={{ color: "#6E6E73" }}>Batch Grade</td>
                    <td className="py-3 text-right font-bold text-lg" style={{ color: batchInfo.color }}>
                      {batchInfo.grade}
                    </td>
                  </tr>
                </tbody>
              </table>
              {latestPurity < 95 && (
                <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                  This vendor has demonstrated strong historical performance, transparency, and testing
                  practices. However, the most recently tested batch of {latestTestRow.peptide_name} achieved
                  only {latestPurity.toFixed(1)}% purity — below the 95% standard expected from top-tier
                  vendors. The overall score reflects the vendor&apos;s full track record, not any single result.
                </p>
              )}
            </div>
          )}

          {/* Shipping & Payment */}
          {(vendor.shipping_flat_fee != null || vendor.shipping_free_threshold != null ||
            vendor.ships_internationally || vendor.credit_card_accepted || vendor.crypto_accepted || vendor.paypal_accepted) && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-4" style={{ color: "#1D1D1F" }}>Shipping &amp; Payment</h2>
              <div className="flex flex-wrap gap-3">
                {vendor.shipping_free_threshold === 0 ? (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                    <span>✓</span>
                    <span className="font-medium">Free shipping on all orders</span>
                  </div>
                ) : vendor.shipping_free_threshold != null && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                    <span>✓</span>
                    <span className="font-medium">Free shipping on orders over ${vendor.shipping_free_threshold}</span>
                  </div>
                )}
                {vendor.shipping_flat_fee != null && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73", border: "1px solid #E5E5E7" }}>
                    <span className="font-medium">
                      {vendor.shipping_flat_fee === 0 ? "Free shipping" : `Flat rate: $${vendor.shipping_flat_fee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {vendor.ships_internationally && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>
                    <span className="font-medium">Ships internationally</span>
                  </div>
                )}
                {vendor.credit_card_accepted && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73", border: "1px solid #E5E5E7" }}>
                    <span className="font-medium">Credit card</span>
                  </div>
                )}
                {vendor.crypto_accepted && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                    <span className="font-medium">Crypto accepted</span>
                  </div>
                )}
                {vendor.paypal_accepted && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>
                    <span className="font-medium">PayPal accepted</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Score Breakdown</h2>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F5F5F7" }}>
              {Object.entries(vendor.scores).filter(([key]) => key in SCORE_LABELS).map(([key, val], i, arr) => {
                const meta = SCORE_LABELS[key];
                const pct = Math.round((val / meta.max) * 100);
                const barColor = pct >= 80 ? "#16A34A" : pct >= 60 ? "#D97706" : "#DC2626";
                return (
                  <div
                    key={key}
                    className="px-6 py-5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #E5E5E7" : "none" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "#1D1D1F" }}>{meta.label}</span>
                      <span className="text-sm font-bold" style={{ color: barColor }}>
                        {val} / {meta.max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: "#E5E5E7" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#6E6E73" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peptide inventory */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#1D1D1F" }}>
              Peptide Inventory ({vendor.peptide_inventory.length})
            </h2>
            <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: "#F5F5F7" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
                    {["Peptide", "Price", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 font-semibold" style={{ color: "#6E6E73" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendor.peptide_inventory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center" style={{ color: "#6E6E73" }}>
                        No inventory data yet
                      </td>
                    </tr>
                  ) : (
                    vendor.peptide_inventory.map((item, i) => (
                      <tr
                        key={item.name}
                        style={{ borderBottom: i < vendor.peptide_inventory.length - 1 ? "1px solid #E5E5E7" : "none" }}
                      >
                        <td className="px-5 py-3.5 font-medium" style={{ color: "#1D1D1F" }}>{item.name}</td>
                        <td className="px-5 py-3.5" style={{ color: "#6E6E73" }}>{item.price}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: item.in_stock ? "#DCFCE7" : "#FEE2E2",
                              color: item.in_stock ? "#16A34A" : "#DC2626",
                            }}
                          >
                            {item.in_stock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "#1D1D1F" }}
          >
            ← Back to Vendor Reviews
          </Link>
        </div>
      </div>

      <Footer verseIndex={0} />
    </div>
  );
}
