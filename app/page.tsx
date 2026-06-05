import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import { supabase, dbVendorToVendor, type DbVendor, type VendorStatus } from "@/lib/supabase";

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  recommended:       { label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
};

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: "FDA Approved",  bg: "#DCFCE7", text: "#16A34A" },
  "not-approved":  { label: "Not Approved",  bg: "#FEF3C7", text: "#D97706" },
  "research-only": { label: "Research Only", bg: "#DBEAFE", text: "#2563EB" },
};

function scoreColor(score: number) {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export default async function Home() {
  const [
    { count: activeCount },
    { count: labTestCount },
    { data: lastUpdatedRow },
    { data: topVendorRows },
    { data: peptideRows },
  ] = await Promise.all([
    supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("lab_tests").select("*", { count: "exact", head: true }),
    supabase.from("vendors").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase
      .from("vendors")
      .select("id, name, slug, website, overall_score, status, location, has_coa, verified_domain, verdict, last_reviewed, lab_testing_score, purity_accuracy_score, transparency_score, community_reputation_score, pricing_reliability_score, notes")
      .eq("status", "active")
      .order("overall_score", { ascending: false, nullsFirst: false })
      .limit(4),
    supabase
      .from("peptides")
      .select("name, slug, fda_status, tagline, aliases")
      .in("slug", ["bpc-157", "tb-500", "ipamorelin"])
      .not("category", "eq", "blend"),
  ]);

  const vendorCount = activeCount ?? 0;
  const labCount = labTestCount ?? 0;
  const labCountLabel = labCount === 0 ? "—" : labCount >= 100 ? `${Math.floor(labCount / 50) * 50}+` : String(labCount);
  const lastUpdated = lastUpdatedRow?.updated_at
    ? new Date(lastUpdatedRow.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const stats = [
    { label: "Vendors Reviewed",   value: String(vendorCount) },
    { label: "Lab Tests Reviewed", value: labCountLabel        },
    { label: "Last Updated",       value: lastUpdated          },
    { label: "Independent Reviews",value: "100%"               },
  ];

  const allVendors = (topVendorRows ?? []).map((v) => dbVendorToVendor(v as DbVendor));
  const topVendor  = allVendors[0];
  const topVendors = allVendors.slice(0, 3);

  // Sort featured peptides to a consistent order
  const PEPTIDE_ORDER = ["bpc-157", "tb-500", "ipamorelin"];
  const featuredPeptides = PEPTIDE_ORDER
    .map(slug => (peptideRows ?? []).find(p => p.slug === slug))
    .filter(Boolean) as typeof peptideRows;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />
      <HeroSlider />

      {/* Stats bar */}
      <section style={{ backgroundColor: "#1D1D1F" }} className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold mb-1" style={{ color: "#FFFFFF" }}>{stat.value}</div>
              <div className="text-sm" style={{ color: "#6E6E73" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 1 — Our Approach (white, left text / right score card) */}
      <section className="px-6 py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Our Approach
            </p>
            <h2 className="text-4xl font-bold leading-tight mb-6" style={{ color: "#1D1D1F" }}>
              Built for researchers who don't trust marketing.
            </h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#6E6E73" }}>
              Every vendor is scored across five independently verified categories — lab testing,
              purity accuracy, transparency, community reputation, and pricing reliability.
              No sponsored placements. No affiliate links. Just data.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-semibold text-sm transition-opacity hover:opacity-70"
              style={{ color: "#1D1D1F" }}
            >
              See how we score →
            </Link>
          </div>

          {/* Live top vendor score card */}
          {topVendor && (
            <div className="flex-1 w-full max-w-sm md:max-w-none">
              <div className="rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-semibold text-lg" style={{ color: "#1D1D1F" }}>{topVendor.name}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#6E6E73" }}>{topVendor.website}</p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: scoreColor(topVendor.overall_score),
                      border: `2px solid ${scoreColor(topVendor.overall_score)}20`,
                    }}
                  >
                    {topVendor.overall_score}
                  </div>
                </div>
                {Object.entries(topVendor.scores).map(([key, val]) => {
                  const maxes: Record<string, number> = {
                    lab_testing: 30, purity_accuracy: 25, transparency: 20,
                    community_reputation: 15, pricing_reliability: 10,
                  };
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const pct = Math.round((val / maxes[key]) * 100);
                  return (
                    <div key={key} className="mb-3">
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#6E6E73" }}>
                        <span>{label}</span>
                        <span style={{ color: "#1D1D1F", fontWeight: 500 }}>{val}/{maxes[key]}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: "#E5E5E7" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#186784" }} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: STATUS_CONFIG[topVendor.status].bg, color: STATUS_CONFIG[topVendor.status].text }}
                  >
                    {STATUS_CONFIG[topVendor.status].label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — Top Vendors (gray, centered grid) */}
      <section className="px-6 py-24" style={{ backgroundColor: "#F5F5F7" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Supplier Reviews
            </p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Top Recommended Vendors</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#6E6E73" }}>
              Vendors with verified third-party lab testing and strong community trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {topVendors.map((vendor) => {
              const color  = scoreColor(vendor.overall_score);
              const status = STATUS_CONFIG[vendor.status];
              return (
                <Link
                  key={vendor.slug}
                  href={`/vendors/${vendor.slug}`}
                  className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-base" style={{ color: "#1D1D1F" }}>{vendor.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "#6E6E73" }}>{vendor.website}</p>
                    </div>
                    <div
                      className="text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center shrink-0 ml-3"
                      style={{ backgroundColor: `${color}12`, color }}
                    >
                      {vendor.overall_score}
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                  <p className="text-sm mt-3 line-clamp-2 leading-relaxed" style={{ color: "#6E6E73" }}>
                    {vendor.verdict}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#1D1D1F", color: "#FFFFFF" }}
            >
              View all vendors →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3 — Peptide Library (white, right text / left cards) */}
      <section className="px-6 py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Peptide Library
            </p>
            <h2 className="text-4xl font-bold leading-tight mb-6" style={{ color: "#1D1D1F" }}>
              Everything you need to know before you buy.
            </h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#6E6E73" }}>
              Dosage guides, reconstitution instructions, FDA status, and curated research
              studies for the most commonly studied peptides — all in one place.
            </p>
            <div className="flex gap-4">
              <Link
                href="/peptides"
                className="inline-flex items-center gap-2 font-semibold text-sm transition-opacity hover:opacity-70"
                style={{ color: "#1D1D1F" }}
              >
                Browse peptides →
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 font-semibold text-sm transition-opacity hover:opacity-70"
                style={{ color: "#186784" }}
              >
                Reconstitution Calculator →
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-3">
            {(featuredPeptides ?? []).map((peptide) => {
              const fda = peptide.fda_status ? FDA_CONFIG[peptide.fda_status] : null;
              const aliases = Array.isArray(peptide.aliases) ? (peptide.aliases as string[]) : [];
              return (
                <Link
                  key={peptide.slug}
                  href={`/peptides/${peptide.slug}`}
                  className="flex items-center gap-4 rounded-xl px-5 py-4 transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#F5F5F7" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold" style={{ color: "#1D1D1F" }}>{peptide.name}</span>
                      {fda && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: fda.bg, color: fda.text }}
                        >
                          {fda.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 line-clamp-1" style={{ color: "#6E6E73" }}>
                      {aliases.slice(0, 2).join(" · ") || (peptide.tagline ?? "")}
                    </p>
                  </div>
                  <span style={{ color: "#6E6E73" }}>›</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-20" style={{ backgroundColor: "#1D1D1F" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#FFFFFF" }}>Don't buy blind.</h2>
          <p className="text-lg mb-8" style={{ color: "#6E6E73" }}>
            Check any vendor's score, lab history, and active alerts before you order.
          </p>
          <Link
            href="/vendors"
            className="font-semibold px-8 py-4 rounded-full transition-opacity hover:opacity-80 text-base inline-block"
            style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}
          >
            View Vendor Directory →
          </Link>
        </div>
      </section>

      <Footer verseIndex={0} />
    </div>
  );
}
