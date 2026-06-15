import { db } from "./lib/client.js";

async function main() {
  const verdict = "Maxx Research Supply has no publicly verifiable information — no product catalog, pricing, lab testing, or company documentation is accessible through any source. The score of 5 reflects a data gap, not confirmed problems. We recommend waiting for more information before considering this vendor.";
  const { error } = await db.from("vendors").update({ verdict }).eq("slug", "maxx-research-supply");
  if (error) { console.error(error); process.exit(1); }
  console.log("Updated.");
}

main();
