import { db } from "./lib/client.js";
import catalog from "./data/onetwenty-catalog.json" with { type: "json" };

// Exact/anchored rules verified against this vendor's raw strings. "TT (male-only)"
// and "FT (male-only)" matched to Total/Free Testosterone per the standard TT/FT
// men's-hormone-panel pairing convention (same abbreviation precedent as Jinfiniti).
// "E2 (female-only)" matched to Estradiol (standard clinical abbreviation). "Fasting
// Glucose" matched directly since it's explicitly labeled fasting, unlike other
// vendors' ambiguous bare "Glucose". Ambiguous/unmatched: "BioT" (Bioavailable
// Testosterone, distinct calculated fraction), "T3 Uptake"/"Free T4 Index (T7)"
// (older indirect thyroid methodology, not our tracked direct Free T3/T4), "Total
// T4" (not tracked), "Complete Blood Count" (bare aggregate line item redundant
// with its own separately-listed differential components -- granularity mismatch
// vs. our aggregate "CBC with Differential"), "Iron Binding Capacity" (ambiguous
// TIBC vs. UIBC), all lipid components/ratios and electrolytes individually.
const RULES: [string, string][] = [
  ["Lp(a)", "^Lipoprotein \\(a\\)$"],
  ["Fasting Glucose", "^Fasting Glucose$"],
  ["Homocysteine", "^Homocysteine$"],
  ["ApoB", "\\(ApoB\\)"],
  ["AST", "\\(AST\\)"],
  ["Albumin", "^Albumin$"],
  ["BUN", "\\(BUN\\)"],
  ["eGFR", "\\(eGFR\\)"],
  ["Creatinine", "^Creatinine$"],
  ["TSH", "\\(TSH\\)"],
  ["SHBG", "^SHBG"],
  ["FSH", "\\(FSH\\)"],
  ["LH", "\\(LH\\)"],
  ["PSA", "\\(PSA\\)"],
  ["Estradiol", "^E2"],
  ["hs-CRP", "^hs-CRP$"],
  ["Ferritin", "^Ferritin$"],
  ["Testosterone (Total)", "^TT "],
  ["Testosterone (Free)", "^FT "],
  ["ALT", "^Liver Enzyme ALT$"],
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
        source_url: `https://onetwenty.com/biometrics`,
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
