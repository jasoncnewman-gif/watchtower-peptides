import { db } from "./lib/client.js";
import * as XLSX from "xlsx";
import * as path from "path";

async function main() {
const { data, error } = await db
  .from("vendors")
  .select("slug, name, overall_score, status, coa_audit_tier, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score, verdict, coa_audit_notes, coa_audited_at")
  .in("status", ["active", "flagged"])
  .order("overall_score", { ascending: false });

if (error) { console.error(error); process.exit(1); }

const rows = (data || []).map(v => ({
  "Vendor": v.name,
  "Score": v.overall_score ?? "",
  "Status": v.status,
  "COA Tier": v.coa_audit_tier != null ? `T${v.coa_audit_tier}` : "",
  "LV": v.lab_testing_score ?? "",
  "PQ": v.purity_accuracy_score ?? "",
  "TR": v.transparency_score ?? "",
  "CX": v.pricing_reliability_score ?? "",
  "Verdict": v.verdict ?? "",
  "Audit Notes": v.coa_audit_notes ?? "",
  "Audited At": v.coa_audited_at ? v.coa_audited_at.slice(0, 10) : "",
}));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// Column widths
ws["!cols"] = [
  { wch: 28 },  // Vendor
  { wch: 7 },   // Score
  { wch: 9 },   // Status
  { wch: 9 },   // COA Tier
  { wch: 5 },   // LV
  { wch: 5 },   // PQ
  { wch: 5 },   // TR
  { wch: 5 },   // CX
  { wch: 80 },  // Verdict
  { wch: 60 },  // Audit Notes
  { wch: 12 },  // Audited At
];

XLSX.utils.book_append_sheet(wb, ws, "Vendor Verdict Audit");

const outPath = path.join(process.cwd(), "vendor-verdict-audit.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`Written: ${outPath} (${rows.length} vendors)`);
}

main().catch(console.error);
