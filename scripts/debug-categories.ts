import { db } from "./lib/client.js"

async function main() {
  const { data } = await db.from("peptides").select("category, name").order("category").order("name")
  const byCat: Record<string, string[]> = {}
  for (const r of data ?? []) {
    const c = r.category ?? "(none)"
    if (!byCat[c]) byCat[c] = []
    byCat[c].push(r.name)
  }
  for (const [cat, names] of Object.entries(byCat)) {
    console.log(`\n${cat} (${names.length})`)
    names.forEach(n => console.log(`  ${n}`))
  }
}
main()
