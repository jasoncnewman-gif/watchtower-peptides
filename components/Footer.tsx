import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="px-6 py-10 text-sm"
      style={{ borderTop: "1px solid #0C2E3D", backgroundColor: "#000101" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "#186784" }}>⚑</span>
          <span className="font-semibold" style={{ color: "#FFFCF2" }}>Watchtower Peptides</span>
        </div>
        <div className="flex gap-6" style={{ color: "#9A7C65" }}>
          <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
          <Link href="/peptides" className="hover:text-white transition-colors">Peptides</Link>
          <Link href="/calculator" className="hover:text-white transition-colors">Calculator</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </div>
        <p style={{ color: "#9A7C65" }}>
          © 2026 Watchtower Peptides — Independent research only. Not medical advice.
        </p>
      </div>
    </footer>
  );
}
