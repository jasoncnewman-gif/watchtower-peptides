import { db } from "./lib/client.js";
async function main() {
  const { data } = await db.from("vendors").select("slug, website, login_email, login_username, login_password, login_path, coa_url, is_gated").in("slug", ["penguin-peptides", "core-peptides", "biotech-peptides"]);
  console.log(JSON.stringify(data, null, 2));
}
main();
