import { db } from "./lib/client.js";

async function main() {
  const today = "2026-06-15";
  const slugs = ["crush-research", "licensed-peptides", "biotech-peptides", "penguin-peptides", "core-peptides"];

  const { error } = await db.from("vendors").update({ last_reviewed: today }).in("slug", slugs);
  if (error) { console.error(error); process.exit(1); }
  console.log(`Updated last_reviewed = ${today} for: ${slugs.join(", ")}`);
}

main().catch(console.error);
