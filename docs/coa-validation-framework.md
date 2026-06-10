# COA Validation Framework
## Watchtower Peptides — Internal Research Standard

---

## Part 1: What a Fake COA Looks Like

Understanding fraud is prerequisite to spotting it. These are the documented fraud patterns in the peptide space.

### Pattern 1: Vendor-Branded "Purity Reports"
The vendor creates a PDF on their own letterhead with purity numbers they chose. There is no third party involved. The vendor is grading their own homework.
- **Tell:** The lab section says the vendor's own company name, not an external lab
- **Example:** "Licensed Peptides Report" — this is not a COA. It is a self-issued document.
- **Risk level:** High — this is the most common form of COA fraud

### Pattern 2: Fabricated Chromatograms
A real HPLC trace has baseline noise — small irregular fluctuations from the detector, mobile phase mixing, and column temperature variation. Fabricated ones don't.
- **Tell:** Perfectly flat baseline with zero noise. Smooth, suspiciously clean peak shapes. Looks like clip art.
- **Tell:** The purity number is present but no chromatogram image is included at all
- **Risk level:** High — indicates no instrument was ever used

### Pattern 3: Templated/Cloned COAs
The same COA layout, font, graphs, and numbers appear across multiple products or multiple batches. Different peptides, different lots — identical results.
- **Tell:** Every product shows exactly 99.1% or 99.9%
- **Tell:** Minor impurities are always "not detected" — real analyses find something
- **Tell:** Same formatting, same signatures, different product names
- **Risk level:** High — real testing produces variation; identical results means no testing

### Pattern 4: Stolen Lab Identity
A vendor photoshops a legitimate lab's logo and formatting onto a document they created. The report number doesn't exist in the lab's system.
- **Tell:** Report number cannot be verified by contacting the lab directly
- **Tell:** Lab address or phone number on the document doesn't match the real lab's contact info
- **Risk level:** High — requires independent verification to catch

### Pattern 5: Unverifiable/Fake Lab
A vendor creates or uses a fictitious lab with a website but no real accreditation, no physical presence, and no independent verification path.
- **Tell:** Lab website is thin — no staff, no physical address, no accreditation certificate, no scope document
- **Tell:** Accreditation number not in A2LA, PJLA, ANAB, or UKAS registry
- **Tell:** Lab was incorporated recently and only serves this vendor's products
- **Risk level:** Critical — the entire testing claim is fabricated

### Pattern 6: Endotoxin "Zero" Claims
Endotoxin results of exactly 0.00 EU/mg or "undetectable" are suspicious. Real LAL tests have detection limits and report those limits.
- **Tell:** Endotoxin = 0. Real reports say "<0.05 EU/mg" or similar, reflecting the detection limit
- **Tell:** No units given (should be EU/mg for injectables)
- **Risk level:** Medium

### Pattern 7: Purity Overstatement
Independent verification studies find that 15–20% of vendor COAs significantly overstate purity. Claimed 99%, actual 88–94%.
- **Tell:** Claimed purity cannot be cross-referenced against any independent source (Finnrick, Janoshik public records, community testing)
- **Risk level:** Medium-High

---

## Part 2: What a Legitimate COA Looks Like

A genuine third-party COA from an ISO 17025-accredited laboratory has these characteristics:

