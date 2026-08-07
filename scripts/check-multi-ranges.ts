import { db } from "./lib/client.js";

async function main() {
  const { data } = await db
    .from("peptides")
    .select("name, dosage")
    .in("slug", ["bpc-157","dihexa","epithalon","ghk-cu","kpv","ll-37","melanotan-i","selank","semax","tb-500"])
    .order("name");

  for (const p of data!) {
    console.log(`\n=== ${(p as any).name} ===`);
    for (const [i, r] of ((p as any).dosage?.ranges ?? []).entries()) {
      console.log(`  [${i}] route: ${r.route}`);
      console.log(`       range: ${r.range}`);
      console.log(`       freq:  ${r.frequency}`);
      console.log(`       notes: ${(r.notes ?? "").slice(0, 120)}`);
    }
  }
}
main();
