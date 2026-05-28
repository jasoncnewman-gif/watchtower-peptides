import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockPeptides, mockVendors } from "@/lib/mock-data";

const FDA_CONFIG = {
  approved:        { label: "FDA Approved",   bg: "#0a2e1a", text: "#22c55e" },
  "not-approved":  { label: "Not Approved",   bg: "#2e1f00", text: "#eab308" },
  "research-only": { label: "Research Only",  bg: "#1a1f2e", text: "#60a5fa" },
};

export async function generateStaticParams() {
  return mockPeptides.map((p) => ({ slug: p.slug }));
}

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const peptide = mockPeptides.find((p) => p.slug === slug);
  if (!peptide) notFound();

  const fda = FDA_CONFIG[peptide.fda_status];
  const vendors = mockVendors.filter((v) => peptide.vendors.includes(v.slug));

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "#9A7C65" }}>
            <Link href="/peptides" className="hover:text-white transition-colors">Peptide Library</Link>
            <span>›</span>
            <span style={{ color: "#FFFCF2" }}>{peptide.name}</span>
          </div>

          {/* Header */}
          <div
            className="rounded-xl p-8 mb-6"
            style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
          >
            <div className="flex items-start gap-4 flex-wrap mb-4">
              <h1 className="text-3xl font-bold" style={{ color: "#FFFCF2" }}>{peptide.name}</h1>
              <span
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: fda.bg, color: fda.text }}
              >
                {fda.label}
              </span>
            </div>
            {peptide.aliases.length > 0 && (
              <p className="text-sm mb-4" style={{ color: "#9A7C65" }}>
                Also known as: {peptide.aliases.join(", ")}
              </p>
            )}
            <p className="text-base leading-relaxed" style={{ color: "#C0A088" }}>
              {peptide.description}
            </p>
          </div>

          {/* Dosage & Reconstitution */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: "#FFFCF2" }}>
                💉 Typical Dosage
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#C0A088" }}>
                {peptide.typical_dosage}
              </p>
            </div>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: "#FFFCF2" }}>
                🧪 Reconstitution
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#C0A088" }}>
                {peptide.reconstitution}
              </p>
              <Link
                href="/calculator"
                className="inline-block mt-3 text-xs transition-colors hover:opacity-80"
                style={{ color: "#186784" }}
              >
                Use the Reconstitution Calculator →
              </Link>
            </div>
          </div>

          {/* Studies */}
          {peptide.studies.length > 0 && (
            <div
              className="rounded-xl p-6 mb-6"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: "#FFFCF2" }}>
                📚 Research Studies
              </h2>
              <div className="flex flex-col gap-3">
                {peptide.studies.map((study, i) => (
                  <a
                    key={i}
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm hover:opacity-80 transition-opacity"
                  >
                    <span style={{ color: "#186784" }} className="shrink-0 mt-0.5">↗</span>
                    <span style={{ color: "#C0A088" }} className="hover:underline">{study.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {vendors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4" style={{ color: "#FFFCF2" }}>
                🏪 Available From ({vendors.length} vendor{vendors.length !== 1 ? "s" : ""})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {vendors.map((vendor) => {
                  const item = vendor.peptide_inventory.find(
                    (p) => p.name.toLowerCase() === peptide.name.toLowerCase()
                  );
                  return (
                    <Link
                      key={vendor.slug}
                      href={`/vendors/${vendor.slug}`}
                      className="flex items-center justify-between rounded-xl p-4 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: "#FFFCF2" }}>{vendor.name}</p>
                        {item && (
                          <p className="text-sm mt-0.5" style={{ color: "#C0A088" }}>{item.price}</p>
                        )}
                      </div>
                      {item && (
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: item.in_stock ? "#0a2e1a" : "#3D1C0C",
                            color: item.in_stock ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.in_stock ? "In Stock" : "Out of Stock"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back link */}
          <Link
            href="/peptides"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: "#186784" }}
          >
            ← Back to Peptide Library
          </Link>

        </div>
      </div>

      <Footer />
    </div>
  );
}
