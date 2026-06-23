import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — needed to bypass RLS for admin writes
function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { type, id, action, summary, sentiment } = await req.json() as {
    type: "audit" | "sentiment";
    id: string;
    action: "approved" | "denied";
    summary?: string;
    sentiment?: string;
  };

  if (!type || !id || !["approved", "denied"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = serviceDb();
  const now = new Date().toISOString();

  if (type === "audit") {
    const { data: log, error: e1 } = await db
      .from("vendor_audit_log")
      .update({ status: action, reviewed_at: now, ...(summary ? { change_summary: summary } : {}) })
      .eq("id", id)
      .select("vendor_id, audited_at, score_after, score_changed")
      .single();

    if (e1 || !log) {
      return NextResponse.json({ error: e1?.message ?? "Not found" }, { status: 500 });
    }

    // On approve: update last_reviewed and apply proposed score if it changed
    if (action === "approved") {
      const vendorUpdates: Record<string, unknown> = { last_reviewed: log.audited_at };
      if (log.score_changed) vendorUpdates.overall_score = log.score_after;
      await db.from("vendors").update(vendorUpdates).eq("id", log.vendor_id);
    }
  } else {
    const { data: log, error: e1 } = await db
      .from("vendor_sentiment_log")
      .update({
        status: action,
        ...(summary ? { summary } : {}),
        ...(sentiment ? { sentiment } : {}),
      })
      .eq("id", id)
      .select("vendor_id, sentiment, summary")
      .single();

    if (e1 || !log) {
      return NextResponse.json({ error: e1?.message ?? "Not found" }, { status: 500 });
    }

    // On approve: sync sentiment to vendor flat fields
    if (action === "approved") {
      await db
        .from("vendors")
        .update({
          reddit_sentiment: log.sentiment === "insufficient_data" ? null : log.sentiment,
          positive_review_summary: log.summary,
        })
        .eq("id", log.vendor_id);
    }
  }

  return NextResponse.json({ ok: true });
}
