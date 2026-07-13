# Product Requirements Document — Watchtower Peptides

**Owner:** Jason Newman (jason@watchtowerpeptides.com)  
**Entity:** Four Chariots / Arba Haras Group  
**Status:** Live — active development  
**Last updated:** July 2026

---

## 1. Mission

Watchtower Peptides is an independent vendor review and research platform for the research peptide market. No affiliates. No paid placements. No conflicts of interest.

Every vendor score is computed from verifiable data: third-party lab results, transparency signals, pricing, and shipping. Users know exactly who they're buying from and why.

---

## 2. Problem

The peptide research market has no neutral review infrastructure. Available "review" sources are:
- Affiliate-driven blogs (paid per sale)
- Reddit threads (anecdotal, easily gamed)
- Vendor-funded "top 10" lists
- No consistent lab data aggregation

Buyers have no reliable way to evaluate vendor quality, purity claims, or legitimacy. Fake or misleading COAs are widespread. Vendors with FDA warnings sit alongside legitimate suppliers in the same informal recommendation pools.

---

## 3. Target Audience

**Primary:** Researchers, biohackers, and educated consumers purchasing peptides for personal research use. Specifically people who:
- Already know what they want to buy
- Are trying to decide *who* to buy from
- Want to understand what the science actually says (vs. vendor marketing)

**Not:** Beginners who need to be sold on peptides. The platform assumes a baseline level of prior research.

---

## 4. Core Value Proposition

1. **Objective vendor scoring** — formula-driven, not editorial. Every point in every score is traceable to a data source.
2. **Lab verification** — we read the actual COAs, cross-reference the labs, and weight scores by testing depth and recency.
3. **Peptide research library** — evidence-graded profiles with PMID-verified citations. No hallucinated studies.
4. **Honest negatives** — if a vendor has FDA warning history or a purity problem, we say so explicitly.

---

## 5. Current Feature Set (Live)

### 5.1 Vendor Directory (`/vendors`)
- 50 active/flagged vendors scored
- Search + tier filter (Elite / Trusted / Acceptable / Watchlist / Avoid)
- Verdict excerpt with "Read full review" expansion
- Status badges (active / flagged / inactive)

### 5.2 Vendor Detail Pages (`/vendors/[slug]`)
- Community sentiment section (Reddit-derived, human-approved)
- Score breakdown: LV + PQ + TR + CX with explanatory labels
- Latest lab results table (vendor, purity %, batch grade A/B/C/F)
- Shipping & payment badges (CC / crypto / PayPal / intl)
- Full peptide inventory with prices
- Verdict (editorial summary, ~3–5 sentences)

### 5.3 Peptide Library (`/peptides`)
- ~110 profiles: 41 standalone + blend stacks + alias profiles
- 5-category taxonomy: healing | hormones | metabolic | brain-longevity | immune | blend
- Search + evidence filter (Strong / Moderate / Limited / Early)
- Category photos, blend badge, vendor count per peptide

### 5.4 Peptide Detail Pages (`/peptides/[slug]`)
- 7 tabs: Overview, Components (blends only), Mechanism, Research, Dosage, Safety, Studies
- PMID-verified study citations
- Evidence-graded research applications
- Vendor tab: which vendors carry this peptide with prices

### 5.5 Calculator (`/calculator`)
- 3-tool suite: Dosage Planner → Order Calculator → Reconstitution Calculator
- Values carry forward between tools
- Live Supabase data: all 46 non-blend peptides with dose ranges
- Weight-based dosing (lbs/kg toggle)
- Loading/maintenance phase toggle (TB-500 and future peptides)
- Escalation protocol detection (GLP drugs)
- IU-first reconstitution output for insulin syringe users

### 5.6 Research Articles (`/research`)
- 14 articles published (backdated to ~1–2/week cadence)
- KB pipeline: YouTube transcripts → vector embeddings → claim extraction → GPT-4o drafts → human review → publish
- Direct publish path for topic-driven articles (written from primary sources, no KB pipeline required)
- SEO-driven topic selection: articles target high-impression/low-rank queries identified via Google Search Console
- Banned phrase checker prevents AI-sounding vocabulary
- Client-side search on article index

