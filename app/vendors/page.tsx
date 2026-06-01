import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockVendors } from "@/lib/mock-data";
import type { VendorStatus } from "@/lib/mock-data";

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  recommended:       { label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
};

function scoreColor(score: number) {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export default function VendorsPage() {
  const vendors = [...mockVendors].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Supplier Reviews
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Vendor Directory</h1>
            <p className="text-xl" style={{ color: "#6E6E73" }}>
              Every vendor independently scored on lab testing, transparency, and reliability. Scores are out of 100.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {vendors.map((vendor) => {
                const status = STATUS_CONFIG[vendor.status];
                const color = scoreColor(vendor.overall_score);
                return (
                  <Link
                    key={vendor.slug}
                    href={`/vendors/${vendor.slug}`}
                    className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-base truncate" style={{ color: "#1D1D1F" }}>
                          {vendor.name}
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: "#6E6E73" }}>
                          {vendor.website}
                        </p>
                      </div>
                      <div className="text-center ml-3 shrink-0">
                        <div
                          className="text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${color}12`, color }}
                        >
                          {vendor.overall_score}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#6E6E73" }}>/ 100</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                      {vendor.has_coa && (
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                        >
                          ✓ COA Verified
                        </span>
                      )}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}
                      >
                        {vendor.location}
                      </span>
                    </div>

                    {/* Verdict preview */}
                    <p className="text-sm mt-3 line-clamp-2 leading-relaxed" style={{ color: "#6E6E73" }}>
                      {vendor.verdict}
                    </p>

                    {/* Score mini-bars */}
                    <div className="mt-4 flex gap-1">
                      {Object.entries(vendor.scores).map(([key, val]) => {
                        const maxes: Record<string, number> = {
                          lab_testing: 30, purity_accuracy: 25, transparency: 20,
                          community_reputation: 15, pricing_reliability: 10,
                        };
                        const pct = (val / maxes[key]) * 100;
                        return (
                          <div key={key} className="flex-1 h-1 rounded-full" style={{ backgroundColor: "#E5E5E7" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#6E6E73" }}>
                      Last reviewed:{" "}
                      {new Date(vendor.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer verseIndex={2} />
    </div>
  );
}
