import { db } from "./lib/client.js";
import catalog from "./data/everlywell-catalog.json" with { type: "json" };

// Case-insensitive parenthetical-abbreviation rules, verified safe against this
// vendor's raw strings (no derived-ratio string contains a bracketed short form like
// "(FSH)" or "(LH)" -- those only appear attached to the full hormone name). Multiple
// capitalization variants of the same test (e.g. "Follicle Stimulating Hormone (FSH)"
// vs. "Follicle-stimulating hormone (FSH)") are handled by case-insensitive matching
// rather than being treated as different tests. Ambiguous/unmatched: bare "DHEA"
// (distinct from tracked "DHEA-S"), "Cortisol" (not confirmed AM, consistent with
// prior vendors' judgment call -- matched here per that same precedent), bare
// "Insulin"/"Glucose" (not confirmed fasting), "Iron Binding Capacity" (ambiguous
// TIBC vs. UIBC), bare "Zinc" (specimen type unconfirmed), Thyroid Peroxidase/
// Thyroglobulin antibodies and ANA (not tracked), all infectious-disease qualitative
// results and cancer-screening/microbiome/food-sensitivity summary markers (none
// correspond to a tracked blood-chemistry biomarker), all CBC/urinalysis components
// and cholesterol/lipid components (granularity mismatch vs. our aggregate
// "CBC with Differential"/"Lipid Panel" biomarkers).
const RULES: [string, string][] = [
  ["Vitamin D (25-OH)", "25-OH D|^Vitamin D$"],
  ["ALT", "\\(ALT\\)"],
  ["Albumin", "^Albumin$"],
  ["AMH", "\\(AMH\\)"],
  ["AST", "\\(AST\\)"],
  ["BUN", "\\(BUN\\)"],
  ["Cortisol (AM)", "^Cortisol$"],
  ["Creatinine", "^Creatinine$"],
  ["DHEA-S", "^DHEA-Sulfate$"],
  ["eGFR", "\\(eGFR\\)"],
  ["Estradiol", "^Estradiol( \\(E2\\))?$"],
  ["Ferritin", "^Ferritin$"],
  ["FSH", "\\(FSH\\)"],
  ["Free T3", "Free T3$|Triiodothyronine \\(T3\\) Free"],
  ["Free T4", "Free T4$|Thyroxine \\(T4\\) Free"],
  ["GGT", "\\(GGT\\)"],
  ["HbA1c", "HbA1c"],
  ["hs-CRP", "hsCRP|hsCRP\\)$"],
  ["Homocysteine", "^Homocysteine$"],
  ["Lp(a)", "Lipoprotein \\(a\\)"],
  ["LH", "\\(LH\\)"],
  ["Progesterone", "^Progesterone$"],
  ["PSA", "\\(PSA\\) Total"],
  ["Sodium", "^Sodium$"],
  ["Testosterone (Total)", "^Testosterone Total$|^Total Testosterone$"],
  ["TSH", "\\(TSH\\)"],
];

function matchBiomarkerName(raw: string): string | null {
  for (const [name, pattern] of RULES) {
    if (new RegExp(pattern, "i").test(raw)) return name;
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
        source_url: `https://www.everlywell.com/products/${p.slug}/`,
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
