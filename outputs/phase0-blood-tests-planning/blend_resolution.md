# Task 0B: Blend Component Resolution

## Wolverine-Cu Blend — RESOLVED (no research needed)
Source: watchtower_biomarker_audit.xlsx explicitly states "See BPC-157 + TB-500 + GHK-Cu blend" — same composition as the existing `bpc-157-tb-500-ghk-cu-blend` peptide.

Components → matched slugs:
- BPC-157 → `bpc-157` ✓ confirmed exists
- TB-500 → `tb-500` ✓ confirmed exists
- GHK-Cu → `ghk-cu` ✓ confirmed exists

blend_id: `wolverine-cu-blend` (confirmed exists in peptides table)
Status: fully resolved, all 3 components matched, ready for peptide_blend_components seeding.

---

## GLOW Blend — RESOLVED (high confidence)
Components (5:1:1 ratio, 70mg/vial): GHK-Cu 50mg, BPC-157 10mg, TB-500 10mg

Matched slugs:
- BPC-157 → `bpc-157` ✓
- TB-500 → `tb-500` ✓
- GHK-Cu → `ghk-cu` ✓

Confidence: HIGH — 8+ independent commercial/dosing-info sources agree exactly on both composition and the 50/10/10mg ratio, no conflicts found. Caveat: no Reddit/forum corroboration found (search tooling didn't surface results), so triangulation rests on vendor/dosing-info sites rather than community discussion. Also no independent COA verification — consistency found is in labeling/marketing, not lab-confirmed contents.

Important adjacent note: KLOW = GLOW + KPV (4th component). Multiple sources confirm KLOW's GHK-Cu/BPC-157/TB-500 core is identical to GLOW, with KPV added. GLOW itself does NOT include KPV.

blend_id: `glow-blend` (confirmed exists in peptides table)
Status: fully resolved, all 3 components matched, ready for peptide_blend_components seeding.

---

## Diamond Glow — RESOLVED 2026-07-09 (confirmed by Jason directly, overrides prior "unresolved" status)
Components: GHK-Cu + TB-500 + BPC-157 — same as GLOW.

Matched slugs: BPC-157 → `bpc-157` ✓, TB-500 → `tb-500` ✓, GHK-Cu → `ghk-cu` ✓ (all exist)

This confirms the web research's single-source finding (Peptide Crafters' listing) rather than contradicting it — the "likely GLOW rebrand" inference was correct. Web research alone couldn't clear the 2-source bar; direct confirmation from the site owner does. Dose ratio not independently re-confirmed by Jason — defaulting to the same 5:1:1 (GHK-Cu 50mg/BPC-157 10mg/TB-500 10mg) ratio found for GLOW unless told otherwise.

blend_id: `diamond-glow` (confirmed exists in peptides table)
Status: ready for peptide_blend_components seeding.

---

## KLOW Blend — RESOLVED (high confidence)
Components (80mg vial): GHK-Cu 50mg, BPC-157 10mg, TB-500 10mg, KPV 10mg — confirms KLOW = GLOW + KPV, matches earlier finding.

Matched slugs: BPC-157 → `bpc-157` ✓, TB-500 → `tb-500` ✓, GHK-Cu → `ghk-cu` ✓, KPV → `kpv` ✓ (all 4 exist)

Confidence: HIGH — 8+ independent vendor/dosing-guide sources agree exactly, no conflicts. Caveat: no Reddit/forum corroboration found (tool limitation — zero Reddit results returned despite targeted queries), so this rests on commercial/vendor-adjacent sources, not peer community discussion. One source (theklowpeptide.com) gave a "10-15mg" range instead of flat 10mg for BPC-157/TB-500 — minor, not a real conflict. One low-credibility snippet suggested KLOW might exclude GHK-Cu — weighted as likely a search-summarization artifact given 8+ sources unanimously include it at 50mg.

blend_id: `klow-blend` (confirmed exists in peptides table)
Status: fully resolved, all 4 components matched, ready for seeding.

---

## Deadpool Blend — RESOLVED 2026-07-09 (confirmed by Jason directly, overrides prior "unresolved" status)
Components: BPC-157 + TB-500 + Cartalax.

Matched slugs: BPC-157 → `bpc-157` ✓, TB-500 → `tb-500` ✓, Cartalax → `cartalax` ✓ (all exist)

This confirms "Formulation A" from web research (3 vendors + 1 forum mention) over "Formulation B" (BPC-157+TB-500+KPV, 2 South African vendors that may have shared a white-label source). Formulation B and the unrelated MK-677 product both using the "Deadpool" name elsewhere should be treated as name collisions, not this blend.

blend_id: `deadpool-blend` (confirmed exists in peptides table)
Status: ready for peptide_blend_components seeding.

---

## Nova KLOW — RESOLVED, but likely not a distinct blend (high confidence on composition, lower confidence on naming)
Components: same as standard KLOW — GHK-Cu 50mg, BPC-157 10mg, TB-500 10mg, KPV 10mg (80mg vial, 5:1:1:1 ratio)

Matched slugs: BPC-157 → `bpc-157` ✓, TB-500 → `tb-500` ✓, GHK-Cu → `ghk-cu` ✓, KPV → `kpv` ✓ (all 4 exist)

Confidence: HIGH on composition (10+ vendor/dosing-guide sources agree exactly, no conflicts) — but the research found NO evidence "Nova KLOW" is a genuinely distinct formulation. It appears to just be standard KLOW sold by vendors with "Nova" in their brand name (Nova Labs, Nova Peptides, PeptideNova.com). My original research prompt speculated some vendors might add IGF-1 to "Nova" variants — that speculation was NOT substantiated by any source found. No Reddit/forum term-specific corroboration found (tool limitation, same as other blends).

blend_id: `nova-klow` (confirmed exists in peptides table)
Status: components fully resolved and matched — same composition as `klow-blend`. Recommend describing it as "KLOW blend as sold by Nova-branded vendors" rather than implying a proprietary formulation difference, since no evidence supports one.

---

## ISOFLOW — RESOLVED 2026-07-09 (confirmed by Jason directly, overrides prior "unresolved" status)
Components: KPV + TB-500 + BPC-157 (no GHK-Cu, unlike GLOW/KLOW).

Matched slugs: KPV → `kpv` ✓, TB-500 → `tb-500` ✓, BPC-157 → `bpc-157` ✓ (all exist)

Confirms the single-vendor (Peptide Crafters) web-research finding exactly — 10mg each, 30mg/8mL vial. The "isomerized GLOW component" hypothesis floated in the original research prompt was never substantiated and isn't part of the confirmed composition.

blend_id: `isoflow` (confirmed exists in peptides table)
Status: ready for peptide_blend_components seeding.

---
# STATUS: All 7 blends resolved (4 via web research, 3 confirmed directly by Jason 2026-07-09).
# Doses confirmed independently for Wolverine-Cu/GLOW/KLOW/Nova KLOW; Diamond Glow/Deadpool/ISOFLOW
# have confirmed COMPONENTS but doses are inferred/defaulted (GLOW-family 5:1:1 ratio for Diamond
# Glow, 10mg-each assumed for Deadpool/ISOFLOW pending explicit confirmation) -- flag if exact
# mg amounts matter before this goes into peptide_blend_components.quantity_mcg.
#
# NOT YET applied to seed_peptide_blend_components.csv / seed_peptide_biomarkers.csv or any
# Supabase table -- this file is the record of what's confirmed, not an executed action.
# Holding per Jason's instruction until told to start on Phase 1 execution.
