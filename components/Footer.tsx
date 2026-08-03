import Link from "next/link";
import Image from "next/image";

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
            <div className="mb-3">
              <Link href="/">
                <Image
                  src="/images/logo-footer.png"
                  alt="Watchtower Peptides"
                  width={200}
                  height={40}
                />
              </Link>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
              Independent research platform. Every score is earned, not bought — some blood-test partners pay
              a referral commission, disclosed on their page, but it never affects a rating.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div>
              <p className="font-semibold mb-4" style={{ color: "#FFFFFF" }}>Platform</p>
              <div className="flex flex-col gap-3" style={{ color: "#6E6E73" }}>
                <Link href="/vendors" className="hover:text-white transition-colors">Vendor Reviews</Link>
                <Link href="/labs" className="hover:text-white transition-colors">Lab Verification</Link>
                <Link href="/peptides" className="hover:text-white transition-colors">Peptide Library</Link>
                <Link href="/calculator" className="hover:text-white transition-colors">Reconstitution Calculator</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-4" style={{ color: "#FFFFFF" }}>Info</p>
              <div className="flex flex-col gap-3" style={{ color: "#6E6E73" }}>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/about" className="hover:text-white transition-colors">Methodology</Link>
                <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
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

        {/* Copyright + disclaimer */}
        <div className="pt-6 flex flex-col gap-2">
          <p className="text-sm" style={{ color: "#6E6E73" }}>
            © 2026 Watchtower Peptides — Independent research only. Ratings are never influenced by affiliate relationships.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#4E4E53" }}>
            All peptides referenced on this site are sold by third-party vendors as research chemicals
            for laboratory use only. Not intended for human consumption. Not medical advice.{" "}
            <Link href="/disclaimer" className="underline hover:text-white transition-colors">
              Full disclaimer
            </Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
