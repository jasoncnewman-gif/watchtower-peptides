import { db } from "./lib/client.js";

async function main() {
  const { data, error } = await db
    .from("vendors")
    .select("slug, verdict")
    .not("verdict", "is", null)
    .order("slug");
  if (error) { console.error(error); process.exit(1); }
  for (const v of data ?? []) {
    console.log(`\n=== ${v.slug} ===\n${v.verdict}`);
  }
}

main();
