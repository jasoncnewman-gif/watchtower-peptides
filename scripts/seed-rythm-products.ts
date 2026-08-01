import { db } from "./lib/client.js";
import catalog from "./data/rythm-catalog.json" with { type: "json" };

// Exact/anchored rules verified against this vendor's raw strings. Ambiguous cases
// deliberately left unmatched: LDL/HDL Cholesterol and Triglycerides (granularity
// mismatch vs. our aggregate "Lipid Panel"), both ratio markers, Fructosamine/Uric
// Acid/ALP (not tracked), Hematocrit/Hemoglobin (CBC components, not our aggregate
// "CBC with Differential"). "Biological Age" matched despite being a computed
// dashboard metric here, not a distinct lab draw -- same precedent as Jinfiniti.
const RULES: [string, string][] = [
  ["Testosterone (Total)", "^Total Testosterone$"],
  ["Testosterone (Free)", "^Free Testosterone$"],
  ["Estradiol", "Estradiol"],
  ["Progesterone", "^Progesterone"],
  ["SHBG", "^SHBG"],
  ["TSH", "^TSH"],
  ["Free T3", "^Free T3"],
  ["ApoB", "^ApoB"],
  ["hs-CRP", "^hsCRP"],
  ["Vitamin D (25-OH)", "^Vitamin D$"],
  ["Ferritin", "^Ferritin"],
  ["Albumin", "^Albumin"],
  ["Creatinine", "^Creatinine"],
  ["GGT", "^GGT"],
  ["Biological Age Score", "^Biological Age$"],
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
        source_url: `https://rythmhealth.com/biomarkers`,
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
