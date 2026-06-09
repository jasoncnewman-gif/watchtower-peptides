import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "About — Scoring Methodology",
  description: "How Watchtower Peptides independently scores peptide vendors across lab verification, product quality, transparency, and value. No affiliates, no bias.",
  alternates: { canonical: "/about" },
};

const SCORE_CATEGORIES = [
  {
    name: "Lab Verification",
    points: 40,
    description: "How independently a vendor's products have been tested. Points scale by tier — from no testing at all up to independently verified results across a meaningful sample size.",
    tiers: [
      { label: "No COA",                         pts: "0" },
      { label: "Internal testing only",           pts: "5" },
      { label: "Third-party COA",                 pts: "15" },
      { label: "Batch-specific third-party COA",  pts: "25" },
      { label: "Verified independent (Finnrick)",  pts: "up to 40" },
    ],
  },
  {
    name: "Product Quality",
    points: 25,
    description: "Recency-weighted average purity across all independently verified tests. More recent results count more heavily. Vendors with no independently verified test data score 0 — we do not take a vendor's word for it.",
    tiers: null,
  },
  {
    name: "Transparency",
    points: 25,
    description: "A checklist of verifiable legitimacy signals: published business address, ownership disclosure, named testing lab, contact information, methodology disclosure, batch numbers on COAs, and domain age. FDA warning letters and confirmed fraud flags apply penalties.",
    tiers: null,
  },
  {
    name: "Customer Experience",
    points: 10,
    description: "Price per mg compared to the market average for the same peptides. Vendors priced 15% or more below market earn full points. Vendors priced 15% or more above market earn zero.",
    tiers: null,
  },
];

const RATING_TIERS = [
  { label: "Elite",      range: "85–100",   bg: "#DCFCE7", text: "#16A34A", description: "Independently verified testing across multiple products, high purity record, strong transparency, and competitive pricing." },
  { label: "Trusted",    range: "70–84",    bg: "#D1FAE5", text: "#059669", description: "Strong third-party verification and good purity record with above-average transparency." },
  { label: "Acceptable", range: "55–69",    bg: "#FEF3C7", text: "#D97706", description: "Some verified testing and transparency, but gaps in sample size, methodology, or value." },
  { label: "Watchlist",  range: "45–54",    bg: "#FED7AA", text: "#EA580C", description: "Limited or unverified testing data. Proceed with significant caution." },
  { label: "Avoid",      range: "Below 45", bg: "#FEE2E2", text: "#DC2626", description: "No independent verification, material transparency failures, or active FDA warnings or fraud flags." },
];

