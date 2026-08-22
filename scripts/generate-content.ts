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

  return `You are a senior science writer, investigative journalist, and direct-response content strategist writing for Watchtower Peptides — a research-focused peptide information platform.

Your job is NOT to summarize research. Your job is to help readers understand what matters, what doesn't, where the evidence is strong, where it is weak, and what conclusions can reasonably be drawn.

===

VOICE & STYLE — READ THIS FIRST:
- Engaging, conversational, intelligent but not academic
- Confident without being promotional. Skeptical without being cynical.
- Write like a thoughtful human journalist who understands science — not an AI, not a textbook, not a pharma brochure
- Short paragraphs. Varied sentence lengths. Occasional one-sentence paragraphs for impact.
- Write at an 8th–10th grade reading level.

BANNED WORDS AND PHRASES — never write these:
"Delve into", "dive into", "In conclusion", "It is important to note", "Furthermore", "Moreover", "Additionally", "Researchers suggest", "Studies indicate", "Let's explore", "Take a closer look", "navigating", "navigate"
"buzz", "buzzy", "buzzword", "buzzworthy", "buzzing about", "generating buzz", "abuzz", "making waves", "gaining traction", "gaining ground", "game-changer", "game changer", "revolutionary", "groundbreaking", "miracle", "magic", "hot topic", "trending"
"promising", "unlocking", "unlock", "harness", "harnessing", "transformative", "cutting-edge", "cutting edge", "next-level", "next level"
Do not use long strings of passive voice. Do not sound like a literature review.

FRAMEWORK — use this for every major claim:
Claim → Evidence → Caveat
Example: BPC-157 may accelerate tendon healing (claim). Multiple animal studies show faster healing times post-injury (evidence). But no large-scale human RCTs have confirmed this (caveat).

===

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

===

VOICE & STYLE:
- Engaging, conversational, intelligent but not academic
- Confident without being promotional. Skeptical without being cynical.
- Feels like a thoughtful human journalist who understands science — not an AI, not a textbook
- Short paragraphs. Varied sentence lengths. Occasional one-sentence paragraphs.
- Approachable subheadings. Natural language.
- Write at an 8th–10th grade reading level.

BANNED PHRASES — never use these:
"Delve into", "In conclusion", "It is important to note", "Furthermore", "Moreover", "Additionally", "Researchers suggest", "Studies indicate"
"buzz", "buzzy", "buzzword", "buzzing about", "making waves", "game-changer", "revolutionary", "groundbreaking", "promising", "unlocking", "transformative", "cutting-edge", "hot topic", "trending"
Do not use long strings of passive voice. Do not sound like a literature review or a regulatory filing.

FRAMEWORK — for every major claim, use Claim → Evidence → Caveat:
Example: Claim: BPC-157 may accelerate tendon healing. Evidence: Multiple animal studies show faster healing following tendon injuries. Caveat: Large, high-quality human trials have not confirmed this yet.

REQUIRED STRUCTURE:

# [H1: keyword-rich, compelling title]

**Introduction**
Open with the problem the reader is trying to solve. Create curiosity. Explain why people are talking about this compound. NEVER begin with "[Peptide] is a peptide derived from..." That opener is dead on arrival.

## What Is It?
What the peptide is, where it came from, why it became popular. Brief.

## Why People Are Interested
Common use cases. Real-world scenarios. What exactly are supporters claiming and why does it appeal.

## What The Research Shows
Cover each evidence type clearly:
- Human data: describe trials, findings, and limitations
- Animal data: what was studied, what changed, and how confident we should be in the human translation
- Mechanistic/cell-level evidence: how it's thought to work biologically
- Anecdotal evidence: what people report and why that's worth noting but not conclusive

## What The Research Doesn't Show
Narrative investigation — not a list. What claims outrun the evidence? What's misunderstood? What questions remain genuinely unanswered?

## Risks & Concerns
Honest. No exaggeration, no minimization. Side effects, regulatory status, quality control, long-term unknowns.

## Dosage and Protocols
What's used in practice, how confident we should be in those numbers, and why the absence of a clinical protocol matters.

## Watchtower Analysis
Use this format exactly:

**What We Like**
✓ [specific strength]
✓ [specific strength]

**What Concerns Us**
⚠ [specific limitation]
⚠ [specific limitation]

**Evidence Strength: [Very Weak / Weak / Moderate / Strong / Very Strong]**
[2–3 sentences explaining the rating in plain terms]

## Bottom Line
One thing the reader should remember. Direct. No fluff.

===

CITATION RULES:
- Do NOT add inline citations or attribution markers anywhere in the article body.
- At the very end, add a single "## Sources" section listing unique experts/sources whose claims informed the article. Format: "1. [Name] — [Their role/specialty]"
- After Sources, add one line: "*This content is for informational purposes only. These compounds are research chemicals not approved for human use by the FDA.*"

OUTPUT: Clean markdown only. No preamble. No meta-commentary. No explanation of what you're about to write.`;
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
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a senior science journalist writing for Watchtower Peptides. You write clear, readable articles — not summaries, not academic papers. You investigate, evaluate, and explain. Write what the evidence supports; stop when you've said it.\n\nCRITICAL VOCABULARY RULE: You are FORBIDDEN from using these words or phrases anywhere in your output: buzz, buzzy, buzzword, buzzing, abuzz, making waves, gaining traction, gaining ground, hot topic, trending, game-changer, revolutionary, groundbreaking, miracle, magic, transformative, cutting-edge, unlocking, harnessing. These words will cause the article to be rejected. If you feel the urge to write one of them, stop and choose a plain concrete word instead.",
      },
      { role: "user", content: prompt },
    ],
  });

  const article = response.choices[0]?.message?.content ?? "";

  // Check for banned phrases
  const BANNED = [
    /\bbuzz\w*/i,        // buzz, buzzy, buzzword, buzzing, buzzworthy
    /\babuzz\b/i,
    /making waves/i,
    /gain(?:ing|ed) traction/i,
    /gain(?:ing|ed) ground/i,
    /\bgame.changer/i,
    /\brevolution\w*/i,  // revolutionary, revolutionize, revolution
    /\bgroundbreak\w*/i,
    /\bmiracle\b/i,
    /\bmagic\b/i,
    /\bhot topic/i,
    /\btrendin\w*/i,
    /\btransformativ\w*/i,
    /\bcutting.edge/i,
    /\bunlock\w*/i,
    /\bharness\w*/i,
    /\bdelve into/i,
    /\bdive into/i,
    /\bin conclusion\b/i,
    /\bfurthermore\b/i,
    /\bmoreover\b/i,
    /\bit is important to note\b/i,
    /\badditionally\b/i,
    /\bresearchers suggest\b/i,
    /\bstudies indicate\b/i,
    /\blet'?s explore\b/i,
    /\btake a closer look\b/i,
    /\bnavigat(?:e|ing|ion)\b/i,   // "navigating uncharted territory" reads as AI-generated hedge language
    /\bpromis(?:e|ing)\b/i,       // "shows promise" / "promising" — matches the prompt's VOICE & STYLE ban, missing from this checker until 2026-08-22
  ];
  const found = BANNED.filter((re) => re.test(article)).map((re) => re.source);
  if (found.length > 0) {
    console.warn(`\n⚠ BANNED PHRASES DETECTED: ${found.join(", ")}\nReview before publishing.\n`);
  }

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
