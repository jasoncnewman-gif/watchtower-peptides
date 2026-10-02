/**
 * One-off: replace the thin, source-free NAD+ article content with a
 * fully-researched rewrite (real human RCTs cited, community sentiment
 * section, protocol table). Same slug as the existing live article
 * (nad-for-aging-and-energy) so it keeps whatever indexing it already has
 * rather than starting a new, undiscovered URL. published_at is preserved;
 * only updated_at moves to today, matching normal content-refresh practice.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/update-nad-article.ts
 */
import { readFileSync } from "fs";
import { db } from "./lib/client.js";

const SLUG = "nad-for-aging-and-energy";
const FILE = "/private/tmp/claude-501/-Users-jcnmacbook/739b5db9-40a6-4ace-9177-c7c5bb8759cd/scratchpad/nad-article.md";

function extractTitle(md: string): string {
  return md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "NAD+";
}

function extractDescription(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (/^\*\*[^*]+\*\*$/.test(t)) continue; // skip **Introduction** label
    return t.replace(/\*\*/g, "").slice(0, 160);
  }
  return "";
}

async function main() {
  const content = readFileSync(FILE, "utf8");
  const title = extractTitle(content);
  const description = extractDescription(content);
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const { data: existing, error: fe } = await db
    .from("research_articles")
    .select("published_at")
    .eq("slug", SLUG)
    .single();
  if (fe || !existing) { console.error("Article not found:", fe?.message); process.exit(1); }

  const { error } = await db
    .from("research_articles")
    .update({
      title,
      meta_description: description,
      content,
      keyword: "NAD+ and NAD+-raising strategies",
      peptide: "NAD+",
      status: "published",
      reading_time_minutes: readingTime,
      published_at: existing.published_at, // preserved
      updated_at: new Date().toISOString(),
    })
    .eq("slug", SLUG);

  if (error) { console.error("Update failed:", error.message); process.exit(1); }

  console.log(`Updated /research/${SLUG}`);
  console.log(`Title: ${title}`);
  console.log(`Word count: ${wordCount}  Reading time: ${readingTime} min`);
  console.log(`published_at preserved: ${existing.published_at}`);
}

main();
