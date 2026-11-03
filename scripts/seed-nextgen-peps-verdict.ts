/**
 * scripts/seed-nextgen-peps-verdict.ts
 * Writes the analyst verdict for NextGen Peps — the narrative summary of the
 * COA audit completed 2026-11-03 (see coa_audit_notes for the raw findings).
 * Numeric scores/tier/transparency flags were already set directly; this
 * fills the one piece that was missed: vendors.verdict (renders as "Our
 * Verdict" on the vendor detail page).
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-nextgen-peps-verdict.ts
 */
import { db } from "./lib/client.js";

const SLUG = "nextgen-peps";

const VERDICT =
  "NextGen Peps is a San Diego-based research peptide storefront (501 W Broadway Ste A, San Diego, CA 92101) " +
  "whose \"Price revealed on sign-in\" gate turned out to be cosmetic — both pricing and lab results are public " +
  "once you look past the teaser, no account needed. Across 71 products, 30 carry published lab results from " +
  "three different labs (Janoshik, Bioviridian, BioRegen), and we independently verified samples from each " +
  "directly against the lab's own system rather than trusting the vendor's PDFs: a Janoshik report matched " +
  "public.janoshik.com exactly, a Bioviridian report came back byte-for-byte identical to the file hosted on " +
  "bioviridians.com's own server, and a BioRegen report matched what bioregen.com's live verify form returned. " +
  "All three labs are real, independently operating, and used by multiple unrelated vendors — not a shell lab " +
  "set up to rubber-stamp this one storefront. Purity results vary realistically (98.82% to 99.94%, nothing " +
  "templated or suspiciously identical), and endotoxin results carry proper units and non-zero values.\n\n" +
  "What keeps this at T2 rather than higher: none of the three labs hold ISO 17025 accreditation (the same " +
  "community-standard-but-unaccredited category Janoshik sits in across this whole site), and batch/lot number " +
  "is blank on all 30 reports with no exception — there's no way to trace a given COA to a specific production " +
  "run. Business transparency is mixed: a real street address and working contact channels (phone, contact " +
  "form), but no individual ownership disclosure beyond the \"Nextgenpeps LLC\" name, and no dedicated page " +
  "explaining their testing process beyond a marketing \"third-party tested\" claim. Reddit sentiment is " +
  "positive across the posts we found, with users citing pricing and a referral discount code."

async function main() {
  const { data: vendor, error } = await db.from("vendors").select("id, name").eq("slug", SLUG).single();
  if (error || !vendor) { console.error("Vendor not found:", error?.message); process.exit(1); }

  const { error: upErr } = await db.from("vendors").update({ verdict: VERDICT }).eq("id", vendor.id);
  if (upErr) { console.error("Update failed:", upErr.message); process.exit(1); }

  console.log(`✅ Verdict written for ${vendor.name} (${VERDICT.length} chars)`);
}

main();
