import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import AuditClient from "./AuditClient";

export const revalidate = 0; // always fresh — admin page

export default async function AdminAuditsPage() {
  const [{ data: auditLogs }, { data: sentimentLogs }] = await Promise.all([
    supabase
      .from("vendor_audit_log")
      .select("id, vendor_id, audited_at, score_before, score_after, score_changed, change_summary, vendors(name, slug)")
      .eq("status", "pending")
      .order("audited_at", { ascending: false })
      .limit(50),

    supabase
      .from("vendor_sentiment_log")
      .select("id, vendor_id, scraped_at, post_count, sentiment, summary, notable_posts, vendors(name, slug)")
      .eq("status", "pending")
      .order("scraped_at", { ascending: false })
      .limit(50),
  ]);

  type Entry = Parameters<typeof AuditClient>[0]["entries"][number];

  const entries: Entry[] = [
    ...(auditLogs ?? []).map((row) => {
      const vendor = row.vendors as unknown as { name: string; slug: string } | null;
      return {
        id: row.id,
        type: "audit" as const,
        vendorName: vendor?.name ?? "Unknown",
        vendorSlug: vendor?.slug ?? "",
        date: row.audited_at,
        summary: row.change_summary ?? "",
        scoreBefore: row.score_before ?? undefined,
        scoreAfter: row.score_after ?? undefined,
        scoreChanged: row.score_changed ?? false,
      };
    }),
    ...(sentimentLogs ?? []).map((row) => {
      const vendor = row.vendors as unknown as { name: string; slug: string } | null;
      return {
        id: row.id,
        type: "sentiment" as const,
        vendorName: vendor?.name ?? "Unknown",
        vendorSlug: vendor?.slug ?? "",
        date: row.scraped_at,
        summary: row.summary ?? "",
        sentiment: row.sentiment ?? undefined,
        postCount: row.post_count ?? undefined,
        notablePosts: (row.notable_posts as string[] | null) ?? undefined,
      };
    }),
  ];

  const pendingCount = entries.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />
      <div className="pt-20">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1D1D1F" }}>
              Vendor Audit Queue
            </h1>
            <p style={{ color: "#6E6E73" }}>
              {pendingCount} pending item{pendingCount !== 1 ? "s" : ""} — review and approve or deny each update.
            </p>
            <p className="text-sm mt-1" style={{ color: "#6E6E73" }}>
              Run <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "#F5F5F7" }}>npm run audit:vendors</code> to queue 5 more audits.
            </p>
          </div>

          <AuditClient entries={entries} />
        </div>
      </div>
    </div>
  );
}