### 5.7 Admin Audit Queue (`/admin/audits`)
- Approve/deny vendor score changes and Reddit sentiment entries
- Editable summary text before approval
- Sentiment classifier (positive / neutral / mixed / negative / insufficient data)
- Links to vendor pages for context

### 5.8 Automated Monitoring
- Daily URL health check (Vercel cron, 12:00 UTC) → email alert via Brevo when vendor domains go dead
- UptimeRobot: 5-minute uptime checks on watchtowerpeptides.com → alert to jason@watchtowerpeptides.com

### 5.9 Blood Test Vendor Comparison (`/blood-tests`)
A second vertical: at-home blood testing services, scored for relevance to peptide researchers specifically (which biomarkers matter for monitoring safety/efficacy of a given protocol, not general wellness testing).

- **Protocol Builder** — pick the peptides in your stack, get a ranked biomarker checklist (Safety / Efficacy / Advanced tiers) plus every eligible vendor scored by coverage %, with a budget filter and an "Over Budget" flag for vendors whose true annual cost exceeds it.
- **Peptide profile Bloodwork tab** — the same per-peptide monitoring data surfaced on individual `/peptides/[slug]` pages.
- **Cart Builder (per-vendor, products-model vendors only)** — pick peptides, get the actual cheapest combination of that vendor's real panels + à la carte tests to cover it, with a toggle between "cheapest for exactly what I need" and "best overall value" (credits a panel's non-target markers too, since someone getting bloodwork anyway benefits from broader data). Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, and Everlywell are migrated to this model so far — see `CLAUDE.md`'s "Blood Test Vendor Data Model" for the schema and how to migrate another vendor onto it. The other 7 blood-test vendors still show a flatter coverage table until migrated the same way.
- **Full catalog view (per-vendor, products-model vendors only)** — every panel and à la carte test the vendor sells, searchable, with full marker breakdowns.

**Affiliate model exception:** unlike the peptide vendor review side (Section 4: "no affiliates, no paid placements"), the blood-test vertical does carry disclosed affiliate links (`lab_vendors.affiliate_url`/`affiliate_program`) — shown with an inline disclosure on every vendor card and detail page ("Watchtower Peptides may earn a referral commission... This does not affect our scoring or editorial coverage"). This is a deliberate, disclosed departure from the peptide-vendor no-affiliate stance, not an inconsistency — the two verticals are evaluated and monetized differently because blood-testing labs aren't peptide vendors and don't compete for the same trust position. Affiliate commission rates for several vendors remain unresearched/unconfirmed — logged as an open item, not blocking.

---

## 6. Scoring System

### Formula
`overall_score = LV + PQ + TR + CX` (max 100)

### Sub-scores

**Lab Verification (LV) — max 40**  
Tiered by COA verification depth:
- T0: No COA → 0 pts
- T1: COA exists, no named lab → 5 pts
- T2: Named lab, no batch IDs → 15 pts
- T3: Named lab + batch IDs (HPLC-verifiable) → 25 pts
- T4: Finnrick aggregate data → 25–40 pts (scales with test count, confidence curve)

**Product Quality (PQ) — max 25**  
Recency-weighted average purity from `lab_tests`. Weight = `e^(-0.04 × months_since_test)`. Capped by LV tier: T1 max 10, T2 max 15, T3 max 20, T4 max 25. No lab data → 0.

**Transparency (TR) — max 25**  
Checklist: business address (5), ownership disclosure (5), lab disclosure (5), contact info (3), testing methodology (3), batch numbers (2), domain ≥2 years (2). FDA warning = -10. Fraud flags = cap at 0. Maps to 3 bands: ≥18 pts → 25, ≥9 pts → 16, ≥1 pt → 8, else 0.

**Customer Experience (CX) — max 10**  
- Pricing (max 6): `price_per_mg` vs market average. >15% below = 6, 5–15% below = 5, within 5% = 3, 5–15% above = 1, >15% above = 0. No data = 3.
- Shipping (max 4): Free on all orders = 4, free ≤$100 threshold = 4, free ≤$200 = 3, flat fee only = 1, no data = 2.

