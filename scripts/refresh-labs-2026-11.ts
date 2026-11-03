/**
 * scripts/refresh-labs-2026-11.ts
 * Re-verification pass on all 6 labs (last reviewed 2026-08-02/06), per the
 * project's own standing rule that lab_registry/labs data drifts and must be
 * re-checked before trusting. Live-reachability-checked all 6 sites/portals
 * (stealth Puppeteer for the 3 Cloudflare-protected ones: vanguardlaboratory.com,
 * janoshik.com, public.janoshik.com — all genuinely live, not down) and
 * websearched each for anything new since the last review.
 *
 * Material findings, two labs:
 *  - Freedom Diagnostics: stored verification_portal_url (coas.freedomdiagnostics
 *    testing.com) now 404s. Real portal moved to freedomdiagnosticstesting.com/?page_id=52.
 *  - Kovera Labs: independent analysis (vialaudit.com) found 57 of 1,828 public
 *    COAs were silently re-certified under the same certificate number since
 *    first recorded, 20 with a changed purity/content value, with no public
 *    disclosure — a real new red flag not in the Aug review. (A separate claim
 *    from an AI-search-summary, that Kovera's verifier shares a DB with vendor
 *    files, did NOT hold up on reading the actual source — the source says the
 *    opposite, verification resolves to Kovera's own servers. Not included.)
 *  - Horizon Analytical: independent investigative reporting (a two-part
 *    Substack deep-dive, corroborated by a USPTO trademark filing) found Horizon
 *    is operationally tied to Aspire Labs, which also owns Direct Peptides — a
 *    vendor Horizon tests for. COAs reportedly provided "at cost" with "no
 *    profit built in," contradicting Horizon's own compliance-policy claim of
 *    independence from Direct Peptides. A real conflict-of-interest finding for
 *    at least that one vendor relationship — not extended to a tier change here,
 *    since it's unclear how it affects Horizon's other (non-Direct-Peptides)
 *    testing relationships; flagged as an open question for a human call.
 *  - Chromate, Vanguard, Janoshik: no material new findings. Confirmed live,
 *    existing writeups still accurate.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/refresh-labs-2026-11.ts
 */
import { db } from "./lib/client.js";

const TODAY = "2026-11-03";

async function main() {
  // Freedom Diagnostics: fix the dead portal URL
  await db.from("labs").update({
    verification_portal_url: "https://freedomdiagnosticstesting.com/?page_id=52",
    portal_verified: true,
    last_reviewed: TODAY,
  }).eq("slug", "freedom-diagnostics");

  // Kovera Labs: add the certificate-mutation finding
  await db.from("labs").update({
    what_we_could_not_verify:
      "No legal entity name, ownership, or corporate registration confirmed (Illinois Secretary of State and OpenCorporates searches could not be completed via automated tools this session — both are behind interactive forms/CAPTCHAs). Could not personally complete a live verification-portal lookup (no COA code on hand). A LinkedIn profile associated with the lab could not be independently corroborated (LinkedIn blocks automated access). A separate, more serious claim — a MESO-Rx forum poster describing a specific sample that tested ~27% purity but received a passing Kovera result, with an accompanying blacklisting allegation — was surfaced on a first automated page fetch, but the source site actively blocks automated access and we could not reproduce or re-verify the exact wording on a second pass. The claim is specific enough (an exact purity figure and vial weight) that it plausibly reflects real forum content rather than a fabrication, but it should be treated as unconfirmed and unreproduced, not as a verified finding.",
    caveats:
      "Operator/ownership transparency remains a genuine, unresolved gap — no team, credentials, or legal entity are disclosed anywhere, which is consistent with several other small labs in this registry (Horizon Analytical, Chromate at launch) but still a real limitation for a lab whose entire value proposition is independence. The specific vendor-ownership-overlap claim, when checked directly, did not hold up technically. The specific false-pass/blacklisting claim could not be re-verified due to source-site access blocking, not because it was found to be false — treat it as an open question, not a resolved one either way. New as of 2026-11-03: an independent analysis (vialaudit.com) found 57 of 1,828 public Kovera COAs had been silently re-certified under the same certificate number since first recorded, 20 of those with a changed purity or content value, and Kovera has made no public statement about the revisions. A re-issue isn't inherently fraudulent (labs do correct errors), but undisclosed, unexplained value changes on already-published certificates — on roughly 1% of the public dataset — is a real new data-integrity concern, not resolved one way or the other.",
    bottom_line:
      "Kovera Labs is real, not a fabricated identity — its published-failure-rate data and a directly-checked negative on the \"IP overlap\" claim are genuine positive signals. But operator anonymity, one unconfirmed fraud allegation, and a newly-found pattern of undisclosed certificate revisions (57 of 1,828 public COAs re-certified since first recorded, 20 with changed values, no public explanation) keep it below the other labs we track. Re-review after Kovera has a longer operating history and addresses the revision pattern publicly.",
    last_reviewed: TODAY,
  }).eq("slug", "kovera-labs");

  // Horizon Analytical: add the Aspire Labs / Direct Peptides ownership-adjacency finding
  await db.from("labs").update({
    caveats:
      "Heavy Metals and Sterility panels are both still listed as \"Coming Soon,\" and a third gap not previously noted — \"Proteins & HGH\" testing — is also marked \"Coming Soon.\" For an injectable research compound, this means Horizon currently covers identity/purity/potency and endotoxin, but not a full safety panel. New as of 2026-11-03: independent investigative reporting (a two-part deep-dive, partially corroborated by a USPTO trademark filing) found Horizon is operationally tied to Aspire Labs, which also owns Direct Peptides — a vendor whose COAs come through Horizon. Reporting describes Aspire's own recruiting materials as crediting Aspire with \"building Horizon Analytical's laboratory operation,\" and Direct Peptides COAs as provided \"at cost\" with \"no profit to Horizon built in.\" This sits in tension with Horizon's own compliance policy, which states it is \"independent of Direct Peptides\" and that \"Direct Peptides and other customers do not control Horizon's methods, quality review, results, or reporting.\" We have not independently confirmed the ownership structure beyond this secondary reporting, and it's unclear whether or how this affects Horizon's testing for its OTHER clients (e.g. True Research Labs, whose COA we independently reproduced) — flagged as a real, specific conflict-of-interest concern for the Direct Peptides relationship specifically, not resolved into a tier change here pending a closer look.",
    bottom_line:
      "Horizon Analytical is real and independently verifiable — we tested its own portal ourselves and got a reproducible historical match. Not accredited, no public address, several safety-relevant panels remain unbuilt, and new reporting ties it operationally to Aspire Labs (which also owns vendor Direct Peptides) in a way that sits uneasily with Horizon's own independence claim for that specific relationship: a legitimate mid-tier verification with a real open question, not a full safety guarantee.",
    last_reviewed: TODAY,
  }).eq("slug", "horizon-analytical");

  // Chromate, Vanguard, Janoshik: no material changes — just record the fresh check
  await db.from("labs").update({ last_reviewed: TODAY }).in("slug", ["chromate", "vanguard-laboratory", "janoshik-analytical"]);

  console.log("Labs refresh complete.");
}

main();
