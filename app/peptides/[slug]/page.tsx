import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function scoreColor(score: number) {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function displayStatus(status: string, score: number | null): "recommended" | "caution" | "not-recommended" | "under-review" {
  if (status === "flagged" || status === "closed") return "not-recommended";
  if (status === "inactive") return "caution";
  if (score === null) return "under-review";
  if (score >= 80) return "recommended";
  if (score >= 55) return "caution";
  return "not-recommended";
}

const STATUS_CONFIG = {
  recommended:       { label: "Recommended",      bg: "#DCFCE7", text: "#16A34A" },
  caution:           { label: "Use With Caution",  bg: "#FEF3C7", text: "#D97706" },
  "not-recommended": { label: "Not Recommended",   bg: "#FEE2E2", text: "#DC2626" },
  "under-review":    { label: "Under Review",      bg: "#EDE9FE", text: "#7C3AED" },
};

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: "FDA Approved",  bg: "#DCFCE7", text: "#16A34A" },
  "not-approved":  { label: "Not Approved",  bg: "#FEF3C7", text: "#D97706" },
  "research-only": { label: "Research Only", bg: "#DBEAFE", text: "#2563EB" },
};

type VpRow = {
  vendor_id: string;
  peptide_name: string;
  size_mg: number | null;
  list_price: number | null;
  sale_price: number | null;
  in_stock: boolean;
};

