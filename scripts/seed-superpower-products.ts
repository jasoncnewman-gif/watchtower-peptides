import { db } from "./lib/client.js";
import catalog from "./data/superpower-catalog.json" with { type: "json" };

// Exact/anchored rules verified against this vendor's raw strings. Superpower's
// catalog leans heavily into specialty/functional-medicine tests (organic acids,
// allergen IgE panels, autoimmune antibodies, computed "Organ Age" scores, dozens
// of derived ratios) that have no tracked-biomarker equivalent at all -- expect a
// low match rate, same as Marek's/Goodlabs' long tails. Notably this vendor
// explicitly distinguishes "Insulin" (bare, unconfirmed fasting state -- left
// unmatched) from "Insulin Fasting" (matched to our tracked "Fasting Insulin").
// Also left unmatched: "Cystatin C–based eGFR" (different formula from our tracked
// creatinine-based eGFR), "Testosterone, Bioavailable" (distinct calculated
// fraction), all lipid components/ratios (granularity mismatch vs. our aggregate
// "Lipid Panel"), Vitamin B12/Folate/Rheumatoid Factor/immunoglobulins (not
// individually tracked), and all CBC/urinalysis components.
const RULES: [string, string][] = [
  ["Albumin", "^Albumin$"],
  ["ApoB", "^Apolipoprotein B$"],
  ["AST", "\\(AST\\)"],
  ["BUN", "\\(BUN\\)"],
  ["Cortisol (AM)", "^Cortisol$"],
  ["Creatinine", "^Creatinine$"],
  ["DHEA-S", "\\(DHEA-S\\)"],
  ["eGFR", "^Estimated Glomerular Filtration Rate \\(eGFR\\)$"],
  ["Estradiol", "^Estradiol$"],
  ["Ferritin", "^Ferritin$"],
  ["Free T3", "^Free T3"],
  ["Testosterone (Free)", "^Free Testosterone$"],
  ["hs-CRP", "^High-sensitivity CRP$"],
  ["Homocysteine", "^Homocysteine$"],
  ["Fasting Insulin", "^Insulin Fasting$"],
  ["IGF-1", "\\(IGF-1\\)"],
  ["Lp(a)", "^Lipoprotein \\(a\\)$"],
  ["Testosterone (Total)", "^Testosterone, Total$"],
  ["Vitamin D (25-OH)", "^Vitamin D$"],
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
        source_url: `https://www.superpower.com/biomarkers`,
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
