/**
 * publish-article.ts
 * Takes a generated markdown file and publishes it to research_articles.
 *
 * Usage:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/publish-article.ts \
 *     --file ~/Desktop/bpc157-tendons.md \
 *     --keyword "BPC-157 for tendon healing" \
 *     --peptide "BPC-157" \
 *     [--publish]   # omit to save as draft
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { db } from "./lib/client.js";

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1) return args[idx + 1];
  const inline = args.find((a) => a.startsWith(`--${name}=`));
  return inline?.split("=").slice(1).join("=");
}

const filePath = arg("file");
const keyword  = arg("keyword");
const peptide  = arg("peptide");
const publish  = process.argv.includes("--publish");

if (!filePath || !keyword) {
  console.error("Usage: publish-article.ts --file <path> --keyword <keyword> [--peptide <name>] [--publish]");
  process.exit(1);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? keyword!;
}

function extractDescription(markdown: string): string {
  // First non-heading paragraph
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!")) {
      return trimmed.slice(0, 160);
    }
  }
  return "";
}

function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

async function main() {
  const absPath = resolve(filePath!.replace(/^~/, process.env.HOME ?? "~"));
  const content = readFileSync(absPath, "utf8");

  const title       = extractTitle(content);
  const description = extractDescription(content);
  const slug        = slugify(keyword!);
  const readingTime = estimateReadingTime(content);
  const status      = publish ? "published" : "draft";
  const publishedAt = publish ? new Date().toISOString() : null;

  console.log(`\nTitle:        ${title}`);
  console.log(`Slug:         /research/${slug}`);
  console.log(`Peptide:      ${peptide ?? "not set"}`);
  console.log(`Reading time: ${readingTime} min`);
  console.log(`Status:       ${status}`);

  const { data, error } = await db
    .from("research_articles")
    .upsert({
      slug,
      title,
      meta_description: description,
      content,
      keyword,
      peptide: peptide ?? null,
      status,
      reading_time_minutes: readingTime,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to publish:", error.message);
    process.exit(1);
  }

  console.log(`\nSaved. ID: ${data.id}`);
  if (status === "draft") {
    console.log("Article is a DRAFT. Re-run with --publish to make it live.");
  } else {
    console.log(`Live at: https://www.watchtowerpeptides.com/research/${slug}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
