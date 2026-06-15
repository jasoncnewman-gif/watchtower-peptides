import { db } from "./lib/client.js";
async function main() {
  const { data } = await db.from("vendors").select("slug, overall_score, verdict").in("slug", ["core-peptides", "penguin-peptides", "biotech-peptides"]);
  for (const v of data ?? []) {
    console.log(`\n=== ${v.slug} (${v.overall_score}) ===`);
    console.log(v.verdict ?? "(no verdict)");
  }
}
main();
