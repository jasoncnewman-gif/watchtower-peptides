# Action Register — Watchtower Peptides
## Living document. Work items added each session, closed when done.
## Format: [Priority] Item — Owner — Status

---

## OPEN — High Priority

**[H2] Retrieve Certified Pep COA documents via Puppeteer scraper** — DONE 2026-06-09  
Vanguard claim VERIFIED. T3 COAs confirmed (ISO 17025, A2LA #6377.01.01, authentic Agilent chromatograms).  
Script: scripts/fetch-coa-forensics.ts. Full findings in docs/vendor_profiles/certified-pep.md.  
Trustpilot removal still open — moved to M5.

**[H3] Retrieve Perfect Peptides COA documents via Puppeteer scraper** — DONE 2026-06-09  
Lab confirmed as **Chromate** (chromate.org), Hudson NH, founded 2024, NOT ISO 17025.  
COA portal verified: Job #34141 + code PERFECT88HGR → confirmed in Chromate database.  
BPC-157 99.294%, TB-500 99.011%, MOTS-c 99.547% — realistic with variance.  
Key red flag: vendor watermarks chromatograms with "PERFECT PEPTIDES" — obscures analytical data.  
Score: T1 → T3, LV=25, Total=38. Full findings in docs/vendor_profiles/perfect-peptides.md.

---

## OPEN — Medium Priority

**[M1] Verify Freedom Diagnostics batch via public lookup** — DONE 2026-06-09  
Batch `Whol2604280197` CONFIRMED in Freedom Diagnostics database (36,613 total COAs).  
COA PDF retrieved from `coas.freedomdiagnosticstesting.com/Whol2604280197.pdf`.  
- Product: BPC-157 15mg, Lot BPC15-042026-7, Client: Wholesale  
- Purity: 99.12% HPLC-UV (2 vials: 98.98% / 99.26%), Net content 17.52mg / 17.56mg (+17% overfill)  
- Chromatogram: present, realistic baseline noise  
- MS confirmation: correct ESI+ ions for BPC-157 ([M+2H]+2 = 710.96, [M+H]+ = ~1420)  
- Endotoxin: both replicates Pass (LAL, USP <85>)  
- Signed: Alex Johnson, Principal Chemist  
Note: API endpoint is `coa-list.nameless-credit-789e.workers.dev` (full list), documents at `coas.freedomdiagnosticstesting.com/{code}.pdf`.

**[M2] Find True Research Labs COA document URLs** — DONE 2026-06-09  
Lab confirmed as **Horizon Analytical** (horizonanalytical.com, Aleksey Yevtodiyenko PhD, UPLC/MS).  
COA PDFs extracted via `rcl-coa-manager` data-attributes in page HTML.  
Selank TRL-9907743 (99.22%) + BPC-157 TRL-5561606 (99.32%) — realistic UPLC/MS data.  
DB updated: has_lab_disclosure=true, has_batch_numbers=true → T3, LV=25, Total=46.  
Horizon Analytical added to lab_registry.md. true-research-labs.md fully updated.  
Notable gaps: no physical address, no heavy metals/sterility panel ("Coming Soon").

**[M3] Find Licensed Peptides COA page URL** — DONE 2026-06-09  
COA page confirmed at licensedpeptides.com/purity-reports/.  
PDF filenames: `Licensed-Peptides-Report-XXX.pdf` — vendor-branded, T1 confirmed.  
No external lab referenced anywhere on site. licensed-peptides.md updated.

**[M4] Apply LV tier corrections to scoring** — DONE 2026-06-09  
- Certified Pep: T2 → T3 (has_lab_disclosure + has_batch_numbers → true; LV=25, Total=43)
- RUO Science: T1 → T3 (has_lab_disclosure → true; has_batch_numbers was already true; LV=25, Total=68)
  - Note: Freedom Diagnostics is CLIA-registered but NOT ISO 17025 — T3 is formula result; non-ISO caveat in vendor profile
- Licensed Peptides: T1 confirmed, no DB change (vendor-branded reports)
- Perfect Peptides, True Research Labs: T1 confirmed pending H3 COA review
Scores rerun and written to Supabase.

**[M5] Investigate Certified Pep Trustpilot removal** — DONE 2026-06-09  
Removal confirmed: Trustpilot cited "Code of Ethics" — classified peptide vendors as "unregulated drugs/medications" = bad fit for platform.  
NOT due to: review manipulation, fraud, or customer harm.  
Industry-wide platform policy, not vendor-specific misconduct.  
**No transparency penalty warranted.** Certified-Pep now maintains customer reviews at certifiedpep-reviews.com.  
Certified-pep.md does not require score adjustment for this finding.

---

## OPEN — COA Integrity Audit

**[COA-0] Apply migration_011.sql** — DONE 2026-06-10  
Adds 4 tracking columns to vendors: coa_audit_status, coa_audit_tier, coa_audit_notes, coa_audited_at.  
T4 (Finnrick) and T0 (no COA) vendors pre-marked skip. Result: 16 pending, 32 skipped / 48 total.

**[COA-1] COA Integrity Audit — batch 1 (5 vendors)** — PENDING  
Goal: verify T3 claims (25pts LV) are legitimate. These vendors score highest and are most misleading if wrong.  
Run `npm run coa:queue` to see the current queue — T3 first, then T2, then T1, sorted by overall_score DESC.  

**Current queue (as of 2026-06-10):**
1. RUO Science — T3 claimed, score 68 — https://ruoscience.com/coa-library/
2. Ion Peptide — T3 claimed, score 66 — https://ionpeptide.com/lab-results/
3. Glacier Aminos — T3 claimed, score 66 — https://glaciersaminos.com/coas
4. Mile High Compounds — T3 claimed, score 66 — https://milehighcompounds.is/pages/coa
5. Ascension Peptides — T3 claimed, score 61 — https://ascensionpeptides.com/certificates-of-analysis/

**Audit workflow per vendor:**
1. Open the COA URL and run through the Part 3 checklist in `docs/coa-validation-framework.md`
2. Key checks: real lab letterhead (not vendor-branded), verifiable batch numbers, lab registry entry
3. Record findings: `npm run coa:update -- --slug <slug> --tier <0|1|2|3> --status <complete|flagged> --notes "..."`
4. If tier changed, run `npm run compute:scores` to recalculate
5. Update vendor profile in `docs/vendor_profiles/<slug>.md` if one exists

**Cadence:** 4–5 vendors per session to stay within token budget. Run `npm run coa:queue` each session — it shows remaining queue and progress. When all 16 are done, audit is complete.

---

## OPEN — High Priority

**[H5] Peptide Partners `lab_tests.lab_name` was "Kovera" not "Kovera Labs"** — DONE 2026-08-06  
Exact-match gap on the vendor↔lab cross-link (same class of bug CLAUDE.md already warns about for this feature) meant Peptide Partners never showed up on /labs/kovera-labs' reverse vendor lookup despite having 15 Kovera-attributed records. Normalized to "Kovera Labs" via scripts/fix-kovera-labname.ts.

**[H4] Review Ascension Peptides + Peptide Partners LV tier given Kovera Labs findings** — DECIDED 2026-08-06: leave scores as-is  
Jason's call after the deep-dive: no confirmed problem with Kovera's actual test results, so Ascension Peptides and Peptide Partners keep their current LV tiers/scores unchanged. The /labs/kovera-labs disclosure is the mitigation for now. Revisit only if the unresolved false-pass allegation ever gets independently corroborated (see "Action required" in docs/lab_registry.md's Kovera Labs entry).  
`/labs/kovera-labs` published with `trust_tier: unverified` (not `verified_unaccredited` like the other 4 non-accredited labs). Deeper pass same day: the "IP registration overlap with instantpeptides.com" allegation was checked directly via WHOIS/DNS (different registrar, nameservers, hosting IP, and mail provider on both domains — no overlap found) and the primary community thread shows other posters disputing the original claim as unsubstantiated, plus a real counter-example of Kovera *failing* a Glacier Aminos sample that passed elsewhere. The second allegation (a MESO-Rx poster's claim of a ~27% purity sample receiving a passing result) could not be re-verified — the source site blocks automated access on every retry — so it's neither confirmed nor refuted, just unreproduced.  
Net effect: picture is more favorable than the initial publish, but operator/ownership identity is still fully undisclosed and the specific false-pass claim, while unconfirmed, hasn't been ruled out either.  
Our `lab_tests` table currently credits: Ascension Peptides (50 Kovera rows, drives its T3/LV=25 tier since Session 12), Peptide Partners (15 rows), Glacier Aminos (2 rows), Ion Peptide (1 row — negligible).  
Decision needed: leave LV tiers as-is given the weakened case against Kovera, or open a `verification_flags` entry (LAB_UNVERIFIABLE) on Ascension/Peptide Partners pending Kovera having a longer operating history. Not auto-applied — full writeup in docs/lab_registry.md under "Kovera Labs."

---

## OPEN — Future / Deferred

**[F1] Wire verification_flags email notifications**  
When: platform is stable, automated triggers are running, daily active sessions end.  
What: Supabase Database Webhook or pg_net trigger on INSERT to verification_flags  
WHERE status = 'OPEN'. Email to jason.c.newman@gmail.com.  
Payload: vendor name, flag_type, severity, finding_summary.  
Table is ready (migration_010). Just needs the trigger wired.  
Owner: Claude (when Jason says go)

**[F2] Wire score computation gate against open flags**  
When: same as F1.  
What: add check to compute-scores.ts — skip score write if vendor has OPEN flags  
in verification_flags table.  
Owner: Claude (when Jason says go)

**[F3] Maxx Research Supply — re-check for product catalog**  
Currently no products. Re-check quarterly.  
Owner: Claude (automated or quarterly reminder)

---

## CLOSED

**[H1] Apply migration_010.sql to Supabase** — DONE 2026-06-09  
verification_flags table live in production.
