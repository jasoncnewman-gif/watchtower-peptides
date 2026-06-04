import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "About — Scoring Methodology",
  description: "How Watchtower Peptides independently scores vendors across lab testing, purity accuracy, transparency, community reputation, and pricing. No affiliates, no bias.",
  alternates: { canonical: "/about" },
};

const SCORE_CATEGORIES = [
  { name: "Lab Testing", points: 30, description: "Number of independently tested products, diversity of labs used, and whether COAs are publicly accessible." },
  { name: "Purity Accuracy", points: 25, description: "How closely test results match label claims. Consistently ≥98% purity scores highest. Mislabeled or underdosed products heavily penalized." },
  { name: "Transparency", points: 20, description: "Accessibility of COAs, lab names disclosed, batch numbers available, no hidden sourcing." },
  { name: "Community Reputation", points: 15, description: "Verified Trustpilot, Reddit, and forum sentiment. Fraud complaints, scam reports, and shipping issues all factor in." },
  { name: "Pricing & Reliability", points: 10, description: "Competitive pricing for the quality level, consistent stock, and reliable fulfillment." },
];

const STATUS_THRESHOLDS = [
  { label: "Recommended", range: "75–100", bg: "#DCFCE7", text: "#16A34A", description: "Verified third-party lab testing, high purity accuracy, and strong community trust." },
  { label: "Use With Caution", range: "50–74", bg: "#FEF3C7", text: "#D97706", description: "Some positive signals but gaps in testing transparency or community concerns present." },
  { label: "Not Recommended", range: "0–49", bg: "#FEE2E2", text: "#DC2626", description: "Insufficient testing data, purity failures, or significant fraud or quality red flags." },
  { label: "Under Review", range: "—", bg: "#EDE9FE", text: "#7C3AED", description: "New vendor or recent ownership change — test results pending re-evaluation." },
];

export default async function AboutPage() {
  const [
    { data: statusCounts },
    { count: labCount },
    { data: lastUpdatedRow },
    { count: peptideCount },
  ] = await Promise.all([
    supabase.from("vendors").select("status"),
    supabase.from("lab_tests").select("*", { count: "exact", head: true }),
    supabase.from("vendors").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("peptides").select("*", { count: "exact", head: true }).not("category", "eq", "blend"),
  ]);

  const distribution = { recommended: 0, caution: 0, "not-recommended": 0, "under-review": 0 };
  for (const v of statusCounts ?? []) {
    if (v.status in distribution) distribution[v.status as keyof typeof distribution]++;
  }
  const totalVendors = Object.values(distribution).reduce((a, b) => a + b, 0);
  const lastUpdated = lastUpdatedRow?.updated_at
    ? new Date(lastUpdatedRow.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        {/* Header */}
        <section className="px-6 py-24 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: "#186784" }}>
              Our Methodology
            </p>
            <h1 className="text-5xl font-bold mb-6" style={{ color: "#1D1D1F" }}>
              How We Score Vendors
            </h1>
            <p className="text-xl leading-relaxed" style={{ color: "#6E6E73" }}>
              Watchtower Peptides is an independent research platform. We have no affiliate
              relationships, accept no paid placements, and receive no compensation from any vendor.
              Our scoring is based entirely on publicly verifiable data.
            </p>
          </div>
        </section>

        {/* Live stats bar */}
        <section style={{ backgroundColor: "#1D1D1F" }} className="px-6 py-12">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: String(totalVendors), label: "Vendors Reviewed" },
              { value: labCount && labCount > 0 ? `${Math.floor(labCount / 50) * 50}+` : "—", label: "Lab Tests Reviewed" },
              { value: String(peptideCount ?? 0), label: "Peptide Profiles" },
              { value: lastUpdated, label: "Last Updated" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold mb-1" style={{ color: "#FFFFFF" }}>{stat.value}</div>
                <div className="text-sm" style={{ color: "#6E6E73" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Vendor distribution */}
        <section className="px-6 py-16" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Current Data
            </p>
            <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: "#1D1D1F" }}>Vendor Distribution</h2>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { key: "recommended",       label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
                { key: "caution",           label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
                { key: "not-recommended",   label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
                { key: "under-review",      label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
              ].map((s) => (
                <div key={s.key} className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: s.text }}>
                    {distribution[s.key as keyof typeof distribution]}
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scoring breakdown */}
        <section className="px-6 py-20" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Scoring Criteria
            </p>
            <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: "#1D1D1F" }}>100 Points Total</h2>
            <p className="text-center mb-12" style={{ color: "#6E6E73" }}>
              Each vendor is scored across five independently verified categories.
            </p>
            <div className="flex flex-col gap-4">
              {SCORE_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" style={{ color: "#1D1D1F" }}>{cat.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>{cat.description}</p>
                    </div>
                    <div className="text-center shrink-0 rounded-xl px-4 py-2" style={{ backgroundColor: "#F5F5F7" }}>
                      <div className="text-2xl font-bold" style={{ color: "#186784" }}>{cat.points}</div>
                      <div className="text-xs" style={{ color: "#6E6E73" }}>pts</div>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full" style={{ backgroundColor: "#E5E5E7" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.points}%`, backgroundColor: "#186784" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rating thresholds */}
        <section className="px-6 py-20" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Rating System
            </p>
            <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: "#1D1D1F" }}>Rating Thresholds</h2>
            <p className="text-center mb-12" style={{ color: "#6E6E73" }}>
              Score ranges determine a vendor's overall rating badge.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {STATUS_THRESHOLDS.map((s) => (
                <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: "#F5F5F7" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                    <span className="text-sm font-mono font-semibold" style={{ color: "#1D1D1F" }}>{s.range}</span>
                  </div>
                  <p className="text-sm" style={{ color: "#6E6E73" }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data sources */}
        <section className="px-6 py-20" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Where We Get Our Data
            </p>
            <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: "#1D1D1F" }}>Data Sources</h2>
            <div className="grid sm:grid-cols-3 gap-5 text-center">
              {[
                { icon: "🧪", title: "Finnrick Analytics", desc: "Independent third-party peptide testing with HPLC, NMR, and LC-MS results." },
                { icon: "🔬", title: "Lab COA Archives", desc: "Publicly published Certificates of Analysis from named independent laboratories." },
                { icon: "💬", title: "Community Reviews", desc: "Verified reviews from Trustpilot, Reddit, and specialized peptide research communities." },
              ].map((s) => (
                <div key={s.title} className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF" }}>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold mb-2" style={{ color: "#1D1D1F" }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: "#6E6E73" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="px-6 py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1D1D1F" }}>Disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
              Watchtower Peptides is for research and informational purposes only. None of the content
              constitutes medical advice, and nothing should be interpreted as a recommendation to use,
              purchase, or administer any substance. Peptides reviewed may be restricted or illegal in
              certain jurisdictions. Always consult a licensed medical professional before use.
            </p>
          </div>
        </section>
      </div>

      <Footer verseIndex={1} />
    </div>
  );
}
