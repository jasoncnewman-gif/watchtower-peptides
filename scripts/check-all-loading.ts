import { db } from "./lib/client.js";

async function main() {
  const { data } = await db
    .from("peptides")
    .select("name, slug, dosage, blend_components")
    .order("name");

  const nonBlends = (data as any[]).filter(p => !p.blend_components || p.blend_components.length === 0);

  console.log(`\nChecking all ${nonBlends.length} non-blend peptides for loading protocol mentions...\n`);

  const keywords = ["loading", "maintenance", "taper", "escalat", "titrat", "ramp", "week 1", "phase"];

  for (const p of nonBlends) {
    const allText = JSON.stringify(p.dosage ?? "").toLowerCase();
    const found = keywords.filter(k => allText.includes(k));
    if (found.length > 0) {
      const ranges = p.dosage?.ranges ?? [];
      console.log(`${p.name}  [keywords: ${found.join(", ")}]`);
      ranges.forEach((r: any, i: number) => {
        console.log(`  range[${i}]: ${r.range} | ${r.frequency} | ${(r.notes ?? "").slice(0, 100)}`);
      });
      console.log();
    }
  }
}
main();
