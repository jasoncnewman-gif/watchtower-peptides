# Vendor Profile: Certified Pep
**Slug:** certified-pep  
**Last validated:** 2026-06-09  
**Verification Confidence:** MEDIUM  
**Current LV Tier:** T3 — Vanguard COAs confirmed, ISO 17025 verified, batch-specific, chromatograms authentic

---

## COA Acquisition Log
**2026-06-09:**
- certified-pep.com/lab-testing/ — accessible without login; Vanguard explicitly named on page with address, ISO 17025 description, A2LA reference
- certified-pep.com/coas/ — accessible, shows 80+ products in grid; COA images in `data-view` attributes (PNG), accessible without authentication despite login modal overlay
- Login attempt blocked: `/research-access/` is Cloudflare Turnstile-protected (unsolvable by automation)
- Direct download of COA images via `data-view` URLs succeeded
- BPC-157 10mg COA: `wp-content/uploads/2024/12/BPC-157-10MG-4-28-26-COA.png` — RETRIEVED
- BPC-157 10mg Contaminant: `wp-content/uploads/2024/12/BPC-157-10MG-4-28-26-CONTAM.png` — RETRIEVED
- GLP1-S (Semaglutide) 10mg COA: `wp-content/uploads/2026/03/GLP1-S-10MG-3-27-26-COA.png` — RETRIEVED
- Full image URL list: 150+ COA/Contaminant images saved to coa-image-urls.json

**Acquisition result:** SUCCESS — multiple COA documents retrieved and analyzed

---

## COA Authenticity Assessment — BPC-157 10mg (Lot 260401MO203, Dated 4/28/2026)

### Section A: Document Authenticity
| Item | Status | Notes |
|------|--------|-------|
| Lab's own letterhead | PASS | Vanguard Laboratory — not Certified Peptides branding |
| Lab name, address, phone | PASS | 2635 Parkmont Ln, Olympia WA 98502; 360-967-7010 — matches registry |
| Unique report number | PASS | Laboratory ID: V260409-20 006 |
| Analyst name + signature | PASS | Dustin Newman (Laboratory Director) + Tori Johnson (Operations Manager) — dual signature |
| Issue date | PASS | 4/28/2026 |
| Page count | PASS | Page 1 of 2 |
| Document format | PASS | PNG image of professional COA layout |

### Section B: Lab Verification
| Item | Status | Notes |
|------|--------|-------|
| Lab in registry | PASS | Vanguard Laboratory — VERIFIED in lab_registry.md |
| Physical address match | PASS | 2635 Parkmont Ln, Olympia WA — confirmed match |
| ISO 17025 accreditation | PASS | ISO 17025:2017 logo on document |
| A2LA certificate | PASS | "Please consult A2LA Certificate #6377.01.01" — cited in footer |
| Website referenced | PASS | vanguardlaboratory.com / testing@vanguardlaboratory.com |

### Section C: Sample Traceability
| Item | Status | Notes |
|------|--------|-------|
| Lot number | PASS | 260401MO203 — batch-specific |
| Date plausible | PASS | 4/28/2026 — recent and plausible |
| Product match | PASS | BPC-157 10mg |

### Section D: Analytical Data Quality
| Item | Status | Notes |
|------|--------|-------|
| Chromatogram present | PASS | Full HPLC-UV/VIS trace shown |
| Realistic baseline | PASS | Baseline shows noise, not perfectly flat |
| Instrument file path | PASS — STRONG | Header: "DAD1 A, Sig=214,4 Ref=off (4_9_26\4_1...6 2026-04-10 16-39-52\054-50-V260409-20 06 BPC-157 Certified P.D)" — actual Agilent ChemStation data file path; nearly impossible to fabricate convincingly |
| Purity result | PASS | >99.80% + 0.18% (main peak + named impurity) — realistic notation |
| Net content measured | PASS | Assay: 12.13 mg (for 10mg labeled — 21% overfill; high but not impossible) |
| Method specified | PASS | HPLC-UV/VIS |
| Mass spec (identity) | NOT PRESENT | Identity not confirmed on this document — purity only |

### Section E: Safety Testing (Contaminant Report, same lot)
| Item | Status | Notes |
|------|--------|-------|
| Heavy metals — ICP-MS | PASS | Cr, As, Cd, Pb, Hg — all ND with stated LOQ values |
| Endotoxin — LAL | PASS | Pass <5.00 EU/mg (USP/FDA threshold: 5 EU/kg for 70kg adult = 350 EU total — properly contextualized) |
| Sterility — USP <71> | PASS | Pass — No Growth Detected |
| Run IDs | PASS | 260413, 260416 — separate run IDs for metals vs endotoxin |

