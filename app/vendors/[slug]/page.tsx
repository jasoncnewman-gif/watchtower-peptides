import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase, dbVendorToVendor, type DbVendor, type DbVendorPeptide } from "@/lib/supabase";
import type { VendorStatus } from "@/lib/mock-data";

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  recommended:       { label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
};

const SCORE_LABELS: Record<string, { label: string; max: number }> = {
  lab_testing:          { label: "Lab Testing",           max: 30 },
  purity_accuracy:      { label: "Purity Accuracy",       max: 25 },
  transparency:         { label: "Transparency",          max: 20 },
  community_reputation: { label: "Community Reputation",  max: 15 },
  pricing_reliability:  { label: "Pricing & Reliability", max: 10 },
};

function scoreColor(score: number) {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

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

  const vendor = dbVendorToVendor(vendorRow as DbVendor, (peptideRows ?? []) as DbVendorPeptide[]);
  const status = STATUS_CONFIG[vendor.status];
  const color = scoreColor(vendor.overall_score);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-10" style={{ color: "#6E6E73" }}>
            <Link href="/vendors" className="hover:text-black transition-colors">Supplier Reviews</Link>
            <span>›</span>
            <span style={{ color: "#1D1D1F" }}>{vendor.name}</span>
          </div>

          {/* Header card */}
          <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold" style={{ color: "#1D1D1F" }}>{vendor.name}</h1>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                  {vendor.has_coa && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                    >
                      ✓ COA Verified
                    </span>
                  )}
                </div>

                <a
                  href={`https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: "#186784" }}
                >
                  {vendor.website} ↗
                </a>

                <div className="flex flex-wrap gap-5 mt-4 text-sm" style={{ color: "#6E6E73" }}>
                  <span>📍 {vendor.location}</span>
                  <span>
                    Last reviewed{" "}
                    {vendor.last_reviewed
                      ? new Date(vendor.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                  {vendor.notes}
                </p>
              </div>

              {/* Score circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{ backgroundColor: `${color}14`, color }}
                >
                  {vendor.overall_score}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color }}>
                  {status.label}
                </div>
                <div className="text-xs mt-1" style={{ color: "#6E6E73" }}>out of 100</div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
            <h2 className="font-semibold mb-3" style={{ color: "#1D1D1F" }}>Our Verdict</h2>
            <p className="leading-relaxed" style={{ color: "#6E6E73" }}>{vendor.verdict}</p>
          </div>

          {/* Score breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Score Breakdown</h2>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F5F5F7" }}>
              {Object.entries(vendor.scores).map(([key, val], i, arr) => {
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
            ← Back to Supplier Reviews
          </Link>
        </div>
      </div>

      <Footer verseIndex={0} />
    </div>
  );
}
