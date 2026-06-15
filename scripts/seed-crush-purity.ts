import * as https from "https";
import { db } from "./lib/client.js";

function fetchText(url: string, depth = 0): Promise<string> {
  if (depth > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity" } }, res => {
      if ([301,302,307,308].includes(res.statusCode!)) {
        const loc = res.headers.location || "";
        resolve(fetchText(loc.startsWith("http") ? loc : new URL(loc, url).href, depth + 1));
        return;
      }
      let body = "";
      res.on("data", (c: any) => body += c);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

function slugToName(slug: string): string {
  return slug
    .replace(/-\d+mg.*$/, "")
    .replace(/-vial$/, "")
    .split("-")
    .map(w => w.length <= 4 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  const dryRun = process.argv[2] === "--dry-run";
  const raw = await fetchText("https://crushresearch.shop/testing");

  // Unescape the double-escaped JSON
  const html = raw.replace(/\\"/g, '"').replace(/\\n/g, " ").replace(/\\t/g, " ");

  // Extract objects containing averagePurity
  const re = /"productSlug":"([^"]+)"[^}]*?"batchNumber":"([^"]*)"[^}]*?"dateTested":"([^"]*)"[^}]*?"averagePurity":"([\d.]+)%"/g;
  const rows: { peptide: string; purity: number; batch: string; date: string }[] = [];
  const seen = new Set<string>();

  for (const m of html.matchAll(re)) {
    const [, productSlug, batch, date, purityStr] = m;
    const purity = parseFloat(purityStr);
    const peptide = slugToName(productSlug);
    const key = batch || `${peptide}-${date}-${purity}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ peptide, purity, batch, date });
  }

  console.log(`Parsed ${rows.length} unique purity rows`);
  const byPeptide: Record<string, number[]> = {};
  for (const r of rows) {
    byPeptide[r.peptide] = byPeptide[r.peptide] ?? [];
    byPeptide[r.peptide].push(r.purity);
  }
  const avg = rows.length ? (rows.reduce((s, r) => s + r.purity, 0) / rows.length).toFixed(2) : "—";
  for (const [p, vals] of Object.entries(byPeptide).sort((a,b) => a[0].localeCompare(b[0]))) {
    const pavg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    console.log(`  ${p.padEnd(32)} ${vals.length}x  avg ${pavg}%`);
  }
  console.log(`\nOverall avg: ${avg}%`);

  if (dryRun) { console.log("[dry-run] Not inserting."); return; }

  const { data: vendor } = await db.from("vendors").select("id").eq("slug", "crush-research").single();
  if (!vendor) { console.error("Vendor not found"); return; }

  await db.from("lab_tests").delete().eq("vendor_id", vendor.id).eq("test_source", "crushresearch-2026-06-15");

  const inserts = rows.map(r => ({
    vendor_id:    vendor.id,
    peptide_name: r.peptide,
    batch_number: r.batch || null,
    test_date:    r.date || null,
    purity_result: r.purity,
    test_type:    "HPLC",
    lab_name:     "Unattributed",
    test_source:  "crushresearch-2026-06-15",
  }));

  const { error } = await db.from("lab_tests").insert(inserts);
  if (error) { console.error("Insert error:", error.message); return; }
  console.log(`Inserted ${inserts.length} rows.`);

  await db.from("vendors").update({ last_reviewed: new Date().toISOString().slice(0, 10) }).eq("slug", "crush-research");
}

main().catch(console.error);
