import { db } from "./lib/client.js";
import catalog from "./data/marek-catalog.json" with { type: "json" };

// (biomarker_name, include_regex, exclude_regex_or_null) -- hand-verified against
// marekdiagnostics.com's actual catalog, not fuzzy-matched. Ambiguous assay-specificity
// cases (e.g. bare "Cortisol" vs our tracked "Cortisol (AM)", "Glucose" vs "Fasting
// Glucose", "Growth Hormone, Serum" vs our tracked "Growth Hormone (Fasting)", RBC/Plasma
// zinc & copper vs our tracked serum-specific entries, decomposed CBC/CMP components vs
// the aggregate "CBC with Differential"/"WBC Differential"/"Lipid Panel" biomarkers) are
// deliberately left unmatched rather than forced -- see report to user for the full list.
const RULES: [string, string, string | null][] = [
  ["ACTH", "\\bACTH\\b", null],
  ["AST", "\\bAST\\b", null],
  ["ALT", "\\bALT\\b", null],
  ["Albumin", "\\bAlbumin\\b", "Globulin|Ratio"],
  ["Amylase", "\\bAmylase\\b", null],
  ["AMH", "\\(AMH\\)", null],
  ["ApoB", "ApoB|Apolipoprotein[\\s-]B", "Ratio|:"],
  ["BUN", "\\bBUN\\b", "Ratio|/|:"],
  ["Calcitonin", "\\bCalcitonin\\b", null],
  ["Ceruloplasmin", "\\bCeruloplasmin\\b", null],
  ["CoQ10", "CoQ10|Coenzyme Q10", null],
  ["Collagen Biomarkers (CTX/P1NP)", "C-Telopeptide|P1NP|Procollagen", null],
  ["Cortisol (AM)", "^Cortisol$", null],
  ["Creatinine", "^Creatinine$", null],
  ["eGFR", "^eGFR$", null],
  ["DHEA-S", "DHEA-S|Dehydroepiandrosterone Sulfate", null],
  ["Estradiol", "\\bEstradiol\\b", null],
  ["Fasting Insulin", "Fasting Insulin", null],
  ["Ferritin", "\\bFerritin\\b", null],
  ["Fibrinogen", "\\bFibrinogen\\b", null],
  ["hs-CRP", "hs-?CRP|High Sensitivity C-Reactive Protein|C-Reactive Protein, High Sensitivity", null],
  ["ESR", "\\bESR\\b", null],
  ["FSH", "\\bFSH\\b|Follicle.{0,2}[Ss]timulating [Hh]ormone", null],
  ["GGT", "\\bGGT\\b", null],
  ["HbA1c", "HbA1c", null], // matched case-insensitively
  ["Homocysteine", "\\bHomocysteine\\b", null],
  ["IGF-1", "IGF-1|Insulin-[Ll]ike Growth Factor", null],
  ["Lipase", "\\bLipase\\b", null],
  ["LH", "\\bLH\\b|Luteinizing [Hh]ormone", null],
  ["Lp(a)", "Lipoprotein\\(a\\)|Lp\\(a\\)", null],
  ["Progesterone", "\\bProgesterone\\b", "17-OH"],
  ["Prolactin", "\\bProlactin\\b", null],
  ["PSA", "PSA|Prostate[\\s-]?[Ss]pecific Antigen", "Free"],
  ["Serum Copper", "Copper.*Serum", null],
  ["SHBG", "\\bSHBG\\b|Sex[\\s-]?[Hh]ormone[\\s-]?[Bb]inding [Gg]lobulin", null],
  ["Sodium", "\\bSodium\\b", null],
  ["Testosterone (Free)", "Free Testosterone", null],
  ["Testosterone (Total)", "Total Testosterone", null],
  ["TIBC", "\\bTIBC\\b|Total Iron.?[Bb]inding Capacity", null],
  ["TSH", "\\bTSH\\b|Thyroid.?[Ss]timulating Hormone", "Immunoglobulin"],
  ["Vitamin D (25-OH)", "Vitamin D.*25|25.?Hydroxy.*Vitamin D", "D2|D3|1,25"],
  ["Free T3", "Free T3|Free Triiodothyronine", null],
  ["Free T4", "Free T4|Free Thyroxine", null],
  ["Fecal Calprotectin", "\\bCalprotectin\\b", null],
];

function matchBiomarkerName(raw: string): string | null {
  for (const [name, inc, exc] of RULES) {
    const flags = name === "HbA1c" ? "i" : "";
    if (exc && new RegExp(exc, flags).test(raw)) continue;
    if (new RegExp(inc, flags).test(raw)) return name;
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
        source_url: `https://marekdiagnostics.com/products/${p.slug}`,
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
