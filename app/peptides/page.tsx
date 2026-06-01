import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockPeptides } from "@/lib/mock-data";

const FDA_CONFIG = {
  approved:        { label: "FDA Approved",  bg: "#DCFCE7", text: "#16A34A" },
  "not-approved":  { label: "Not Approved",  bg: "#FEF3C7", text: "#D97706" },
  "research-only": { label: "Research Only", bg: "#DBEAFE", text: "#2563EB" },
};

export default function PeptidesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Peptide Library
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Peptide Library</h1>
            <p className="text-xl" style={{ color: "#6E6E73" }}>
              Dosage guides, reconstitution instructions, and research summaries for commonly studied peptides.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto pt-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mockPeptides.map((peptide) => {
                const fda = FDA_CONFIG[peptide.fda_status];
                return (
                  <Link
                    key={peptide.slug}
                    href={`/peptides/${peptide.slug}`}
                    className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-bold text-xl" style={{ color: "#1D1D1F" }}>{peptide.name}</h2>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: fda.bg, color: fda.text }}
                      >
                        {fda.label}
                      </span>
                    </div>

                    {peptide.aliases.length > 0 && (
                      <p className="text-xs mb-3" style={{ color: "#6E6E73" }}>
                        {peptide.aliases.join(" · ")}
                      </p>
                    )}

                    <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: "#6E6E73" }}>
                      {peptide.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}>
                        {peptide.vendors.length} vendor{peptide.vendors.length !== 1 ? "s" : ""}
                      </span>
                      <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}>
                        {peptide.studies.length} {peptide.studies.length !== 1 ? "studies" : "study"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer verseIndex={1} />
    </div>
  );
}
