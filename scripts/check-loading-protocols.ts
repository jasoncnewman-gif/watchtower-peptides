import { db } from "./lib/client.js";

async function main() {
  const { data, error } = await db
    .from("peptides")
    .select("name, slug, dosage, blend_components")
    .order("name");

  if (error) { console.error(error); process.exit(1); }

  const nonBlends = data!.filter((p: any) => !p.blend_components || p.blend_components.length === 0);

  const withLoading: any[]    = [];
  const multipleRanges: any[] = [];

  for (const p of nonBlends) {
    const ranges = p.dosage?.ranges ?? [];
    const allText = JSON.stringify(p.dosage).toLowerCase();
    const hasLoadingKeyword = allText.includes("loading") || allText.includes("maintenance") || allText.includes("taper");

    if (ranges.length > 1) multipleRanges.push(p);
    if (hasLoadingKeyword) withLoading.push({ name: p.name, ranges: ranges.length, notes: ranges.map((r: any) => `[${r.range}] ${r.notes ?? ""}`.slice(0, 100)) });
  }

  console.log(`\n--- PEPTIDES WITH LOADING/MAINTENANCE KEYWORD (${withLoading.length}) ---`);
  withLoading.forEach(p => {
    console.log(`\n  ${p.name} (${p.ranges} range(s))`);
    p.notes.forEach((n: string) => console.log(`    ${n}`));
  });

  console.log(`\n--- PEPTIDES WITH MULTIPLE RANGES IN DB (${multipleRanges.length}) ---`);
  multipleRanges.forEach((p: any) => console.log(`  ${p.name}: ${p.dosage.ranges.length} ranges`));
}
main();
