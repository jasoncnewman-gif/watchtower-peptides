import Link from "next/link";

const VERSES = [
  {
    text: "Your body is a temple of the Holy Spirit within you, whom you have from God? You are not your own, for you were bought with a price. So glorify God in your body.",
    reference: "1 Corinthians 6:19–20 ESV",
  },
  {
    text: "I will restore health to you, and your wounds I will heal, declares the LORD.",
    reference: "Jeremiah 30:17 ESV",
  },
  {
    text: "I pray that all may go well with you and that you may be in good health, as it goes well with your soul.",
    reference: "3 John 1:2 ESV",
  },
];

interface FooterProps {
  verseIndex?: number;
}

export default function Footer({ verseIndex = 0 }: FooterProps) {
  const verse = VERSES[verseIndex % VERSES.length];

  return (
    <footer className="px-6 pt-14 pb-10" style={{ backgroundColor: "#1D1D1F" }}>
      <div className="max-w-6xl mx-auto">

        {/* Links row */}
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

        {/* Verse */}
        <div
          className="text-center py-8 px-4"
          style={{ borderTop: "1px solid #2D2D2D", borderBottom: "1px solid #2D2D2D" }}
        >
          <p
            className="text-sm italic leading-relaxed max-w-2xl mx-auto mb-2"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="text-xs font-medium tracking-wide" style={{ color: "#6E6E73" }}>
            — {verse.reference}
          </p>
        </div>

        {/* Copyright */}
        <div className="pt-6">
          <p className="text-sm" style={{ color: "#6E6E73" }}>
            © 2026 Watchtower Peptides — Independent research only. Not medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
