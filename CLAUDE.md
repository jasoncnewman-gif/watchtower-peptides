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
- `/blood-tests/[slug]` — vendor detail. For vendors migrated to the products model (Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health, Superpower, Function Health, Hundred Health, OneTwenty, as of this writing): Cart Builder (`components/blood-tests/VendorCartBuilder.tsx`, greedy set-cover algorithm in `lib/set-cover.ts`) + full searchable catalog (`VendorCatalogView.tsx`), replacing the flat coverage table entirely. Other vendors still render the flat `vendor_biomarker_coverage` table + `vendor_tiers` pricing cards — see "Blood Test Vendor Data Model" below.

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

**`scripts/scrape-vendor-products.ts` peptide classification (fixed 2026-07-17):** `isPeptideProduct()` is an allow-list keyword match, deliberately — vendors mix real peptides in with merch, reconstitution supplies, and non-peptide research chemicals (NAD+, glutathione, small-molecule drugs like Tesofensine), so "everything in the product grid" is the wrong default. The bug wasn't the allow-list approach, it was that `KNOWN_PEPTIDES` had never been kept current: Orbitrex's page showed 2 peptides against a real catalog of ~60+ because names like GHK-Cu, KPV, DSIP, and the Khavinson bioregulator peptides (Pinealon, Vilon, Cartalax, Bronchogen) matched nothing and were silently dropped — no error, no log, just gone. Two fixes: (1) expanded `KNOWN_PEPTIDES` with the real compounds found missing, (2) any product name matching neither `KNOWN_PEPTIDES` nor the new `KNOWN_NON_PEPTIDES` deny-list is now logged at the end of the run instead of silently discarded — see the "Unmatched product names" block in script output. Orbitrex still has 17 unmatched names (`1G-SGT`, `3G-RT`, `G2-TRZ`, `MTP-31`, `Orbitzen`, `SomatoPulse`, `Wolverine`, `Cag-10mg`, `LIPO-C + B12`, `Adamax`) — these read like proprietary/house-brand blend codenames rather than generic compound names, genuinely ambiguous without vendor confirmation, deliberately left unclassified rather than guessed into the global keyword list (a wrong guess there is wrong for every vendor, not just this one). `npm run scrape:products -- <slug> [<slug> ...]` now supports targeting specific vendors instead of the full ~40-vendor run — use this when checking whether a fix worked. **Known next step:** several other vendors' `catalogUrl` in `VENDOR_CONFIGS` may point at a homepage rather than the actual shop/catalog listing page (Orbitrex did) — this needs auditing per-vendor, not assumed fixed by the keyword-list change alone.

## Blood Test Vendor Data Model

Two coexisting models for `/blood-tests`, because vendors migrate one at a time:

**Flat coverage model (default, all vendors start here):** `vendor_biomarker_coverage` — one row per (vendor, biomarker) with a single `status`/`tier_price_cents`/`addon_cost_cents`. Works for "does this vendor offer this marker" but can't represent a bundle (a fixed marker set at one price) — it has no concept of "these 76 markers only come together for $195." Powers the flat table on `/blood-tests/[slug]` and the cross-vendor ranking in `get_vendor_coverage`.

