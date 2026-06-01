import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockPeptides, mockVendors } from "@/lib/mock-data";

const FDA_CONFIG = {
  approved:        { label: "FDA Approved",  bg: "#DCFCE7", text: "#16A34A" },
  "not-approved":  { label: "Not Approved",  bg: "#FEF3C7", text: "#D97706" },
  "research-only": { label: "Research Only", bg: "#DBEAFE", text: "#2563EB" },
};

const VENDOR_STATUS_CONFIG = {
  recommended:       { label: "Recommended",     bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution", bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended", bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",    bg: "#EDE9FE", text: "#7C3AED" },
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
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-10" style={{ color: "#6E6E73" }}>
            <Link href="/peptides" className="hover:text-black transition-colors">Peptide Library</Link>
            <span>›</span>
            <span style={{ color: "#1D1D1F" }}>{peptide.name}</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
            <div className="flex items-start gap-4 flex-wrap mb-4">
              <h1 className="text-3xl font-bold" style={{ color: "#1D1D1F" }}>{peptide.name}</h1>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: fda.bg, color: fda.text }}
              >
                {fda.label}
              </span>
            </div>
            {peptide.aliases.length > 0 && (
              <p className="text-sm mb-4" style={{ color: "#6E6E73" }}>
                Also known as: {peptide.aliases.join(", ")}
              </p>
            )}
            <p className="text-base leading-relaxed" style={{ color: "#6E6E73" }}>
              {peptide.description}
            </p>
          </div>

          {/* Dosage & Reconstitution */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-3" style={{ color: "#1D1D1F" }}>💉 Typical Dosage</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                {peptide.typical_dosage}
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-3" style={{ color: "#1D1D1F" }}>🧪 Reconstitution</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                {peptide.reconstitution}
              </p>
              <Link
                href="/calculator"
                className="inline-block mt-3 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "#186784" }}
              >
                Use the Reconstitution Calculator →
              </Link>
            </div>
          </div>

          {/* Studies */}
          {peptide.studies.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#F5F5F7" }}>
              <h2 className="font-semibold mb-4" style={{ color: "#1D1D1F" }}>📚 Research Studies</h2>
              <div className="flex flex-col gap-3">
                {peptide.studies.map((study, i) => (
                  <a
                    key={i}
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm hover:opacity-70 transition-opacity"
                  >
                    <span style={{ color: "#186784" }} className="shrink-0 mt-0.5">↗</span>
                    <span style={{ color: "#6E6E73" }} className="hover:underline">{study.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {vendors.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4" style={{ color: "#1D1D1F" }}>
                Available From ({vendors.length} vendor{vendors.length !== 1 ? "s" : ""})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {vendors.map((vendor) => {
                  const item = vendor.peptide_inventory.find(
                    (p) => p.name.toLowerCase() === peptide.name.toLowerCase()
                  );
                  const vs = VENDOR_STATUS_CONFIG[vendor.status];
                  return (
                    <Link
                      key={vendor.slug}
                      href={`/vendors/${vendor.slug}`}
                      className="flex items-center justify-between rounded-2xl p-5 transition-shadow hover:shadow-md"
                      style={{ backgroundColor: "#F5F5F7" }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: "#1D1D1F" }}>{vendor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: vs.bg, color: vs.text }}
                          >
                            {vs.label}
                          </span>
                          {item && (
                            <span className="text-sm" style={{ color: "#6E6E73" }}>{item.price}</span>
                          )}
                        </div>
                      </div>
                      {item && (
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                          style={{
                            backgroundColor: item.in_stock ? "#DCFCE7" : "#FEE2E2",
                            color: item.in_stock ? "#16A34A" : "#DC2626",
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

          <Link
            href="/peptides"
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#1D1D1F" }}
          >
            ← Back to Peptide Library
          </Link>
        </div>
      </div>

      <Footer verseIndex={2} />
    </div>
  );
}
