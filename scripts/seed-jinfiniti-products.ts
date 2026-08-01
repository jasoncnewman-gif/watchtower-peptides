import { db } from "./lib/client.js";
import catalog from "./data/jinfiniti-catalog.json" with { type: "json" };

// Exact-string rules (not substring/word-boundary) because Jinfiniti's raw marker
// names are extremely short abbreviations (TT, E2, LH, FSH, PRL) where a
// word-boundary match risks false collisions. Ambiguous cases deliberately left
// unmatched: "DHEA" (distinct molecule from our tracked "DHEA-S"), "HGH" (not
// confirmed fasting -- the exact CLAUDE.md cautionary example: "Growth Hormone" vs.
// our tracked "Growth Hormone (Fasting)"), "Glucose"/"Insulin" (not confirmed
// fasting), "Free PSA" (distinct from Total/bare PSA), lipid-panel components
// (LDL/HDL/Triglycerides -- granularity mismatch vs. our aggregate "Lipid Panel"
// biomarker), and markers not in our tracked list at all (Klotho, SAβG, IL-1β,
// IL-8, TNF-α, D-Dimer, GSP, Uric Acid, ALP, Folate, Vitamin B12, C-Peptide).
const RULES: [string, string][] = [
  ["ApoB", "^ApoB$"],
  ["Lp(a)", "^LP\\(A\\)$"],
  ["Homocysteine", "^Homocysteine$"],
  ["HbA1c", "^HbA1c$"],
  ["hs-CRP", "^hs-CRP$"],
  ["ALT", "^ALT$"],
  ["Albumin", "^Albumin$"],
  ["Creatinine", "^Creatinine$"],
  ["Creatine Kinase", "^Creatine Kinase$"],
  ["Vitamin D (25-OH)", "^Vitamin D3?$"],
  ["NAD+", "^NAD\\+$"],
  ["8-OHdG", "^8-OHdG$"],
  ["IL-6", "^IL-6$"],
  ["TSH", "^TSH$"],
  ["Free T3", "^Free T3$"],
  ["Free T4", "^Free T4$"],
  ["Prolactin", "^PRL$"],
  ["Testosterone (Total)", "^TT$"],
  ["Estradiol", "^E2$"],
  ["Progesterone", "^Progesterone$"],
  ["SHBG", "^SHBG$"],
  ["LH", "^LH$"],
  ["FSH", "^FSH$"],
  ["eGFR", "^eGFR$"],
  ["Ferritin", "^Ferritin$"],
  ["PSA", "^Total PSA$"],
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
        source_url: `https://www.jinfiniti.com/product/${p.slug}/`,
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
