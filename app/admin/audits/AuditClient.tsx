"use client";

import { useState } from "react";

type SentimentValue = "positive" | "neutral" | "mixed" | "negative" | "insufficient_data";

type AuditEntry = {
  id: string;
  type: "audit" | "sentiment";
  vendorName: string;
  vendorSlug: string;
  date: string;
  summary: string;
  scoreBefore?: number;
  scoreAfter?: number;
  scoreChanged?: boolean;
  sentiment?: SentimentValue;
  postCount?: number;
  notablePosts?: string[];
};

const SENTIMENT_OPTIONS: { value: SentimentValue; label: string; color: string; bg: string }[] = [
  { value: "positive",          label: "Positive",          color: "#16A34A", bg: "#DCFCE7" },
  { value: "neutral",           label: "Neutral",           color: "#6E6E73", bg: "#F5F5F7" },
  { value: "mixed",             label: "Mixed",             color: "#D97706", bg: "#FEF3C7" },
  { value: "negative",          label: "Negative",          color: "#DC2626", bg: "#FEE2E2" },
  { value: "insufficient_data", label: "Insufficient Data", color: "#9333EA", bg: "#F3E8FF" },
];

function sentimentMeta(s: SentimentValue) {
  return SENTIMENT_OPTIONS.find((o) => o.value === s) ?? SENTIMENT_OPTIONS[2];
}

