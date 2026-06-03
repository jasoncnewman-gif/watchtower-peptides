import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const FDA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved:        { label: "FDA Approved",  bg: "#DCFCE7", text: "#16A34A" },
  "not-approved":  { label: "Not Approved",  bg: "#FEF3C7", text: "#D97706" },
  "research-only": { label: "Research Only", bg: "#DBEAFE", text: "#2563EB" },
};

export default async function PeptidesPage() {
  const [{ data: vpRows }, { data: peptideRows }] = await Promise.all([
    supabase.from("vendor_peptides").select("peptide_name, vendor_id, list_price, sale_price"),
    supabase.from("peptides").select("slug, name, description, fda_status"),
  ]);

  // Group vendor_peptides by slugified name
  type Group = {
    displayName: string;
    slug: string;
    vendorIds: Set<string>;
    prices: number[];
  };
  const bySlug = new Map<string, Group>();

  for (const row of vpRows ?? []) {
    const slug = toSlug(row.peptide_name);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { displayName: row.peptide_name, slug, vendorIds: new Set(), prices: [] });
    }
    const g = bySlug.get(slug)!;
    g.vendorIds.add(row.vendor_id);
    const effective = row.sale_price ?? row.list_price;
    if (effective != null) g.prices.push(effective);
  }

  // Build peptide info map for enrichment
  const peptideBySlug = new Map((peptideRows ?? []).map((p) => [p.slug, p]));

  // Sort by vendor count descending
  const peptides = [...bySlug.values()].sort((a, b) => b.vendorIds.size - a.vendorIds.size);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Price Comparison
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Peptide Comparison</h1>
            <p className="text-xl" style={{ color: "#6E6E73" }}>
              Compare prices across verified vendors for every peptide we track.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto pt-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {peptides.map((g) => {
                const info = peptideBySlug.get(g.slug);
                const fda = info?.fda_status ? FDA_CONFIG[info.fda_status] : null;
                const minPrice = g.prices.length > 0 ? Math.min(...g.prices) : null;
                const maxPrice = g.prices.length > 0 ? Math.max(...g.prices) : null;

                return (
                  <Link
                    key={g.slug}
                    href={`/peptides/${g.slug}`}
                    className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-bold text-xl" style={{ color: "#1D1D1F" }}>{g.displayName}</h2>
                      {fda && (
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
                          style={{ backgroundColor: fda.bg, color: fda.text }}
                        >
                          {fda.label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: "#6E6E73" }}>
                      {info?.description ?? `Compare prices from ${g.vendorIds.size} vendor${g.vendorIds.size !== 1 ? "s" : ""}.`}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}>
                        {g.vendorIds.size} vendor{g.vendorIds.size !== 1 ? "s" : ""}
                      </span>
                      {minPrice != null && (
                        <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F5F7", color: "#6E6E73" }}>
                          {minPrice === maxPrice
                            ? `$${minPrice.toFixed(2)}`
                            : `$${minPrice.toFixed(2)} – $${maxPrice!.toFixed(2)}`}
                        </span>
                      )}
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
