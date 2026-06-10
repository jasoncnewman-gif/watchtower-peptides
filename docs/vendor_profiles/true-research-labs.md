# Vendor Profile: True Research Labs
**Slug:** true-research-labs  
**Last validated:** 2026-06-09  
**Verification Confidence:** MEDIUM  
**Current LV Tier:** T3 (Horizon Analytical confirmed — real non-ISO lab with batch-specific lot numbers; same tier as Freedom Diagnostics / RUO Science)

---

## COA Acquisition Log
**2026-06-09:**
- Direct fetch of trueresearchlabs.com/coa/ → SUCCESS (partial) — product list visible
- COA page uses `rcl-coa-manager` WordPress plugin — COA data embedded in `data-coa-list` JSON attributes in initial page HTML (not loaded via AJAX)
- PDF URLs extracted from plugin data-attributes — format: `wp-content/uploads/.../{product}-purity.pdf`
- Two COA PDFs downloaded:
  - `/tmp/trl-selank-purity.pdf` — Selank, lot TRL-9907743
  - `/tmp/trl-bpc157-purity.pdf` — BPC-157, lot TRL-5561606
- Lab identified as **Horizon Analytical** (horizonanalytical.com)

**Acquisition result:** SUCCESS — 2 COA documents retrieved and analyzed. Lab confirmed as Horizon Analytical.

---

## COA Authenticity Assessment — Selank (Lot TRL-9907743)

### Section A: Document Authenticity
| Item | Status | Notes |
|------|--------|-------|
| Lab's own letterhead | PASS | "Horizon Analytical" — not True Research Labs branding |
| Lab name | PASS | Horizon Analytical, horizonanalytical.com |
| Analyst name | PASS | Aleksey Yevtodiyenko, PhD |
| Issue date | PASS | Sample received 05/05/26, analyzed 05/12/26 |
| Unique report/lot number | PASS | TRL-9907743 — vendor-specific lot series |
| Document format | PASS | Standard COA layout; mass spec data included |

### Section B: Lab Verification
| Item | Status | Notes |
|------|--------|-------|
| Lab independently findable | PASS | horizonanalytical.com confirmed; contact@horizonanalytical.com |
| ISO 17025 accreditation | FAIL | Not accredited — not in A2LA/PJLA/ANAB registries |
| Physical address | FAIL | No physical address anywhere on website or COA |
| Verification portal | PARTIAL | /verify-coa exists (JS-driven QR code destination); batch-level confirmation not completed (Puppeteer JS timing failure) |

### Section C: Sample Traceability
| Item | Status | Notes |
|------|--------|-------|
| Lot number | PASS | TRL-9907743 — batch-specific |
| Date of testing | PASS | Received 05/05/26 → analyzed 05/12/26 (7-day turnaround) |
| Sample description | PASS | Selank — correct peptide identity |

### Section D: Analytical Data Quality
| Item | Status | Notes |
|------|--------|-------|
| Method | PASS | UPLC/MS (Ultra-Performance LC + mass spectrometry) |
| Purity result | PASS | 99.22% — realistic |
| Quantity | PASS | 9.8mg — slight underfill vs 10mg label (2%) |
| Mass spectrum identity | PASS | Correct molecular ions with realistic isotope pattern |
| Endotoxin | UNKNOWN | Not present on this COA |
| Heavy metals | FAIL | "Coming Soon" — not yet available |
| Sterility | FAIL | "Coming Soon" — not yet available |

---

## COA Authenticity Assessment — BPC-157 (Lot TRL-5561606)
| Item | Status | Notes |
|------|--------|-------|
| Same Horizon Analytical letterhead | PASS | Consistent with Selank COA |
| Lot number | PASS | TRL-5561606 — batch-specific |
| Received/analyzed | PASS | 04/28/26 → 05/03/26 (5-day turnaround) |
| Purity | PASS | 99.32% — realistic |
| Quantity | PASS | 9.91mg vs 10mg labeled (0.9% short) |
| MS identity | PASS | Correct molecular ions |

---

## Lab Verification
**Lab:** Horizon Analytical (horizonanalytical.com)  
**Verification status:** VERIFIED REAL — see lab_registry.md  
**Address on document/site:** Not present — no physical address anywhere  
**Accreditation:** NOT ISO 17025 — no formal accreditation  
**Verification portal:** /verify-coa (JS-driven); batch confirmation not independently completed  
**Verdict:** REAL independent lab with genuine UPLC/MS capability. Not ISO 17025. Comparable trust to Freedom Diagnostics / Chromate.

---

## Red Flags
| Flag | Severity | Description |
|------|----------|-------------|
| No physical address | MEDIUM | Horizon Analytical lists no physical location on website or COAs — unusually opaque |
| Heavy metals "Coming Soon" | HIGH | Safety panel not available — significant gap for injectable research compounds |
| Sterility "Coming Soon" | HIGH | No sterility testing available — same concern |
| Verification portal unconfirmed | LOW | Portal exists but batch-level lookup not completed (JS rendering blocker) |
| New lab, single vendor | LOW | Only TRL confirmed using Horizon Analytical as of 2026-06-09 |

---

## Current Scoring Implication
- **LV Tier: T3** (25 pts) — Horizon Analytical confirmed as real third-party lab (independently findable), batch-specific lot numbers on all COAs
- Formula: has_lab_disclosure=true + has_batch_numbers=true = T3 — consistent with RUO Science/Freedom Diagnostics/Perfect Peptides/Chromate treatment
- Horizon Analytical limitations (no ISO, no physical address, no heavy metals/sterility panel) are documented as red flags but do not override the tier formula
- **Cannot reach T4** without independent chain-of-custody testing

---

## Validation Triggers Pending
- [ ] Manually verify lot TRL-9907743 at horizonanalytical.com/verify-coa (requires browser with JS)
- [ ] Download remaining COA PDFs to confirm consistent Horizon Analytical letterhead across products
- [ ] Monitor for heavy metals / sterility panel availability ("Coming Soon")
- [ ] Confirm whether other vendors use Horizon Analytical (multi-vendor = stronger trust signal)
