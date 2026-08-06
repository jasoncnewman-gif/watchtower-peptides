# Lab Registry — Watchtower Peptides
## Forensic record of all labs encountered during COA validation.
## APPEND ONLY. Never delete entries. Flag contradictions explicitly.

---

## LEGEND
- **Status:** VERIFIED / UNVERIFIED / SUSPECTED_FAKE / KNOWN_FAKE
- **Accreditation:** ISO/IEC 17025 via accrediting body name + cert number
- **Vendor appearances:** which vendor COAs reference this lab (slug)
- **Batch lookup:** whether independent batch confirmation is possible

---

## Vanguard Laboratory (Olympic Analytical LLC)
**Added:** 2026-06-09  
**Status:** VERIFIED  
**Physical address:** 2635 Parkmont Ln. SW Ste. A, Olympia, WA 98502  
**Website:** [Confirmed via independent search]  
**Accreditation:** ISO/IEC 17025:2017 via A2LA, Certificate #6377.01  
**Accreditation verified at:** customer.a2la.org  
**Scope:** Peptide purity (HPLC), endotoxin (LAL), heavy metals — confirmed in scope  
**Batch lookup:** Possible via direct contact (phone/email at lab's site)  
**Vendor appearances:** certified-pep (CONFIRMED — Vanguard letterhead verified on BPC-157 + Semaglutide COAs 2026-06-09)  
**Fraud incidents:** None known  
**Notes:** Well-established peptide testing lab in the Pacific Northwest. Specializes in this compound class. Accreditation current as of 2026-06-09. Vanguard letterhead confirmed on multiple Certified Pep COAs with authentic Agilent ChemStation file paths in chromatogram headers — strong authenticity indicator.

---

## Janoshik Analytical
**Added:** 2026-06-09  
**Status:** VERIFIED (community-trusted, not formally accredited)  
**Physical address:** Czech Republic (exact address available on their site)  
**Website:** janoshik.com  
**Accreditation:** NOT ISO/IEC 17025 accredited — operates outside formal accreditation framework  
**Batch lookup:** YES — public.janoshik.com allows verification by unique report key  
**Important limitation:** Tests submitted samples only. Chain of custody is vendor-controlled — the lab tests what it receives, which may not match what is sold.  
**Vendor appearances:** None among current 6 new vendors (as of 2026-06-09); common in established vendors  
**Fraud incidents:** Known to be impersonated — if Janoshik is claimed, ALWAYS verify the report key at public.janoshik.com  
**Notes:** Community standard for peptide COAs. Lack of ISO accreditation is a limitation but publicly verifiable results partially offset this. Do not reject Janoshik COAs solely on accreditation grounds; do reject any Janoshik COA where the batch key cannot be verified.

---

## Colmaric Analyticals
**Added:** 2026-06-09  
**Status:** VERIFIED  
**Physical address:** USA  
**Website:** colmaricanalyticals.com  
**Accreditation:** ISO accredited (scope and cert number to be confirmed on next encounter)  
**Batch lookup:** Direct contact — detailed reports; $150–250/sample; 10–15 business day turnaround  
**Vendor appearances:** None among current vendors (to be updated on encounter)  
**Fraud incidents:** None known  
**Notes:** Well-regarded in the US peptide testing community. Detailed reports. Certifying body and cert number should be pulled and verified on first vendor COA encounter.

---

## ACS Lab
**Added:** 2026-06-09  
**Status:** VERIFIED  
**Physical address:** USA  
**Website:** acslabtest.com  
**Accreditation:** ISO-certified (specific cert to be confirmed)  
**Batch lookup:** Publicly accessible test submissions at their website  
**Vendor appearances:** None among current vendors (to be updated)  
**Fraud incidents:** None known  
**Notes:** Peptide specialist. Their public submission lookup is a useful cross-reference tool.

---

## MZ Biolabs
**Added:** 2026-06-09  
**Status:** UNVERIFIED (community-trusted, accreditation not yet confirmed)  
**Physical address:** USA  
**Website:** mzbiolabs.com  
**Accreditation:** Reported as accredited — not yet independently verified in registry  
**Batch lookup:** Unknown  
**Vendor appearances:** None among current vendors (to be updated)  
**Fraud incidents:** None known  
**Action required:** On first vendor COA encounter — verify accreditation against A2LA/PJLA/ANAB

---

## Freedom Diagnostics Testing (Freedom Diagnostics)
**Added:** 2026-06-09  
**Status:** VERIFIED (real lab, not ISO 17025 accredited)  
**Physical address:** 133 Holiday Ct Suite 106, Franklin, TN 37067 (confirmed via Peptide Alliance directory and search)  
**Website:** FreedomDiagnosticsTesting.com  
**Contact:** Admin@FreedomDiagnostics.net  
**Founded:** 2023  
**Accreditation:** NONE found in A2LA, PJLA, or ANAB registries. CLIA registered (#14D2263999) — note CLIA covers clinical diagnostic testing, not research peptide analysis.  
**Public batch lookup:** YES — confirmed working 2026-06-09. Full COA list at `coa-list.nameless-credit-789e.workers.dev` (JSON, 36,613+ entries). Documents at `coas.freedomdiagnosticstesting.com/{SearchCode}.pdf`. Batch `Whol2604280197` confirmed in database and COA retrieved. Website search form at `?page_id=52` is JS-driven — use direct API instead.  
**Analyst on record:** Alex Johnson, Principal Chemist (signature visible on COAs; LinkedIn confirms person by this name in pharma/biotech)  
**COA format observations:**  
- HPLC-UV + LC-MS/MS on every COA  
- Chromatogram included; baseline shows slight noise (not perfectly flat) — positive sign  
- Mass spec shows expected molecular ions with consistent m/z values  
- Net peptide content measured per vial (realistic fill variance observed)  
- Endotoxin by LAL (USP <85>) with sensitivity limits stated — proper format  
- 1-day turnaround (received→reported = 1 day) — fast, but explicitly marketed  
- No physical address on COA documents themselves — only "Proudly Owned and Operated in the USA"  
- No accreditation number on documents  
**Multi-vendor usage confirmed:** RUO Science, Oath Research, Modernaminos, AminoUSA — all independently use this lab. Not a captive vendor lab.  
**Fraud incidents:** None known  
**Assessment:** Comparable trust tier to Janoshik — real, operating, publicly verifiable via search code, used by multiple independent vendors, but not formally ISO 17025 accredited. Higher trust than an unnamed or unverifiable lab. COA documents include proper analytical data (chromatogram, mass spec, endotoxin). Absence of physical address on COA documents and no accreditation number are notable gaps.  
**Scoring implication:** T2 (named lab, independently findable, multi-vendor confirmed, but accreditation not formal)

---

## Chromate (Chromate Analytical Services)
**Added:** 2026-06-09  
**Status:** VERIFIED (real lab, not ISO 17025 accredited)  
**Physical address:** Hudson, NH 03051 (contact page; no street address disclosed)  
**Website:** chromate.org  
**Founded:** 2024 (per copyright)  
**Phone:** Offline / not published  
**Accreditation:** NOT ISO/IEC 17025 — NOT in A2LA registry. No CLIA mention. No formal accreditation claimed.  
**Verification portal:** YES — chromate.org/verify — accepts Job Number + Access Code from each COA. Tested: Job #34141 + PERFECT88HGR → confirmed "Secure DocuView Download" (real entry in database).  
**Vendor-specific access codes:** All Perfect Peptides codes begin with "PERFECT" prefix (PERFECT88HGR, PERFECT5ZF49, PERFECTH3236) — lab issues vendor-specific code series.  
**Analyst on record:** Lucas Weber, Principal Chemist  
**COA format observations:**
- RP-HPLC with UV detection for purity; kinetic chromogenic LAL for endotoxin; ICP for metals
- Identity, Quantity, Purity, Endotoxins, Metals tested per lot — comprehensive panel
- Sequential COA numbers (34141, 34142, 34149) — consistent with ongoing lab operations
- Chromatograms present but **obscured by vendor-applied "PERFECT PEPTIDES" watermark** — cannot fully assess chromatogram quality
- Lab does NOT apply the watermark — this is vendor branding added post-delivery
- No physical address on COA documents
- Services page explicitly lists research peptide testing (Semaglutide $300, Tirzepatide $300, etc.)
- Affordable pricing model, community-focused mission ("keeping manufacturers honest")
**Multi-vendor usage:** Only Perfect Peptides confirmed as of 2026-06-09. Not confirmed as captive lab; public services page accepts orders from anyone.  
**Fraud incidents:** None known  
**Assessment:** Real independent testing service. New and small (2024, no street address, phone offline). Not ISO accredited. Verification portal is functional and confirms COA authenticity. Comparable trust tier to Freedom Diagnostics — real, verifiable, but below ISO 17025 standard.  
**Scoring implication:** T2 (named lab, independently findable, portal-verified, but no formal accreditation)  
**Note:** Perfect Peptides obscures chromatograms with vendor watermark — this is the vendor's fault, not the lab's. The underlying COA data is real.

---

## Horizon Analytical
**Added:** 2026-06-09  
**Status:** VERIFIED (real lab, not ISO 17025 accredited)  
**Physical address:** Not disclosed — no physical address on website or COA documents  
**Website:** horizonanalytical.com  
**Contact:** contact@horizonanalytical.com  
**Accreditation:** NOT ISO/IEC 17025 — not in A2LA, PJLA, or ANAB registries. No formal accreditation claimed.  
**Verification portal:** YES — horizonanalytical.com/verify-coa (JS-driven; QR code on COAs links here). Portal search for lot TRL-9907743 did not execute in Puppeteer (JS rendering issue); portal exists but independent batch confirmation unconfirmed.  
**Method:** UPLC/MS (Ultra-Performance LC with mass spectrometry) — differs from standard HPLC-UV  
**Analyst on record:** Aleksey Yevtodiyenko, PhD (name on COA documents)  
**COA format observations:**
- UPLC/MS method for purity; full mass spectrum data included
- Lot numbers are TRL-prefixed (TRL-XXXXXXX) — vendor-specific series
- Sample receipt and analysis dates recorded — plausible turnaround (5–7 days)
- Selank TRL-9907743: received 05/05/26, analyzed 05/12/26, 99.22% purity, 9.8mg
- BPC-157 TRL-5561606: received 04/28/26, analyzed 05/03/26, 99.32% purity, 9.91mg
- MS data shows correct molecular ions with realistic isotope pattern
- Heavy Metals panel: listed as "Coming Soon" — not currently available
- Sterility: listed as "Coming Soon" — not currently available
- "Trusted by 300+ clients globally" (marketing claim; multi-vendor use unconfirmed)
**Multi-vendor usage:** Only True Research Labs confirmed as of 2026-06-09  
**Fraud incidents:** None known  
**Assessment:** Real operating lab with UPLC/MS capability (mass spectrometry adds identity confidence beyond UV-only). New/small — no physical address, no ISO accreditation, no street address anywhere. Verification portal exists but JS-gated; batch-level confirmation not independently completed. Trust comparable to Freedom Diagnostics and Chromate — real, non-ISO, portal-claimed but not portal-verified.  
**Scoring implication:** T3 (named lab, independently findable, batch-specific lot numbers — same formula tier as Freedom Diagnostics/Chromate; non-ISO caveat documented)  
**Note:** Absence of heavy metals and sterility panels ("Coming Soon") is a significant safety gap for research-use injectable compounds.

---

## Kovera Labs
**Added:** 2026-08-06  
**Status:** UNVERIFIED (real, high-volume lab; two distinct unresolved fraud/independence allegations)  
**Physical address:** Not disclosed on site. Third-party sources place it in Buffalo Grove, IL; the lab's own Facebook page lists Deerfield, IL instead — an unresolved location inconsistency (the two towns are adjacent Chicago suburbs, so this may be imprecision rather than deception, but it was not resolved this session).  
**Website:** koveralabs.com — domain registered 2026-01-02 (WHOIS privacy-protected via Contact Privacy Inc.), so the lab is roughly 7 months old as of this writing. Site is a JS-rendered SPA; could not pull full page content (services list, about page) via automated fetch this session — everything below comes from independent secondary sources, not the lab's own site copy.  
**Accreditation:** NOT claimed anywhere found (no ISO/IEC 17025, no A2LA, no CLIA). Could not complete a direct A2LA registry search this session (search endpoint requires an interactive form, not reachable via automated fetch) — absence is inferred from no accreditation claim existing anywhere, not from a completed registry search finding nothing, same caveat as Horizon Analytical.  
**Corporate registration:** Not confirmed. No legal entity name found. Illinois Secretary of State business search could not be completed via automated tools this session (form-based search, returned 403/timeout). One LinkedIn profile (David Cohen) surfaced associated with "Kovera Labs" but could not be independently verified (LinkedIn blocks automated fetch).  
**Verification portal:** YES, in principle — koveralabs.com/verify?code=KVR-2026-XXXXXX, each COA resolves against Kovera's own server rather than a vendor-hosted page. Portal page loads (confirmed a "Verifying certificate…" redirect state) but is JS-driven; did not have a live code on hand to complete an actual end-to-end lookup this session.  
**Independent volume analysis (via vialaudit.com, not our own data pull):** 1,816 published COAs across 146 vendor-clients as of May 2026. Median purity 99.907% (p10 99.629%, p90 99.976%). 15 explicit purity failures (0.8% of result-bearing records) and 7 identity-mismatch records across 5 vendors, all published rather than suppressed — a real trust signal, since a captive/rubber-stamp lab has no incentive to publish failures against its own paying clients.  
**Vendor appearances (our own `lab_tests` table, checked 2026-08-06):** ascension-peptides (50 rows), peptide-partners (15 rows), glacier-aminos (2 rows), ion-peptide (1 row). Per the vialaudit.com analysis, Ion Peptide's 105 Kovera records show zero flags; Glacier Aminos' 77 records include identity-mismatch flags; a separate vendor not in our pool, Instant Peptides, had 5 of 72 fail including 3 identity mismatches.  
**Fraud incidents — two distinct, unresolved, from named community sources, not independently confirmed by us:**  
  1. A peptidecritic.com community thread alleges the domain/IP registration for koveralabs.com overlaps with instantpeptides.com, a vendor Kovera tests — i.e., the "independent" lab and one of its paying clients may share ownership or operators. We could not run our own WHOIS/IP correlation to confirm or refute this.  
  2. A MESO-Rx (thinksteroids.com) forum poster using the handle "GigaCompounds" describes submitting a sample that field-tested at ~27% purity (13.59mg of a labeled 50mg) but received a passing Kovera result, and states they were blacklisted from the lab after requesting transparency information for the forum. Single-source, detailed and specific, but unverified — we have no access to the underlying sample or lab record.  
**Other concerns:** at least one independent investigator described the lab's listed address as resembling a co-working space rather than a laboratory; other community members countered that small independent labs commonly operate from compact/shared space, so this alone is not decisive.  
**Assessment:** Real, operating, high-volume — not a fabricated identity; the published-failure-rate data is a genuine positive signal. But two specific, named, unresolved allegations (a potential vendor-lab ownership conflict, and a specific claimed false-pass) are materially more serious than "not yet ISO accredited," which is the ceiling every other lab in this registry tops out at. This is why Kovera is marked UNVERIFIED rather than the VERIFIED-but-unaccredited tier used for Freedom Diagnostics/Chromate/Horizon Analytical — those labs have accreditation gaps; Kovera has open integrity questions on top of the accreditation gap.  
**Scoring implication:** Any Watchtower vendor whose LV tier currently credits a Kovera Labs COA (ascension-peptides T3/25pts as of Session 12; peptide-partners' Kovera-sourced records) should be flagged for review rather than silently left as-is — the underlying lab's own trustworthiness is now in question in a way it wasn't when those tiers were assigned. Not auto-downgraded here; this needs a human decision (see docs/action-register.md), same pattern as any other COA integrity finding.  
**Action required:** Re-check this entry after Kovera has an operating history longer than ~7 months, and if either open allegation gets independently confirmed or refuted, update Status accordingly (SUSPECTED_FAKE if the false-pass allegation is corroborated; upgrade to VERIFIED-unaccredited if both allegations are refuted and accreditation search is completed cleanly).

---

## [NEW LABS — TO BE ADDED ON ENCOUNTER]
When a new lab appears on any vendor COA, add it here before scoring the COA.
Template:
```
## [Lab Name]
**Added:** [date]  
**Status:** UNVERIFIED (pending Section 3 assessment)  
**Physical address:** [from COA, then independently confirmed or UNCONFIRMED]  
**Website:** [found independently, not from COA link]  
**Accreditation:** [claimed on COA, then verified at registry or UNVERIFIED]  
**Batch lookup:** [YES/NO/UNKNOWN]  
**Vendor appearances:** [slug list]  
**Fraud incidents:** None known / [details]  
**Notes:** [assessment trail]
```
