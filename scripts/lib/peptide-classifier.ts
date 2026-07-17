/**
 * scripts/lib/peptide-classifier.ts
 * Shared peptide/non-peptide product classifier — previously duplicated
 * independently in scrape-vendor-products.ts and scrape-gated-vendors.ts,
 * which drifted out of sync (the gated-vendor copy was missing Cagrilintide
 * and Mazdutide, and incorrectly listed "nad+" and "mk-677" — a SARM — as
 * peptides). One copy now, imported by both.
 */

const KNOWN_PEPTIDES = [
  "bpc", "body protection compound", "tb-500", "thymosin", "sermorelin", "cjc", "ipamorelin",
  "semaglutide", "tirzepatide", "pt-141", "bremelanotide", "kisspeptin",
  "ghrp", "igf", "selank", "semax", "epitalon", "epithalon", "melanotan",
  "gh frag", "aod", "ss-31", "mots-c", "humanin", "fgl",
  "retatrutide", "triptorelin", "hexarelin", "tesamorelin", "tesa-",
  "peptide yy", "gip", "glp", "oxytocin", "ll-37",
  // Added 2026-07-17, found auditing Orbitrex: Khavinson bioregulator peptides
  // (short synthetic peptides, distinct from GLP-1/GH-axis compounds above)
  // and other real compounds the original list simply never included.
  "ghk-cu", "kpv", "dsip", "ara-290", "bronchogen", "pinealon", "vilon",
  "cartalax", "foxo4", "survodutide", "mt-1", "mt-ii", "mt-2", "vip",
  "glow", "klow",
  // Added 2026-07-17, found auditing the rest of the vendor pool: real
  // compounds that recur across many independent vendors (Cagrilintide and
  // Mazdutide especially — both missing meant every vendor selling them
  // showed zero for two of the most common GLP-1-adjacent compounds sold).
  // Also the rest of the Khavinson bioregulator family beyond what Orbitrex
  // surfaced — Testagen/Cardiogen/Livagen/etc. are a well-established
  // product line multiple vendors carry, not one-off names.
  "cagrilintide", "mazdutide", "setmelanotide", "thymulin", "thymalin",
  "thymogen", "thymagen", "pnc-27", "ace-031", "follistatin", "gonadorelin",
  "ahk-cu", "snap-8", "snap8", "pe-22-28", "pe 22-28", "b7-33", "klotho",
  "cerebrolysin", "vesugen", "chonluten", "livagen", "prostamax", "cortagen",
  "ovagen", "cardiogen", "testagen", "adipotide", "176-191", "mgf",
  "protirelin", "dihexa", "hgh", "hcg", "hmg", "tb4", "tb 4",
  // Cross-vendor recurring name (Orbitrex, Skye, Verified, NexTech, RUO,
  // True Research Labs all carry it) — composition unconfirmed but too
  // consistent across independently-run stores to be vendor-specific noise.
  "adamax",
];

// Known non-peptide items vendors commonly list alongside their peptide
// catalog — merch, reconstitution supplies, SARMs, and other research
// chemicals that are NOT peptides, not research compounds.
// Checked first so an exact non-peptide match never falls through to the
// "unmatched, log for review" path below and clutter it.
const KNOWN_NON_PEPTIDES = [
  "tee", "hoodie", "towel", "shaker bottle", "water bottle",
  "bacteriostatic water", "bacteriostic water", "bac water", "sterile water",
  "acetic acid", "saline", "gift card", "sticker", "keychain",
  "snapback", "tank top", "long sleeve", "polo", "premium packaging",
  "storage case", "vial storage", "loyalty reward", "shipping", "priority processing",
  "customs invoice", "custom invoice", "milestone badge", "promotional product",
  "reconstitution solution", "reconstitution water", "research diluent",
  "mixing syringe", "empty air dispersal", "empty 10ml vial", "air dispersal kit",
  // Real compounds sold alongside peptides that are not themselves peptides
  // (cofactors/supplements/vitamins or small-molecule drugs) — excluded
  // deliberately, not missing keywords.
  "nad+", "glutathione", "l-carnitine", "tesofensine", "5-amino-1mq",
  "5-amino 1mq", "5 amino 1mq", "slu-pp-332", "slu-pp 332", "slu pp 332",
  "botox", "lemon bottle", "methylene blue", "polyethylene glycol", "peg-400",
  "b12", "methylcobalamin", "vitamin d", "vitamin b", "curcumin", "melatonin",
  "aicar",
  // SARMs — small-molecule androgen receptor ligands, not peptides, despite
  // being sold by the same vendors as a matter of course. Deliberately not
  // including bare "S4"/"NAD" here (checked separately above) — too short,
  // real risk of matching inside an unrelated peptide name (e.g.
  // "Gonadorelin" contains "nad"); classifyProduct checks the peptide list
  // first so this only matters for names no real-peptide keyword already
  // caught, but the safer failure mode is "left unmatched for review", not
  // "silently misclassified as non-peptide".
  "rad-140", "rad-150", "tlb-150", "lgd-4033", "ligandrol", "mk-677",
  "ibutamoren", "ostarine", "mk-2866", "cardarine", "gw-501516", "sr-9009",
  "sr-9011", "stenabolic", "yk-11", "andarine", "s23", "ru-58841",
  "ru58841", "ac-262", "accadrine", "testolone",
];

// Compact form (letters/digits only) used for matching so hyphen/space
// variants of the same name (PT-141 vs "PT 141", SNAP-8 vs "SNAP8") match
// without enumerating every punctuation variant per keyword.
function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+]/g, "");
}

export function isPeptideProduct(name: string): boolean {
  const c = compact(name);
  return KNOWN_PEPTIDES.some((kw) => c.includes(compact(kw)));
}

export function isKnownNonPeptide(name: string): boolean {
  const c = compact(name);
  return KNOWN_NON_PEPTIDES.some((kw) => c.includes(compact(kw)));
}

// Names that matched neither list — logged instead of silently dropped, so
// an unrecognized product (a new compound, a vendor's proprietary blend
// name) shows up for a human to classify instead of vanishing with no
// trace. This was the actual bug behind Orbitrex showing 2 products when it
// really sells ~60+: the old allow-list dropped everything it didn't
// recognize with zero signal that anything had been skipped.
export const unmatchedNames = new Map<string, string[]>(); // vendor slug -> names

export function classifyProduct(vendorSlug: string, name: string): "peptide" | "non-peptide" | "unmatched" {
  if (isPeptideProduct(name)) return "peptide";
  if (isKnownNonPeptide(name)) return "non-peptide";
  const list = unmatchedNames.get(vendorSlug) ?? [];
  list.push(name);
  unmatchedNames.set(vendorSlug, list);
  return "unmatched";
}
