# Watchtower Peptides — Operations Brief
*For use as Claude app project instructions. Last updated: July 2026.*

---

## What This Is

Watchtower Peptides is a research vendor review platform at watchtowerpeptides.com. It evaluates peptide research compound vendors on lab verification, purity, transparency, and pricing. The audience is self-directed researchers who want to know which vendors are trustworthy before purchasing.

**Tech:** Next.js 16 + Supabase (PostgreSQL) + Vercel. All scripts live in `/scripts` and run as npm commands. The admin review queue is at `watchtowerpeptides.com/admin/audits` (HTTP Basic Auth required). DB changes need a git push to appear on the live site.

---

## Current State (July 2026)

- **52 active vendors** scored and live
- **Tier breakdown:** 12 Elite · 13 Trusted · 10 Acceptable · 2 Watchlist · 15 Avoid
- **14 research articles** published
- **0 pending audits or sentiments** in the queue
- **Two open verticals in progress:** (1) Blood test lab vendor review — research complete, /labs page not yet built. (2) SEO — no tooling built yet.

---

## Vendor Scoring System

Four sub-scores → total out of 100:

| Sub-score | Max | What It Measures |
|---|---|---|
| Lab Verification (LV) | 40 | COA tier. T4 = Finnrick-verified (independent chain-of-custody). T0 = no COA. |
| Product Quality (PQ) | 25 | Recency-weighted purity from actual test records. 0 if no purity data. |
| Transparency (TR) | 25 | Checklist: address, ownership, lab name, methodology, batch numbers, contact, domain age. |
| Customer Experience (CX) | 10 | Price vs. market average + shipping policy. |

**Tiers:** Elite ≥85 · Trusted ≥70 · Acceptable ≥55 · Watchlist ≥45 · Avoid <45

Finnrick (finnrick.com) is an independent third-party lab that tests vendor products without vendor involvement. T4 vendors have Finnrick records — this is the gold standard. T0–T3 vendors have self-reported or unverified COAs.

---

## Operational Workflows

### 1. Vendor Audit (weekly or when new vendors are queued)

**Run order is mandatory:**

```
Step 1: npm run audit:pricing     # Scrapes product prices from all vendors → rebuilds market price averages
Step 2: npm run audit:vendors     # Audits 5 vendors: shipping, transparency, score, Reddit sentiment
Step 3: Review at /admin/audits   # Approve or deny each score proposal and sentiment entry
```

- `audit:vendors` batches the 5 least-recently-reviewed vendors. Each run = 5 vendors.
- Vendors with `pending` entries in the queue are skipped — approve/deny before running the next batch.
- Newly added vendors have no `last_reviewed` date so they are always picked first.
- Never run `compute:scores` mid-pricing-sweep — partial data corrupts relative pricing scores.
- After approving, the vendor's score updates live and `last_reviewed` is set.

### 2. Sentiment Analysis

Sentiment is bundled into `audit:vendors` automatically. For a single vendor re-run:
```
npm run audit:sentiment -- <vendor-slug>
```
Review and approve/deny at `/admin/audits`. Sentiment pulls Reddit results for the vendor name. If results are about an unrelated business with the same name, deny the entry.

### 3. Adding New Vendors

```
npm run add:vendor -- --name "Vendor Name" --website "https://vendor.com"
```
This creates the DB record with `status: active` and no `last_reviewed`, so the vendor is picked up in the next `audit:vendors` batch. New vendors need:
- Finnrick URL set if they appear on finnrick.com (check manually)
- Credentials added to Supabase if they're a gated vendor (login required to view COAs)

After `audit:vendors` runs, write the verdict manually based on what the audit surfaced.

### 4. Peptide Articles (Knowledge Base Pipeline)

Four-step pipeline:

```
npm run kb:import     # Import YouTube transcript as source (provide URL)
npm run kb:extract    # Extract claims from transcript chunks via GPT-4o-mini
npm run kb:generate   # Draft article from claims via GPT-4o
npm run kb:publish    # Push draft to research_articles table (status: draft)
```

Article is then live at `/research/[slug]` as a draft. Review, edit, then set `status: published` in Supabase.

**Content rules:**
- Target ~1,000 words. Light is intentional.
- Weave skeptic voices into "What the Research Doesn't Show" sections — no standalone negative articles.
- When batch-publishing, backdate articles to ~1–2/week cadence with varied days and times. Same-day publishing signals AI content.
- Banned phrases: "groundbreaking," "revolutionary," "game-changer," and similar AI-sounding vocabulary.

### 5. Blood Test Vendor Review (/labs page) — PENDING BUILD

Research audit of 18 at-home blood testing vendors (SiPhox, Function Health, Superpower, Marek Diagnostics, etc.) is complete. Vendors are scored 0–10 on how well their panel serves peptide-protocol monitoring (IGF-1, HOMA-IR, hormone panels, liver/kidney safety markers).

**Top picks:** Superpower (10/10), Marek Diagnostics (10/10)

Research files live in `platform/outputs/`:
- `lab_vendor_audit.json` — full structured data
- `lab_vendor_audit.xlsx` — 4-sheet workbook
- `lab_vendor_audit_summary.md` — rankings and coverage gaps

**Not yet built:** the /labs page, Supabase schema, or scoring system for this vertical. Next step when prioritized: design the schema, build the page.

### 6. SEO

No tooling built. This is an open gap. Current organic reach comes from the research articles and vendor pages. No keyword tracking, sitemap submission workflow, or backlink strategy is in place yet.

---

## Review Queue (/admin/audits)

Each `audit:vendors` run writes proposals to the queue — never directly updates scores. You must explicitly approve or deny each entry:

- **Approve score:** Updates the vendor's sub-scores, overall score, and `last_reviewed` date.
- **Approve sentiment:** Writes the Reddit summary and rating to the vendor profile.
- **Deny:** Discards the proposal. The vendor keeps its previous data.

Access: `watchtowerpeptides.com/admin/audits` — HTTP Basic Auth (credentials in 1Password or ask Claude Code for the env var name).

---

## Key Constraints

1. **Run `audit:pricing` before `audit:vendors`** if prices haven't been refreshed recently. Stale market prices corrupt the CX sub-score for all vendors.
2. **Approve pending entries before the next batch.** `audit:vendors` skips vendors with pending queue entries.
3. **DB changes need a git push** to appear on the live Vercel site — even if Supabase data updated correctly.
4. **Gated vendors** (login-required sites) need credentials stored in Supabase before automated scraping works.
5. **Verdict copy** is written manually — the audit pipeline proposes scores but does not write vendor verdicts.

---

## What Claude Code Handles vs. What Claude App Handles

**Claude Code (the CLI tool in the terminal):**
- Actually runs scripts, modifies files, queries Supabase
- Writes verdicts, seeds data, fixes bugs
- Knows the full schema, codebase, and script details

**Claude app (this context):**
- Plans workflows, schedules, and prioritization
- Helps draft verdicts, article outlines, SEO ideas
- Answers "what should we do next?" questions

When you need something actually built or run: go to Claude Code. When you need to think through operations: stay here.
