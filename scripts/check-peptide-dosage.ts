import { db } from "./lib/client.js";

async function main() {
  const { data, error } = await db
    .from("peptides")
    .select("name, slug, category, dosage, blend_components")
    .order("name");

  if (error) { console.error(error); process.exit(1); }

  const withDosage    = data!.filter((p: any) => p.dosage && p.dosage.ranges?.length > 0);
  const withoutDosage = data!.filter((p: any) => !p.dosage || !p.dosage.ranges?.length);
  const blends        = data!.filter((p: any) => p.blend_components);

  console.log(`Total: ${data!.length} | With dosage: ${withDosage.length} | Without: ${withoutDosage.length} | Blends: ${blends.length}`);
  console.log("\n--- WITH DOSAGE ---");
  withDosage.forEach((p: any) => console.log(`  ${p.name} [${p.category}]: ${JSON.stringify(p.dosage?.ranges?.[0]?.range)}`));
  console.log("\n--- WITHOUT DOSAGE (first 20) ---");
  withoutDosage.slice(0, 20).forEach((p: any) => console.log(`  ${p.name} [${p.category}]`));
}
main();