### Score Tiers
| Label | Range |
|---|---|
| Elite | ≥ 85 |
| Trusted | 70–84 |
| Acceptable | 55–69 |
| Watchlist | 45–54 |
| Avoid | < 45 |

### Pricing Integrity Rule
`audit:pricing` must run across ALL active vendors before scores are recomputed. Partial pricing updates corrupt relative CX scores. Pricing and per-vendor auditing are separate jobs.

---

## 7. Vendor Audit Pipeline

Two jobs, separate cadence:

**`audit:pricing` (weekly or on-demand)**
- Scrapes product catalogs for all ~46 active vendors
- Handles public APIs (Shopify/WooCommerce), browser fallback for gated sites
- Rebuilds `peptide_market_prices` (market avg per peptide key)
- No scoring — data collection only

**`audit:vendors` (daily, 5 vendors/run)**
- Picks 5 least-recently-reviewed active vendors
- Per vendor: scrape shipping info → check transparency signals → compute proposed score → fetch Reddit sentiment via Serper → summarize via GPT-4o-mini
- All proposals written as `pending` to `vendor_audit_log` / `vendor_sentiment_log`
- Human reviews at `/admin/audits` — approve applies changes, deny discards

Full vendor pool cycles through in ~10 runs (~10 days at 5/day).

**`audit:sentiment <slug>` (on-demand)**
- Re-runs Reddit sentiment for a single vendor
- Replaces any existing pending sentiment record
- Use when a summary is inaccurate or sourced from off-topic posts

**Vendor discovery and onboarding**
- New vendors are found via Reddit (r/Peptides, r/Peptidesource), Google searches, and Finnrick's testing data
- `npm run add:vendor -- --name "Name" --website "https://..."` creates the DB record and queues for next audit batch
- Duplicate check runs on slug and website origin before insert

---

## 8. Content Strategy

### Research Articles
- Target: 1–2 articles/week (backdated cadence to avoid AI-batch appearance)
- Source: KB pipeline (YouTube transcripts from credentialed speakers)
- Voice: honest optimism — acknowledge what the science doesn't show
- Length: ~1,000 words (intentionally light — no padding)
- Skeptic voices woven into "What the Research Doesn't Show" sections
- No standalone negative articles

### Peptide Profiles
- Evidence-graded, PMID-verified
- All PMIDs manually audited — no hallucinated citations
- Injectable vs. topical evidence clearly distinguished (e.g., GHK-Cu)
- FDA approval status disclosed where applicable

---

## 9. Technical Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6, App Router, TypeScript |
| Styling | Tailwind CSS v4, DM Sans |
| Database | Supabase (PostgreSQL + RLS) |
| Hosting | Vercel (auto-deploy from GitHub main) |
| Images | next/image |
| Scraping | Puppeteer + puppeteer-extra-plugin-stealth, Cheerio, plain fetch |
| AI | OpenAI GPT-4o / GPT-4o-mini (content + sentiment), text-embedding-3-small (vectors) |
| Search | Serper API (Reddit sentiment) |
| Email | Brevo (cron alerts) |
| Monitoring | UptimeRobot (external uptime) |

**Repository:** `jasoncnewman-gif/watchtower-peptides` (GitHub → Vercel auto-deploy)  
**Supabase project:** `kirlzgiwyzwwkfxtpygg`  
**Domain:** watchtowerpeptides.com (Bluehost DNS → Vercel)

**Deploy workflow:** pushes to `main` go straight to production. For changes worth reviewing before they're public, push to a feature branch first — Vercel auto-builds a Preview deployment at its own URL, no setup required — then fast-forward-merge to `main` once confirmed. See `CLAUDE.md` for the exact commands.

---

## 10. Deferred / Roadmap

