import { db } from "./lib/client.js";
import catalog from "./data/vitalsvault-catalog.json" with { type: "json" };

// Hand-verified against marekdiagnostics-style precedent: exact-string rules (not
// substring) because Vitals Vault's derived ratio/index names embed the base marker
// as a substring (e.g. "AST:ALT Ratio" contains "AST", "GGT/HDL Ratio" contains "GGT"),
// so a naive \b-word-boundary match would wrongly credit ratios as raw markers.
// Ambiguous cases left unmatched: bare "Insulin" (not confirmed fasting, same as
// Marek's "Insulin" vs "Fasting Insulin"), "Testosterone Bioavailable" (a distinct
// calculated fraction, not the same as Free or Total), "T3 Uptake"/"Free T4 Index (T7)"
// (older indirect-estimate thyroid methodology, not the same assay as our tracked
// direct Free T3/Free T4 immunoassays), "HOMA2-IR" (HOMA2 is a distinct nonlinear
// model from the HOMA-IR formula we track, can diverge on the same inputs), all CBC/
// urinalysis/lipid-panel individual components (granularity mismatch vs our aggregate
// biomarkers), and all derived ratios/percentages generally.
const RULES: [string, string][] = [
  ["ALT", "^ALT$"],
  ["AST", "^AST$"],
  ["Albumin", "^Albumin$"],
  ["Amylase", "^Amylase$"],
  ["ApoB", "^Apolipoprotein B$"],
  ["Biological Age Score", "^Biological Age$"],
  ["BUN", "^Urea Nitrogen \\(BUN\\)$"],
  ["Cortisol (AM)", "^Cortisol, Total$"],
  ["Creatinine", "^Creatinine$"],
  ["DHEA-S", "^DHEA Sulfate$"],
  ["eGFR", "^eGFR$"],
  ["ESR", "Sed Rate"],
  ["Estradiol", "^Estradiol$"],
  ["Ferritin", "^Ferritin$"],
  ["GGT", "^GGT$"],
  ["HbA1c", "Hemoglobin A1C"],
  ["Homocysteine", "^Homocysteine$"],
  ["hs-CRP", "^Hs CRP$"],
  ["IGF-1", "IGF-1"],
  ["Lipase", "^Lipase$"],
  ["Lp(a)", "Lipoprotein \\(A\\)"],
  ["Progesterone", "^Progesterone$"],
  ["SHBG", "Sex Hormone Binding Globulin"],
  ["Sodium", "^Sodium$"],
  ["Testosterone (Free)", "^Testosterone, Free$"],
  ["Testosterone (Total)", "^Testosterone, Total"],
  ["TSH", "^TSH$"],
  ["Vitamin D (25-OH)", "Vitamin D, 25-Oh, Total"],
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
        source_url: `https://www.vitalsvault.com/biomarkers`,
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
