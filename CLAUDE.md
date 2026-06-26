# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Warning — Next.js 16:** This project runs Next.js 16.2.6. APIs, conventions, and file structure differ from earlier versions covered by training data. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for current guidance.

## Commands

```bash
# Development
npm run dev              # dev server on http://localhost:3000
npm run build            # production build (runs type-check)

# Scoring
npm run compute:scores   # recompute all vendor scores → writes to Supabase
npm run compute:prices   # recompute price_per_mg + peptide_market_prices

# Vendor management
npm run add:vendor -- --name "Name" --website "https://..."  # onboard new vendor (checks for duplicates)

# Vendor audit pipeline (run in order when doing a full refresh)
npm run audit:pricing    # scrape ALL vendor products → rebuild market prices (run first)
npm run audit:vendors    # audit 5 vendors: shipping, transparency, score, sentiment → queue for approval
npm run audit:sentiment -- <slug>  # re-run Reddit sentiment for a single vendor (replaces pending record)

# COA integrity audit
npm run coa:queue        # show pending audit queue (T3→T2→T1 priority)
npm run coa:update -- --slug <s> --tier <0-4> --status <complete|flagged|skip> --notes "..."

# Scraping (legacy / one-off)
npm run scrape:products  # scrape product inventory from all active vendor sites
npm run scrape:coas      # scrape COA links from all active vendor sites
npm run scrape:gated     # Puppeteer login scraper for gated/Cloudflare-protected vendors
npm run scrape:finnrick  # scrape Finnrick test data
npm run verify:domains   # check which vendor domains are alive

# Knowledge base pipeline
npm run kb:import        # YouTube transcript → chunks → embeddings
npm run kb:extract       # GPT-4o-mini claim extraction from chunks
npm run kb:generate      # GPT-4o article draft from claims
npm run kb:publish       # upsert article draft to research_articles
```

All scripts in `scripts/` run via `tsx --tsconfig scripts/tsconfig.json`. Node is not on PATH — always use `npm run <script>` rather than running `tsx` directly.

Before writing any new script, run `ls scripts/ | grep <keyword>` — many tools already exist.

## Architecture

**App router pages (all server components, async data-fetching):**
- `/` — hero slider, stats bar, top-4 vendors, featured peptides
- `/vendors` — vendor directory (server fetch → `VendorListClient` for client-side search/filter)
- `/vendors/[slug]` — vendor detail: community sentiment, score breakdown, lab results, shipping & payment, peptide inventory, verdict
- `/peptides` — peptide library (server fetch → `PeptideLibraryClient` for client-side search/filter)
- `/peptides/[slug]` — 7-tab peptide profile; Components tab is conditional on `blend_components` being non-null
- `/calculator` — 3-tool CalculatorSuite (Dosage Planner, Order Calculator, Reconstitution Calculator); async server component, live Supabase data
- `/research` — article listing + individual article pages (`/research/[slug]`)
- `/about` — scoring methodology + vendor distribution grid
- `/disclaimer`, `/privacy`, `/terms` — legal pages
- `/admin/audits` — vendor audit review queue (approve/deny score proposals and sentiment)

**Two Supabase client instances:**
1. `lib/supabase.ts` — anon key, used by Next.js app at runtime (public RLS-gated access)
2. `scripts/lib/client.ts` — service role key, used exclusively by seed/scrape/compute scripts. Also wraps fetch with `noGzipFetch` (forces `Accept-Encoding: identity`) — required workaround for Node 26 + Cheerio corrupting gzip responses from PostgREST.

**API routes:**
- `app/api/cron/url-check/route.ts` — Vercel cron, daily at 12:00 UTC; probes all vendor URLs, emails alerts@watchtowerpeptides.com via Brevo on dead URLs. Auth: `WATCHTOWER_CRON_TOKEN` header.
- `app/api/admin/audit-action/route.ts` — POST; approves or denies audit/sentiment log entries; uses service-role key to bypass RLS. On approve: updates `vendors.last_reviewed`, syncs score (all sub-scores + overall) or sentiment. Protected by `middleware.ts` basic auth.

**Type boundary:** `lib/supabase.ts` defines `DbVendor` / `DbPeptide` (flat DB row shapes) and `Vendor` / `Peptide` (display types). `dbVendorToVendor()` and `dbPeptideToAppPeptide()` are the only translation functions — don't map inline.

**Slug matching for vendor→peptide cross-references (`lib/utils.ts`):**
`generateSlug()` decodes HTML entities before slugifying. `stripSizeSuffix()` normalises vendor product names like `ipamorelin-10mg` → `ipamorelin`. Blend profiles use prefix matching (`vpSlug.startsWith(slug + '-')`). Both functions must stay in sync.

## Scoring Formula

4 sub-scores → `scripts/compute-scores.ts`:

| Sub-score | Field | Max | Source |
|---|---|---|---|
| Lab Verification (LV) | `lab_testing_score` | 40 | COA tier (T0–T4); T4 scales with Finnrick test count |
| Product Quality (PQ) | `purity_accuracy_score` | 25 | Recency-weighted purity from `lab_tests`; capped by LV tier |
| Transparency (TR) | `transparency_score` | 25 | Checklist from `vendor_transparency` table |
| Customer Experience (CX) | `pricing_reliability_score` | 10 | Pricing sub-score (max 6) + shipping sub-score (max 4) |

