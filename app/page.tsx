import Link from "next/link";

const stats = [
  { label: "Vendors Tracked", value: "50+" },
  { label: "Lab Tests Reviewed", value: "500+" },
  { label: "Red Flags Identified", value: "120+" },
  { label: "Independent Reviews", value: "100%" },
];

const features = [
  {
    icon: "🔬",
    title: "Lab Test Verification",
    description:
      "We verify third-party COAs and lab results so you know exactly what purity you're getting.",
  },
  {
    icon: "🚩",
    title: "Ad Monitoring",
    description:
      "We track vendor advertising claims and flag misleading or unsubstantiated marketing.",
  },
  {
    icon: "⭐",
    title: "Independent Scoring",
    description:
      "Every vendor receives a transparent score based on testing, shipping, support, and honesty.",
  },
  {
    icon: "🔔",
    title: "Vendor Alerts",
    description:
      "Get notified when a vendor fails a test, changes ownership, or receives fraud reports.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#DAC6B6" }}>

      {/* Nav */}
      <nav style={{ backgroundColor: "#0C2E3D", borderBottom: "1px solid #186784" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: "#186784" }} className="text-2xl">⚑</span>
            <span className="font-bold text-lg tracking-tight" style={{ color: "#DAC6B6" }}>
              Watchtower Peptides
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#C0A088" }}>
            <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
            <Link href="/lab-tests" className="hover:text-white transition-colors">Lab Tests</Link>
            <Link href="/alerts" className="hover:text-white transition-colors">Alerts</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <Link
            href="/vendors"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#186784", color: "#DAC6B6" }}
          >
            View All Vendors
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784", color: "#C0A088" }}
          >
            <span>⚑</span>
            <span>Independent. Unbiased. Verified.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6" style={{ color: "#DAC6B6" }}>
            The Independent<br />
            <span style={{ color: "#186784" }}>Peptide Vendor</span><br />
            Review Platform
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#C0A088" }}>
            Watchtower Peptides tracks, scores, and monitors peptide vendors so
            researchers can make informed decisions. No affiliate bias. No paid
            placements. Just the truth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vendors"
              className="font-semibold px-8 py-4 rounded-lg transition-colors hover:opacity-90 text-lg"
              style={{ backgroundColor: "#186784", color: "#DAC6B6" }}
            >
              Browse Vendors →
            </Link>
            <Link
              href="/about"
              className="font-semibold px-8 py-4 rounded-lg transition-colors hover:opacity-90 text-lg"
              style={{ backgroundColor: "#0C2E3D", color: "#DAC6B6", border: "1px solid #186784" }}
            >
              How We Score
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12" style={{ borderTop: "1px solid #0C2E3D", borderBottom: "1px solid #0C2E3D", backgroundColor: "#0C2E3D" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold mb-1" style={{ color: "#186784" }}>{stat.value}</div>
              <div className="text-sm" style={{ color: "#C0A088" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "#DAC6B6" }}>What We Track</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#C0A088" }}>
              Our methodology covers every angle of vendor quality and trustworthiness.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 transition-colors hover:opacity-90"
                style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#DAC6B6" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#C0A088" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center" style={{ borderTop: "1px solid #0C2E3D" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#DAC6B6" }}>Don't Buy Blind</h2>
          <p className="text-lg mb-8" style={{ color: "#C0A088" }}>
            Check any vendor's score, lab history, and active alerts before you order.
          </p>
          <Link
            href="/vendors"
            className="font-semibold px-8 py-4 rounded-lg transition-colors hover:opacity-90 text-lg inline-block"
            style={{ backgroundColor: "#186784", color: "#DAC6B6" }}
          >
            View Vendor Directory →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: "1px solid #0C2E3D", color: "#9A7C65" }}>
        <p>© 2026 Watchtower Peptides — Independent research only. Not medical advice.</p>
      </footer>

    </div>
  );
}
