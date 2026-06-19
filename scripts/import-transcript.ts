/**
 * import-transcript.ts
 * Imports a YouTube video transcript into kb_episodes + kb_chunks.
 * Optionally generates OpenAI embeddings for semantic search.
 *
 * Usage:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/import-transcript.ts \
 *     --url "https://www.youtube.com/watch?v=VIDEO_ID" \
 *     --source "Andrew Huberman" \
 *     [--date "2023-05-15"] \
 *     [--embed]
 *
 *   # Embed an already-imported episode by ID:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/import-transcript.ts \
 *     --embed-episode <episode-uuid>
 */

import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { db } from "./lib/client.js";

// ── CLI args ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx !== -1) return args[idx + 1];
  const inline = args.find((a) => a.startsWith(`${flag}=`));
  return inline?.split("=").slice(1).join("=");
}

const videoUrl = arg("url");
const sourceName = arg("source");
const dateArg = arg("date");
const doEmbed = process.argv.includes("--embed");
const embedEpisodeId = arg("embed-episode");

if (!embedEpisodeId && (!videoUrl || !sourceName)) {
  console.error("Usage:");
  console.error("  import-transcript.ts --url <youtube-url> --source <name> [--date YYYY-MM-DD] [--embed]");
  console.error("  import-transcript.ts --embed-episode <episode-uuid>");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  if (!match) throw new Error(`Cannot extract video ID from: ${url}`);
  return match[1];
}

function secondsToTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

// Merge transcript segments into chunks of ~TARGET_WORDS words.
// Each chunk keeps the timestamp of its first segment.
const TARGET_WORDS = 700;

function chunkTranscript(items: TranscriptItem[]): Array<{
  content: string;
  timestamp_start: string;
  timestamp_end: string;
}> {
  const chunks: Array<{ content: string; timestamp_start: string; timestamp_end: string }> = [];
  let buffer: string[] = [];
  let chunkStart = items[0]?.offset ?? 0;
  let lastOffset = 0;
  let lastDuration = 0;

  for (const item of items) {
    const text = item.text.replace(/\n/g, " ").trim();
    buffer.push(text);
    lastOffset = item.offset;
    lastDuration = item.duration;

    if (wordCount(buffer.join(" ")) >= TARGET_WORDS) {
      chunks.push({
        content: buffer.join(" "),
        timestamp_start: secondsToTimestamp(chunkStart / 1000),
        timestamp_end: secondsToTimestamp((lastOffset + lastDuration) / 1000),
      });
      buffer = [];
      chunkStart = item.offset + item.duration;
    }
  }

  // flush remainder (only skip if it's a tiny tail fragment < 50 words)
  if (buffer.length && wordCount(buffer.join(" ")) >= 50) {
    chunks.push({
      content: buffer.join(" "),
      timestamp_start: secondsToTimestamp(chunkStart / 1000),
      timestamp_end: secondsToTimestamp((lastOffset + lastDuration) / 1000),
    });
  }

  return chunks;
}

async function fetchVideoMetadata(videoId: string): Promise<{ title: string; published_date: string | null }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    const data = (await res.json()) as { title?: string };
    return { title: data.title ?? videoId, published_date: dateArg ?? null };
  } catch {
    return { title: videoId, published_date: dateArg ?? null };
  }
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set in .env.local");

  const client = new OpenAI({ apiKey });
  const BATCH = 100; // OpenAI max per request
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    all.push(...res.data.map((d) => d.embedding));
    console.log(`  embeddings: ${Math.min(i + BATCH, texts.length)}/${texts.length}`);
  }

  return all;
}

// ── Embed existing episode ───────────────────────────────────────────────────

