import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import { mockVendors, mockPeptides } from "@/lib/mock-data";

const stats = [
  { label: "Vendors Tracked", value: "50+" },
  { label: "Lab Tests Reviewed", value: "500+" },
  { label: "Red Flags Identified", value: "120+" },
  { label: "Independent Reviews", value: "100%" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  recommended:     { bg: "#0a2e1a", text: "#22c55e" },
  caution:         { bg: "#2e1f00", text: "#eab308" },
  "not-recommended": { bg: "#3D1C0C", text: "#ef4444" },
  "under-review":  { bg: "#1a1a2e", text: "#a78bfa" },
};

const FDA_COLORS: Record<string, { bg: string; text: string }> = {
  approved:       { bg: "#0a2e1a", text: "#22c55e" },
  "not-approved": { bg: "#2e1f00", text: "#eab308" },
  "research-only": { bg: "#1a1f2e", text: "#60a5fa" },
};

export default function Home() {
  const topVendors = mockVendors
    .filter((v) => v.status === "recommended")
    .slice(0, 3);
  const featuredPeptides = mockPeptides.slice(0, 3);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />
      <HeroSlider />

      {/* Stats Bar */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: "#0C2E3D", borderTop: "1px solid #186784", borderBottom: "1px solid #186784" }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold mb-1" style={{ color: "#186784" }}>{stat.value}</div>
              <div className="text-sm" style={{ color: "#C0A088" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Vendors Preview */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#FFFCF2" }}>Top Recommended Vendors</h2>
              <p style={{ color: "#C0A088" }}>Vendors with verified lab testing and strong community trust.</p>
            </div>
            <Link
              href="/vendors"
              className="hidden md:block text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "#186784" }}
            >
              View all vendors →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {topVendors.map((vendor) => {
              const badge = STATUS_COLORS[vendor.status] ?? STATUS_COLORS["under-review"];
              return (
                <Link
                  key={vendor.slug}
                  href={`/vendors/${vendor.slug}`}
                  className="block rounded-xl p-6 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: "#FFFCF2" }}>{vendor.name}</h3>
                      <p className="text-sm mt-0.5" style={{ color: "#9A7C65" }}>{vendor.website}</p>
                    </div>
                    <div className="text-center ml-4 shrink-0">
                      <div
                        className="text-2xl font-bold w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: "#000101",
                          color: vendor.overall_score >= 75 ? "#22c55e" : vendor.overall_score >= 60 ? "#eab308" : "#ef4444",
                          border: `2px solid ${vendor.overall_score >= 75 ? "#22c55e" : vendor.overall_score >= 60 ? "#eab308" : "#ef4444"}`,
                        }}
                      >
                        {vendor.overall_score}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#9A7C65" }}>/ 100</div>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium capitalize"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {vendor.status.replace(/-/g, " ")}
                  </span>
                  <p className="text-sm mt-3 line-clamp-2" style={{ color: "#C0A088" }}>
                    {vendor.verdict}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link href="/vendors" className="text-sm font-semibold" style={{ color: "#186784" }}>
              View all vendors →
            </Link>
          </div>
        </div>
      </section>

      {/* Peptide Library Preview */}
      <section className="px-6 py-20" style={{ borderTop: "1px solid #0C2E3D" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#FFFCF2" }}>Peptide Library</h2>
              <p style={{ color: "#C0A088" }}>Dosage, reconstitution, and research summaries for common peptides.</p>
            </div>
            <Link
              href="/peptides"
              className="hidden md:block text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "#186784" }}
            >
              View all peptides →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredPeptides.map((peptide) => {
              const fda = FDA_COLORS[peptide.fda_status] ?? FDA_COLORS["research-only"];
              return (
                <Link
                  key={peptide.slug}
                  href={`/peptides/${peptide.slug}`}
                  className="block rounded-xl p-6 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg" style={{ color: "#FFFCF2" }}>{peptide.name}</h3>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2"
                      style={{ backgroundColor: fda.bg, color: fda.text }}
                    >
                      {peptide.fda_status === "approved" ? "FDA Approved" :
                       peptide.fda_status === "research-only" ? "Research Only" : "Not Approved"}
                    </span>
                  </div>
                  {peptide.aliases.length > 0 && (
                    <p className="text-xs mb-2" style={{ color: "#9A7C65" }}>
                      {peptide.aliases.slice(0, 2).join(", ")}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#C0A088" }}>
                    {peptide.description}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link href="/peptides" className="text-sm font-semibold" style={{ color: "#186784" }}>
              View all peptides →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center" style={{ borderTop: "1px solid #0C2E3D" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#FFFCF2" }}>Don't Buy Blind</h2>
          <p className="text-lg mb-8" style={{ color: "#C0A088" }}>
            Check any vendor's score, lab history, and active alerts before you order.
          </p>
          <Link
            href="/vendors"
            className="font-semibold px-8 py-4 rounded-lg transition-opacity hover:opacity-90 text-lg inline-block"
            style={{ backgroundColor: "#186784", color: "#FFFCF2" }}
          >
            View Vendor Directory →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