### Document Header
- Lab's own name, logo, physical address, phone number — NOT the vendor's branding
- Unique report/certificate number (traceable in lab's own records)
- Accreditation body logo (A2LA, PJLA, ANAB, UKAS) with certificate number
- Date issued, analyst name, authorized signatory signature

### Sample Identification
- Client name (the vendor who submitted the sample)
- Sample description matching the product
- Batch/lot number specific to the tested batch
- Date sample received by lab
- Date testing performed

### Analytical Results
- Specific method reference (e.g., HPLC-UV SOP-012, USP <621>)
- HPLC chromatogram image — the actual graph output, showing baseline noise
- Purity percentage with specification limits (e.g., ≥98.0%)
- Identity confirmation via mass spectrometry (molecular weight match)
- Minor impurities listed individually at ≥0.10% threshold
- Column type, mobile phase, gradient used

### Safety Panel (for injectable research compounds)
- Endotoxin: LAL test result in EU/mg with detection limit stated
- Heavy metals: individual results for Pb, Cd, Hg, As in ppm with limits
- Residual solvents: TFA, acetonitrile, DMF levels
- Microbial: Total aerobic count, yeast and mold
- Sterility: USP <71> (if claimed sterile)

---

## Part 3: COA Validation Checklist

Use this checklist for every vendor COA reviewed. Score each item. Document findings.

### Section A: Document Authenticity (pass/fail)
```
[ ] Lab's own letterhead — NOT vendor branding
[ ] Lab name, physical address, phone on document
[ ] Unique report number present
[ ] Analyst name present
[ ] Authorized signatory / QA signature present
[ ] Issue date present
[ ] Page count indicated (e.g., "Page 1 of 3")
[ ] Document is a proper PDF (not a screenshot, not a JPEG)
```

### Section B: Lab Verification (pass/fail — see Part 4)
```
[ ] Lab name independently searchable (not just from vendor's website)
[ ] Lab has verifiable physical address that matches document
[ ] Lab website has real contact info found independently
[ ] Accreditation number present on document
[ ] Accreditation number verified in accrediting body's public registry
[ ] Accreditation scope covers the specific tests performed
[ ] For Janoshik: report key verified at public.janoshik.com
[ ] For other labs: direct contact confirmation possible
```

### Section C: Sample Traceability (pass/fail)
```
[ ] Batch/lot number on COA
[ ] Batch number matches product label / vendor's stated batch
[ ] Date of testing is plausible (after manufacture, before sale)
[ ] Sample description matches the product being sold
```

### Section D: Analytical Data Quality (scored)
```
[ ] HPLC chromatogram image included
[ ] Chromatogram shows realistic baseline noise (not perfectly flat)
[ ] Mass spec identity confirmation included
[ ] Purity result is a realistic value (≥95% expected; 99.9%+ requires scrutiny)
[ ] Minor impurities detected and listed (absence of all impurities is suspicious)
[ ] Specific analytical method referenced (not just "HPLC")
[ ] Mobile phase / column details present
```

### Section E: Safety Testing (scored)
```
[ ] Endotoxin test included (result in EU/mg, not "0" or "undetectable")
[ ] Heavy metals panel (Pb, Cd, Hg, As individually stated)
[ ] Residual solvents panel
[ ] Microbial enumeration
[ ] Sterility (if applicable)
```

### Section F: Red Flags (each is a deduction or disqualifier)
```
[ ] Vendor's own branding on COA → DISQUALIFY as third-party
[ ] No lab name anywhere on document → DISQUALIFY
[ ] Purity 99.9%+ with no impurities detected → HIGH SUSPICION
[ ] Identical results across multiple unrelated peptides → HIGH SUSPICION
[ ] No chromatogram image → SIGNIFICANT DEDUCTION
[ ] Perfectly flat chromatogram baseline → HIGH SUSPICION
[ ] Endotoxin = exactly 0 with no units → FLAG
[ ] No batch number → SIGNIFICANT DEDUCTION
[ ] Report number not verifiable with lab → FLAG
[ ] Lab not findable independently → DISQUALIFY lab claim
```

---

## Part 4: Lab Verification Protocol

### Step 1: Independent Discovery
Do not use the website link on the COA or vendor's website. Search for the lab independently:
- Search: `"[Lab Name]" laboratory accredited`
- Search: `"[Lab Name]" [city] analytical testing`
- Check A2LA directory: customer.a2la.org (search by lab name or certificate number)

### Step 2: Accreditation Verification
Check the lab against these registries. Accreditation number must be present on the COA and must match:
- **A2LA:** customer.a2la.org — search by lab name or certificate number
- **PJLA:** pjlabs.com/accredited-labs
- **ANAB:** anab.org
- **UKAS (UK):** ukas.com/find-an-accredited-organisation
- **ILAC MRA members (international):** ilac.org/ilac-mra-and-signatories

### Step 3: Scope Confirmation
Accreditation must cover the *specific tests* on the COA — HPLC purity, endotoxin, heavy metals, etc. A lab accredited for water testing cannot produce a valid peptide purity COA under that accreditation.

### Step 4: Direct Verification
For high-stakes assessments, contact the lab using independently found contact info and provide the report number. Ask them to confirm it exists in their system.

### Step 5: Janoshik-Specific
Navigate to **public.janoshik.com**, enter the unique verification key on the COA. If no key is present, the Janoshik COA is unverifiable. Note: Janoshik is NOT ISO 17025 accredited but is community-recognized and publicly verifiable.

---

## Part 5: Known Labs — Verified Status

| Lab | Location | Accreditation | Verification Method | Notes |
|-----|----------|---------------|---------------------|-------|
| Janoshik Analytical | Czech Republic | None (ISO 17025 not held) | public.janoshik.com — unique key per report | Community standard; not formally accredited; chain of custody = submitted sample only |
| Vanguard Laboratory (Olympic Analytical LLC) | Olympia, WA | ISO/IEC 17025 via A2LA, cert #6377.01 | customer.a2la.org | Specializes in peptides; accredited for purity, endotoxin, heavy metals |
| Freedom Diagnostics | Franklin, TN | None (CLIA #14D2263999 only) | FreedomDiagnosticsTesting.com search by lot code | HPLC-UV + LC-MS/MS; multi-vendor confirmed; not ISO 17025 |
| Chromate (Chromate Analytical Services) | Hudson, NH | None | chromate.org/verify — Job# + Access Code | New lab (2024); portal-verified; T3 tier; no physical address; no ISO |
| Horizon Analytical | Unknown | None | horizonanalytical.com/verify-coa (JS-driven) | UPLC/MS; no physical address; no ISO; heavy metals/sterility "Coming Soon" |
| Colmaric Analyticals | USA | ISO accredited | Direct contact | Detailed reports; $150–250/sample; 10–15 business days |
| ACS Lab | USA | ISO-certified | acslabtest.com | Peptide specialist; publicly available test submissions |
| MZ Biolabs | USA | Accredited | mzbiolabs.com | Community-trusted |

**Rule:** Any lab not on this list must be verified through Steps 1–4 above before being credited.

---

## Part 6: COA Trust Tiers (Scoring Implications)

This maps directly to the LV (Lab Verification) scoring tiers:

| Tier | Description | Points | Criteria |
|------|-------------|--------|----------|
| T0 | No COA | 0 | No testing documentation exists |
| T1 | Vendor-issued document | 5 | COA exists but is vendor-branded, or lab is unnamed, or lab is unverifiable |
| T2 | Named lab, unverified | 15 | Lab name on document, lab is findable, but accreditation not confirmed or scope not confirmed |
| T3 | Verified third-party, batch-specific | 25 | Lab verified in accreditation registry, batch number present, chromatogram present |
| T4 | Finnrick / independently verified | up to 40 | Chain-of-custody independent testing (Finnrick), or multiple T3 COAs across product line |

**Current vendor implications:**
- Licensed Peptides "purity reports": T1 (vendor-branded — not third-party)
- RUO Science COAs: T1 (unnamed lab)
- Certified Pep (Vanguard claimed): T2 pending — need to see actual COA with Vanguard letterhead
- Perfect Peptides: T1 (COA links exist, no lab named)
- True Research Labs: T1 (COA page exists, no lab named)

---

## Part 7: Vendor Claim Red Flags

These marketing phrases require verification, never credit:

| Phrase | Status | Action Required |
|--------|--------|-----------------|
| "Third-party tested" | Unverified claim | Find and read an actual COA |
| "ISO-certified lab" | Unverified claim | Get accreditation number, check registry |
| "Rigorous testing" | Marketing copy | Meaningless without documentation |
| "99%+ purity guaranteed" | Unverified claim | Cross-reference with COA or Finnrick |
| "Independent laboratory" | Unverified claim | Verify lab is not vendor-owned or affiliated |
| "COA available upon request" | Lower confidence | COAs should be public, not gated |

---

---

## Part 8: Discrepancies Between Original Spec and Current Implementation

The original Section 6 guidelines contained instructions that are NOT currently active. Do not follow them as written.

### Discrepancy 1: Flags do not block score publication
**Spec said:** If a vendor has an OPEN flag in `verification_flags`, compute-scores.ts should skip writing the score for that vendor.
**Reality:** No such gate exists. Scores are always written regardless of flag status. This is deferred (action register F2). Do not assume a flag will hold a score back.

### Discrepancy 2: Flags do not trigger email notifications
**Spec said:** An INSERT into `verification_flags` with status=OPEN triggers an email to jason.c.newman@gmail.com.
**Reality:** No webhook or trigger is wired. The table exists (migration_010.sql applied), but inserts are silent. This is deferred (action register F1).

### Discrepancy 3: Flags are manual-review indicators only
**What they actually are:** A DB record visible only via direct query. No automated consequence. Useful when a finding needs to persist across sessions and doesn't fit in a vendor profile or the score already surfaces the concern.

### When to log a flag vs not
**Log a flag when:** The vendor's score does NOT surface the concern — e.g., a high-scoring vendor where a specific COA is suspected fake, or a finding that needs to be tracked over time regardless of score.

**Do not log a flag when:** The score already reflects the problem. A low total score (e.g., 38) signals the issue to the reviewer. A redundant flag adds no value until F1/F2 are wired.

**Example:** Perfect Peptides watermarks their chromatograms. Real red flag. Score is 38 — already low. No flag needed. If a vendor scoring 85 did the same thing, log the flag because the score wouldn't surface it.

*Last updated: 2026-06-09*
*Apply this framework to every vendor COA review. Update the Known Labs table as new labs are verified or invalidated.*
