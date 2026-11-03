/**
 * scripts/regenerate-sentiment.ts
 * One-off: regenerates Reddit sentiment for every vendor that had 2+ stacked
 * approved sentiment entries reading as near-identical AI boilerplate (found
 * 2026-11-03 — 39/46 vendors, all using the same generic phrasing pattern
 * audit-vendors.ts's old prompt kept reproducing run after run).
 *
 * For each affected vendor: re-fetches Reddit posts, regenerates a summary
 * with the improved (banned-filler-phrase, specificity-forced) prompt, wipes
 * that vendor's old sentiment_log rows, writes one fresh approved row, and
 * updates vendors.reddit_sentiment / last_reviewed.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/regenerate-sentiment.ts
 */
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";
import { fetchRedditPosts, summarizeSentiment } from "./audit-vendors.js";

const SCRIPT = "regenerate-sentiment";

async function main() {
  const { data: logs } = await db
    .from("vendor_sentiment_log")
    .select("vendor_id")
    .eq("status", "approved")
    .neq("sentiment", "insufficient_data");

  const counts = new Map<string, number>();
  for (const l of logs ?? []) counts.set(l.vendor_id, (counts.get(l.vendor_id) ?? 0) + 1);
  const targetIds = [...counts.entries()].filter(([, n]) => n >= 2).map(([id]) => id);

  const { data: vendors } = await db
    .from("vendors").select("id, name").in("id", targetIds).order("name");

  log(SCRIPT, `Regenerating sentiment for ${vendors?.length ?? 0} vendors…\n`);

  let done = 0;
  for (const v of vendors ?? []) {
    try {
      const posts = await fetchRedditPosts(v.name);
      const result = await summarizeSentiment(v.name, posts);
      const now = new Date().toISOString();

      if (result.sentiment === "insufficient_data") {
        log(SCRIPT, `  ${v.name}: insufficient_data (${posts.length} posts) — leaving old entries alone`);
        await sleep(1000);
        continue;
      }

      // Replace, don't stack — this run supersedes every prior entry for this vendor.
      await db.from("vendor_sentiment_log").delete().eq("vendor_id", v.id);
      await db.from("vendor_sentiment_log").insert({
        vendor_id: v.id,
        scraped_at: now,
        post_count: posts.length,
        sentiment: result.sentiment,
        summary: result.summary,
        status: "approved",
      });

      await db.from("vendors").update({
        reddit_sentiment: result.sentiment,
        positive_review_summary: result.sentiment === "positive" ? result.summary : null,
        negative_review_summary: result.sentiment === "negative" ? result.summary : null,
        last_reviewed: now,
      }).eq("id", v.id);

      log(SCRIPT, `  ✓ ${v.name}: ${result.sentiment} — ${result.summary}`);
      done++;
    } catch (err: any) {
      log(SCRIPT, `  ✗ ${v.name}: ${err.message?.slice(0, 150)}`);
    }
    await sleep(1200);
  }

  log(SCRIPT, `\nDone. ${done}/${vendors?.length ?? 0} vendors regenerated.`);
}

main();