### Near-term
- **BPC-157 brain/neuroprotection article** — 261 claims in KB, only tendon angle covered so far
- **Additional KB imports** — Robert Lustig, Gil Carvalho, Nick Tiller, Joe Rogan peptide episodes
- **Paramount Peptides COA** — email + verification code auth blocks automation; needs manual cookie share or skip decision
- **Blood test vendor migrations** — 7 of 14 blood-test vendors still on the flat coverage model; Goodlabs, Marek Diagnostics, Vitals Vault, Jinfiniti (AgingSOS), SiPhox Health, Mito Health, and Everlywell (all 2026-07-13) are the reference implementations for migrating a vendor to the products model (Cart Builder + full catalog). Superpower, Function Health, Hundred Health, and **InsideTracker** were all evaluated and rejected: InsideTracker's "Membership" tier turned out to be platform-access-only (no blood test at all) with just one real test product (Ultimate, $340/48 markers) — same single-bundle shape as Superpower, not a real candidate despite looking like 2 tiers in `vendor_tiers`. Billing cadence (subscription vs one-time) doesn't actually matter for this model — only whether there are 2+ genuinely different purchasable bundles at different price points; watch for the InsideTracker trap where one "tier" is actually just a subscription gate, not a product. Everlywell notably wasn't tiers at all — its real catalog was ~25 individual à-la-carte test-kit SKUs (mixed blood panels + qualitative infectious-disease tests + unrelated telehealth), found via its ecommerce sitemap rather than a `vendor_tiers`-style tier list. Remaining candidates: **Lifeforce** (2 tiers but named "Peptide Membership (funnel-specific)" vs "General Membership (main funnel)" — likely the same product marketed two ways, not real bundle diversity, but unverified); **Rythm Health** and **OneTwenty** look like the weakest remaining candidates (Rythm has one tier priced $0, likely a data artifact; OneTwenty's two tiers differ only by NY/NJ surcharge, not content). At this point the remaining pool may be exhausted of easy wins — worth checking each vendor's actual site (not just `vendor_tiers` row count) before investing further, since both InsideTracker's fake-tier and Everlywell's no-tier-but-real-à-la-carte-catalog shapes weren't predictable from the DB alone.
- **SiPhox Health `lab_vendors.entry_price_cents`/`true_annual_cost_cents` are stale** — currently $99/$500, left from before this migration. The live site now prices all four base focus panels uniformly at $124 (Ultimate at $249), confirmed during the 2026-07-13 products-model migration. These vendor-level summary fields feed the vendor header display and possibly CX scoring elsewhere; not touched during this migration since it was out of scope (only `vendor_test_products`/`vendor_test_product_markers` were seeded), but worth a follow-up pass to correct.
- **Blood test affiliate rates** — 5+ vendors have undisclosed/unconfirmed commission rates; explicitly deferred, not yet researched
- **À la carte pricing gaps** — `vendor_biomarker_coverage.addon_cost_cents` is null for most non-Goodlabs vendors' à la carte items (regex-extraction limitation from original seeding); Goodlabs' equivalent gap was backfilled from `notes` free text, same technique not yet applied elsewhere

### Post-launch
- **Score history tracking** — `score_history` table exists but not wired to `compute-scores` runs
- **Verification flags notifications** — `verification_flags` table live (migration_010), email trigger on `OPEN` insert not yet wired
- **Score gate on open flags** — `compute-scores.ts` should skip write if vendor has OPEN flags
- **Maxx Research Supply** — quarterly re-check for product catalog (currently none found)
- **Reddit sentiment pipeline automation** — currently manual (run audit:vendors, approve on admin page); could schedule as Vercel cron when confidence is high enough to reduce human review load

### Monetization (not yet built)
- No current revenue. Platform runs at cost.
- Planned: display advertising (peptide-adjacent, non-affiliate)
- Explicitly excluded: affiliate links, paid placements, sponsored vendor boosts

---

## 11. Legal & Compliance

- All content: research use only, not medical advice, no products sold
- `/disclaimer` — research-use-only, FDA disclosure, age requirement, accuracy caveat
- `/privacy` — anonymized analytics, no cookies, third-party disclosures
- Footer: inline disclaimer on every page
- Peptide profiles correctly scope FDA-approved vs. research-only compounds (Semaglutide, PT-141, Tesamorelin treated differently from BPC-157, TB-500, etc.)
