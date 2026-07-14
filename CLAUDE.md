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
- `/blood-tests` — at-home blood testing vendor comparison; Protocol Builder (pick peptides → ranked biomarker checklist + cross-vendor coverage scoring via `get_protocol_biomarkers`/`get_vendor_coverage` RPCs)
- `/blood-tests/[slug]` — vendor detail. For vendors migrated to the products model (Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health, as of this writing): Cart Builder (`components/blood-tests/VendorCartBuilder.tsx`, greedy set-cover algorithm in `lib/set-cover.ts`) + full searchable catalog (`VendorCatalogView.tsx`), replacing the flat coverage table entirely. Other vendors still render the flat `vendor_biomarker_coverage` table + `vendor_tiers` pricing cards — see "Blood Test Vendor Data Model" below.

**Peptide profile Bloodwork tab:** `/peptides/[slug]` has an 8th tab (`components/peptides/PeptideDetailTabs.tsx`) showing the same per-peptide monitoring markers as the Protocol Builder, scoped to one peptide, plus top 3 vendor matches.

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

## Blood Test Vendor Data Model

Two coexisting models for `/blood-tests`, because vendors migrate one at a time:

**Flat coverage model (default, all vendors start here):** `vendor_biomarker_coverage` — one row per (vendor, biomarker) with a single `status`/`tier_price_cents`/`addon_cost_cents`. Works for "does this vendor offer this marker" but can't represent a bundle (a fixed marker set at one price) — it has no concept of "these 76 markers only come together for $195." Powers the flat table on `/blood-tests/[slug]` and the cross-vendor ranking in `get_vendor_coverage`.

