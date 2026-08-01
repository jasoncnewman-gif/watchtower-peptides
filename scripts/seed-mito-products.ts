import { db } from "./lib/client.js";
import catalog from "./data/mito-catalog.json" with { type: "json" };

// Exact/anchored rules verified against this vendor's raw strings. Ambiguous cases
// deliberately left unmatched: bare "Glucose"/"Insulin" (not confirmed fasting),
// "Free PSA"/"Free/Total PSA Ratio" (distinct from bare/Total PSA), "Free Thyroxine
// Index"/"T3 Resin Uptake" (older indirect-methodology thyroid tests, not the same
// assay as our tracked direct Free T3/Free T4), "Total T4" (not tracked -- only Free
// T4 is), "eGFR (Cystatin C-Based)" (a genuinely different calculation formula from
// creatinine-based eGFR, not the same test), bare "Copper"/"Zinc" (specimen type
// unconfirmed vs. our tracked "Serum Copper"/"Serum Zinc"), all lipid subfraction/
// particle-size/fatty-acid-ratio markers (Ultra's NMR panel -- granularity mismatch
// vs. our aggregate "Lipid Panel"), all CBC morphology/urinalysis line items
// (granularity mismatch vs. aggregate "CBC with Differential"/"WBC Differential").
const RULES: [string, string][] = [
  ["ALT", "^ALT$"],
  ["AST", "^AST$"],
  ["Albumin", "^Albumin$"],
  ["Amylase", "^Amylase$"],
  ["ApoB", "^Apolipoprotein B$"],
  ["Cortisol (AM)", "^Cortisol$"],
  ["Creatinine", "^Creatinine$"],
  ["DHEA-S", "^DHEA-S$"],
  ["Estradiol", "^Estradiol$"],
  ["FSH", "^FSH$"],
  ["Ferritin", "^Ferritin$"],
  ["Free T3", "^Free T3$"],
  ["Free T4", "^Free T4$"],
  ["Testosterone (Free)", "^Free Testosterone$"],
  ["GGT", "^GGT$"],
  ["HbA1c", "^HbA1c$"],
  ["Homocysteine", "^Homocysteine$"],
  ["IGF-1", "^Insulin-Like Growth Factor 1$"],
  ["Lipase", "^Lipase$"],
  ["Lp(a)", "^Lipoprotein\\(a\\)$"],
  ["LH", "^Luteinizing Hormone$"],
  ["PSA", "^PSA \\(Men only\\)$"],
  ["Progesterone", "^Progesterone"],
  ["Prolactin", "^Prolactin"],
  ["SHBG", "^Sex Hormone Binding Globulin$"],
  ["Sodium", "^Sodium$"],
  ["TSH", "^TSH$"],
  ["TIBC", "^Total Iron Binding Capacity$"],
  ["Testosterone (Total)", "^Total Testosterone$"],
  ["BUN", "^Urea Nitrogen$"],
  ["hs-CRP", "^hs-CRP$"],
  ["AMH", "^Anti-Müllerian Hormone"],
  ["Adiponectin", "^Adiponectin$"],
  ["Leptin", "^Leptin$"],
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
        source_url: `https://mitohealth.com/products/${p.slug}`,
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
