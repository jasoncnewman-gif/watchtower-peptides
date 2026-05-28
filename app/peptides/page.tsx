import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockPeptides } from "@/lib/mock-data";

const FDA_CONFIG = {
  approved:        { label: "FDA Approved",   bg: "#0a2e1a", text: "#22c55e" },
  "not-approved":  { label: "Not Approved",   bg: "#2e1f00", text: "#eab308" },
  "research-only": { label: "Research Only",  bg: "#1a1f2e", text: "#60a5fa" },
};

export default function PeptidesPage() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        {/* Header */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4" style={{ color: "#FFFCF2" }}>Peptide Library</h1>
            <p className="text-lg" style={{ color: "#FFFCF2" }}>
              Dosage guides, reconstitution instructions, and research summaries for commonly studied peptides.
            </p>
          </div>
        </section>

        {/* Peptide Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPeptides.map((peptide) => {
                const fda = FDA_CONFIG[peptide.fda_status];
                return (
                  <Link
                    key={peptide.slug}
                    href={`/peptides/${peptide.slug}`}
                    className="block rounded-xl p-6 transition-all hover:opacity-90"
                    style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-bold text-xl" style={{ color: "#FFFCF2" }}>{peptide.name}</h2>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
                        style={{ backgroundColor: fda.bg, color: fda.text }}
                      >
                        {fda.label}
                      </span>
                    </div>

                    {peptide.aliases.length > 0 && (
                      <p className="text-xs mb-3" style={{ color: "#FFFCF2" }}>
                        {peptide.aliases.join(" · ")}
                      </p>
                    )}

                    <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: "#FFFCF2" }}>
                      {peptide.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs" style={{ color: "#FFFCF2" }}>
                      <span
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: "#000101" }}
                      >
                        {peptide.vendors.length} vendor{peptide.vendors.length !== 1 ? "s" : ""}
                      </span>
                      <span
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: "#000101" }}
                      >
                        {peptide.studies.length} stud{peptide.studies.length !== 1 ? "ies" : "y"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