export default async function AboutPage() {
  const [
    { data: vendorScores },
    { count: labCount },
    { data: lastUpdatedRow },
    { count: peptideCount },
  ] = await Promise.all([
    supabase.from("vendors").select("overall_score").in("status", ["active", "flagged"]),
    supabase.from("lab_tests").select("*", { count: "exact", head: true }).not("purity_result", "is", null),
    supabase.from("vendors").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("peptides").select("*", { count: "exact", head: true }).not("category", "eq", "blend"),
  ]);

  const distribution = { elite: 0, trusted: 0, acceptable: 0, watchlist: 0, avoid: 0 };
  for (const v of vendorScores ?? []) {
    const s = v.overall_score ?? 0;
    if      (s >= 85) distribution.elite++;
    else if (s >= 70) distribution.trusted++;
    else if (s >= 55) distribution.acceptable++;
    else if (s >= 45) distribution.watchlist++;
    else              distribution.avoid++;
  }
  const totalVendors = (vendorScores ?? []).length;

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
              Every score is derived from publicly verifiable data or independently collected testing records.
            </p>
          </div>
        </section>

        {/* Live stats bar */}
        <section style={{ backgroundColor: "#1D1D1F" }} className="px-6 py-12">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: String(totalVendors), label: "Vendors Reviewed" },
              { value: labCount && labCount > 0 ? `${Math.floor(labCount / 10) * 10}+` : "—", label: "Purity Tests Analyzed" },
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
            <div className="grid grid-cols-5 gap-3">
              {[
                { key: "elite",      label: "Elite",      bg: "#DCFCE7", text: "#16A34A" },
                { key: "trusted",    label: "Trusted",    bg: "#D1FAE5", text: "#059669" },
                { key: "acceptable", label: "Acceptable", bg: "#FEF3C7", text: "#D97706" },
                { key: "watchlist",  label: "Watchlist",  bg: "#FED7AA", text: "#EA580C" },
                { key: "avoid",      label: "Avoid",      bg: "#FEE2E2", text: "#DC2626" },
              ].map((s) => (
                <div key={s.key} className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFFFFF" }}>
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
        <section className="px-6 py-20" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Scoring Criteria
            </p>
            <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: "#1D1D1F" }}>100 Points Total</h2>
            <p className="text-center mb-12" style={{ color: "#6E6E73" }}>
              Four independently weighted categories. Lab Verification carries the most weight — vendors without independent testing cannot exceed 35 points total.
            </p>
            <div className="flex flex-col gap-4">
              {SCORE_CATEGORIES.map((cat) => (
                <div key={cat.name} className="rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" style={{ color: "#1D1D1F" }}>{cat.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>{cat.description}</p>
                    </div>
                    <div className="text-center shrink-0 rounded-xl px-4 py-2" style={{ backgroundColor: "#FFFFFF" }}>
                      <div className="text-2xl font-bold" style={{ color: "#186784" }}>{cat.points}</div>
                      <div className="text-xs" style={{ color: "#6E6E73" }}>pts</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: "#E5E5E7" }}>
                    <div className="h-full rounded-full" style={{ width: `${cat.points}%`, backgroundColor: "#186784" }} />
                  </div>
                  {cat.tiers && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      {cat.tiers.map((t, i) => (
                        <div key={t.label} className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                          style={{ backgroundColor: "#FFFFFF" }}>
                          <span style={{ color: "#6E6E73" }}>
                            <span className="font-medium" style={{ color: "#1D1D1F" }}>Tier {i}</span> — {t.label}
                          </span>
                          <span className="font-semibold" style={{ color: "#186784" }}>{t.pts} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rating thresholds */}
        <section className="px-6 py-20" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Rating System
            </p>
            <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: "#1D1D1F" }}>Rating Tiers</h2>
            <p className="text-center mb-12" style={{ color: "#6E6E73" }}>
              Score ranges map to five confidence tiers, displayed on every vendor profile.
            </p>
            <div className="flex flex-col gap-3">
              {RATING_TIERS.map((s) => (
                <div key={s.label} className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: "#FFFFFF" }}>
                  <div className="shrink-0 text-center w-28">
                    <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-1"
                      style={{ backgroundColor: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                    <div className="text-sm font-mono font-semibold" style={{ color: "#1D1D1F" }}>{s.range}</div>
                  </div>
                  <p className="text-sm leading-relaxed pt-1" style={{ color: "#6E6E73" }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data sources */}
        <section className="px-6 py-20" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: "#186784" }}>
              Where We Get Our Data
            </p>
            <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: "#1D1D1F" }}>Data Sources</h2>
            <div className="grid sm:grid-cols-3 gap-5 text-center">
              {[
                {
                  icon: "🧪",
                  title: "Finnrick Analytics",
                  desc: "Independent third-party peptide testing — HPLC, mass spec, and endotoxin results published publicly across 25+ vendors.",
                },
                {
                  icon: "🔬",
                  title: "Lab COA Archives",
                  desc: "Certificates of Analysis published by vendors, evaluated for lab name, batch specificity, and methodology disclosure.",
                },
                {
                  icon: "🌐",
                  title: "Web Transparency Scan",
                  desc: "Automated checks for business address, ownership disclosure, contact information, and domain registration age.",
                },
              ].map((s) => (
                <div key={s.title} className="rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold mb-2" style={{ color: "#1D1D1F" }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: "#6E6E73" }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-center mt-8" style={{ color: "#9CA3AF" }}>
              Community reputation data (Reddit, forums) is collected and displayed on vendor profiles but is not included in the numeric score.
              It is shown as supplemental context only.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="px-6 py-16" style={{ backgroundColor: "#F5F5F7" }}>
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
