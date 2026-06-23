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
    type: string;
    id: string;
    action: "approved" | "denied";
    summary?: string;
    sentiment?: string;
  };

  if (!["audit", "sentiment"].includes(type) || !id || !["approved", "denied"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = serviceDb();
  const now = new Date().toISOString();

  if (type === "audit") {
    const { data: log, error: e1 } = await db
      .from("vendor_audit_log")
      .update({ status: action, reviewed_at: now, ...(summary ? { change_summary: summary } : {}) })
      .eq("id", id)
      .select("vendor_id, audited_at, score_after, score_changed, sub_scores")
      .single();

    if (e1 || !log) {
      return NextResponse.json({ error: e1?.message ?? "Not found" }, { status: 500 });
    }

    if (action === "approved") {
      const vendorUpdates: Record<string, unknown> = { last_reviewed: log.audited_at };
      if (log.score_changed) {
        vendorUpdates.overall_score = log.score_after;
        const sub = log.sub_scores as { lv?: number; pq?: number; tr?: number; cx?: number } | null;
        if (sub) {
          if (sub.lv !== undefined) vendorUpdates.lab_testing_score          = sub.lv;
          if (sub.pq !== undefined) vendorUpdates.purity_accuracy_score      = sub.pq;
          if (sub.tr !== undefined) vendorUpdates.transparency_score         = sub.tr;
          if (sub.cx !== undefined) vendorUpdates.pricing_reliability_score  = sub.cx;
        }
      }
      const { error: ve } = await db.from("vendors").update(vendorUpdates).eq("id", log.vendor_id);
      if (ve) return NextResponse.json({ error: ve.message }, { status: 500 });
    }
  } else {
    const { data: log, error: e1 } = await db
      .from("vendor_sentiment_log")
      .update({
        status: action,
        ...(summary   ? { summary }   : {}),
        ...(sentiment ? { sentiment } : {}),
      })
      .eq("id", id)
      .select("vendor_id, sentiment, summary")
      .single();

    if (e1 || !log) {
      return NextResponse.json({ error: e1?.message ?? "Not found" }, { status: 500 });
    }

    if (action === "approved") {
      const sentimentFields: Record<string, unknown> = {
        reddit_sentiment: log.sentiment === "insufficient_data" ? null : log.sentiment,
      };
      if (log.sentiment === "positive")  sentimentFields.positive_review_summary  = log.summary;
      if (log.sentiment === "negative")  sentimentFields.negative_review_summary  = log.summary;

      const { error: ve } = await db.from("vendors").update(sentimentFields).eq("id", log.vendor_id);
      if (ve) return NextResponse.json({ error: ve.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
