import { db } from "./lib/client.js";
async function main() {
  // Check columns
  const { data } = await db.from("vendors").select("*").eq("slug", "penguin-peptides").maybeSingle();
  if (data) console.log("columns:", Object.keys(data));
}
main();
