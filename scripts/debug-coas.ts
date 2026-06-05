import { db } from "./lib/client.js"
async function main() {
  const { count } = await db.from("lab_tests").select("*", { count: "exact", head: true })
  console.log("lab_tests rows:", count)
  const { data } = await db.from("vendors").select("name, has_coa").eq("has_coa", true).order("name")
  console.log("Vendors with COA:", data?.length)
  for (const v of data ?? []) console.log("  " + v.name)
}
main()
