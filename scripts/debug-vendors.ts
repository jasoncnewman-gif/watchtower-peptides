import { db } from "./lib/client.js"
async function main() {
  const { data } = await db.from("vendors").select("name, slug, status, website").order("status").order("name")
  for (const v of data ?? [])
    console.log(v.status.padEnd(18) + v.name.padEnd(32) + (v.website || "(none)"))
}
main()
