import { db } from "./lib/client.js";

async function main() {
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, slug, name, overall_score, status, coa_audit_tier, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score, verdict, coa_audit_notes, website, established_year")
    .in("status", ["active", "flagged"])
    .order("overall_score", { ascending: false });

  if (error) { console.error(error); process.exit(1); }

  const vendorIds = vendors!.map(v => v.id);

  const { data: transparency } = await db
    .from("vendor_transparency")
    .select("*")
    .in("vendor_id", vendorIds);

  const transpMap = new Map((transparency || []).map(t => [t.vendor_id, t]));

  const { data: labTests } = await db
    .from("lab_tests")
    .select("vendor_id, purity_result, test_date, lab_name, peptide_name, batch_number")
    .in("vendor_id", vendorIds)
    .not("purity_result", "is", null)
    .order("test_date", { ascending: false });

  const labMap = new Map<string, { count: number; sum: number; min: number; max: number; recent: any[]; labs: Set<string> }>();
  for (const t of (labTests || [])) {
    if (!labMap.has(t.vendor_id)) {
      labMap.set(t.vendor_id, { count: 0, sum: 0, min: 100, max: 0, recent: [], labs: new Set() });
    }
    const e = labMap.get(t.vendor_id)!;
    e.count++;
    e.sum += t.purity_result;
    e.min = Math.min(e.min, t.purity_result);
    e.max = Math.max(e.max, t.purity_result);
    if (t.lab_name) e.labs.add(t.lab_name);
    if (e.recent.length < 5) e.recent.push({ peptide: t.peptide_name, purity: t.purity_result, date: t.test_date, lab: t.lab_name, batch: t.batch_number });
  }

  for (const v of vendors!) {
    const t = transpMap.get(v.id);
    const lab = labMap.get(v.id);
    const avg = lab && lab.count > 0 ? Math.round(lab.sum / lab.count * 10) / 10 : null;
    console.log(JSON.stringify({
      slug: v.slug,
      name: v.name,
      score: v.overall_score,
      lv: v.lab_testing_score, pq: v.purity_accuracy_score, tr: v.transparency_score, cx: v.pricing_reliability_score,
      tier: v.coa_audit_tier,
      status: v.status,
      website: v.website,
      established: v.established_year,
      verdict: v.verdict,
      audit_notes: v.coa_audit_notes,
      has_address: t?.has_business_address,
      has_ownership: t?.has_ownership_disclosure,
      has_lab_disc: t?.has_lab_disclosure,
      has_contact: t?.has_contact_info,
      has_methodology: t?.has_testing_methodology,
      has_batch: t?.has_batch_numbers,
      fda_warning: t?.fda_warning,
      fraud_flags: t?.fraud_flags,
      domain_years: t?.domain_years,
      tr_notes: t?.notes,
      lab_count: lab?.count ?? 0,
      lab_avg: avg,
      lab_min: lab && lab.min < 100 ? lab.min : null,
      lab_max: lab?.max ?? null,
      labs: lab ? [...lab.labs] : [],
      recent_labs: lab?.recent ?? [],
    }));
  }
}

main().catch(console.error);
