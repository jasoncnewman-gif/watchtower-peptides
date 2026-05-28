import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SCORE_CATEGORIES = [
  { name: "Lab Testing", points: 30, description: "Number of independently tested products, diversity of labs used, and whether COAs are publicly accessible." },
  { name: "Purity Accuracy", points: 25, description: "How closely test results match label claims. Consistently ≥98% purity scores highest. Mislabeled or underdosed products heavily penalized." },
  { name: "Transparency", points: 20, description: "Accessibility of COAs, lab names disclosed, batch numbers available, no hidden sourcing." },
  { name: "Community Reputation", points: 15, description: "Verified Trustpilot, Reddit, and community forum sentiment. Fraud complaints, scam reports, and shipping complaints all factor in." },
  { name: "Pricing & Reliability", points: 10, description: "Competitive pricing for the quality level, consistent stock, and reliable fulfillment." },
];

const STATUS_THRESHOLDS = [
  { label: "Recommended", range: "75–100", color: "#22c55e", bg: "#0a2e1a", description: "Verified third-party lab testing, high purity accuracy, and strong community trust." },
  { label: "Use With Caution", range: "50–74", color: "#eab308", bg: "#2e1f00", description: "Some positive signals but gaps in testing transparency or community concerns present." },
  { label: "Not Recommended", range: "0–49", color: "#ef4444", bg: "#3D1C0C", description: "Insufficient testing data, purity failures, or significant fraud/quality red flags." },
  { label: "Under Review", range: "—", color: "#a78bfa", bg: "#1a1a2e", description: "New vendor or recent change in ownership / test results pending re-evaluation." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        {/* Header */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784", color: "#C0A088" }}
            >
              <span>⚑</span>
              <span>Our Methodology</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#FFFCF2" }}>
              How We Score<br />
              <span style={{ color: "#186784" }}>Peptide Vendors</span>
            </h1>
            <p className="text-xl leading-relaxed" style={{ color: "#C0A088" }}>
              Watchtower Peptides is an independent research platform. We have no affiliate relationships,
              accept no paid placements, and receive no compensation from any vendor.
              Our scoring is based entirely on publicly verifiable data.
            </p>
          </div>
        </section>

        {/* Scoring Categories */}
        <section className="px-6 py-16" style={{ borderTop: "1px solid #0C2E3D" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "#FFFCF2" }}>Scoring Breakdown</h2>
            <p className="text-center mb-10" style={{ color: "#C0A088" }}>
              Each vendor is scored out of 100 points across five categories.
            </p>
            <div className="flex flex-col gap-4">
              {SCORE_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-xl p-6"
                  style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ color: "#FFFCF2" }}>{cat.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#C0A088" }}>{cat.description}</p>
                    </div>
                    <div
                      className="text-center shrink-0 rounded-lg px-4 py-2"
                      style={{ backgroundColor: "#000101" }}
                    >
                      <div className="text-2xl font-bold" style={{ color: "#186784" }}>{cat.points}</div>
                      <div className="text-xs" style={{ color: "#9A7C65" }}>pts</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 rounded-full" style={{ backgroundColor: "#000101" }}>
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

        {/* Status Ratings */}
        <section className="px-6 py-16" style={{ borderTop: "1px solid #0C2E3D" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "#FFFCF2" }}>Rating Thresholds</h2>
            <p className="text-center mb-10" style={{ color: "#C0A088" }}>
              Score ranges determine a vendor's overall rating badge.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {STATUS_THRESHOLDS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: s.bg, border: `1px solid ${s.color}40` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: `${s.color}20`, color: s.color }}
                    >
                      {s.label}
                    </span>
                    <span className="text-sm font-mono" style={{ color: s.color }}>{s.range}</span>
                  </div>
                  <p className="text-sm" style={{ color: "#C0A088" }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="px-6 py-16" style={{ borderTop: "1px solid #0C2E3D" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-10 text-center" style={{ color: "#FFFCF2" }}>Data Sources</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: "🧪", title: "Finnrick Analytics", desc: "Independent third-party peptide testing database with HPLC, NMR, and LC-MS results." },
                { icon: "🔬", title: "Lab COA Archives", desc: "Publicly published Certificates of Analysis from named independent laboratories." },
                { icon: "💬", title: "Community Forums", desc: "Verified reviews from Trustpilot, Reddit, and specialized peptide research communities." },
              ].map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl p-6"
                  style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                >
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold mb-2" style={{ color: "#FFFCF2" }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: "#C0A088" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="px-6 py-16" style={{ borderTop: "1px solid #0C2E3D" }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#9A7C65" }}>Disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#9A7C65" }}>
              Watchtower Peptides is for research and informational purposes only. None of the content on this
              platform constitutes medical advice, and nothing should be interpreted as a recommendation to use,
              purchase, or administer any substance. Peptides reviewed on this platform may be restricted or
              illegal in certain jurisdictions. Always consult a licensed medical professional before use.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
