/**
 * Fix dosage range strings for peptides that were either dropped or parsed
 * incorrectly by the calculator due to mixed units, IU, or "→" escalation format.
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/fix-peptide-dosage-ranges.ts
 */
import { db } from "./lib/client.js";

const FIXES: Array<{ slug: string; rangeUpdate: string; routeUpdate?: string; notesUpdate?: string }> = [
  // Dropped — no mcg/mg unit parseable
  { slug: "ghk-cu",   rangeUpdate: "1000–2000 mcg", routeUpdate: "Subcutaneous injection", notesUpdate: "1–2 mg/day. Start at 1 mg daily × 4 weeks, increase to 2 mg if tolerated. 5 days on / 2 off." },
  { slug: "oxytocin", rangeUpdate: "100–500 mcg",   routeUpdate: "Subcutaneous injection", notesUpdate: "SubQ injection only. Does not cross blood-brain barrier — intranasal preferred for CNS effects. Start at 100 mcg, titrate up." },

  // Mixed units "500 mcg – 1 mg" → collapsed to single value
  { slug: "fragment-176-191",   rangeUpdate: "250–500 mcg",  notesUpdate: "Twice daily fasted protocol (AM + pre-sleep). Weight-based: 2 mcg/kg/day. Standard flat dose: 250–500 mcg/day." },
  { slug: "kpv",                rangeUpdate: "200–500 mcg",  notesUpdate: "Start at 200 mcg/day × 1 week, increase to 500 mcg. 5 days on / 2 off. Cycle 8 weeks on / 8 off." },
  { slug: "tb-500-frag-17-23",  rangeUpdate: "500–2000 mcg", notesUpdate: "500 mcg – 2 mg twice weekly. Shorter active fragment of TB-500; lower dose achieves similar systemic distribution." },

  // Escalation format "0.25 mg → 2.4 mg" → parser only caught start value
  { slug: "semaglutide",  rangeUpdate: "0.25–2.4 mg", notesUpdate: "Fixed weekly escalation: 0.25 mg × 4 wks → 0.5 mg × 4 wks → 1.0 mg × 4 wks → 1.7 mg × 4 wks → 2.4 mg maintenance. Dose represents start–maintenance range, not a body-weight calculation." },
  { slug: "glp-1-s",      rangeUpdate: "0.25–2.4 mg", notesUpdate: "Fixed weekly escalation: 0.25 mg × 4 wks → 0.5 mg × 4 wks → 1.0 mg × 4 wks → 1.7 mg × 4 wks → 2.4 mg maintenance." },
  { slug: "glp-2-t",      rangeUpdate: "2.5–15 mg",   notesUpdate: "Fixed weekly escalation: 2.5 mg × 4 wks → 5 mg → 7.5 mg → 10 mg → 12.5 mg → 15 mg maintenance." },
  { slug: "tirzepatide",  rangeUpdate: "2.5–15 mg",   notesUpdate: "Fixed weekly escalation: 2.5 mg × 4 wks → 5 mg → 7.5 mg → 10 mg → 12.5 mg → 15 mg maintenance." },
];

async function main() {
  for (const fix of FIXES) {
    const { data, error: fetchErr } = await db
      .from("peptides")
      .select("slug, dosage")
      .eq("slug", fix.slug)
      .single();

    if (fetchErr || !data) {
      console.error(`  ✗ ${fix.slug}: not found`);
      continue;
    }

    const dosage = data.dosage as any;
    if (!dosage?.ranges?.[0]) {
      console.error(`  ✗ ${fix.slug}: no dosage.ranges[0] to update`);
      continue;
    }

    dosage.ranges[0].range = fix.rangeUpdate;
    if (fix.routeUpdate) dosage.ranges[0].route  = fix.routeUpdate;
    if (fix.notesUpdate) dosage.ranges[0].notes  = fix.notesUpdate;

    const { error: updateErr } = await db
      .from("peptides")
      .update({ dosage })
      .eq("slug", fix.slug);

    if (updateErr) {
      console.error(`  ✗ ${fix.slug}: ${updateErr.message}`);
    } else {
      console.log(`  ✓ ${fix.slug}: "${fix.rangeUpdate}"`);
    }
  }
  console.log("Done.");
}

main();