**Products model (Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health):** `vendor_test_products` (one row per purchasable panel or à la carte test, `product_type` = `panel`|`ala-carte`) + `vendor_test_product_markers` (junction: `raw_marker_name` always populated, `biomarker_id` nullable — null means the vendor sells that marker but it's not one of our tracked biomarkers). This is what `lib/set-cover.ts`'s `greedySetCover()` operates on. **To migrate another vendor to this model:** a vendor does NOT need 2+ products to be worth migrating — `vendor_test_products` works fine with a single row (Rythm Health, 2026-07-14: one product, $79/mo, 25 markers). Even with only one purchasable item, the Cart Builder still shows exactly which of the user's target markers that one product covers and which it doesn't (e.g. "Core Monthly covers 4 of your markers... doesn't sell 21 of your markers"), which reads better than the flat model's included/unavailable table for a vendor whose marketing site doesn't itemize per-marker status well. This reopens vendors earlier written off for "no bundle choice" (Superpower, Function Health, Hundred Health, InsideTracker's real Ultimate product) as potential single-product migrations — the original reasoning conflated "no combinatorial cart decision" with "not worth migrating," which was too narrow. What actually disqualifies a vendor is having NO itemizable product at all (e.g. InsideTracker's "Membership" tier is platform-access-only, not a purchasable test) or genuinely being better served by the flat model for some other reason, not the tier count. Then fetch their full catalog (panel + à la carte pricing and marker composition — extraction method is vendor-specific: Goodlabs' came from a `testNameMaps` JSON blob embedded in their own page's Next.js RSC stream; Marek's came from itemized marker lists on each product page plus the Shopify product sitemap/collection listing for the à la carte catalog; Vitals Vault's and Jinfiniti's both came from itemized per-tier marker breakdowns on their own product pages, where higher tiers are confirmed additive supersets of lower ones — verify the cumulative counts match the vendor's own claimed totals before trusting the breakdown, as both of these matched exactly; SiPhox Health's came from a B2B partner page (`/partner/test-panels`) with per-panel marker lists hidden behind a client-rendered "View All N Markers" expand button — not static HTML, requires Playwright to click each panel's expand control — and its 5 panels are NOT additive tiers but genuinely distinct topic-focused panels with only partial overlap, plus its publicly-listed prices had drifted from what was in our DB, so always re-verify current prices against the vendor's own `/pricing/<program>` pages rather than trusting stale `vendor_tiers` rows; Mito Health's came from each tier's own product page having its own complete itemized list — looks additive by biomarker *count* (111→131→174) but isn't a strict superset, since Core/Ultra swap Essential's indirect thyroid tests (T3 Resin Uptake, Free Thyroxine Index, Total T4) for direct Free T3/Free T4 immunoassays instead of layering on top, so always extract and seed each tier's own page content directly rather than assuming higher tiers = lower tier's list plus additions; Everlywell's came from its individual à-la-carte test-kit shop (`/products/<slug>/`, discovered via `/ecommerce-sitemap.xml`) rather than tiers at all — its "membership" DB row was a discount club, not a real bundle, and had to be excluded; its actual catalog mixes real blood-biomarker panels with purely qualitative infectious-disease tests (chlamydia, HIV, syphilis, etc.) that have no biomarker value at all, only a pathogen name as the "marker," plus unrelated telehealth/prescription pages that had to be filtered out entirely — check any vendor's full product catalog for this kind of mixed business (lab tests + prescriptions + qualitative screens) before assuming everything under `/products/` belongs in this migration), hand-verify raw marker names against the `biomarkers` table (don't fuzzy-match — see the 77/257 Goodlabs, 109/384 Marek, 64/160-raw-rows Vitals Vault, 49/94-raw-rows Jinfiniti, 79/160-raw-rows SiPhox, 79/416-raw-rows Mito Health, 50/151-raw-rows Everlywell, and 15/25-raw-rows Rythm Health match rates as a model: most raw markers won't correspond to anything we track, and forcing matches on assay-specificity ambiguity, e.g. "Growth Hormone"/"HGH" vs. "Growth Hormone (Fasting)", or granularity mismatches like decomposed CBC/urinalysis/lipid-panel components vs. the aggregate "CBC with Differential"/"Lipid Panel" biomarkers, or older indirect-methodology tests like "T3 Uptake"/"Free T4 Index (T7)" vs. our tracked direct Free T3/Free T4 immunoassays, produces wrong data — also watch for terse vendor abbreviations like Jinfiniti's "TT"/"E2"/"LH" needing exact-string rather than substring matching to avoid false collisions), then seed `vendor_test_products`/`vendor_test_product_markers`. Once a vendor has rows in `vendor_test_products`, its `/blood-tests/[slug]` page automatically switches to Cart Builder + Catalog View and drops the flat table/Pricing & Plans section (see `cartProducts.length > 0` branches in `app/blood-tests/[slug]/page.tsx`).

**Set-cover algorithm (`lib/set-cover.ts`):** greedy, two modes. `'targeted'` (default) picks whatever covers the most *currently-uncovered target* markers per dollar — cheapest way to hit exactly the requested list, values a panel's non-target markers at zero. `'value'` credits a product for *all* its markers (tracked or not) via a running `acquiredRawNames` set across the whole cart, not each product's static total — without that dedup, two overlapping broad panels can each look individually cheap and both get selected, which is worse than either alone (caught and fixed during Goodlabs' build: an earlier version produced a $690 cart from three redundant panels; the fix settled on $506 with one panel picked where it actually added new breadth).

## Database Tables

Core: `vendors`, `vendor_peptides`, `vendor_transparency`, `lab_tests`, `peptide_market_prices`, `peptides`

Audit: `vendor_audit_log`, `vendor_sentiment_log` (migration_016, migration_017)

COA integrity: `coa_audit_status`, `coa_audit_tier`, `coa_audit_notes`, `coa_audited_at` columns on `vendors` (migration_011)

Knowledge base: `kb_sources`, `kb_episodes`, `kb_chunks` (pgvector HNSW), `kb_claims`

Content: `research_articles`

Monitoring: `alerts`, `score_history`, `verification_flags` (migration_010 — applied but notifications not wired)

Blood tests (migration_019/020): `biomarkers`, `peptide_biomarkers`, `peptide_blend_components`, `lab_vendors`, `vendor_tiers`, `vendor_biomarker_coverage`. RPCs (migration_021): `get_protocol_biomarkers(peptide_slugs)`, `get_vendor_coverage(biomarker_ids, budget_tier)`.

Blood test products model (migration_022/023; Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health so far): `vendor_test_products`, `vendor_test_product_markers` — see "Blood Test Vendor Data Model" above.

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

**Vercel env vars set (Production + Preview):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `WATCHTOWER_CRON_TOKEN` — confirmed working for Preview as of 2026-07-10.

**Preview deployments:** Vercel's GitHub integration auto-builds a Preview deployment (own URL, no extra cost) for any push to a branch other than `main`. Workflow for risky/visible changes: push to a feature branch, review the preview URL, then fast-forward-merge into `main` and push once confirmed (`git checkout main && git merge --ff-only <branch> && git push origin main`). Project: `watchtower-peptides` (`prj_iHRu3hhB2aGhFdTQYz9jvUodglBE`), team `Jason Newman's projects` (`team_kpkz6Jmqr9M29y4BClL8d6H8`).

**Admin auth:** `/admin` and `/api/admin` routes are protected by HTTP Basic Auth via `middleware.ts`. Username: `admin`, password: `WATCHTOWER_CRON_TOKEN` value. In dev without the token set, auth is bypassed.

## Known Constraints

- **Cloudflare Turnstile (managed mode)** detects CDP — cannot be auto-solved. Vendors using it on login pages (e.g., Peptide Crafters `/wp-login.php`) require a manually shared session cookie. Workaround: use the embedded login form on a non-gated page (e.g., `/coas/` for Certified Pep) which bypasses Turnstile.
- **WooCommerce login selectors:** use `page.evaluate()` for fills/clicks, never `page.type()` or native `click()`. Selector priority: `name='log'` > `name='username'` > `type='email'`.
- **Gzip corruption:** Node 26 + Cheerio corrupts gzip responses from PostgREST. Fixed via `noGzipFetch` wrapper in `scripts/lib/client.ts`.
- **Puppeteer lazy import:** import puppeteer inside the function body, not at module top level — stealth plugin patches Node fetch and breaks DB queries if imported at module level.
- **`compute:scores` does not update `last_reviewed`** — must be set manually per vendor or via the audit approve flow.
- **Supabase changes don't appear on live site** until a git push triggers Vercel redeploy. Push even when no app code changed.
- **Transient Vercel build failures:** `errorCode: "sts_credentials_fetch_failed"` at `errorStep: "build-container-init"` (build dies right after cloning, before `npm install`) is a Vercel-side infra hiccup, not a code problem — confirmed by an identical commit succeeding on retry. If a build errors in ~1s with no actual build log output, just push an empty commit (or retrigger) rather than debugging the diff.
