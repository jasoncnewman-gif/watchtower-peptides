import { db } from "./lib/client.js";

async function main() {
  const { data } = await db.from('peptides')
    .select('slug,name,dosage')
    .in('slug', ['tb-500', 'glp-3-r', 'melanotan-1']);
  for (const p of data ?? []) {
    console.log(`\n=== ${p.slug} ===`);
    const d = p.dosage as any;
    if (d?.loading_phase)      console.log("loading_phase:", JSON.stringify(d.loading_phase));
    if (d?.maintenance_phase)  console.log("maintenance_phase:", JSON.stringify(d.maintenance_phase));
    if (d?.escalation_protocol) console.log("escalation_protocol:", d.escalation_protocol);
    if (d?.ranges)              console.log("ranges[0].route:", d.ranges[0]?.route, "| ranges[1].route:", d.ranges[1]?.route ?? "—");
  }
}
main();
