/**
 * Adds structured loading_phase / maintenance_phase to TB-500
 * and marks GLP-3/Retatrutide with escalation_protocol: true.
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/add-loading-protocols.ts
 */
import { db } from "./lib/client.js";

async function main() {
  // ── TB-500: loading + maintenance structured fields ──────────────────────
  {
    const { data, error: fetchErr } = await db
      .from("peptides").select("slug,dosage").eq("slug", "tb-500").single();
    if (fetchErr || !data) { console.error("tb-500 not found"); }
    else {
      const dosage = data.dosage as any;
      dosage.loading_phase = {
        range: "2–2.5 mg",
        frequency: "Twice per week",
        duration_weeks: { min: 4, max: 6 },
      };
      dosage.maintenance_phase = {
        range: "1–2 mg",
        frequency: "Once per week",
      };
      const { error } = await db.from("peptides").update({ dosage }).eq("slug", "tb-500");
      if (error) console.error("tb-500:", error.message);
      else console.log("✓ tb-500: loading_phase + maintenance_phase added");
    }
  }

  // ── GLP-3/Retatrutide: escalation flag ───────────────────────────────────
  {
    const { data, error: fetchErr } = await db
      .from("peptides").select("slug,dosage").eq("slug", "glp-3-r").single();
    if (fetchErr || !data) { console.error("glp-3-r not found"); }
    else {
      const dosage = data.dosage as any;
      dosage.escalation_protocol = true;
      const { error } = await db.from("peptides").update({ dosage }).eq("slug", "glp-3-r");
      if (error) console.error("glp-3-r:", error.message);
      else console.log("✓ glp-3-r: escalation_protocol = true");
    }
  }

  console.log("Done.");
}

main();
