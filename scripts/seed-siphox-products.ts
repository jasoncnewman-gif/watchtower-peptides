import { db } from "./lib/client.js";
import catalog from "./data/siphox-catalog.json" with { type: "json" };

// Parenthetical-abbreviation rules (e.g. "(LH)", "(FSH)", "(TSH)") verified safe against
// this vendor's derived-ratio raw strings: ratios like "LH:FSH Ratio (female only)" or
// "AST:ALT Ratio" never contain the bracketed short form ("(LH)", "(AST)"), only the bare
// colon-joined names, so a substring match on "(XXX)" doesn't accidentally catch a ratio.
// Gender-qualified variants (male only)/(female only) map to the same underlying tracked
// biomarker since they're the same lab test with a different reference range, not a
// different assay. Ambiguous/unmatched: "% Free Testosterone" (percentage, not raw value),
// all cholesterol/lipid components (granularity mismatch vs. our aggregate "Lipid Panel"),
// "Female Free Androgen Index (FAI)"/"Free Androgen Index (FAI)" (not one of our tracked
// biomarkers), Thyroglobulin/Thyroperoxidase antibodies (not tracked), all other ratios.
const RULES: [string, string][] = [
  ["HbA1c", "Hemoglobin A1C"],
  ["Vitamin D (25-OH)", "Vitamin D"],
  ["ALT", "\\(ALT\\)"],
  ["Albumin", "^Albumin"],
  ["ApoB", "\\(APOB\\)"],
  ["AST", "\\(AST\\)"],
  ["BUN", "\\(BUN\\)"],
  ["Creatinine", "^Creatinine$"],
  ["DHEA-S", "\\(DHEA-S\\)"],
  ["Estradiol", "^Estradiol"],
  ["Ferritin", "^Ferritin$"],
  ["FSH", "\\(FSH\\)"],
  ["Free T4", "\\(Free T4\\)"],
  ["Free T3", "\\(Free T3\\)"],
  ["hs-CRP", "High-Sensitivity CRP"],
  ["Lp(a)", "Lipoprotein \\(a\\)"],
  ["LH", "\\(LH\\)"],
  ["Cortisol (AM)", "^Morning Cortisol$"],
  ["Progesterone", "^Progesterone"],
  ["Prolactin", "\\(PRL\\)"],
  ["SHBG", "\\(SHBG\\)"],
  ["Testosterone (Free)", "^Testosterone, Free"],
  ["Testosterone (Total)", "^Testosterone, Total"],
  ["TSH", "\\(TSH\\)"],
  ["eGFR", "^eGFR$"],
  ["PSA", "\\(PSA\\)"],
  ["TIBC", "\\(TIBC\\)"],
];

function matchBiomarkerName(raw: string): string | null {
  for (const [name, pattern] of RULES) {
    if (new RegExp(pattern).test(raw)) return name;
  }
  return null;
}

async function main() {
  const { data: vendor } = await db
    .from("lab_vendors")
    .select("id, slug")
    .eq("slug", catalog.vendor_slug)
    .single();
  if (!vendor) throw new Error(`vendor ${catalog.vendor_slug} not found`);

  const { data: biomarkers } = await db.from("biomarkers").select("id, name");
  const nameToId = new Map((biomarkers ?? []).map((b) => [b.name, b.id]));

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const p of catalog.products) {
    const { data: existing } = await db
      .from("vendor_test_products")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("vendor_slug", p.slug)
      .maybeSingle();
    if (existing) {
      console.log(`skip (already seeded): ${p.title}`);
      continue;
    }

    const { data: product, error: insertError } = await db
      .from("vendor_test_products")
      .insert({
        vendor_id: vendor.id,
        vendor_slug: p.slug,
        name: p.title,
        product_type: p.product_type,
        price_cents: p.price_cents,
        raw_marker_count: p.markers.length,
        source_url: `https://siphoxhealth.com/partner/test-panels`,
      })
      .select("id")
      .single();
    if (insertError || !product) {
      console.error(`FAILED to insert ${p.title}:`, insertError);
      continue;
    }

    const markerRows = p.markers.map((raw) => {
      const biomarkerName = matchBiomarkerName(raw);
      const biomarkerId = biomarkerName ? nameToId.get(biomarkerName) ?? null : null;
      if (biomarkerId) matchedCount++;
      else unmatchedCount++;
      return {
        product_id: product.id,
        raw_marker_name: raw,
        biomarker_id: biomarkerId,
      };
    });

    const { error: markersError } = await db.from("vendor_test_product_markers").insert(markerRows);
    if (markersError) {
      console.error(`FAILED to insert markers for ${p.title}:`, markersError);
      continue;
    }

    console.log(`seeded: ${p.title} (${p.markers.length} markers)`);
  }

  console.log(`\nTotal marker rows: matched=${matchedCount} unmatched=${unmatchedCount}`);
}

main();