type VendorRow = {
  id: string;
  name: string;
  slug: string | null;
  overall_score: number | null;
  status: string;
  website: string | null;
};

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch all vendor_peptides to find rows matching this slug
  const [{ data: vpAll }, { data: peptideInfo }] = await Promise.all([
    supabase
      .from("vendor_peptides")
      .select("vendor_id, peptide_name, size_mg, list_price, sale_price, in_stock")
      .not("list_price", "is", null),
    supabase.from("peptides").select("name, slug, description, aliases, fda_status, typical_dosage, reconstitution_instructions").eq("slug", slug).maybeSingle(),
  ]);

  const allRows = (vpAll ?? []) as VpRow[];
  const matchingRows = allRows.filter((r) => toSlug(r.peptide_name) === slug && r.size_mg != null);

  if (matchingRows.length === 0) notFound();

  // Determine canonical display name (most common among matching)
  const nameCounts = new Map<string, number>();
  for (const r of matchingRows) {
    nameCounts.set(r.peptide_name, (nameCounts.get(r.peptide_name) ?? 0) + 1);
  }
  const displayName = [...nameCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Fetch vendor info for all matching vendor_ids
  const vendorIds = [...new Set(matchingRows.map((r) => r.vendor_id))];
  const { data: vendorsData } = await supabase
    .from("vendors")
    .select("id, name, slug, overall_score, status, website")
    .in("id", vendorIds);

  const vendors = (vendorsData ?? []) as VendorRow[];
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // Collect distinct sizes, sorted ascending
  const sizes = [...new Set(matchingRows.map((r) => r.size_mg as number))].sort((a, b) => a - b);

  // Build per-vendor price map: vendorId → { [size]: { price, onSale, inStock } }
  type PriceEntry = { price: number; onSale: boolean; inStock: boolean };
  const priceMap = new Map<string, Map<number, PriceEntry>>();
  for (const r of matchingRows) {
    if (!priceMap.has(r.vendor_id)) priceMap.set(r.vendor_id, new Map());
    const existing = priceMap.get(r.vendor_id)!.get(r.size_mg!);
    const effective = r.sale_price ?? r.list_price!;
    if (!existing || effective < existing.price) {
      priceMap.get(r.vendor_id)!.set(r.size_mg!, {
        price: effective,
        onSale: r.sale_price != null,
        inStock: r.in_stock,
      });
    }
  }

  // Sort vendors by overall_score descending
  const sortedVendors = [...vendors].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));

  const fda = peptideInfo?.fda_status ? FDA_CONFIG[peptideInfo.fda_status] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-6 py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-10" style={{ color: "#6E6E73" }}>
            <Link href="/peptides" className="hover:text-black transition-colors">Peptide Comparison</Link>
            <span>›</span>
            <span style={{ color: "#1D1D1F" }}>{displayName}</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: "#F5F5F7" }}>
            <div className="flex items-start gap-4 flex-wrap mb-3">
              <h1 className="text-3xl font-bold" style={{ color: "#1D1D1F" }}>{displayName}</h1>
              {fda && (
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: fda.bg, color: fda.text }}
                >
                  {fda.label}
                </span>
              )}
            </div>

            {peptideInfo?.aliases && peptideInfo.aliases.length > 0 && (
              <p className="text-sm mb-3" style={{ color: "#6E6E73" }}>
                Also known as: {peptideInfo.aliases.join(", ")}
              </p>
            )}

            {peptideInfo?.description && (
              <p className="text-base leading-relaxed mb-4" style={{ color: "#6E6E73" }}>
                {peptideInfo.description}
              </p>
            )}

            {(peptideInfo?.typical_dosage || peptideInfo?.reconstitution_instructions) && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {peptideInfo.typical_dosage && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#186784" }}>Typical Dosage</p>
                    <p className="text-sm" style={{ color: "#6E6E73" }}>{peptideInfo.typical_dosage}</p>
                  </div>
                )}
                {peptideInfo.reconstitution_instructions && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#186784" }}>Reconstitution</p>
                    <p className="text-sm" style={{ color: "#6E6E73" }}>{peptideInfo.reconstitution_instructions}</p>
                    <Link
                      href="/calculator"
                      className="inline-block mt-2 text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: "#186784" }}
                    >
                      Reconstitution Calculator →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <h2 className="text-xl font-bold mb-4" style={{ color: "#1D1D1F" }}>
            Price Comparison ({sortedVendors.length} vendor{sortedVendors.length !== 1 ? "s" : ""})
          </h2>

          <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: "#F5F5F7" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
                  <th className="text-left px-5 py-4 font-semibold" style={{ color: "#1D1D1F", minWidth: "180px" }}>Vendor</th>
                  <th className="text-center px-4 py-4 font-semibold" style={{ color: "#1D1D1F" }}>Score</th>
                  <th className="text-left px-4 py-4 font-semibold" style={{ color: "#1D1D1F" }}>Status</th>
                  {sizes.map((mg) => (
                    <th key={mg} className="text-right px-4 py-4 font-semibold" style={{ color: "#1D1D1F" }}>
                      {mg}mg
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedVendors.map((vendor, i) => {
                  const ds = displayStatus(vendor.status, vendor.overall_score);
                  const sc = STATUS_CONFIG[ds];
                  const score = vendor.overall_score ?? 0;
                  const color = scoreColor(score);
                  const vendorPrices = priceMap.get(vendor.id) ?? new Map<number, PriceEntry>();

                  return (
                    <tr
                      key={vendor.id}
                      style={{
                        borderBottom: i < sortedVendors.length - 1 ? "1px solid #E5E5E7" : undefined,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {/* Vendor name */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/vendors/${vendor.slug ?? vendor.id}`}
                          className="font-medium hover:underline"
                          style={{ color: "#1D1D1F" }}
                        >
                          {vendor.name}
                        </Link>
                        {vendor.website && (
                          <p className="text-xs mt-0.5" style={{ color: "#6E6E73" }}>
                            {vendor.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </p>
                        )}
                      </td>

                      {/* Score bubble */}
                      <td className="px-4 py-4 text-center">
                        <div
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {score}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-4">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {sc.label}
                        </span>
                      </td>

                      {/* Price per size */}
                      {sizes.map((mg) => {
                        const entry = vendorPrices.get(mg);
                        return (
                          <td key={mg} className="px-4 py-4 text-right">
                            {entry ? (
                              <span style={{ color: entry.onSale ? "#16A34A" : "#1D1D1F", fontWeight: entry.onSale ? 600 : 400 }}>
                                ${entry.price.toFixed(2)}
                                {!entry.inStock && (
                                  <span className="ml-1 text-xs" style={{ color: "#6E6E73" }}>(OOS)</span>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: "#C7C7CC" }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs mt-3" style={{ color: "#6E6E73" }}>
            Green prices indicate a current sale. OOS = out of stock. Vendor scores are out of 100 and reflect lab testing, purity, transparency, community reputation, and pricing.
          </p>

          <Link
            href="/peptides"
            className="inline-flex items-center gap-2 text-sm font-medium mt-10 transition-opacity hover:opacity-70"
            style={{ color: "#1D1D1F" }}
          >
            ← Back to Peptide Comparison
          </Link>
        </div>
      </div>

      <Footer verseIndex={2} />
    </div>
  );
}
