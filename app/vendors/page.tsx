import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockVendors } from "@/lib/mock-data";
import type { VendorStatus } from "@/lib/mock-data";

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string; border: string }> = {
  recommended:       { label: "Recommended",       bg: "#0a2e1a", text: "#22c55e", border: "#22c55e" },
  caution:           { label: "Use With Caution",  bg: "#2e1f00", text: "#eab308", border: "#eab308" },
  "not-recommended": { label: "Not Recommended",   bg: "#3D1C0C", text: "#ef4444", border: "#ef4444" },
  "under-review":    { label: "Under Review",      bg: "#1a1a2e", text: "#a78bfa", border: "#a78bfa" },
};

function scoreColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

export default function VendorsPage() {
  const vendors = [...mockVendors].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        {/* Header */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4" style={{ color: "#FFFCF2" }}>Supplier Reviews</h1>
            <p className="text-lg" style={{ color: "#FFFCF2" }}>
              Every vendor independently scored on lab testing, transparency, and reliability.
              Scores are out of 100.
            </p>
          </div>
        </section>

        {/* Vendor Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => {
                const status = STATUS_CONFIG[vendor.status];
                const color = scoreColor(vendor.overall_score);
                return (
                  <Link
                    key={vendor.slug}
                    href={`/vendors/${vendor.slug}`}
                    className="block rounded-xl p-6 transition-all hover:opacity-90"
                    style={{ backgroundColor: "#0C2E3D", border: `1px solid #186784` }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-lg truncate" style={{ color: "#FFFCF2" }}>
                          {vendor.name}
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: "#FFFCF2" }}>
                          {vendor.website}
                        </p>
                      </div>
                      {/* Score badge */}
                      <div className="text-center ml-4 shrink-0">
                        <div
                          className="text-2xl font-bold w-14 h-14 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: "#000101",
                            color,
                            border: `2px solid ${color}`,
                          }}
                        >
                          {vendor.overall_score}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#FFFCF2" }}>/ 100</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                      {vendor.has_coa && (
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: "#0a2e1a", color: "#22c55e" }}
                        >
                          ✓ COA Verified
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: "#000101", color: "#FFFCF2" }}
                      >
                        📍 {vendor.location}
                      </span>
                    </div>

                    {/* Verdict preview */}
                    <p className="text-sm mt-3 line-clamp-2" style={{ color: "#FFFCF2" }}>
                      {vendor.verdict}
                    </p>

                    {/* Score bar preview */}
                    <div className="mt-4 flex gap-1">
                      {Object.entries(vendor.scores).map(([key, val]) => {
                        const maxes: Record<string, number> = {
                          lab_testing: 30, purity_accuracy: 25, transparency: 20,
                          community_reputation: 15, pricing_reliability: 10,
                        };
                        const pct = (val / maxes[key]) * 100;
                        return (
                          <div
                            key={key}
                            className="flex-1 h-1 rounded-full"
                            style={{ backgroundColor: "#000101" }}
                            title={`${key.replace(/_/g, " ")}: ${val}/${maxes[key]}`}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#FFFCF2" }}>
                      Last reviewed: {new Date(vendor.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
