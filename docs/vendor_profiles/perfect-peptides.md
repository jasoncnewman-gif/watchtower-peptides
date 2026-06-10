# Vendor Profile: Perfect Peptides
**Slug:** perfect-peptides  
**Last validated:** 2026-06-09  
**Verification Confidence:** MEDIUM  
**Current LV Tier:** T3 (Chromate lab confirmed — real non-ISO lab with portal verification and batch-specific lot numbers; same category as Freedom Diagnostics/RUO Science)

---

## COA Acquisition Log
**2026-06-09:**
- Direct fetch of perfectpeptides.com/certificates-of-analysis/ → 404 (wrong path)
- Direct fetch of perfectpeptides.com/coa/ → SUCCESS after WooCommerce login
- Puppeteer stealth + real Chrome binary — login via WooCommerce `/my-account/` succeeded
- COA page contains 19 webp (product images, Jan 2026) + 14 PNG files (actual COAs, Apr 2026)
- Actual COA PNG URLs use pattern: `wp-content/uploads/2026/04/{product}-coa-scaled.png`
- Direct download of 3 COA PNGs: BPC-157 20mg, TB-500 10mg, MOTS-c 20mg — all retrieved

**Acquisition result:** SUCCESS — 3 COA documents retrieved and analyzed. Lab identified as Chromate.

---

## COA Authenticity Assessment — BPC-157 20mg (Lot PP6896266, COA #34141)

### Section A: Document Authenticity
| Item | Status | Notes |
|------|--------|-------|
| Lab's own letterhead | PASS | "Chromate \| Analytical Services" — not Perfect Peptides branding |
| Lab name | PASS | Chromate, chromate.org |
| Analyst name + signature | PASS | Lucas Weber, Principal Chemist |
| Issue date | PASS | Sample received 04/07/26, Analysis conducted 04/08/26 |
| Unique report number | PASS | COA #34141 |
| Document format | PASS | Standard COA layout; chromatogram section present |
| **CRITICAL — Vendor watermark** | **FLAG** | "PERFECT PEPTIDES" watermark diagonally across chromatogram on ALL COAs — vendor-applied post-delivery. Cannot assess chromatogram quality. This is the vendor's action, not the lab's. |

### Section B: Lab Verification
| Item | Status | Notes |
|------|--------|-------|
| Lab in registry | PASS | Chromate — VERIFIED (new entry 2026-06-09) |
| Website | PASS | chromate.org confirmed active |
| ISO 17025 accreditation | FAIL | Not accredited — NOT in A2LA registry |
| Physical address on COA | FAIL | Hudson NH on contact page but no street address on document |
| Verification portal | **PASS — STRONG** | chromate.org/verify — COA #34141 + access code PERFECT88HGR → confirmed "Job 34141 Secure DocuView Download" — database entry confirmed |

### Section C: Sample Traceability
| Item | Status | Notes |
|------|--------|-------|
| Lot number | PASS | PP6896266 — batch-specific |
| Date plausible | PASS | April 2026 — recent and plausible |
| CAS number | PASS | 137525-51-0 — correct for BPC-157 |
| Molecular formula | PASS | C62H98N16O22 — correct |

### Section D: Analytical Data Quality
| Item | Status | Notes |
|------|--------|-------|
| Chromatogram present | PASS (obstructed) | Present but obscured by vendor watermark |
| Purity result | PASS | 99.294% (spec >98%) — realistic |
| Quantity measured | CONCERN | 19.45mg vs 20mg labeled (2.75% short) — slightly underweight |
| Endotoxin | PASS | 7.65 EU/vial vs <80 EU/vial spec — Conforms |
| Metals | PASS | <5 ppb vs <50 ppb spec — ND effectively |
| Method specified | PASS | RP-HPLC UV detection + kinetic chromogenic LAL |

---

## COA Authenticity Assessment — TB-500 (Tβ4) 10mg (Lot PP2180272, COA #34142)
| Item | Status | Notes |
|------|--------|-------|
| Same Chromate letterhead | PASS | Sequential COA #34142 |
| CAS | PASS | 77591-33-4 — correct for Thymosin Beta-4 |
| Purity | PASS | 99.011% |
| Quantity | PASS | 11.15mg vs 10mg (+11.5% overfill) |
| Endotoxin | PASS | <1 EU/vial — very clean |

---

## COA Authenticity Assessment — MOTS-c 20mg (Lot PP2632867, COA #34149)
| Item | Status | Notes |
|------|--------|-------|
| Same Chromate letterhead | PASS | COA #34149 |
| CAS | PASS | 1627580-64-6 — correct for MOTS-c |
| Purity | PASS | 99.547% |
| Quantity | PASS | 20.93mg vs 20mg (+4.65%) |
| Endotoxin | PASS | <1.5 EU/vial — very clean |

---

## Lab Verification
**Lab:** Chromate (Chromate Analytical Services)  
**Verification status:** VERIFIED REAL — see lab_registry.md  
**Address on document:** Not present on COA; Hudson NH on contact page  
**Accreditation:** NOT ISO 17025 — no formal accreditation  
**Verification portal:** CONFIRMED — Job #34141 verified at chromate.org  
**Verdict:** REAL independent lab, but not ISO 17025 accredited. Trust tier: T2 (comparable to Freedom Diagnostics)

---

## Red Flags
| Flag | Severity | Description |
|------|----------|-------------|
| Vendor watermarks chromatograms | HIGH | "PERFECT PEPTIDES" diagonal watermark applied to all COA documents before publication — obscures chromatogram data; prevents quality assessment of the primary purity evidence. Vendor's practice, not lab's. |
| Chromate not ISO 17025 | MEDIUM | New lab (2024), no formal accreditation, no street address on contact page, phone offline |
| BPC-157 slightly underweight | LOW | 19.45mg vs 20mg labeled (2.75% short) — within normal variation but opposite direction from typical intentional overfill |
| Same-day analysis | LOW | Samples received 04/07, analyzed 04/08 — 1-day turnaround is fast but explicitly part of Chromate's service model |

---

## Current Scoring Implication
- **LV Tier: T3** (25 pts) — Chromate confirmed as real third-party lab (portal verified), batch-specific lot numbers on all COAs
- Formula: has_lab_disclosure=true + has_batch_numbers=true = T3 — consistent with RUO Science treatment of Freedom Diagnostics (also real, non-ISO, portal-verifiable)
- Chromate limitations (new lab, no ISO 17025, no street address, phone offline) are documented as red flags but do not override the tier formula
- **Chromatogram watermark** is a significant transparency concern captured in TR score, not LV

**Cannot reach T4 without:** Independent chain-of-custody testing (Finnrick-style)

---

## Validation Triggers Pending
- [ ] Verify whether other vendors use Chromate (cross-reference to confirm it's not captive)
- [ ] Check if Chromate CLIA registered (contact page suggests regulatory gaps)
- [ ] Download full COA list — 14 COA PNGs available; inspect 2–3 more for consistency
- [ ] Monitor for community discussion of Perfect Peptides quality/effectiveness
