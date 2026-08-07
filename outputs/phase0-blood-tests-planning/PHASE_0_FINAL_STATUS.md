# Revised Phase 0 — Final Status

Covers everything researched/fixed since the original 8-phase spec review found it unsound. Nothing in this document has been applied to Supabase — that's still a separate, explicit go-ahead away.

## 1. Schema fix: biomarkers.category enum expanded

Added `hematology` and `electrolyte` to the CHECK constraint (was 11 values, now 13). Reason: 44 newly-researched markers had no clean home — Sodium/Osmolality don't fit any existing category, and Ferritin/Fibrinogen/ESR/Immunoglobulins/Lymphocyte Subsets are hematology-adjacent, not cleanly "immune." Full corrected DDL: `scratchpad/biomarkers_table_corrected.sql`. No other table in the original 6-table schema needed structural changes.

## 2. Vendor-list fix: section mapping corrected

Full mapping in `scratchpad/vendor_section_mapping.json`. Summary of what changed from the original spec:
- **Jinfiniti (AgingSOS) added** to `panel-package` — was missing entirely from every vendor list despite being a fully-researched INCLUDE-NICHE vendor
- **Just Labs reverted to `excluded`** — the original spec resurrected it as the sole Build-Your-Own vendor with no stated rationale, contradicting the original eligibility audit (dead domain, no distinguishing features)
- **Goodlabs moved to `build-your-own`** — its actual identity is a la carte (200+ individually-priced Quest tests), which also resolves the schema conflict where the original spec tried to cross-list it into two sections at once
- Vendor name strings corrected to exact `vendor_name` values (`SiPhox Health`, `Rythm Health`, not bare `SiPhox`/`Rythm`)

18 vendors total: 9 membership, 3 panel-package, 1 build-your-own, 1 special, 4 excluded.

## 3. Biomarker matrix: 84 rows, complete

`lab_vendor_audit.xlsx`/`.json` now hold the full matrix — original 40 markers plus 44 researched this session (Lipid Panel recovered from existing data; 6 Tier B markers; 10 high-value + 9 exotic Tier C markers; 18 final Tier C markers). All 14 vendors × 84 markers populated. Non-blood specimens (urine/stool) explicitly tagged inline wherever they'd otherwise mislead — 8 vendors' Ketones offerings and Everlywell's Melatonin are urine-only, tagged as such.

**Known gaps, carried forward honestly rather than papered over:**
- 14 markers have zero vendor coverage anywhere (HGF, Thymulin Assay, Mitochondrial Function Markers, NK Cell Activity, GnRH Stimulation Test, BDNF, Citrulline, Free Fatty Acids, Ghrelin, Lactate, Osmolality, Pre-Albumin, Procalcitonin, Troponin I) — genuine absences, not research failures
- Mito Health's 1000+ item à la carte catalog is JS-rendered and unauditable — every "not offered" finding for that vendor is soft (confirmed only against its 3 named panels)
- Rythm Health's third-party Plus Panel is WAF-blocked — findings there rest on cached search snippets, not a direct fetch

## 4. Blend components: 4 of 7 resolved, 3 flagged rather than guessed

`scratchpad/blend_resolution.md`. Resolved with high confidence: Wolverine-Cu Blend, GLOW Blend, KLOW Blend, Nova KLOW (= KLOW, not a distinct formula). Genuinely unresolved: Diamond Glow and ISOFLOW (single-vendor sources only, no independent corroboration), Deadpool Blend (two vendor clusters sell materially different formulations under the same name). None of the 3 unresolved ones should be seeded as fact.

## 5. Affiliate data: 2 of 8 confirmed, rest partial or undisclosed

`outputs/affiliate_audit.md`. Superpower and Vitals Vault have real, verified terms. The other 6 are either application-gated with undisclosed rates (Function Health, Hundred Health, OneTwenty), have conflicting third-party data (InsideTracker, Everlywell), or have no public program at all (Mito Health).

## 6. What's still genuinely missing before Phase 1 can execute

This is the honest gap: **all of the above is research and design, not seed-ready data.** Phase 1 seeding still needs:

- **A seed-generation script for `peptide_biomarkers`** — the canonical biomarker-name mapping exists (`biomarker_normalization.json`), but nobody has actually run it against all 60 peptides' Tier 1/2/3 cells to produce insertable rows. This also needs the blend "See X + Y components" special-casing (resolve to the union of named component peptides' own tier lists) and has to skip/flag the 3 still-unresolved blends rather than guessing their components.
- **A parser for `vendor_biomarker_coverage`** — the 84×14 matrix exists as human-readable annotation strings (`✓ (Ultra/$1,455)`, `+ (à la carte)`, etc.), not as the structured `status`/`tier_id`/`tier_price_cents`/`accuracy_flag` columns the schema expects. That translation logic hasn't been written.
- **`vendor_tiers` seeding** — untouched this session; still needs to come from `lab_vendor_audit.xlsx` Sheet 3 (Pricing Deep Dive).
- **Affiliate columns mapped onto `lab_vendors`** — straightforward now that the data exists, just not yet done.

None of this is more research — it's engineering work (writing the actual seed scripts) that hasn't started. Recommend treating "write and dry-run the seed scripts, show you the output before touching Supabase" as the next concrete milestone, separate from and after this document.
