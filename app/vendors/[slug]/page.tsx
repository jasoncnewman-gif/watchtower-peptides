import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockVendors } from "@/lib/mock-data";
import type { VendorStatus } from "@/lib/mock-data";

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  recommended:       { label: "Recommended",       bg: "#0a2e1a", text: "#22c55e" },
  caution:           { label: "Use With Caution",  bg: "#2e1f00", text: "#eab308" },
  "not-recommended": { label: "Not Recommended",   bg: "#3D1C0C", text: "#ef4444" },
  "under-review":    { label: "Under Review",      bg: "#1a1a2e", text: "#a78bfa" },
};

const SCORE_LABELS: Record<string, { label: string; max: number }> = {
  lab_testing:          { label: "Lab Testing",           max: 30 },
  purity_accuracy:      { label: "Purity Accuracy",       max: 25 },
  transparency:         { label: "Transparency",          max: 20 },
  community_reputation: { label: "Community Reputation",  max: 15 },
  pricing_reliability:  { label: "Pricing & Reliability", max: 10 },
};

function scoreColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

export async function generateStaticParams() {
  return mockVendors.map((v) => ({ slug: v.slug }));
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = mockVendors.find((v) => v.slug === slug);
  if (!vendor) notFound();

  const status = STATUS_CONFIG[vendor.status];
  const color = scoreColor(vendor.overall_score);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "#9A7C65" }}>
            <Link href="/vendors" className="hover:text-white transition-colors">Supplier Reviews</Link>
            <span>›</span>
            <span style={{ color: "#FFFCF2" }}>{vendor.name}</span>
          </div>

          {/* Vendor Header */}
          <div
            className="rounded-xl p-8 mb-8"
            style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold" style={{ color: "#FFFCF2" }}>{vendor.name}</h1>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                  {vendor.has_coa && (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "#0a2e1a", color: "#22c55e" }}
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

                <div className="flex flex-wrap gap-6 mt-4 text-sm" style={{ color: "#C0A088" }}>
                  <span>📍 {vendor.location}</span>
                  <span>📅 Last reviewed {new Date(vendor.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#C0A088" }}>
                  {vendor.notes}
                </p>
              </div>

              {/* Score circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{
                    backgroundColor: "#000101",
                    color,
                    border: `3px solid ${color}`,
                  }}
                >
                  {vendor.overall_score}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color }}>
                  {vendor.status === "recommended" ? "Recommended" :
                   vendor.status === "caution" ? "Use With Caution" :
                   vendor.status === "not-recommended" ? "Not Recommended" : "Under Review"}
                </div>
                <div className="text-xs mt-1" style={{ color: "#9A7C65" }}>Score out of 100</div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div
            className="rounded-xl p-6 mb-8"
            style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
          >
            <h2 className="text-lg font-bold mb-3" style={{ color: "#FFFCF2" }}>Our Verdict</h2>
            <p className="leading-relaxed" style={{ color: "#C0A088" }}>{vendor.verdict}</p>
          </div>

          {/* Score Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#FFFCF2" }}>Score Breakdown</h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              {Object.entries(vendor.scores).map(([key, val], i, arr) => {
                const meta = SCORE_LABELS[key];
                const pct = Math.round((val / meta.max) * 100);
                const barColor = pct >= 80 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444";
                return (
                  <div
                    key={key}
                    className="px-6 py-5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #186784" : "none" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "#FFFCF2" }}>{meta.label}</span>
                      <span className="text-sm font-bold" style={{ color: barColor }}>
                        {val} / {meta.max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: "#000101" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#9A7C65" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peptide Inventory */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#FFFCF2" }}>
              Peptide Inventory ({vendor.peptide_inventory.length})
            </h2>
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #186784" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#0C2E3D", borderBottom: "1px solid #186784" }}>
                    {["Peptide", "Price", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: "#C0A088" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendor.peptide_inventory.map((item, i) => (
                    <tr
                      key={item.name}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#060f14" : "#000101",
                        borderBottom: "1px solid #0C2E3D",
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "#FFFCF2" }}>{item.name}</td>
                      <td className="px-4 py-3" style={{ color: "#C0A088" }}>{item.price}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: item.in_stock ? "#0a2e1a" : "#3D1C0C",
                            color: item.in_stock ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.in_stock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: "#186784" }}
          >
            ← Back to Supplier Reviews
          </Link>

        </div>
      </div>

      <Footer />
    </div>
  );
}
