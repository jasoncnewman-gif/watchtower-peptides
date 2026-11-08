/**
 * scripts/report-traffic-log.ts
 * Reads back the diagnostic traffic_log table (see supabase/migration_026.sql,
 * proxy.ts) — real User-Agent strings per request, to identify the CN/SG/HK
 * traffic pattern found in Vercel Analytics on 2026-11-08.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/report-traffic-log.ts
 */
import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "report-traffic-log";

// Known crawler UA substrings worth calling out by name rather than leaving
// as an opaque "has a referrer-free visit" bucket.
const KNOWN_BOTS: [string, string][] = [
  ["GPTBot", "OpenAI (GPTBot)"],
  ["ChatGPT-User", "OpenAI (ChatGPT browsing)"],
  ["OAI-SearchBot", "OpenAI (search)"],
  ["ClaudeBot", "Anthropic (ClaudeBot)"],
  ["Claude-User", "Anthropic (Claude browsing)"],
  ["anthropic-ai", "Anthropic"],
  ["PerplexityBot", "Perplexity"],
  ["Perplexity-User", "Perplexity (browsing)"],
  ["Bytespider", "ByteDance/TikTok"],
  ["Baiduspider", "Baidu"],
  ["Sogou", "Sogou"],
  ["YisouSpider", "Yisou"],
  ["360Spider", "360 Search"],
  ["Googlebot", "Google (organic crawl)"],
  ["Google-Extended", "Google (AI training)"],
  ["bingbot", "Bing"],
  ["DuckDuckBot", "DuckDuckGo"],
  ["Amazonbot", "Amazon"],
  ["meta-externalagent", "Meta (AI training)"],
  ["facebookexternalhit", "Facebook (link preview)"],
  ["Applebot", "Apple"],
  ["SemrushBot", "Semrush (SEO tool)"],
  ["AhrefsBot", "Ahrefs (SEO tool)"],
  ["MJ12bot", "Majestic (SEO tool)"],
  ["python-requests", "Python script (generic)"],
  ["Scrapy", "Scrapy (scraper framework)"],
  ["HeadlessChrome", "Headless Chrome (automation)"],
  ["puppeteer", "Puppeteer (automation)"],
  ["playwright", "Playwright (automation)"],
];

function classify(ua: string | null): string {
  if (!ua) return "(no user-agent)";
  for (const [needle, label] of KNOWN_BOTS) {
    if (ua.includes(needle)) return label;
  }
  return "Unclassified — real browser UA";
}

async function main() {
  const { data: rows, error } = await db
    .from("traffic_log")
    .select("path, user_agent, referer, country, city, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) { log(SCRIPT, `DB error: ${error.message}`); process.exit(1); }
  if (!rows || rows.length === 0) { log(SCRIPT, "No rows yet — give it more time to collect data."); return; }

  log(SCRIPT, `${rows.length} rows since ${rows[rows.length - 1].created_at}\n`);

  // Classification breakdown
  const byClass = new Map<string, number>();
  for (const r of rows) {
    const c = classify(r.user_agent);
    byClass.set(c, (byClass.get(c) ?? 0) + 1);
  }
  log(SCRIPT, "=== By classification ===");
  for (const [c, n] of [...byClass.entries()].sort((a, b) => b[1] - a[1])) {
    log(SCRIPT, `  ${String(n).padStart(5)}  ${c}`);
  }

  // CN/SG/HK specific — the cluster under investigation
  const target = rows.filter((r) => ["CN", "SG", "HK"].includes(r.country ?? ""));
  log(SCRIPT, `\n=== CN/SG/HK rows: ${target.length} ===`);
  const uaCount = new Map<string, number>();
  for (const r of target) uaCount.set(r.user_agent ?? "(none)", (uaCount.get(r.user_agent ?? "(none)") ?? 0) + 1);
  for (const [ua, n] of [...uaCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    log(SCRIPT, `  ${String(n).padStart(4)}  ${ua}`);
  }

  // Unclassified real-browser UAs from CN/SG/HK — worth eyeballing directly
  const unclassified = target.filter((r) => classify(r.user_agent) === "Unclassified — real browser UA");
  if (unclassified.length > 0) {
    log(SCRIPT, `\n=== Sample unclassified CN/SG/HK requests (first 10) ===`);
    for (const r of unclassified.slice(0, 10)) {
      log(SCRIPT, `  [${r.country}] ${r.path} | ref=${r.referer ?? "(none)"} | ${r.user_agent}`);
    }
  }
}

main();
