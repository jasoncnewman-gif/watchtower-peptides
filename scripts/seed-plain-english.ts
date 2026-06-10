/**
 * scripts/seed-plain-english.ts
 * Populates the plain_english column for all 60 peptide profiles.
 * Run after applying migration_012.sql in Supabase SQL Editor.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-plain-english.ts
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-plain-english";

const ENTRIES: { slug: string; plain_english: string }[] = [

  // ── Healing ──────────────────────────────────────────────────────────────

  { slug: "bpc-157",
    plain_english: "A synthetic peptide originally found in stomach acid, studied for its ability to accelerate healing in tendons, ligaments, muscle, gut lining, and bone. It promotes the growth of new blood vessels into damaged tissue — one of the leading proposed mechanisms for its repair effects. One of the most researched peptides in the animal model literature for tissue recovery." },

  { slug: "tb-500",
    plain_english: "A synthetic version of the active fragment of Thymosin Beta-4, a protein found in nearly every cell in the body. Studied for tissue repair, reducing inflammation, improving flexibility, and supporting recovery from injury. Often researched alongside BPC-157 as a complementary healing stack." },

  { slug: "ghk-cu",
    plain_english: "A copper-binding tripeptide that occurs naturally in human blood and tissue, declining significantly with age. Studied for skin regeneration, wound healing, collagen production, and anti-inflammatory effects. Commonly used in topical skin care and researched systemically for tissue repair." },

  { slug: "kpv",
    plain_english: "A three-amino-acid peptide that mimics a fragment of the natural hormone alpha-MSH. Studied for potent anti-inflammatory effects, particularly in the gut lining, and for its ability to shut down the NF-κB inflammatory pathway — one of the body's central inflammation switches." },

  { slug: "tb-500-frag-17-23",
    plain_english: "The smallest active portion of TB-500 — a seven-amino-acid sequence that retains much of the tissue-repair and cell-migration activity of the full fragment. Studied for its role in regulating actin, a protein essential to cell movement and wound closure." },

  { slug: "cartalax",
    plain_english: "A four-amino-acid peptide derived from cartilage tissue, studied for stimulating cartilage cell production and slowing age-related cartilage degradation. Developed by the Khavinson group in Russia as part of a class of organ-specific peptide bioregulators." },

  // ── Hormones ─────────────────────────────────────────────────────────────

  { slug: "cjc-1295",
    plain_english: "A modified version of the natural growth hormone-releasing hormone (GHRH), engineered to stay active for about 30 minutes instead of the natural few minutes. Typically combined with a GHRP like Ipamorelin, where it extends the duration of each GH pulse rather than acting alone." },

  { slug: "cjc-1295-no-dac",
    plain_english: "The same compound as CJC-1295 — a short-acting GHRH analog with a ~30-minute half-life that promotes pulsatile growth hormone release. Vendors add \"(No DAC)\" to the name to distinguish it from the long-acting CJC-1295 with DAC version, which is a chemically different molecule." },

  { slug: "cjc-1295-dac",
    plain_english: "CJC-1295 with a chemical attachment — the Drug Affinity Complex (DAC) — that hooks it to albumin in the blood, extending its active duration from ~30 minutes to approximately 6–8 days. Unlike CJC-1295 without DAC, which produces brief GH pulses, this version produces a continuous low-level GH elevation throughout the week — a fundamentally different effect." },

  { slug: "ipamorelin",
    plain_english: "A synthetic peptide that triggers growth hormone release by activating the ghrelin receptor — but selectively, without significantly raising cortisol, prolactin, or appetite like older GHRPs do. Widely considered the cleanest GH secretagogue available and commonly combined with CJC-1295." },

  { slug: "sermorelin",
    plain_english: "A synthetic version of the first 29 amino acids of growth hormone-releasing hormone (GHRH) — the natural signal your brain sends to the pituitary to release GH. Studied as an approach to stimulating the body's own GH production rather than administering GH directly, with a more physiological release pattern." },

  { slug: "tesamorelin",
    plain_english: "A stabilized GHRH analog and the only FDA-approved therapy based on this mechanism — approved for reducing abnormal abdominal fat in HIV patients. Produces strong GH and IGF-1 elevation with one of the most extensively characterized clinical safety profiles of any GH-stimulating peptide." },

  { slug: "ghrp-2",
    plain_english: "A synthetic peptide that stimulates GH release through the ghrelin receptor — a different pathway than GHRH analogs like CJC-1295. Produces strong GH output but also moderately elevates cortisol and prolactin. Most commonly used in combination with a GHRH analog for synergistic GH stimulation." },

  { slug: "ghrp-6",
    plain_english: "A GH-stimulating peptide similar to GHRP-2 in its effect, but with a notably stronger appetite-stimulating side effect that's often deliberately leveraged in body composition research. Produces cortisol and prolactin elevation similar to GHRP-2." },

  { slug: "hexarelin",
    plain_english: "One of the most potent synthetic peptides for stimulating GH release — stronger than Ipamorelin or GHRP-2 in GH output. Also studied separately for cardiac-protective effects that appear independent of GH, though it desensitizes the receptor more readily than other GHRPs with extended use." },

  { slug: "ipamorelin",
    plain_english: "A selective growth hormone secretagogue that triggers GH release without significantly raising cortisol, prolactin, or appetite — a cleaner profile than GHRP-2 or GHRP-6. Widely studied and the most commonly combined GHRP in CJC-1295 stacks." },

  { slug: "igf-1-lr3",
    plain_english: "A modified version of IGF-1 (insulin-like growth factor 1) with altered binding protein affinity that extends its activity from minutes to approximately 20–30 hours. Studied for muscle development, cellular growth, and metabolic effects — the long-acting modification makes it meaningfully more potent than native IGF-1 in research models." },

  { slug: "kisspeptin",
    plain_english: "A neuropeptide produced in the hypothalamus that acts as the master upstream regulator of the reproductive hormone axis. It triggers LH and FSH release from the pituitary, which in turn drive testosterone and estrogen production. Studied for hormone restoration and fertility research." },

  { slug: "kisspeptin-10",
    plain_english: "The active C-terminal fragment of kisspeptin — functionally equivalent to the full molecule for reproductive hormone stimulation. Studied for the same LH/FSH-triggering effects and used interchangeably with kisspeptin in most research protocols." },

  { slug: "mk-677",
    plain_english: "An orally active compound that mimics ghrelin to stimulate growth hormone release from the pituitary. Unlike peptide GHRPs, it's taken as a capsule or tablet and stays active for approximately 24 hours — making it the only GH secretagogue that doesn't require injection." },

  { slug: "oxytocin",
    plain_english: "A naturally produced brain hormone often called the \"bonding hormone\" for its role in social connection, trust, and maternal behavior. Studied for anxiety reduction, autism spectrum disorder, post-traumatic stress, and social cognition — effects distinct from its better-known role in childbirth and breastfeeding." },

  { slug: "pt-141",
    plain_english: "An FDA-approved peptide (brand name Vyleesi) for female hypoactive sexual desire disorder. Works through the brain's melanocortin system to increase sexual desire — a fundamentally different mechanism from treatments that target blood flow, making it effective where those fail. Also studied in men for erectile dysfunction." },

  { slug: "pt-141-bremelanotide",
    plain_english: "The same compound as PT-141 — bremelanotide is the generic pharmaceutical name for the same FDA-approved molecule. Some vendors list the generic name rather than the shorthand." },

  // ── Metabolic ────────────────────────────────────────────────────────────

  { slug: "semaglutide",
    plain_english: "The active ingredient in Ozempic and Wegovy — one of the most widely prescribed medications in the world. An FDA-approved GLP-1 receptor agonist that reduces appetite, slows stomach emptying, and produces consistent ~15% body weight reduction in large clinical trials. Also has proven cardiovascular and kidney-protective benefits." },

  { slug: "tirzepatide",
    plain_english: "The active ingredient in Mounjaro and Zepbound. An FDA-approved drug that activates two appetite-regulating pathways simultaneously (GLP-1 and GIP), producing approximately 20–22% body weight reduction — greater than semaglutide in head-to-head trials, and currently one of the most effective approved treatments for obesity." },

  { slug: "retatrutide",
    plain_english: "An investigational drug in Phase 3 clinical trials that activates three metabolic hormone pathways at once — GLP-1, GIP, and glucagon receptors. Has demonstrated approximately 24% body weight reduction over 48 weeks, the largest of any obesity drug studied to date. Not yet FDA-approved." },

  { slug: "aod-9604",
    plain_english: "A fragment of human growth hormone (amino acids 176–191) that retains GH's fat-metabolism effects without affecting blood sugar or stimulating growth. Studied as a targeted approach to fat reduction — the \"AOD\" stands for \"anti-obesity drug\" from its original development context." },

  { slug: "fragment-176-191",
    plain_english: "The same C-terminal fragment of GH as AOD-9604 — a 16-amino-acid sequence studied for its ability to stimulate fat breakdown and inhibit fat storage without the glucose or growth-stimulating effects of full growth hormone." },

  { slug: "mots-c",
    plain_english: "A peptide encoded within mitochondrial DNA — the genetic material inside the cell's energy-producing organelles. Studied for improving insulin sensitivity, metabolic flexibility, and exercise endurance, and linked to longevity in research on centenarian populations." },

  { slug: "glp-1-s",
    plain_english: "Vendor shorthand for Semaglutide, the active ingredient in Ozempic and Wegovy. An FDA-approved GLP-1 receptor agonist that reduces appetite and slows digestion, producing consistent and clinically significant weight loss." },

  { slug: "glp-2-t",
    plain_english: "Vendor shorthand for Tirzepatide, sold as Mounjaro and Zepbound. An FDA-approved dual-action drug targeting both GLP-1 and GIP receptors, producing weight loss that exceeds semaglutide in head-to-head clinical comparisons." },

  { slug: "glp-3-r",
    plain_english: "Vendor shorthand for Retatrutide, currently in Phase 3 trials. Acts on three metabolic pathways simultaneously — GLP-1, GIP, and glucagon — with approximately 24% body weight reduction in trials, the highest of any obesity drug studied to date." },

  // ── Brain & Longevity ────────────────────────────────────────────────────

  { slug: "selank",
    plain_english: "A synthetic peptide developed by Russian scientists based on a natural immune peptide called Tuftsin. Studied for anxiety reduction and mild cognitive enhancement, with a calming effect that doesn't produce sedation or dependence — distinct from benzodiazepines in both mechanism and risk profile." },

  { slug: "n-acetyl-selank",
    plain_english: "A chemically modified version of Selank with greater enzymatic stability, allowing it to remain active longer in the body. Has the same anxiety-reducing and cognitive-enhancing research profile as standard Selank and is the preferred form for research." },

  { slug: "semax",
    plain_english: "A synthetic peptide derived from a portion of ACTH (a pituitary hormone), developed and studied primarily in Russia. Researched for cognitive enhancement, neuroprotection after stroke or brain injury, and BDNF stimulation in the brain's learning and memory centers." },

  { slug: "n-acetyl-semax",
    plain_english: "A stabilized, more potent form of Semax that crosses the blood-brain barrier more effectively than the unmodified version. The preferred form in contemporary nootropic research, with the same neuroprotective and cognitive-enhancement profile as Semax at lower effective doses." },

  { slug: "epithalon",
    plain_english: "A four-amino-acid peptide derived from the pineal gland and studied extensively by Russian researcher Vladimir Khavinson for its effects on telomere elongation, melatonin production, and lifespan extension. One of the most studied anti-aging peptides in the Russian bioregulator research tradition." },

  { slug: "humanin",
    plain_english: "A small peptide encoded within mitochondrial DNA that declines naturally with aging. Studied for protecting neurons and heart cells from damage, improving insulin sensitivity, and its correlation with longevity — family members of centenarians have been found to have significantly higher humanin levels." },

  { slug: "ss-31",
    plain_english: "A tiny four-amino-acid peptide that selectively concentrates in the inner membrane of mitochondria — the cell's energy factories. Studied for protecting mitochondrial function from oxidative damage, with clinical trials underway for heart failure, kidney disease, and age-related energy decline." },

  { slug: "dihexa",
    plain_english: "A research compound derived from angiotensin IV — a brain hormone — that promotes the formation of new synaptic connections in the hippocampus, the brain's memory center. Studies suggest it's approximately seven orders of magnitude more potent than BDNF in promoting synaptogenesis, making it the most potent cognitive enhancer studied in this class." },

  { slug: "pinealon",
    plain_english: "A three-amino-acid peptide from the pineal gland, studied by Russian researchers for neuroprotection and slowing cognitive decline with aging. Part of the Khavinson group's class of organ-specific short peptide bioregulators, which target specific tissues to restore age-related gene expression changes." },

  { slug: "dsip",
    plain_english: "A neuropeptide originally isolated from rabbit cerebrospinal fluid that was found to induce slow-wave sleep when injected into animals. Also studied for stress regulation, cortisol modulation, and withdrawal support — though its sleep-inducing effects in humans are less consistent than the original animal findings suggested." },

  // ── Immune ───────────────────────────────────────────────────────────────

  { slug: "thymosin-alpha-1",
    plain_english: "A naturally occurring peptide produced by the thymus gland that modulates both innate and adaptive immunity. FDA-approved in multiple countries for hepatitis B, hepatitis C, and as a cancer treatment adjunct. Studied for its potential in immunodeficiency states and as an adjuvant to improve vaccine response." },

  { slug: "thymulin",
    plain_english: "A zinc-dependent thymic hormone that promotes T-cell development and immune function. Naturally produced by the thymus gland, it declines with age alongside the broader decline in immune competence — studied for reversing age-related immunosenescence and supporting immune system maintenance." },

  { slug: "ll-37",
    plain_english: "The only cathelicidin (antimicrobial peptide) naturally produced by humans. Released by immune cells at sites of infection or injury, it kills bacteria, viruses, and fungi directly while also modulating the inflammatory response and promoting tissue repair — a dual role as both antimicrobial and healing agent." },

  { slug: "melanotan-1",
    plain_english: "A synthetic version of alpha-MSH (alpha-melanocyte-stimulating hormone) that produces skin darkening by stimulating melanin production — without UV exposure. FDA-approved under the brand name Scenesse for erythropoietic protoporphyria, a rare disorder causing extreme sun sensitivity." },

  { slug: "melanotan-2",
    plain_english: "A synthetic hormone analog that produces tanning effects and also activates brain melanocortin receptors involved in sexual arousal and appetite. Not FDA-approved. Carries a meaningfully higher risk profile than Melanotan I due to its cyclic structure and broader receptor binding — including unsolicited erections and spontaneous tanning reactions." },

  // ── Blends ───────────────────────────────────────────────────────────────

  { slug: "glow-blend",
    plain_english: "A pre-combined three-peptide healing stack — BPC-157 for tissue repair and angiogenesis, TB-500 for flexibility and cell migration, and GHK-Cu for collagen production and skin regeneration. One of the most popular vendor-bundled stacks in the research peptide market, sold under several brand names." },

  { slug: "diamond-glow",
    plain_english: "A vendor-branded name for the GLOW formulation — GHK-Cu, TB-500, and BPC-157 combined in a single vial. The composition is identical to GLOW regardless of the brand name used." },

  { slug: "klow-blend",
    plain_english: "The GLOW stack (BPC-157, TB-500, GHK-Cu) with KPV added — a four-peptide stack that extends the healing profile to include targeted anti-inflammatory and gut-protective action. Designed for protocols where gut inflammation is a concern alongside systemic tissue repair." },

  { slug: "nova-klow",
    plain_english: "A vendor-branded name for the KLOW formulation — GHK-Cu, TB-500, BPC-157, and KPV in a single vial. The composition is identical to KLOW regardless of the brand name used." },

  { slug: "wolverine-cu-blend",
    plain_english: "A vendor-branded name for the KLOW four-peptide healing blend — GHK-Cu, BPC-157, TB-500, and KPV. The \"Cu\" in the name refers to the copper component of GHK-Cu. Composition is identical to KLOW." },

  { slug: "deadpool-blend",
    plain_english: "A healing blend that adds Cartalax — a cartilage-specific peptide — to the standard BPC-157 and TB-500 pairing. Targeted at joint and cartilage repair beyond what the base healing peptides address, and positioned for research into osteoarthritis and age-related joint degradation." },

  { slug: "isoflow",
    plain_english: "An anti-inflammatory and healing blend leading with KPV's gut and NF-κB targeting, combined with BPC-157 for tissue repair and GHK-Cu for collagen regeneration. Designed for protocols prioritizing gut health and systemic inflammation alongside broader healing." },

  { slug: "bpc-157-tb-500-blend",
    plain_english: "A pre-combined version of the two most researched healing peptides. BPC-157 focuses on local tissue repair and blood vessel formation while TB-500 supports cell migration, flexibility, and systemic recovery. Widely studied together as a comprehensive healing protocol." },

  { slug: "bpc-157-tb-500-ghk-cu-blend",
    plain_english: "A three-peptide healing stack combining BPC-157 (tissue repair), TB-500 (flexibility and recovery), and GHK-Cu (collagen and skin regeneration) in a single vial. Sold under brand names including GLOW, Diamond Glow, and others — the composition is the same regardless of name." },

  { slug: "cjc-1295-ipamorelin-blend",
    plain_english: "The most commonly sold GH secretagogue stack. CJC-1295 extends the duration of each GH release event while Ipamorelin adds a selective GH pulse without raising stress hormones or prolactin. Studied as the standard protocol for pulsatile GH optimization research." },

  { slug: "cjc-1295-ghrp-2-blend",
    plain_english: "A higher-output GH secretagogue stack pairing CJC-1295's GHRH action with GHRP-2's potent GHS-R agonism. Produces stronger GH output than the Ipamorelin version but with more cortisol and prolactin elevation — used when maximal GH stimulation is the research priority." },

  { slug: "cjc-1295-ghrp-6-blend",
    plain_english: "A GH secretagogue stack similar in output to CJC/GHRP-2 but with a significantly stronger appetite-stimulating effect. The hunger increase from GHRP-6 is often deliberately leveraged in research protocols focused on mass gain and caloric intake." },

  { slug: "mod-grf-1-29-ipamorelin-blend",
    plain_english: "Functionally identical to the CJC-1295 (No DAC) + Ipamorelin stack — different vendors use \"Mod GRF 1-29\" and \"CJC-1295 (No DAC)\" interchangeably for the same compound. The research profile and effects are identical." },

  { slug: "sermorelin-ipamorelin-blend",
    plain_english: "A gentler GH secretagogue stack that closely mimics natural pituitary signaling. Sermorelin's shorter action window combined with Ipamorelin's selective GH pulse is often described as the most physiologically appropriate approach to GH protocol research — more similar to natural GH rhythms than longer-acting combinations." },

];

async function main() {
  log(SCRIPT, `Seeding plain_english for ${ENTRIES.length} profiles…`);

  let ok = 0, failed = 0, notFound = 0;

  for (const entry of ENTRIES) {
    const { data, error } = await db
      .from("peptides")
      .update({ plain_english: entry.plain_english, updated_at: new Date().toISOString() })
      .eq("slug", entry.slug)
      .select("slug");

    if (error) {
      log(SCRIPT, `  ✗ ${entry.slug}: ${error.message}`);
      failed++;
    } else if (!data || data.length === 0) {
      log(SCRIPT, `  ? ${entry.slug}: not found in DB`);
      notFound++;
    } else {
      ok++;
    }
  }

  log(SCRIPT, `\nDone. ${ok} updated | ${failed} errors | ${notFound} not found`);
}

main().catch(console.error);
