/**
 * scripts/audit-sentiment.ts
 * Re-run Reddit sentiment for a single vendor by slug.
 * Replaces any existing pending sentiment record.
 *
 * Run: npm run audit:sentiment -- <vendor-slug>
 * e.g: npm run audit:sentiment -- skye-peptides
 */

import OpenAI from "openai";
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "audit-sentiment";
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const slug = process.argv[2];
if (!slug) { console.error("Usage: npm run audit:sentiment -- <vendor-slug>"); process.exit(1); }

type RedditPost    = { title: string; selftext: string; permalink: string };
type SentimentResult = { sentiment: "positive" | "neutral" | "mixed" | "negative" | "insufficient_data"; summary: string };

async function fetchRedditPosts(vendorName: string): Promise<RedditPost[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) { log(SCRIPT, "WARN: SERPER_API_KEY not set"); return []; }
  const posts: RedditPost[] = [];
  for (const q of [`"${vendorName}" peptide site:reddit.com`, `"${vendorName}" peptides vendor site:reddit.com`]) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST", headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" }, body: JSON.stringify({ q, num: 10 }),
      });
      if (!res.ok) continue;
      for (const item of ((await res.json() as any).organic ?? [])) {
        if (!posts.some((p) => p.permalink === item.link))
          posts.push({ title: item.title ?? "", selftext: item.snippet ?? "", permalink: item.link ?? "" });
      }
      await sleep(300);
    } catch { /* skip */ }
  }
  return posts;
}

async function summarizeSentiment(vendorName: string, posts: RedditPost[]): Promise<SentimentResult> {
  if (posts.length < 3) return { sentiment: "insufficient_data", summary: `Fewer than 3 Reddit posts found for ${vendorName}. Insufficient data to assess community sentiment.` };
  const postsText = posts.slice(0, 20).map((p) => `TITLE: ${p.title}\nBODY: ${p.selftext}`).join("\n\n---\n\n");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You analyze Reddit posts about peptide vendors. Be concise and factual." },
      { role: "user", content: `Analyze these Reddit posts about "${vendorName}" and respond with JSON:\n{"sentiment":"positive"|"neutral"|"mixed"|"negative"|"insufficient_data","summary":"2-3 sentence summary."}\n\nSentiment: positive=actively recommended, neutral=mentioned without strong opinion, mixed=praise+complaints, negative=criticized/warned against, insufficient_data=too few posts.\n\nPosts:\n${postsText}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const VALID = ["positive", "neutral", "mixed", "negative", "insufficient_data"];
  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Partial<SentimentResult>;
  if (!parsed.sentiment || !VALID.includes(parsed.sentiment)) {
    return { sentiment: "insufficient_data", summary: `Unable to parse sentiment response for ${vendorName}.` };
  }
  return parsed as SentimentResult;
}

async function main() {
  const { data: vendor, error } = await db.from("vendors").select("id, name").eq("slug", slug).single();
  if (error || !vendor) { log(SCRIPT, `Vendor not found: ${slug}`); process.exit(1); }

  log(SCRIPT, `Vendor: ${vendor.name}`);

  // Remove any existing pending record so the new one isn't blocked
  const { data: existing } = await db.from("vendor_sentiment_log").select("id, status").eq("vendor_id", vendor.id).order("scraped_at", { ascending: false }).limit(1).maybeSingle();
  if (existing?.status === "pending") {
    await db.from("vendor_sentiment_log").delete().eq("id", existing.id);
    log(SCRIPT, "Deleted existing pending sentiment record.");
  }

  log(SCRIPT, "Fetching Reddit posts…");
  const posts = await fetchRedditPosts(vendor.name);
  log(SCRIPT, `Found ${posts.length} posts`);
  posts.forEach((p, i) => log(SCRIPT, `  [${i + 1}] ${p.permalink}`));

  log(SCRIPT, "Summarizing…");
  const result = await summarizeSentiment(vendor.name, posts);
  log(SCRIPT, `Sentiment: ${result.sentiment}`);
  log(SCRIPT, `Summary: ${result.summary}`);

  const { error: se } = await db.from("vendor_sentiment_log").insert({
    vendor_id: vendor.id, post_count: posts.length, sentiment: result.sentiment,
    summary: result.summary, notable_posts: posts.slice(0, 5).map((p) => p.permalink), status: "pending",
  });

  if (se) { log(SCRIPT, `✗ write error: ${se.message}`); process.exit(1); }
  log(SCRIPT, "✓ Written as pending. Review at /admin/audits");
}

main();
