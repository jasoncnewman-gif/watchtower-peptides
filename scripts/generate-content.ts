/**
 * generate-content.ts
 * Takes a keyword/question, retrieves relevant claims and chunks from the KB,
 * and drafts a sourced SEO article using GPT-4o.
 *
 * Usage:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/generate-content.ts \
 *     --keyword "BPC-157 for tendon healing" \
 *     [--peptide "BPC-157"] \
 *     [--output article.md]
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { db } from "./lib/client.js";

// ── CLI args ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1) return args[idx + 1];
  const inline = args.find((a) => a.startsWith(`--${name}=`));
  return inline?.split("=").slice(1).join("=");
}

const keyword = arg("keyword");
const peptideFilter = arg("peptide");
const outputFile = arg("output");

if (!keyword) {
  console.error('Usage: generate-content.ts --keyword "your keyword" [--peptide "BPC-157"] [--output article.md]');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Peptide detection ────────────────────────────────────────────────────────

const PEPTIDE_NAMES = [
  "BPC-157", "TB-500", "CJC-1295", "Ipamorelin", "GHK-Cu",
  "Sermorelin", "Tesamorelin", "NAD+", "PT-141",
  "Thymosin Alpha-1", "MOTS-c", "Semaglutide",
];

function detectPeptide(text: string): string | null {
  const lower = text.toLowerCase();
  for (const p of PEPTIDE_NAMES) {
    if (lower.includes(p.toLowerCase())) return p;
  }
  return null;
}

// ── Semantic search ──────────────────────────────────────────────────────────

async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

interface SearchResult {
  chunk_id: string;
  source_name: string;
  episode_title: string;
  episode_url: string;
  published_date: string;
  timestamp_start: string;
  content: string;
  similarity: number;
}

async function semanticSearch(embedding: number[], limit = 8): Promise<SearchResult[]> {
  const { data, error } = await db.rpc("kb_search", {
    query_embedding: embedding as unknown as string,
    match_count: limit,
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as SearchResult[];
}

// ── Claims retrieval ─────────────────────────────────────────────────────────

interface Claim {
  peptide: string;
  claim_text: string;
  claim_type: string;
  benefit_described: string | null;
  risk_described: string | null;
  evidence_level: string;
  evidence_cited: string | null;
  confidence: number;
  commercial_conflict: boolean;
  conflict_notes: string | null;
  speaker: string;
  timestamp_ref: string;
}

async function fetchClaims(peptide: string, limit = 30): Promise<Claim[]> {
  const { data } = await db
    .from("kb_claims")
    .select(`
      peptide, claim_text, claim_type, benefit_described, risk_described,
      evidence_level, evidence_cited, confidence, commercial_conflict,
      conflict_notes, speaker, timestamp_ref
    `)
    .ilike("peptide", `%${peptide}%`)
    .order("confidence", { ascending: false })
    .limit(limit);
  return (data ?? []) as Claim[];
}

// ── Content prompt ───────────────────────────────────────────────────────────

function buildContentPrompt(
  keyword: string,
  peptide: string | null,
  chunks: SearchResult[],
  claims: Claim[]
): string {
  const claimsByType = {
    benefits: claims.filter((c) => c.claim_type === "benefit"),
    risks: claims.filter((c) => c.claim_type === "risk"),
    mechanisms: claims.filter((c) => c.claim_type === "mechanism"),
    dosing: claims.filter((c) => c.claim_type === "dosing"),
    legal: claims.filter((c) => c.claim_type === "legal"),
  };

  const evidenceRank: Record<string, number> = {
    human_rct: 5, human_observational: 4, animal: 3,
    in_vitro: 2, expert_opinion: 1, anecdotal: 0, unknown: 0,
  };

  const sortedClaims = [...claims].sort(
    (a, b) =>
      (evidenceRank[b.evidence_level] ?? 0) - (evidenceRank[a.evidence_level] ?? 0) ||
      b.confidence - a.confidence
  );

  const formatClaims = (list: Claim[]) =>
    list
      .slice(0, 8)
      .map(
        (c) =>
          `- "${c.claim_text}" — ${c.speaker} [${c.evidence_level}] [confidence: ${c.confidence}]` +
          (c.commercial_conflict ? ` [CONFLICT: ${c.conflict_notes}]` : "") +
          (c.evidence_cited ? ` [cites: ${c.evidence_cited}]` : "")
      )
      .join("\n");

  const formatChunks = (list: SearchResult[]) =>
    list
      .slice(0, 5)
      .map(
        (r) =>
          `SOURCE: ${r.source_name} — "${r.episode_title}" at ${r.timestamp_start}\n${r.content.slice(0, 600)}...`
      )
      .join("\n\n---\n\n");

  return `You are writing a high-quality, factually accurate SEO article for Watchtower Peptides — a research-focused peptide information platform. Watchtower's brand is credible, honest, and evidence-first. It does not hype, overclaim, or ignore risks.

KEYWORD/TOPIC: ${keyword}
${peptide ? `PRIMARY PEPTIDE: ${peptide}` : ""}

SOURCED CLAIMS FROM EXPERT TRANSCRIPTS:

Benefits (${claimsByType.benefits.length} claims):
${formatClaims(claimsByType.benefits)}

Risks (${claimsByType.risks.length} claims):
${formatClaims(claimsByType.risks)}

Mechanisms (${claimsByType.mechanisms.length} claims):
${formatClaims(claimsByType.mechanisms)}

Dosing (${claimsByType.dosing.length} claims):
${formatClaims(claimsByType.dosing)}

Legal/Regulatory (${claimsByType.legal.length} claims):
${formatClaims(claimsByType.legal)}

TOP RANKED CLAIMS BY EVIDENCE:
${sortedClaims
  .slice(0, 5)
  .map((c) => `- [${c.evidence_level}] ${c.claim_text} (${c.speaker})`)
  .join("\n")}

RELEVANT TRANSCRIPT EXCERPTS:
${formatChunks(chunks)}

WRITING INSTRUCTIONS:
1. Write a complete SEO article targeting the keyword: "${keyword}"
2. Target length: 1,200–1,800 words
3. Use this structure:
   - H1: compelling, keyword-rich title
   - Introduction (2-3 paragraphs): what is the peptide, why people use it, honest framing
   - H2: How It Works (mechanism claims — cite the speaker and evidence level)
   - H2: Key Benefits (use benefit claims — be honest about evidence level: human vs animal vs anecdotal)
   - H2: Risks and Side Effects (never skip this — use risk claims)
   - H2: Dosage and Protocols (use dosing claims)
   - H2: Regulatory Status (use legal claims — be accurate about FDA status)
   - H2: FAQ (5 questions people commonly ask, answered concisely)
   - Closing paragraph with disclaimer
4. Citation style: After each claim, attribute it like: (Andrew Huberman, Huberman Lab)
5. When evidence is animal-only or anecdotal, say so explicitly. Don't present animal data as human evidence.
6. Flag commercial conflicts: if a source has a known conflict, note it briefly.
7. Tone: direct, informative, no hype. Write for a reader who is research-savvy and skeptical.
8. Include a one-line disclaimer at the end: "This content is for informational purposes only. These compounds are research chemicals not approved for human use by the FDA."
9. Output clean markdown only — no preamble, no meta-commentary.`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log(`\nGenerating content for: "${keyword}"`);

  // 1. Detect peptide
  const peptide = peptideFilter ?? detectPeptide(keyword!);
  console.log(`Peptide: ${peptide ?? "not detected — using semantic search only"}`);

  // 2. Embed keyword
  console.log("Embedding keyword...");
  const embedding = await embedText(keyword!);

  // 3. Semantic search
  console.log("Searching knowledge base...");
  const chunks = await semanticSearch(embedding, 8);
  console.log(`Relevant chunks found: ${chunks.length}`);

  // 4. Fetch claims
  let claims: Claim[] = [];
  if (peptide) {
    claims = await fetchClaims(peptide, 40);
    console.log(`Claims for ${peptide}: ${claims.length}`);
  }

  if (chunks.length === 0 && claims.length === 0) {
    console.error("No relevant content found in KB. Import more transcripts first.");
    process.exit(1);
  }

  // 5. Generate article
  console.log("Drafting article with GPT-4o...\n");
  const prompt = buildContentPrompt(keyword!, peptide, chunks, claims);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  const article = response.choices[0]?.message?.content ?? "";

  // 6. Output
  if (outputFile) {
    const outPath = resolve(process.cwd(), outputFile);
    writeFileSync(outPath, article, "utf8");
    console.log(`Article saved to: ${outPath}`);
  } else {
    console.log("\n" + "─".repeat(80) + "\n");
    console.log(article);
    console.log("\n" + "─".repeat(80));
  }

  const words = article.split(/\s+/).length;
  console.log(`\nWord count: ~${words}`);
  console.log(`Tokens used: ~${prompt.split(/\s+/).length + words} (est.)`);
  console.log(`Estimated cost: ~$${((prompt.length + article.length) / 4 / 1000000 * 15).toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
