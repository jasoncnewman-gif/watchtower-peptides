import { db } from "./lib/client.js";
async function main() {
  const { data, error } = await db.from("vendors").select("slug, website_url, username, password").in("slug", ["penguin-peptides", "core-peptides", "biotech-peptides"]);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));
}
main();