**Products model (Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health, Superpower, Function Health, Hundred Health, OneTwenty):** `vendor_test_products` (one row per purchasable panel or à la carte test, `product_type` = `panel`|`ala-carte`) + `vendor_test_product_markers` (junction: `raw_marker_name` always populated, `biomarker_id` nullable — null means the vendor sells that marker but it's not one of our tracked biomarkers). This is what `lib/set-cover.ts`'s `greedySetCover()` operates on. **To migrate another vendor to this model:** a vendor does NOT need 2+ products to be worth migrating — `vendor_test_products` works fine with a single row (Rythm Health, 2026-07-14: one product, $79/mo, 25 markers). Even with only one purchasable item, the Cart Builder still shows exactly which of the user's target markers that one product covers and which it doesn't (e.g. "Core Monthly covers 4 of your markers... doesn't sell 21 of your markers"), which reads better than the flat model's included/unavailable table for a vendor whose marketing site doesn't itemize per-marker status well. This reopened vendors earlier written off for "no bundle choice" — Superpower, Function Health, Hundred Health, and OneTwenty were all migrated as single-product vendors (2026-07-14; 218/119/105/70 markers respectively, all at their confirmed current single price). OneTwenty in particular had TWO `vendor_tiers` rows that looked like a rejection case (Standard $499 vs. NY/NJ $749) but were explicitly the same panel — a state-compliance surcharge on one product, not a second bundle; migrated at the $499 standard price. The original reasoning conflated "no combinatorial cart decision" with "not worth migrating," which was too narrow. What actually disqualifies a vendor is having NO itemizable product at all: InsideTracker's "Membership" tier is platform-access-only (not a purchasable test), and its real "Ultimate" product has no public itemized biomarker list anywhere (checked the product page and a biomarkers page, both dead ends) plus a mandatory bundled membership fee on top ($489 total, not a standalone $340 SKU) — left un-migrated for data-availability reasons, not structural ones. This is now the only remaining vendor on the flat model. Then fetch their full catalog (panel + à la carte pricing and marker composition — extraction method is vendor-specific: Goodlabs' came from a `testNameMaps` JSON blob embedded in their own page's Next.js RSC stream; Marek's came from itemized marker lists on each product page plus the Shopify product sitemap/collection listing for the à la carte catalog; Vitals Vault's and Jinfiniti's both came from itemized per-tier marker breakdowns on their own product pages, where higher tiers are confirmed additive supersets of lower ones — verify the cumulative counts match the vendor's own claimed totals before trusting the breakdown, as both of these matched exactly; SiPhox Health's came from a B2B partner page (`/partner/test-panels`) with per-panel marker lists hidden behind a client-rendered "View All N Markers" expand button — not static HTML, requires Playwright to click each panel's expand control — and its 5 panels are NOT additive tiers but genuinely distinct topic-focused panels with only partial overlap, plus its publicly-listed prices had drifted from what was in our DB, so always re-verify current prices against the vendor's own `/pricing/<program>` pages rather than trusting stale `vendor_tiers` rows; Mito Health's came from each tier's own product page having its own complete itemized list — looks additive by biomarker *count* (111→131→174) but isn't a strict superset, since Core/Ultra swap Essential's indirect thyroid tests (T3 Resin Uptake, Free Thyroxine Index, Total T4) for direct Free T3/Free T4 immunoassays instead of layering on top, so always extract and seed each tier's own page content directly rather than assuming higher tiers = lower tier's list plus additions; Everlywell's came from its individual à-la-carte test-kit shop (`/products/<slug>/`, discovered via `/ecommerce-sitemap.xml`) rather than tiers at all — its "membership" DB row was a discount club, not a real bundle, and had to be excluded; its actual catalog mixes real blood-biomarker panels with purely qualitative infectious-disease tests (chlamydia, HIV, syphilis, etc.) that have no biomarker value at all, only a pathogen name as the "marker," plus unrelated telehealth/prescription pages that had to be filtered out entirely — check any vendor's full product catalog for this kind of mixed business (lab tests + prescriptions + qualitative screens) before assuming everything under `/products/` belongs in this migration), hand-verify raw marker names against the `biomarkers` table (don't fuzzy-match — see the 77/257 Goodlabs, 109/384 Marek, 64/160-raw-rows Vitals Vault, 49/94-raw-rows Jinfiniti, 79/160-raw-rows SiPhox, 79/416-raw-rows Mito Health, 50/151-raw-rows Everlywell, 15/25-raw-rows Rythm Health, 19/218-raw-rows Superpower, 32/119-raw-rows Function Health, 23/105-raw-rows Hundred Health, and 20/70-raw-rows OneTwenty match rates as a model: most raw markers won't correspond to anything we track, and forcing matches on assay-specificity ambiguity, e.g. "Growth Hormone"/"HGH" vs. "Growth Hormone (Fasting)", or granularity mismatches like decomposed CBC/urinalysis/lipid-panel components vs. the aggregate "CBC with Differential"/"Lipid Panel" biomarkers, or older indirect-methodology tests like "T3 Uptake"/"Free T4 Index (T7)" vs. our tracked direct Free T3/Free T4 immunoassays, produces wrong data — also watch for terse vendor abbreviations like Jinfiniti's "TT"/"E2"/"LH" needing exact-string rather than substring matching to avoid false collisions), then seed `vendor_test_products`/`vendor_test_product_markers`. Once a vendor has rows in `vendor_test_products`, its `/blood-tests/[slug]` page automatically switches to Cart Builder + Catalog View and drops the flat table/Pricing & Plans section (see `cartProducts.length > 0` branches in `app/blood-tests/[slug]/page.tsx`).

**Set-cover algorithm (`lib/set-cover.ts`):** greedy, two modes. `'targeted'` (default) picks whatever covers the most *currently-uncovered target* markers per dollar — cheapest way to hit exactly the requested list, values a panel's non-target markers at zero. `'value'` credits a product for *all* its markers (tracked or not) via a running `acquiredRawNames` set across the whole cart, not each product's static total — without that dedup, two overlapping broad panels can each look individually cheap and both get selected, which is worse than either alone (caught and fixed during Goodlabs' build: an earlier version produced a $690 cart from three redundant panels; the fix settled on $506 with one panel picked where it actually added new breadth).

**Greedy lock-in cleanup (added 2026-07-14, both modes):** the loop only ever compares *marginal* cost-per-marker at each step, so it can lock in a cheap-but-small product before a bigger product (picked later) turns out to have covered the same ground alone — e.g. Vitals Vault's Max Plan is a confirmed superset of its Essential Plan in matched-`biomarkerIds` terms, but Essential still wins the first iteration on raw $/marker (nothing's covered yet, so it looks cheap) and gets locked in; Max then only shows its *remaining* marginal contribution, hiding that buying Max alone would've been both cheaper and equal-or-better coverage. After the main loop, a cleanup pass removes any selected product whose full `biomarkerIds` are already covered by the other selected products combined (can only reduce cost, never reduces coverage), then `newMarkersCovered` is recomputed per surviving product in cart order so the displayed "covers N of your markers" isn't left showing a stale marginal count from before cleanup. This also retroactively fixed Mito Health's Sermorelin cart, which the same bug had shown as needing all 3 tiers ($1790.74) earlier in the 2026-07-13 session — it's actually just Ultra Panel alone ($1503.51), since Ultra's *matched* tracked biomarkers turn out to fully dominate Essential's and Core's even though the raw catalogs swap out some marker methodologies (see "Blood Test Vendor Data Model" note above). Verified this doesn't over-trigger on genuinely non-redundant panels (SiPhox's Heart & Metabolic + Hormone Focus combination for Sermorelin is unchanged, since neither panel's biomarkerIds is a subset of the other's).

**Cleanup extended to catch group-vs-single dominance + 'value'-mode raw markers (added 2026-07-15, found via code review):** the 2026-07-14 cleanup above only removes a selected product when the *other selected* products fully subsume it — it can't see a GROUP of selected products that's jointly dominated by a single UNSELECTED product, since no individual group member is redundant against just the other members. Reproduced live on SiPhox: a target list equal to Longevity+Thyroid+Heart's combined markers made greedy assemble all three $124 panels ($372) when the standalone Ultimate Health Panel ($249) covers the same 23 markers alone — a real overcharge, not just theoretical. Added a second fixed-point pass that checks every *unselected* candidate against the current `selected` list: if a candidate's `biomarkerIds` fully covers one or more selected products' `biomarkerIds`, and the sum of those dominated products' prices exceeds the candidate's price, swap them all out for the candidate alone. Also fixed a 'value'-mode-only gap the same review caught: both cleanup passes previously compared only tracked `biomarkerIds`, never `rawMarkerNames` — in 'value' mode a product can be selected specifically for bonus untracked raw markers, and the old check would still delete it once its *tracked* markers became redundant, silently discarding the raw-marker credit 'value' mode exists to give. Both passes now also require raw-marker coverage before removing/replacing anything in 'value' mode (see `rawSubsetOf` in `lib/set-cover.ts`); 'targeted' mode is unaffected since it never scores on raw markers. Verified via a standalone script exercising `greedySetCover` directly (not just Playwright): SiPhox-style 3-panel-vs-1 dominance now collapses correctly, a synthetic 'value'-mode case keeps a raw-marker-only product instead of dropping it, the same case correctly still collapses in 'targeted' mode, and the 2026-07-14 Vitals Vault/Mito Health fixes remain intact.

## Database Tables

Core: `vendors`, `vendor_peptides`, `vendor_transparency`, `lab_tests`, `peptide_market_prices`, `peptides`

Audit: `vendor_audit_log`, `vendor_sentiment_log` (migration_016, migration_017)

COA integrity: `coa_audit_status`, `coa_audit_tier`, `coa_audit_notes`, `coa_audited_at` columns on `vendors` (migration_011)

Knowledge base: `kb_sources`, `kb_episodes`, `kb_chunks` (pgvector HNSW), `kb_claims`

Content: `research_articles`

Monitoring: `alerts`, `score_history`, `verification_flags` (migration_010 — applied but notifications not wired)

Blood tests (migration_019/020): `biomarkers`, `peptide_biomarkers`, `peptide_blend_components`, `lab_vendors`, `vendor_tiers`, `vendor_biomarker_coverage`. RPCs (migration_021): `get_protocol_biomarkers(peptide_slugs)`, `get_vendor_coverage(biomarker_ids, budget_tier)`.

Blood test products model (migration_022/023; Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, Everlywell, Rythm Health, Superpower, Function Health, Hundred Health, OneTwenty so far): `vendor_test_products`, `vendor_test_product_markers` — see "Blood Test Vendor Data Model" above.

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

- **`/blood-tests` listing page cards show no price (2026-07-14).** `VendorCard.tsx` briefly displayed an "entry price" (cheapest `vendor_test_products` panel, falling back to `vendor_tiers.is_entry_tier`) but it was removed after Goodlabs surfaced the same underlying problem in a smaller form: a vendor's cheapest *named panel* isn't necessarily a meaningful "starting price" (Goodlabs' cheapest panel is a $38 niche "Kidneys" mini-panel, not what a typical customer buys). Rather than keep patching the definition of "entry price," prices were dropped from the listing cards entirely — vendor detail pages and the Cart Builder still show real per-product prices and computed totals, which is the trustworthy source (`vendor_test_products`). The `entryPriceByVendorId` computation in `app/blood-tests/page.tsx` still exists and feeds `ProtocolBuilder`'s budget filter, it's just no longer passed to `VendorCard`. If listing-card prices are wanted back, don't revive "cheapest panel" as the definition — something like "price of the panel most people actually buy" would need real purchase data we don't have.
- **`/blood-tests` listing page categories (fixed 2026-07-14):** the four section headings (Membership Plans, One-Time Panel Packages, Panels + À La Carte, Build Your Own Panel) are now derived per-request from each vendor's real `vendor_test_products` panel/à-la-carte counts, not the static `lab_vendors.section` field (set once at initial research time, before any product-model migration existed). Goodlabs and Marek Diagnostics have the identical hybrid shape (panels + a large à la carte catalog) but `section` had them in different buckets; Everlywell's `section` said "membership" despite having zero real subscription product. See `categoryFor()` in `app/blood-tests/page.tsx`. The static `section` field is now only a fallback for vendors with no `vendor_test_products` rows yet (InsideTracker).
- **`lab_vendors.audience_fit_score` removed from the UI entirely (2026-07-14).** It was a hand-typed 1-10 checklist score from a single 2026-07-08 research pass (`outputs/lab_vendor_audit.json`, untracked/never committed), never recomputed, and it measured a fixed 9-item checklist (IGF-1 ×2, liver/kidney/hormone panels, venous draw, CLIA, fasting insulin, ApoB, peptide Rx access) rather than actual coverage of our tracked `biomarkers` table — a vendor could score 10/10 on the checklist while covering very few of the 84 tracked biomarkers overall (this is what happened with Superpower: 10/10 checklist score, 19/218 raw markers matched during its products-model migration). The column still exists in the DB but nothing reads it anymore. If a coverage-based ranking signal is wanted later, compute it from `vendor_test_product_markers` (e.g. % of tracked biomarkers covered by a vendor's cheapest panel) rather than reviving the static checklist — the live Protocol Builder above the vendor grid already does the correct, protocol-specific version of this via `get_vendor_coverage`.
- **Cloudflare Turnstile (managed mode)** detects CDP — cannot be auto-solved. Vendors using it on login pages (e.g., Peptide Crafters `/wp-login.php`) require a manually shared session cookie. Workaround: use the embedded login form on a non-gated page (e.g., `/coas/` for Certified Pep) which bypasses Turnstile.
- **WooCommerce login selectors:** use `page.evaluate()` for fills/clicks, never `page.type()` or native `click()`. Selector priority: `name='log'` > `name='username'` > `type='email'`.
- **Gzip corruption:** Node 26 + Cheerio corrupts gzip responses from PostgREST. Fixed via `noGzipFetch` wrapper in `scripts/lib/client.ts`.
- **Puppeteer lazy import:** import puppeteer inside the function body, not at module top level — stealth plugin patches Node fetch and breaks DB queries if imported at module level.
- **`compute:scores` does not update `last_reviewed`** — must be set manually per vendor or via the audit approve flow.
- **Supabase changes don't appear on live site** until a git push triggers Vercel redeploy. Push even when no app code changed.
- **SEO metadata fixes (2026-07-16), found via a GSC-data-backed review.** Root layout (`app/layout.tsx`) applies `template: "%s | Watchtower Peptides"` to every page's `<title>` — any page-level title that already ends in `"| Watchtower"` or the full brand name gets it appended twice. `/blood-tests` and `/blood-tests/[slug]` had exactly this bug; don't reintroduce it when writing new page titles. Meta descriptions built from raw DB copy (peptide `tagline`/`overview`, vendor `verdict`) must go through `truncateDescription()` in `lib/utils.ts`, not a raw `.slice(0, 155)` — the latter cuts mid-word with no ellipsis (was live on every peptide and vendor detail page). Every page-level `generateMetadata`/static `metadata` export should also set matching `openGraph`/`twitter` blocks (title/description/images) — Next does NOT recompute these from a child page's plain `title`/`description` fields; a page that omits `openGraph` inherits the root layout's generic one verbatim. JSON-LD: `Organization` schema is site-wide (root layout), vendor pages carry `Review`/`Rating` schema (`vendor.overall_score` as `ratingValue`, scale 0–100), research articles carry `Article` schema — all inline `<script type="application/ld+json">` tags, no external library.
- **Transient Vercel build failures:** `errorCode: "sts_credentials_fetch_failed"` at `errorStep: "build-container-init"` (build dies right after cloning, before `npm install`) is a Vercel-side infra hiccup, not a code problem — confirmed by an identical commit succeeding on retry. If a build errors in ~1s with no actual build log output, just push an empty commit (or retrigger) rather than debugging the diff.
