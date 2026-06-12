import { db } from "./lib/client.js";

function parseRange(str: string): { low: number; high: number; unit: string } | null {
  const m = str.match(/(\d+\.?\d*)\s*(?:[-–]|→)\s*(\d+\.?\d*)\s*(mcg|mg)/i);
  if (!m) {
    const s = str.match(/(\d+\.?\d*)\s*(mcg|mg)/i);
    if (!s) return null;
    const v = parseFloat(s[1]);
    return { low: v, high: v, unit: s[2].toLowerCase() };
  }
  return { low: parseFloat(m[1]), high: parseFloat(m[2]), unit: m[3].toLowerCase() };
}

async function main() {
  const { data, error } = await db.from("peptides").select("name, slug, category, dosage, blend_components").order("name");
  if (error) { console.error(error); process.exit(1); }

  const nonBlends = data!.filter((p: any) => !p.blend_components || p.blend_components.length === 0);
  
  const passes: any[]  = [];
  const dropped: any[] = [];

  for (const p of nonBlends) {
    const range  = p.dosage?.ranges?.[0];
    const parsed = range?.range ? parseRange(range.range) : null;
    const doseHigh = parsed?.high ?? 0;
    const hasProtocol = !!(p.dosage?.disclaimer || range?.notes);

    if (doseHigh > 0) {
      passes.push({ name: p.name, range: range?.range, parsed, hasProtocol, notes: range?.notes?.slice(0, 60), disclaimer: p.dosage?.disclaimer?.slice(0, 60) });
    } else {
      dropped.push({ name: p.name, range: range?.range });
    }
  }

  console.log(`\n✓ PASSES FILTER (${passes.length} peptides):`);
  passes.forEach(p => {
    const protocolFlag = p.hasProtocol ? "" : "  ← NO PROTOCOL DATA";
    console.log(`  ${p.name}: ${p.parsed?.low}–${p.parsed?.high} ${p.parsed?.unit}${protocolFlag}`);
  });

  console.log(`\n✗ DROPPED - unparseable range (${dropped.length} peptides):`);
  dropped.forEach(p => console.log(`  ${p.name}: "${p.range}"`));
}
main();
