# Vendor Profile: RUO Science
**Slug:** ruo-science  
**Last validated:** 2026-06-09  
**Verification Confidence:** MEDIUM  
**Current LV Tier:** T3 (LV=25, Total=68 — Freedom Diagnostics confirmed, batch-specific COAs; note: not ISO 17025)

---

## COA Acquisition Log
**2026-06-09:**
- Direct fetch of ruoscience.com/coa/ → SUCCESS — 30 products listed with purity values and batch numbers
- Individual product COA pages (ruoscience.com/lab-results/bpc-157/, /tirzepatide/) → rendered as vendor-branded display pages; actual COA is a downloadable webp image
- Direct webp URL fetched: `https://ruoscience.com/wp-content/uploads/2026/03/BPC-157_15mg_Whol2604280197.webp` → SUCCESS — full COA image readable
- Lab identified as **Freedom Diagnostics** (FreedomDiagnosticsTesting.com)

**Acquisition result:** SUCCESS — COAs exist and are verifiable

---

## COA Authenticity Assessment (Section 2A)
Evaluated on BPC-157 15mg COA (Lot BPC15-042026-7):

| Item | Status | Notes |
|------|--------|-------|
| Lab's own letterhead | PASS | Freedom Diagnostics branding, not RUO Science |
| Lab name, address, phone | SUSPICIOUS | Lab name ✓; address NOT on document ("Proudly Owned and Operated in the USA" only); phone absent |
| Unique report/accession number | PASS | Accession #2604280197; Search Code Whol2604280197 |
| Analyst name | PASS | Alex Johnson, Principal Chemist |
| Authorized signatory/signature | PASS | Signed |
| Issue date present | PASS | Received 04/28/2026, Reported 04/29/2026 |
| 1-day turnaround | SUSPICIOUS | 1-day turnaround is fast; Freedom Diagnostics markets 24-48hr service |
| Document format | PASS | Proper COA layout; chromatogram and mass spec included |
| Website COA display | FAIL | RUO Science product pages do not name the lab — only the downloaded certificate reveals Freedom Diagnostics |

**Cross-vendor fingerprint check:** Freedom Diagnostics lab confirmed used by Oath Research, Modernaminos, AminoUSA independently — not captive to RUO Science.

---

## Lab Verification (Section 2C)
- Lab: **Freedom Diagnostics Testing** — see lab_registry.md
- Physical address confirmed: 133 Holiday Ct Suite 106, Franklin, TN 37067
- Website independently found: FreedomDiagnosticsTesting.com
- Accreditation: NOT ISO 17025 — CLIA registered only (#14D2263999)
- Public batch lookup: AVAILABLE at FreedomDiagnosticsTesting.com via Search Code
- Batch `Whol2604280197` → search code `Whol2604280197` (unverified — lookup portal was 403)
- **Lab verdict: UNVERIFIED (real but not ISO 17025)**

---

## Result Plausibility Assessment (Section 2D)
Purity values across 30 products (2026-06-09 scrape):

| Product | Purity | Batch |
|---------|--------|-------|
| BPC-157 | 99.12% | BPC15-042026-7 |
| Tirzepatide | 99.744% | GT100-042026-1 |
| Semaglutide | 99.913% | GS05-032026-1 |
| NAD+ | 99.984% | NADF50012122025-12 |
| CJC-1295 | 99.85% | CJND 10-032026-1 |
| CJC-1295/Ipamorelin | 99.95% | IPCJ10-042026-94 |
| L-carnitine | 99.789% | LCARN500-02122026-J |
| TB-500 | 99.817% | TB1012222025-J |
| Sermorelin | 99.81% | SERM10-042026-4 |
| Retatrutide | 99.555% | GR12-02022026-J |
| (20 additional products — all in range 99.1–99.984%) | | |

**Anomaly flags:**
1. **Suspiciously consistent high range** — All 30 results fall in the 99.1–99.984% range. While Freedom Diagnostics COAs for other vendors (Oath Research: 99.863%) also trend high, this uniformity warrants flagging.
2. **NAD+ at 99.984%** — Extremely high; NAD+ is not a peptide and this result is near the top of what any legitimate HPLC method produces.
3. **"Selank: batch N/A"** — One product has no batch number. All others have batch IDs.
4. **Method confirmation:** BPC-157 COA confirms HPLC-UV + LC-MS, chromatogram and mass spec present — consistent with legitimate testing methodology.

**Positive indicators:**
- Variance exists across products (99.12% to 99.984%) — not identically cloned results
- Two-vial testing on BPC-157 (Vial 1: 98.98%, Vial 2: 99.26%) — suggests actual per-batch testing
- Net peptide content measured (17.52mg, 17.56mg for 15mg labeled BPC-157) — realistic overfill

---

## Safety Testing
- Endotoxin: PRESENT — LAL assay (USP <85>), sensitivity ≤0.05 EU/mL, two replicates both "Pass"
- Heavy metals: NOT FOUND on inspected COA
- Residual solvents: NOT FOUND
- Sterility: NOT FOUND

---

## Red Flags Summary
| Flag | Severity | Description |
|------|----------|-------------|
| Lab not disclosed on vendor website | HIGH | Product pages show no lab name; only downloadable certificate reveals Freedom Diagnostics |
| COAs are webp images | MEDIUM | Not PDFs; images are more easily manipulated than signed PDFs |
| AI-generated images on QA section | MEDIUM | Filenames `ChatGPT_Image_Mar_22__2026__11_43_39_PM-removebg-preview.png` found in site assets — suggests AI-generated imagery used for quality assurance visuals |
| No physical address on COA document | MEDIUM | Lab has a real address but doesn't include it on the document |
| No accreditation number | MEDIUM | Lab is not ISO 17025 accredited |
| All purity 99.1%+ | LOW-MEDIUM | Plausible but uniformly high; variance exists so not identical cloning |
| Selank: no batch number | LOW | One product missing batch ID |

---

## Vendor Claim Verification
- Claim: "Third-party verified peptide purity certificate" — **PARTIALLY VERIFIED**: a real third-party lab (Freedom Diagnostics) does test these products. However "third-party" on the display page is technically accurate only when the download is opened.

---

## Current Scoring Implication
- **LV Tier:** T3 (25 pts) — named third-party lab (Freedom Diagnostics) + batch-specific COA lot numbers both confirmed
- Formula-driven result: `has_lab_disclosure=true` + `has_batch_numbers=true` (was already set) = T3
- **Caveat:** Freedom Diagnostics is NOT ISO 17025 accredited (CLIA only). T3 reflects formula output, not ISO-equivalent verification. This limitation is captured in the red flags table and lab_registry.md.
- Prior assignment was T1, raised to T3 on confirmed real non-captive lab + existing batch number data

---

## Validation Triggers Pending
- [ ] Verify batch Whol2604280197 at FreedomDiagnosticsTesting.com
- [ ] Check variance pattern across more Freedom Diagnostics vendor COAs (detect suspicious uniformity)
- [ ] Monitor for Reddit community discussion of RUO Science product effectiveness
