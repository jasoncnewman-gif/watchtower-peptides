import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────
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

type LabTest = {
  id: string;
  lab_name: string | null;
  test_type: string | null;
  purity_result: number | null;
  test_date: string | null;
  verified: boolean;
};

type Alert = {
  id: string;
  alert_type: string | null;
  message: string | null;
  created_date: string;
  resolved: boolean;
};

type Ad = {
  id: string;
  ad_text: string | null;
  platform: string | null;
  first_seen: string | null;
  last_seen: string | null;
  red_flags: string[] | null;
};

// ── Helpers ────────────────────────────────────────────────────
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

function purityColor(purity: number | null) {
  if (purity === null) return "#9A7C65";
  if (purity >= 98) return "#22c55e";
  if (purity >= 95) return "#eab308";
  return "#ef4444";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Data fetching ──────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function getVendor(id: string): Promise<Vendor | null> {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

async function getLabTests(vendorId: string): Promise<LabTest[]> {
  const { data } = await getSupabase()
    .from("lab_tests")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("test_date", { ascending: false });
  return data ?? [];
}

async function getAlerts(vendorId: string): Promise<Alert[]> {
  const { data } = await getSupabase()
    .from("alerts")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_date", { ascending: false });
  return data ?? [];
}

async function getAds(vendorId: string): Promise<Ad[]> {
  const { data } = await getSupabase()
    .from("ads")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("first_seen", { ascending: false });
  return data ?? [];
}

// ── Page ───────────────────────────────────────────────────────
export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vendor, labTests, alerts, ads] = await Promise.all([
    getVendor(id),
    getLabTests(id),
    getAlerts(id),
    getAds(id),
  ]);

  if (!vendor) notFound();

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

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
            <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
            <Link href="/lab-tests" className="hover:text-white transition-colors">Lab Tests</Link>
            <Link href="/alerts" className="hover:text-white transition-colors">Alerts</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
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

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "#9A7C65" }}>
          <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
          <span>›</span>
          <span style={{ color: "#DAC6B6" }}>{vendor.name}</span>
        </div>

        {/* Vendor Header */}
        <div
          className="rounded-xl p-8 mb-8"
          style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">

            {/* Left: info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold" style={{ color: "#DAC6B6" }}>{vendor.name}</h1>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium capitalize"
                  style={{
                    backgroundColor: vendor.status === "flagged" ? "#3D1C0C" : "#000101",
                    color: vendor.status === "flagged" ? "#ef4444" :
                           vendor.status === "active" ? "#22c55e" : "#9A7C65",
                  }}
                >
                  {vendor.status}
                </span>
                {vendor.has_coa && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#0a2e1a", color: "#22c55e" }}
                  >
                    ✓ COA Verified
                  </span>
                )}
              </div>

              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: "#186784" }}
                >
                  {vendor.website} ↗
                </a>
              )}

              <div className="flex flex-wrap gap-6 mt-4 text-sm" style={{ color: "#C0A088" }}>
                {vendor.location && <span>📍 {vendor.location}</span>}
                <span>📅 Added {formatDate(vendor.date_added)}</span>
                <span>🔬 {labTests.length} lab test{labTests.length !== 1 ? "s" : ""}</span>
                <span>🚩 {activeAlerts.length} active alert{activeAlerts.length !== 1 ? "s" : ""}</span>
              </div>

              {vendor.notes && (
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#C0A088" }}>
                  {vendor.notes}
                </p>
              )}
            </div>

            {/* Right: score */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                style={{
                  backgroundColor: "#000101",
                  color: scoreColor(vendor.overall_score),
                  border: `3px solid ${scoreColor(vendor.overall_score)}`,
                }}
              >
                {vendor.overall_score ?? "—"}
              </div>
              <div className="text-sm font-semibold mt-2" style={{ color: scoreColor(vendor.overall_score) }}>
                {scoreLabel(vendor.overall_score)}
              </div>
              <div className="text-xs mt-1" style={{ color: "#9A7C65" }}>Overall Score</div>
            </div>

          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#ef4444" }}>
              🚨 Active Alerts ({activeAlerts.length})
            </h2>
            <div className="flex flex-col gap-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: "#2D0C0C", border: "1px solid #ef4444" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {alert.alert_type && (
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#ef4444" }}>
                          {alert.alert_type.replace(/_/g, " ")}
                        </span>
                      )}
                      <p className="text-sm mt-1" style={{ color: "#DAC6B6" }}>{alert.message}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "#9A7C65" }}>
                      {formatDate(alert.created_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Tests */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#DAC6B6" }}>
            🔬 Lab Tests ({labTests.length})
          </h2>
          {labTests.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <p style={{ color: "#9A7C65" }}>No lab tests on record for this vendor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #186784" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#0C2E3D", borderBottom: "1px solid #186784" }}>
                    {["Lab", "Test Type", "Purity", "Date", "Verified"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: "#C0A088" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labTests.map((test, i) => (
                    <tr
                      key={test.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#060f14" : "#000101",
                        borderBottom: "1px solid #0C2E3D",
                      }}
                    >
                      <td className="px-4 py-3" style={{ color: "#DAC6B6" }}>{test.lab_name ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: "#DAC6B6" }}>{test.test_type ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: purityColor(test.purity_result) }}>
                        {test.purity_result !== null ? `${test.purity_result}%` : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#C0A088" }}>{formatDate(test.test_date)}</td>
                      <td className="px-4 py-3">
                        <span style={{ color: test.verified ? "#22c55e" : "#9A7C65" }}>
                          {test.verified ? "✓ Yes" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ad History */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#DAC6B6" }}>
            📢 Ad History ({ads.length})
          </h2>
          {ads.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <p style={{ color: "#9A7C65" }}>No ads on record for this vendor.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: "#0C2E3D",
                    border: `1px solid ${ad.red_flags?.length ? "#ef4444" : "#186784"}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {ad.platform && (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: "#186784", color: "#DAC6B6" }}
                      >
                        {ad.platform}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "#9A7C65" }}>
                      {formatDate(ad.first_seen)} → {formatDate(ad.last_seen)}
                    </span>
                  </div>
                  {ad.ad_text && (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#DAC6B6" }}>
                      "{ad.ad_text}"
                    </p>
                  )}
                  {ad.red_flags && ad.red_flags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ad.red_flags.map((flag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: "#3D1C0C", color: "#ef4444" }}
                        >
                          🚩 {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#9A7C65" }}>
              ✓ Resolved Alerts ({resolvedAlerts.length})
            </h2>
            <div className="flex flex-col gap-3">
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784", opacity: 0.6 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {alert.alert_type && (
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9A7C65" }}>
                          {alert.alert_type.replace(/_/g, " ")}
                        </span>
                      )}
                      <p className="text-sm mt-1" style={{ color: "#C0A088" }}>{alert.message}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "#9A7C65" }}>
                      {formatDate(alert.created_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: "1px solid #0C2E3D", color: "#9A7C65" }}>
        <p>© 2026 Watchtower Peptides — Independent research only. Not medical advice.</p>
      </footer>

    </div>
  );
}