**CX detail:**
- Pricing (max 6): `price_per_mg` vs `peptide_market_prices` avg. <0.85x=6, <0.95x=5, <1.05x=3, <1.15x=1, else 0. No data=3.
- Shipping (max 4): free all orders=4, free ≤$100 threshold=4, free ≤$200=3, flat fee=1, no data=2.

**Score tiers:** Elite ≥85 | Trusted ≥70 | Acceptable ≥55 | Watchlist ≥45 | Avoid <45

**Pricing sweep must run before scoring:** `audit:pricing` refreshes `vendor_peptides` for ALL vendors then rebuilds `peptide_market_prices`. Never recompute scores mid-sweep — partial data corrupts relative CX scores.

## Vendor Audit Pipeline

Two separate jobs:
1. **`audit:pricing`** — full-pool product scrape → `compute:prices`. Run weekly or whenever prices need refreshing. No scoring.
2. **`audit:vendors`** — batches 5 vendors (least recently reviewed). Steps: shipping → transparency → score proposal → Reddit sentiment. All proposals written as `pending` to `vendor_audit_log` / `vendor_sentiment_log`. Review at `/admin/audits`.

The audit skips vendors with existing pending records. Approve/deny before running the next batch. On approve: `last_reviewed` is updated (vendor moves to back of queue) and score/sentiment is applied.

**Reddit sentiment search** uses two queries: `"<name>" peptide site:reddit.com` and `"<name>" peptides vendor site:reddit.com`. If results are about an unrelated business with the same name, deny the entry.

**Adding new vendors:** Use `npm run add:vendor` — creates the DB record with `status: active`, null scores, and no `last_reviewed`, so it's picked up first in the next `audit:vendors` batch.

## Database Tables

Core: `vendors`, `vendor_peptides`, `vendor_transparency`, `lab_tests`, `peptide_market_prices`, `peptides`

Audit: `vendor_audit_log`, `vendor_sentiment_log` (migration_016, migration_017)

COA integrity: `coa_audit_status`, `coa_audit_tier`, `coa_audit_notes`, `coa_audited_at` columns on `vendors` (migration_011)

Knowledge base: `kb_sources`, `kb_episodes`, `kb_chunks` (pgvector HNSW), `kb_claims`

Content: `research_articles`

Monitoring: `alerts`, `score_history`, `verification_flags` (migration_010 — applied but notifications not wired)

Migration SQL files live in `supabase/`; apply manually in Supabase SQL Editor — there is no migration runner.

## Knowledge Base Pipeline

29 KB sources across 5 credibility tiers. 32 episodes imported (YouTube transcripts). Embeddings: `text-embedding-3-small`, HNSW index via pgvector. Claims extracted via GPT-4o-mini. Articles drafted via GPT-4o.

Banned phrase checker in `generate-content.ts` catches AI-sounding vocabulary before publishing. Article dates must be backdated to ~1–2/week cadence — same-day batch publishing looks AI-generated.

## Environment

`.env.local` (never committed) must have:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # scripts + admin API routes — never expose to browser
NEXT_PUBLIC_APP_URL=         # used for metadataBase in layout.tsx
OPENAI_API_KEY=              # KB pipeline + audit sentiment
SERPER_API_KEY=              # Reddit sentiment search in audit:vendors
BREVO_API_KEY=               # cron alert emails (in Vercel Production env)
WATCHTOWER_CRON_TOKEN=       # cron auth header (in Vercel Production env)
```

Supabase project ID: `kirlzgiwyzwwkfxtpygg`

**Vercel env vars set (Production):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `WATCHTOWER_CRON_TOKEN`

**Admin auth:** `/admin` and `/api/admin` routes are protected by HTTP Basic Auth via `middleware.ts`. Username: `admin`, password: `WATCHTOWER_CRON_TOKEN` value. In dev without the token set, auth is bypassed.

## Known Constraints

- **Cloudflare Turnstile (managed mode)** detects CDP — cannot be auto-solved. Vendors using it on login pages (e.g., Peptide Crafters `/wp-login.php`) require a manually shared session cookie. Workaround: use the embedded login form on a non-gated page (e.g., `/coas/` for Certified Pep) which bypasses Turnstile.
- **WooCommerce login selectors:** use `page.evaluate()` for fills/clicks, never `page.type()` or native `click()`. Selector priority: `name='log'` > `name='username'` > `type='email'`.
- **Gzip corruption:** Node 26 + Cheerio corrupts gzip responses from PostgREST. Fixed via `noGzipFetch` wrapper in `scripts/lib/client.ts`.
- **Puppeteer lazy import:** import puppeteer inside the function body, not at module top level — stealth plugin patches Node fetch and breaks DB queries if imported at module level.
- **`compute:scores` does not update `last_reviewed`** — must be set manually per vendor or via the audit approve flow.
- **Supabase changes don't appear on live site** until a git push triggers Vercel redeploy. Push even when no app code changed.
