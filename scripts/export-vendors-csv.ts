import { db } from "./lib/client.js"
import { writeFileSync } from "fs"
import { resolve } from "path"

async function main() {
  const { data } = await db
    .from("vendors")
    .select("name, slug, status, website, overall_score, has_coa, verdict, notes")
    .order("status")
    .order("name")

  const rows = [
    ["Vendor", "Domain", "Current Status", "Score", "COA", "Notes / Action Needed"],
    ...(data ?? []).map(v => [
      v.name,
      v.website || "",
      v.status,
      v.overall_score != null ? String(v.overall_score) : "",
      v.has_coa ? "Yes" : "No",
      v.notes || "",
    ])
  ]

  const csv = rows.map(r =>
    r.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
     .join(",")
  ).join("\n")

  const outPath = resolve(process.cwd(), "vendor-review.csv")
  writeFileSync(outPath, csv, "utf8")
  console.log(`Written to: ${outPath}`)
}
main()