async function embedEpisode(episodeId: string) {
  const { data: episode } = await db
    .from("kb_episodes")
    .select("id, title")
    .eq("id", episodeId)
    .single();

  if (!episode) {
    console.error(`Episode not found: ${episodeId}`);
    process.exit(1);
  }

  console.log(`\nEmbedding episode: "${episode.title}"`);

  const { data: chunks } = await db
    .from("kb_chunks")
    .select("id, chunk_index, content")
    .eq("episode_id", episodeId)
    .order("chunk_index");

  if (!chunks?.length) {
    console.error("No chunks found for this episode.");
    process.exit(1);
  }

  console.log(`Chunks to embed: ${chunks.length}`);
  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

  for (const chunk of chunks) {
    const vec = embeddings[chunk.chunk_index];
    await db
      .from("kb_chunks")
      .update({ embedding: vec as unknown as string })
      .eq("id", chunk.id);
  }

  console.log(`\nDone. ${chunks.length} embeddings saved.`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (embedEpisodeId) {
    await embedEpisode(embedEpisodeId);
    return;
  }
  const videoId = extractVideoId(videoUrl!);
  console.log(`\nImporting video: ${videoId}`);
  console.log(`Source: ${sourceName}`);

  // 1. Resolve source
  const { data: source, error: srcErr } = await db
    .from("kb_sources")
    .select("id, name")
    .ilike("name", sourceName!)
    .single();

  if (srcErr || !source) {
    console.error(`Source "${sourceName}" not found in kb_sources.`);
    console.error("Available sources:");
    const { data: all } = await db.from("kb_sources").select("name");
    all?.forEach((s) => console.error(`  - ${s.name}`));
    process.exit(1);
  }

  console.log(`Matched source: ${source.name} (${source.id})`);

  // 2. Check for duplicate
  const { data: existing } = await db
    .from("kb_episodes")
    .select("id, title")
    .eq("url", videoUrl!)
    .maybeSingle();

  if (existing) {
    console.error(`Already imported: "${existing.title}" (${existing.id})`);
    console.error("Delete the episode first if you want to re-import.");
    process.exit(1);
  }

  // 3. Fetch metadata + transcript
  console.log("Fetching video metadata...");
  const { title, published_date } = await fetchVideoMetadata(videoId);
  console.log(`Title: ${title}`);

  console.log("Fetching transcript...");
  let items: TranscriptItem[];
  try {
    items = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Transcript fetch failed: ${msg}`);
    console.error("The video may have captions disabled or be unavailable.");
    process.exit(1);
  }

  console.log(`Transcript segments: ${items.length}`);

  // 4. Merge raw transcript for storage
  const transcript_raw = items.map((i) => i.text).join(" ");

  // 5. Chunk
  const chunks = chunkTranscript(items);
  console.log(`Chunks (${TARGET_WORDS}-word target): ${chunks.length}`);

  // 6. Insert episode
  const { data: episode, error: epErr } = await db
    .from("kb_episodes")
    .insert({
      source_id: source.id,
      title,
      url: videoUrl,
      published_date: published_date ?? undefined,
      content_type: "youtube",
      transcript_source: "youtube_captions",
      transcript_raw,
      transcript_status: "complete",
    })
    .select("id")
    .single();

  if (epErr || !episode) {
    console.error("Failed to insert episode:", epErr?.message);
    process.exit(1);
  }

  console.log(`Episode inserted: ${episode.id}`);

  // 7. Insert chunks
  const chunkRows = chunks.map((c, i) => ({
    episode_id: episode.id,
    chunk_index: i,
    speaker: source.name,
    timestamp_start: c.timestamp_start,
    timestamp_end: c.timestamp_end,
    content: c.content,
  }));

  const { error: chunkErr } = await db.from("kb_chunks").insert(chunkRows);
  if (chunkErr) {
    console.error("Failed to insert chunks:", chunkErr.message);
    process.exit(1);
  }

  console.log(`Chunks inserted: ${chunkRows.length}`);

  // 8. Embeddings (optional)
  if (doEmbed) {
    console.log("\nGenerating embeddings...");
    const texts = chunkRows.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts);

    // Fetch chunk IDs in order
    const { data: inserted } = await db
      .from("kb_chunks")
      .select("id, chunk_index")
      .eq("episode_id", episode.id)
      .order("chunk_index");

    if (inserted) {
      for (const row of inserted) {
        const vec = embeddings[row.chunk_index];
        await db
          .from("kb_chunks")
          .update({ embedding: vec as unknown as string })
          .eq("id", row.id);
      }
      console.log(`Embeddings saved: ${inserted.length}`);
    }
  }

  console.log(`\nDone. Episode ID: ${episode.id}`);
  console.log(`Re-run with --embed to add semantic search embeddings.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