---

## COA Authenticity Assessment — Semaglutide (GLP1-S) 10mg (Lot SEM1025, Batch 250908SEMA10, Dated 12/19/2025)

| Item | Status | Notes |
|------|--------|-------|
| Vanguard letterhead | PASS | Same lab, same address, same signatories |
| ISO 17025 logo | PASS | Present |
| Chromatogram | PASS — STRONG | Shows surrogate standard peak (3.405 min) + main semaglutide peak (10.868 min) + minor impurity (6.774 min) — three peaks consistent with genuine semaglutide HPLC analysis; surrogate standard use is a real analytical practice, very hard to fabricate |
| Instrument file path | PASS | "DAD1 A, Sig=214.4 Ref=off (11_24_25\1...5 2025-11-26...V251125-1 018 Semaglutide Certifi.D)" — authentic Agilent trace |
| Purity | PASS | 99.26% — realistic for semaglutide (29-aa GLP-1 agonist) |
| Assay | PASS | 11.37 mg for 10mg labeled |
| Batch encoding | PASS | 250908SEMA10 — encodes Sept 2025 manufacture date |

---

## Lab Verification
**Lab:** Vanguard Laboratory (Olympic Analytical LLC)  
**Verification status:** VERIFIED — see lab_registry.md  
**Address on document:** 2635 Parkmont Ln, Olympia WA 98502 — confirmed match  
**A2LA cert:** #6377.01.01 (per document footer); registry shows #6377.01 — consistent (.01 is scope sub-document)  
**Verdict:** VERIFIED LEGITIMATE ISO 17025 ACCREDITED LAB

---

## Red Flags
| Flag | Severity | Disposition |
|------|----------|-------------|
| COAs are PNG images, not PDFs | LOW | PNG can be manipulated, but the Agilent file path in chromatogram headers is an internal data trace not typically present in fabricated documents. Low concern given the instrument data authenticity. |
| 21% overfill on BPC-157 (12.13mg for 10mg labeled) | LOW | Vendors intentionally overfill to ensure labeled content after reconstitution losses. Not a fraud indicator. |
| No LC-MS identity confirmation on purity COA | MEDIUM | Identity field blank on purity documents. Separate identity test may exist but not retrieved. Purity method (HPLC) confirms purity only, not identity. |
| Trustpilot removal (early 2026) | HIGH (TR only) | Code of Ethics violation — does not affect LV scoring but significant TR penalty. Investigate separately. See non-COA flags below. |

## Non-COA Red Flags (Transparency Score)
| Flag | Severity | Notes |
|------|----------|-------|
| Trustpilot removed their profile | HIGH | Early 2026, cited "Code of Ethics" — rare action by Trustpilot; suggests systemic review manipulation or other compliance breach |
| Customer complaints of ineffectiveness | MEDIUM | Multiple reviews report no effect after 8+ weeks. Could indicate sub-potent products despite clean COAs. COA tests submitted samples — not samples from customer orders. |
| No vendor physical address found | MEDIUM | Despite extensive search, no street address for the company itself (as distinct from Vanguard lab address) |

---

## Current Scoring Implication
- **LV Tier: T3** (25 pts) — Vanguard ISO 17025 confirmed, batch-specific lot numbers, authentic chromatograms with Agilent instrument data, full safety panel
- **TR score: significant penalty warranted** — Trustpilot removal, no vendor address
- Previous tier was T2 pending — upgraded to T3 on COA evidence

**Cannot reach T4 without:** Independent (Finnrick-style) chain-of-custody testing — current COAs test samples submitted by the vendor, which Vanguard explicitly notes: "Vanguard Laboratory and its staff did not observe or participate in the sample selection process, and cannot confirm the authenticity of the sample or its representativeness of the associated lot/batch."

---

## Validation Triggers Pending
- [ ] Retrieve LC-MS identity confirmation COA (if it exists separately)
- [ ] Investigate Trustpilot removal — search for community explanation; update TR score if warranted
- [ ] Search Finnrick or community for any independent tests of Certified Pep products
- [ ] Cross-reference lot numbers against any community posts or other vendor COAs for batch fingerprinting
