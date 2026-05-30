import Link from "next/link";

export default function Footer() {
  return (
    <footer className="px-6 py-14" style={{ backgroundColor: "#1D1D1F" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: "#186784" }}>⚑</span>
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>Watchtower Peptides</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
              Independent research platform. No affiliates. No paid placements. Just the truth.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div>
              <p className="font-semibold mb-4" style={{ color: "#FFFFFF" }}>Platform</p>
              <div className="flex flex-col gap-3" style={{ color: "#6E6E73" }}>
                <Link href="/vendors" className="hover:text-white transition-colors">Supplier Reviews</Link>
                <Link href="/peptides" className="hover:text-white transition-colors">Peptide Library</Link>
                <Link href="/calculator" className="hover:text-white transition-colors">Reconstitution Calculator</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-4" style={{ color: "#FFFFFF" }}>Info</p>
              <div className="flex flex-col gap-3" style={{ color: "#6E6E73" }}>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/about" className="hover:text-white transition-colors">Methodology</Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #2D2D2D", paddingTop: "1.5rem" }}>
          <p className="text-sm" style={{ color: "#6E6E73" }}>
            © 2026 Watchtower Peptides — Independent research only. Not medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
