import { db } from "./lib/client.js";
async function main() {
  const { data } = await db.from("peptides").select("name, slug").order("name");
  data?.filter((p: any) => p.name.toLowerCase().includes("fragment") || p.name.toLowerCase().includes("hgh") || p.name.toLowerCase().includes("tb-500")).forEach((p: any) => console.log(`"${p.slug}"  ${p.name}`));
}
main();
