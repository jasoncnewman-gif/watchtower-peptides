import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/vendors", label: "Vendors" },
  { href: "/lab-tests", label: "Lab Tests" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
];

type Vendor = {
  id: string;
  name: string;
  website: string | null;
  overall_score: number | null;
  status: string;
  location: string | null;
  has_coa: boolean;
  date_added: string;
  notes: string | null;
};

function scoreColor(score: number | null) {
  if (score === null) return "#9A7C65";
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#eab308";
  return "#ef4444";
}

function scoreLabel(score: number | null) {
  if (score === null) return "Unrated";
  if (score >= 8) return "Trusted";
  if (score >= 6) return "Caution";
  return "Avoid";
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    active:   { bg: "#0C2E3D", text: "#22c55e" },
    flagged:  { bg: "#3D1C0C", text: "#ef4444" },
    closed:   { bg: "#1a1a1a", text: "#9A7C65" },
    inactive: { bg: "#1a1a1a", text: "#9A7C65" },
  };
  return map[status] ?? map.active;
}

async function getVendors(): Promise<Vendor[]> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("overall_score", { ascending: false, nullsFirst: false });
  if (error) { console.error(error); return []; }
  return data ?? [];
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#DAC6B6" }}>

      {/* Nav */}
      <nav style={{ backgroundColor: "#0C2E3D", borderBottom: "1px solid #186784" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ color: "#186784" }} className="text-2xl">⚑</span>
            <span className="font-bold text-lg tracking-tight" style={{ color: "#DAC6B6" }}>
              Watchtower Peptides
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#C0A088" }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <Link
            href="/vendors"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#186784", color: "#DAC6B6" }}
          >
            View All Vendors
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#DAC6B6" }}>
            Vendor Directory
          </h1>
          <p className="text-lg" style={{ color: "#C0A088" }}>
            Every vendor independently scored on lab testing, transparency, and reliability.
          </p>
        </div>
      </section>

      {/* Vendor Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">

          {vendors.length === 0 ? (
            /* Empty state */
            <div
              className="text-center py-24 rounded-xl"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <div className="text-5xl mb-4">⚑</div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#DAC6B6" }}>
                No vendors yet
              </h2>
              <p style={{ color: "#9A7C65" }}>
                Vendors will appear here once added to the database.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => {
                const badge = statusBadge(vendor.status);
                return (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.id}`}
                    className="block rounded-xl p-6 transition-all hover:opacity-90"
                    style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="font-bold text-lg" style={{ color: "#DAC6B6" }}>
                          {vendor.name}
                        </h2>
                        {vendor.website && (
                          <p className="text-sm mt-0.5" style={{ color: "#9A7C65" }}>
                            {vendor.website.replace(/^https?:\/\//, "")}
                          </p>
                        )}
                      </div>
                      {/* Score badge */}
                      <div className="text-center ml-4 shrink-0">
                        <div
                          className="text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: "#000101",
                            color: scoreColor(vendor.overall_score),
                            border: `2px solid ${scoreColor(vendor.overall_score)}`,
                          }}
                        >
                          {vendor.overall_score ?? "—"}
                        </div>
                        <div className="text-xs mt-1" style={{ color: scoreColor(vendor.overall_score) }}>
                          {scoreLabel(vendor.overall_score)}
                        </div>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium capitalize"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {vendor.status}
                      </span>
                      {vendor.has_coa && (
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: "#0a2e1a", color: "#22c55e" }}
                        >
                          ✓ COA Verified
                        </span>
                      )}
                      {vendor.location && (
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: "#000101", color: "#9A7C65" }}
                        >
                          📍 {vendor.location}
                        </span>
                      )}
                    </div>

                    {/* Notes preview */}
                    {vendor.notes && (
                      <p
                        className="text-sm mt-3 line-clamp-2"
                        style={{ color: "#C0A088" }}
                      >
                        {vendor.notes}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: "1px solid #0C2E3D", color: "#9A7C65" }}>
        <p>© 2026 Watchtower Peptides — Independent research only. Not medical advice.</p>
      </footer>

    </div>
  );
}
