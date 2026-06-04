/**
 * scripts/migrate-categories.ts
 * Remaps peptide categories to the new 5-category taxonomy:
 *   healing | hormones | metabolic | brain-longevity | immune | blend
 *
 * Run: npm run migrate:categories
 */

import { db } from "./lib/client.js";

const SCRIPT = "migrate-categories";
function log(msg: string) { console.log(`[${SCRIPT}] ${msg}`); }

// slug → new category
const CATEGORY_MAP: Record<string, string> = {
  // ── Healing & Recovery (unchanged) ──────────────────────────────────────
  "bpc-157":    "healing",
  "tb-500":     "healing",
  "ghk-cu":     "healing",
  "kpv":        "healing",
  "cartalax":   "healing",

  // ── Brain & Longevity (from healing + new) ───────────────────────────────
  "epithalon":          "brain-longevity",
  "humanin":            "brain-longevity",
  "selank":             "brain-longevity",
  "semax":              "brain-longevity",
  "n-acetyl-selank":    "brain-longevity",
  "n-acetyl-semax":     "brain-longevity",

  // ── Immune & Protective (from healing + sexual-health) ───────────────────
  "thymosin-alpha-1":   "immune",
  "ll-37":              "immune",
  "melanotan-1":        "immune",   // Afamelanotide — FDA-approved UV protection
  "melanotan-i":        "immune",   // alternate slug
  "melanotan-2":        "immune",   // Tanning / UV protective
  "melanotan-ii":       "immune",   // alternate slug

  // ── Hormones & Performance (from performance + sexual-health + healing) ──
  "ipamorelin":           "hormones",
  "cjc-1295":             "hormones",
  "cjc-1295-no-dac":      "hormones",
  "cjc-1295-with-dac":    "hormones",
  "cjc-1295-dac":         "hormones",
  "ghrp-2":               "hormones",
  "ghrp-6":               "hormones",
  "hexarelin":            "hormones",
  "igf-1-lr3":            "hormones",
  "sermorelin":           "hormones",
  "tesamorelin":          "hormones",
  "kisspeptin":           "hormones",
  "kisspeptin-10":        "hormones",
  "pt-141":               "hormones",
  "pt-141-bremelanotide": "hormones",
  "oxytocin":             "hormones",

  // ── Weight & Metabolic (from weight-loss + performance) ──────────────────
  "semaglutide":          "metabolic",
  "tirzepatide":          "metabolic",
  "retatrutide":          "metabolic",
  "aod-9604":             "metabolic",
  "hgh-fragment-176-191": "metabolic",
  "fragment-176-191":     "metabolic",
  "mots-c":               "metabolic",
  "glp-1-s":              "metabolic",
  "glp-2-t":              "metabolic",
  "glp-3-r":              "metabolic",
};

async function main() {
  const { data: peptides, error } = await db
    .from("peptides")
    .select("id, name, slug, category")
    .not("category", "eq", "blend");

  if (error) { log(`DB error: ${error.message}`); process.exit(1); }

  let updated = 0;
  let skipped = 0;
  let unknown = 0;

  for (const p of peptides ?? []) {
    const slug = p.slug as string;
    const newCat = CATEGORY_MAP[slug];

    if (!newCat) {
      log(`  UNKNOWN slug: ${slug} (${p.name}) — current: ${p.category}`);
      unknown++;
      continue;
    }

    if (p.category === newCat) {
      skipped++;
      continue;
    }

    const { error: upErr } = await db
      .from("peptides")
      .update({ category: newCat })
      .eq("id", p.id);

    if (upErr) {
      log(`  ERROR updating ${p.name}: ${upErr.message}`);
    } else {
      log(`  ${p.name.padEnd(30)} ${String(p.category).padEnd(15)} → ${newCat}`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} unchanged, ${unknown} unknown slugs.`);
}

main();
