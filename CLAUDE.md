# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Warning — Next.js 16:** This project runs Next.js 16.2.6. APIs, conventions, and file structure differ from earlier versions covered by training data. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for current guidance.

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (runs type-check)
npm run compute:scores   # recompute all vendor scores → writes to Supabase
npm run compute:prices   # recompute price_per_mg + peptide_market_prices
npm run scrape:products  # scrape product inventory from all active vendor sites
npm run scrape:coas      # scrape COA links from all active vendor sites
npm run scrape:gated     # Puppeteer login scraper for gated/Cloudflare-protected vendors
npm run scrape:finnrick  # scrape Finnrick test data
npm run verify:domains   # check which vendor domains are alive
```

All scripts in `scripts/` run via `tsx --tsconfig scripts/tsconfig.json`. Node is not on PATH — always use `npm run <script>` rather than running `tsx` directly.

## Architecture

**App router pages (all server components, async data-fetching):**
- `/` — hero slider, stats bar, top-4 vendors, featured peptides
- `/vendors` — vendor directory (server fetch → `VendorListClient` for client-side search/filter)
- `/vendors/[slug]` — vendor detail: score breakdown, lab results table, shipping & payment, peptide inventory, verdict
- `/peptides` — peptide library (server fetch → `PeptideLibraryClient` for client-side search/filter)
- `/peptides/[slug]` — 7-tab peptide profile; Components tab is conditional on `blend_components` being non-null

**Two Supabase client instances:**
1. `lib/supabase.ts` — anon key, used by Next.js app at runtime (public RLS-gated access)
2. `scripts/lib/client.ts` — service role key, used exclusively by seed/scrape/compute scripts. Also wraps fetch with `noGzipFetch` (forces `Accept-Encoding: identity`) — required workaround for Node 26 + Cheerio corrupting gzip responses from PostgREST.

**Type boundary:** `lib/supabase.ts` defines `DbVendor` / `DbPeptide` (flat DB row shapes) and `Vendor` / `Peptide` (display types). `dbVendorToVendor()` and `dbPeptideToAppPeptide()` are the only translation functions — don't map inline.

**Scoring formula (4 sub-scores → `compute-scores.ts`):**
- `lab_testing_score` ← Lab Verification (LV), max 40 — tiered by verification type (0/5/15/25/40), scaled by Finnrick test count at Tier 4
- `purity_accuracy_score` ← Product Quality (PQ), max 25 — recency-weighted purity from `lab_tests`, capped by LV tier
- `transparency_score` ← Transparency (TR), max 25 — checklist from `vendor_transparency` table
- `pricing_reliability_score` ← Customer Experience (CX), max 10 — `price_per_mg` vs market avg in `peptide_market_prices`
- `overall_score` = LV + PQ + TR + CX; score labels: Elite ≥85, Trusted ≥70, Acceptable ≥55, Watchlist ≥45, Avoid <45

**Slug matching for vendor→peptide cross-references (`lib/utils.ts`):**
`generateSlug()` decodes HTML entities before slugifying. `stripSizeSuffix()` normalises vendor product names like `ipamorelin-10mg` → `ipamorelin`. Blend profiles use prefix matching (`vpSlug.startsWith(slug + '-')`). Both functions must stay in sync — any change to one likely requires the other.

**Scripts infrastructure (`scripts/`):**
- `lib/client.ts` — shared Supabase service-role client (all scripts import this, never the app client)
- `lib/scraper.ts` — shared utilities: `log`, `sleep`, HTTP helpers
- `scrape-gated-vendors.ts` — Puppeteer with stealth plugin; uses real Chrome binary for Cloudflare bypass; lazy-imports puppeteer to avoid patching Node fetch before DB queries run
- Migration SQL files live in `supabase/`; apply manually in Supabase SQL Editor — there is no migration runner

## Environment

`.env.local` (never committed) must have:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # scripts only — never expose to browser
NEXT_PUBLIC_APP_URL=         # used for metadataBase in layout.tsx
```

Supabase project ID: `kirlzgiwyzwwkfxtpygg`