function AuditCard({ entry }: { entry: AuditEntry }) {
  const [status, setStatus]     = useState<"pending" | "approved" | "denied">("pending");
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState(entry.summary);
  const [sentiment, setSentiment] = useState<SentimentValue>(entry.sentiment ?? "insufficient_data");

  async function act(action: "approved" | "denied") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: entry.type,
          id: entry.id,
          action,
          summary,
          sentiment: entry.type === "sentiment" ? sentiment : undefined,
        }),
      });
      if (res.ok) setStatus(action);
    } finally {
      setLoading(false);
    }
  }

  const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const meta = sentimentMeta(sentiment);

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: status === "approved" ? "#F0FDF4" : status === "denied" ? "#FEF2F2" : "#F5F5F7",
        border: "1px solid",
        borderColor: status === "approved" ? "#BBF7D0" : status === "denied" ? "#FECACA" : "#E5E5E7",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: entry.type === "audit" ? "#EDE9FE" : "#DBEAFE",
            color: entry.type === "audit" ? "#7C3AED" : "#1D4ED8",
          }}
        >
          {entry.type === "audit" ? "AUDIT" : "SENTIMENT"}
        </span>
        <a
          href={`/vendors/${entry.vendorSlug}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold hover:underline"
          style={{ color: "#1D1D1F" }}
        >
          {entry.vendorName}
        </a>
        <span className="text-xs" style={{ color: "#6E6E73" }}>{dateStr}</span>
        {entry.postCount != null && (
          <span className="text-xs" style={{ color: "#6E6E73" }}> · {entry.postCount} posts</span>
        )}
      </div>

      {/* Sentiment selector (sentiment entries only) */}
      {entry.type === "sentiment" && status === "pending" && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SENTIMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSentiment(opt.value)}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-opacity"
              style={{
                backgroundColor: sentiment === opt.value ? opt.bg : "#E5E5E7",
                color: sentiment === opt.value ? opt.color : "#6E6E73",
                border: sentiment === opt.value ? `1.5px solid ${opt.color}` : "1.5px solid transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Sentiment badge (read-only after action) */}
      {entry.type === "sentiment" && status !== "pending" && (
        <div className="mb-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
      )}

      {/* Score change */}
      {entry.type === "audit" && entry.scoreChanged && (
        <div className="text-sm mb-2" style={{ color: "#6E6E73" }}>
          Score: {entry.scoreBefore} → <strong style={{ color: "#1D1D1F" }}>{entry.scoreAfter}</strong>
        </div>
      )}

      {/* Editable summary */}
      {status === "pending" ? (
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E7",
            color: "#1D1D1F",
            lineHeight: "1.6",
          }}
        />
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: "#3D3D3F" }}>{summary}</p>
      )}

      {/* Notable posts */}
      {entry.notablePosts && entry.notablePosts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {entry.notablePosts.slice(0, 4).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs hover:underline"
              style={{ color: "#6E6E73" }}
            >
              Source {i + 1} ↗
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {status === "pending" ? (
          <>
            <button
              onClick={() => act("approved")}
              disabled={loading}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-opacity"
              style={{ backgroundColor: "#1D1D1F", color: "#FFFFFF", opacity: loading ? 0.4 : 1 }}
            >
              {loading ? "Saving…" : "Approve"}
            </button>
            <button
              onClick={() => act("denied")}
              disabled={loading}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-opacity"
              style={{ backgroundColor: "#F5F5F7", color: "#6E6E73", border: "1px solid #E5E5E7", opacity: loading ? 0.4 : 1 }}
            >
              Deny
            </button>
          </>
        ) : (
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: status === "approved" ? "#BBF7D0" : "#FECACA",
              color: status === "approved" ? "#15803D" : "#B91C1C",
            }}
          >
            {status === "approved" ? "Approved" : "Denied"}
          </span>
        )}
      </div>
    </div>
  );
}

function RunButton({ label, endpoint, onDone }: { label: string; endpoint: string; onDone?: (output: string) => void }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [output, setOutput] = useState("");

  async function run() {
    setState("running");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json() as { ok: boolean; output: string };
      setOutput(json.output);
      setState(json.ok ? "done" : "error");
      onDone?.(json.output);
      if (json.ok) setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setState("error");
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={state === "running"}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: state === "done" ? "#DCFCE7" : state === "error" ? "#FEE2E2" : "#1D1D1F",
          color: state === "done" ? "#15803D" : state === "error" ? "#B91C1C" : "#FFFFFF",
          opacity: state === "running" ? 0.5 : 1,
        }}
      >
        {state === "running" ? "Running…" : state === "done" ? "Done ✓" : state === "error" ? "Failed ✗" : label}
      </button>
      {output && (
        <pre
          className="mt-3 text-xs rounded-xl p-3 overflow-auto max-h-48"
          style={{ backgroundColor: "#1D1D1F", color: "#E5E5E7" }}
        >
          {output}
        </pre>
      )}
    </div>
  );
}

export default function AuditClient({ entries }: { entries: AuditEntry[] }) {
  const audits    = entries.filter((e) => e.type === "audit");
  const sentiments = entries.filter((e) => e.type === "sentiment");

  return (
    <div>
      {/* Run instructions */}
      <div className="rounded-2xl p-5 mb-8" style={{ backgroundColor: "#F5F5F7", border: "1px solid #E5E5E7" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#6E6E73" }}>RUN FROM TERMINAL</h2>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs mb-1" style={{ color: "#6E6E73" }}>Queue next 5 vendors (shipping, transparency, score, sentiment):</p>
            <code className="text-xs px-3 py-2 rounded-xl block" style={{ backgroundColor: "#1D1D1F", color: "#E5E5E7" }}>
              cd ~/Documents/Watchtower\ Peptides/platform && npm run audit:vendors
            </code>
          </div>
          <div>
            <p className="text-xs mb-1 mt-2" style={{ color: "#6E6E73" }}>Full product + price sweep (run before audit:vendors when prices need refreshing):</p>
            <code className="text-xs px-3 py-2 rounded-xl block" style={{ backgroundColor: "#1D1D1F", color: "#E5E5E7" }}>
              cd ~/Documents/Watchtower\ Peptides/platform && npm run audit:pricing
            </code>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <p style={{ color: "#6E6E73" }}>No pending items. Click "Run Audit" above to queue new audits.</p>
      )}

      {audits.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1D1D1F" }}>
            Audit Log ({audits.length})
          </h2>
          {audits.map((e) => <AuditCard key={e.id} entry={e} />)}
        </section>
      )}

      {sentiments.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1D1D1F" }}>
            Sentiment Updates ({sentiments.length})
          </h2>
          {sentiments.map((e) => <AuditCard key={e.id} entry={e} />)}
        </section>
      )}
    </div>
  );
}
