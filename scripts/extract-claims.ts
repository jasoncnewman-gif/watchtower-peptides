/**
 * extract-claims.ts
 * Reads transcript chunks from kb_chunks, sends each to GPT-4o-mini,
 * and saves structured peptide claims to kb_claims.
 *
 * Usage:
 *   # Extract from one episode:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/extract-claims.ts \
 *     --episode <episode-uuid>
 *
 *   # Extract from all unprocessed chunks:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/extract-claims.ts --all
 *
 *   # Preview without saving:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/extract-claims.ts \
 *     --episode <episode-uuid> --dry-run
 */

import OpenAI from "openai";
import { db } from "./lib/client.js";

// ── CLI args ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1) return args[idx + 1];
  const inline = args.find((a) => a.startsWith(`--${name}=`));
  return inline?.split("=").slice(1).join("=");
}

const episodeId = arg("episode");
const doAll = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");

if (!episodeId && !doAll) {
  console.error("Usage:");
  console.error("  extract-claims.ts --episode <uuid> [--dry-run]");
  console.error("  extract-claims.ts --all [--dry-run]");
  process.exit(1);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractedClaim {
  peptide: string;
  claim_text: string;
  claim_type: "benefit" | "risk" | "mechanism" | "dosing" | "sourcing" | "legal" | "anecdotal";
  benefit_described: string | null;
  risk_described: string | null;
  evidence_cited: string | null;
  evidence_level: "human_rct" | "human_observational" | "animal" | "in_vitro" | "anecdotal" | "expert_opinion" | "unknown";
  confidence: number;
  potential_bias: string | null;
  commercial_conflict: boolean;
  conflict_notes: string | null;
  vendor_mentioned: string | null;
}

interface ExtractionResponse {
  claims: ExtractedClaim[];
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(
  content: string,
  speaker: string,
  episodeTitle: string,
  timestamp: string,
  knownConflicts: string
): string {
  return `You are extracting structured peptide claims from a podcast/video transcript.

Speaker: ${speaker}
Episode: ${episodeTitle}
Timestamp: ${timestamp}
Speaker's known conflicts of interest: ${knownConflicts || "none declared"}

TRANSCRIPT CHUNK:
${content}

Extract every distinct claim about peptides from this text. Only extract claims that are explicitly stated — do not infer or add information not present. If there are no peptide claims, return an empty claims array.

For each claim return:
- peptide: canonical peptide name (e.g. "BPC-157", "TB-500", "CJC-1295", "Ipamorelin", "GHK-Cu", "Sermorelin", "Tesamorelin", "NAD+", "Semaglutide", "Tirzepatide", "PT-141", "Thymosin Alpha-1", "MOTS-c"). Use "unknown" if unclear.
- claim_text: a concise direct statement of the claim (1-2 sentences, third person)
- claim_type: one of "benefit", "risk", "mechanism", "dosing", "sourcing", "legal", "anecdotal"
- benefit_described: if claim_type is benefit, describe it concisely. Otherwise null.
- risk_described: if claim_type is risk, describe it concisely. Otherwise null.
- evidence_cited: any specific study, paper, trial, or data mentioned. null if none.
- evidence_level: one of "human_rct", "human_observational", "animal", "in_vitro", "anecdotal", "expert_opinion", "unknown"
- confidence: 0.0-1.0 — how directly and clearly was this claim stated (1.0 = stated as fact, 0.5 = hedged, 0.2 = speculative)
- potential_bias: reason the speaker might be biased toward this claim. null if none.
- commercial_conflict: true if speaker has a known financial interest related to this claim
- conflict_notes: describe the conflict if commercial_conflict is true. null otherwise.
- vendor_mentioned: name of any peptide vendor mentioned. null if none.

Return a JSON object: { "claims": [...] }`;
}

const VALID_CLAIM_TYPES = ["benefit", "risk", "mechanism", "dosing", "sourcing", "legal", "anecdotal"] as const;
const VALID_EVIDENCE_LEVELS = ["human_rct", "human_observational", "animal", "in_vitro", "anecdotal", "expert_opinion", "unknown"] as const;

function normalizeClaimType(raw: string): ExtractedClaim["claim_type"] {
  const val = raw?.toLowerCase().trim();
  if ((VALID_CLAIM_TYPES as readonly string[]).includes(val)) return val as ExtractedClaim["claim_type"];
  if (val?.includes("risk") || val?.includes("danger") || val?.includes("warn") || val?.includes("safe")) return "risk";
  if (val?.includes("benefit") || val?.includes("efficacy") || val?.includes("effect")) return "benefit";
  if (val?.includes("dose") || val?.includes("protocol")) return "dosing";
  if (val?.includes("source") || val?.includes("vendor") || val?.includes("buy")) return "sourcing";
  if (val?.includes("legal") || val?.includes("fda") || val?.includes("regulat")) return "legal";
  if (val?.includes("mechanism") || val?.includes("pathway") || val?.includes("receptor")) return "mechanism";
  return "anecdotal";
}

function normalizeEvidenceLevel(raw: string): ExtractedClaim["evidence_level"] {
  const val = raw?.toLowerCase().trim();
  if ((VALID_EVIDENCE_LEVELS as readonly string[]).includes(val)) return val as ExtractedClaim["evidence_level"];
  if (val?.includes("rct") || val?.includes("randomized")) return "human_rct";
  if (val?.includes("human") || val?.includes("clinical") || val?.includes("observ")) return "human_observational";
  if (val?.includes("animal") || val?.includes("rat") || val?.includes("mouse")) return "animal";
  if (val?.includes("vitro") || val?.includes("cell")) return "in_vitro";
  if (val?.includes("expert") || val?.includes("opinion")) return "expert_opinion";
  if (val?.includes("anecdot") || val?.includes("personal")) return "anecdotal";
  return "unknown";
}

// ── Extraction ───────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractFromChunk(
  content: string,
  speaker: string,
  episodeTitle: string,
  timestamp: string,
  knownConflicts: string
): Promise<ExtractedClaim[]> {
  const prompt = buildPrompt(content, speaker, episodeTitle, timestamp, knownConflicts);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as ExtractionResponse;
  return parsed.claims ?? [];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  // 1. Fetch chunks to process
  let query = db
    .from("kb_chunks")
    .select(`
      id,
      episode_id,
      chunk_index,
      speaker,
      content,
      timestamp_start,
      kb_episodes!inner (
        id,
        title,
        source_id,
        kb_sources!inner (
          name,
          known_conflicts
        )
      )
    `)
    .order("episode_id")
    .order("chunk_index");

  if (episodeId) {
    query = query.eq("episode_id", episodeId) as typeof query;
  }

  const { data: chunks, error } = await query;

  if (error || !chunks?.length) {
    console.error("No chunks found:", error?.message ?? "empty result");
    process.exit(1);
  }

  // 2. If --all, skip chunks that already have claims
  let toProcess = chunks;
  if (doAll) {
    const { data: processed } = await db
      .from("kb_claims")
      .select("chunk_id");
    const processedIds = new Set((processed ?? []).map((r) => r.chunk_id));
    toProcess = chunks.filter((c) => !processedIds.has(c.id));
  }

  console.log(`\nChunks to process: ${toProcess.length} of ${chunks.length}`);
  if (dryRun) console.log("DRY RUN — nothing will be saved\n");

  let totalClaims = 0;

  for (const chunk of toProcess) {
    const ep = chunk.kb_episodes as unknown as {
      id: string;
      title: string;
      kb_sources: { name: string; known_conflicts: string };
    };

    const speaker = ep.kb_sources.name;
    const episodeTitle = ep.title;
    const knownConflicts = ep.kb_sources.known_conflicts ?? "";
    const timestamp = chunk.timestamp_start ?? "unknown";

    process.stdout.write(
      `  [${chunk.chunk_index + 1}] ${episodeTitle.slice(0, 50)}... ${timestamp} — `
    );

    let claims: ExtractedClaim[] = [];
    try {
      claims = await extractFromChunk(
        chunk.content,
        speaker,
        episodeTitle,
        timestamp,
        knownConflicts
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`ERROR: ${msg}`);
      continue;
    }

    console.log(`${claims.length} claim(s)`);

    if (claims.length && !dryRun) {
      const rows = claims.map((c) => ({
        chunk_id: chunk.id,
        episode_id: chunk.episode_id,
        speaker,
        peptide: c.peptide,
        claim_text: c.claim_text,
        claim_type: normalizeClaimType(c.claim_type),
        benefit_described: c.benefit_described,
        risk_described: c.risk_described,
        evidence_cited: c.evidence_cited,
        evidence_level: normalizeEvidenceLevel(c.evidence_level),
        timestamp_ref: timestamp,
        confidence: c.confidence,
        potential_bias: c.potential_bias,
        commercial_conflict: c.commercial_conflict,
        conflict_notes: c.conflict_notes,
        vendor_mentioned: c.vendor_mentioned,
      }));

      const { error: insertErr } = await db.from("kb_claims").insert(rows);
      if (insertErr) console.error(`    Insert failed: ${insertErr.message}`);
    }

    totalClaims += claims.length;

    // Brief pause to stay within rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. ${totalClaims} claims extracted from ${toProcess.length} chunks.`);
  if (dryRun) console.log("(dry run — nothing saved)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
