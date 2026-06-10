/**
 * scripts/coa-audit-queue.ts
 * Outputs the prioritized COA audit queue for the current session.
 *
 * Usage:
 *   npm run coa:queue          — show next 5 vendors to audit
 *   npm run coa:queue -- --n 8 — show next 8 vendors
 *   npm run coa:queue -- --all — show full remaining queue
 *
 * Priority order:
 *   1. T3 vendors (25 pts LV claimed — most misleading if wrong)
 *   2. T2 vendors (15 pts LV claimed)
 *   3. T1 vendors (5 pts LV claimed — confirm or downgrade to T0)
 *   Skip: T0 (nothing to verify) and T4 (Finnrick, chain-of-custody)
 *   Within each tier: sorted by overall_score DESC
 */

import { db } from "./lib/client.js";

type VendorRow = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  coa_url: string | null;
  has_coa: boolean;
  lab_testing_score: number | null;
  overall_score: number | null;
  finnrick_tests_count: number | null;
  coa_audit_status: string | null;
  coa_audit_tier: number | null;
  coa_audited_at: string | null;
  has_lab_disclosure?: boolean;
  has_batch_numbers?: boolean;
};

function lvTier(v: VendorRow): number {
  if ((v.finnrick_tests_count ?? 0) > 0) return 4;
  if (!v.has_coa) return 0;
  if (v.has_lab_disclosure && v.has_batch_numbers) return 3;
  if (v.has_lab_disclosure) return 2;
  return 1;
}

async function main() {
  const args = process.argv.slice(2);
  const nFlag = args.indexOf("--n");
  const limit = args.includes("--all") ? 999 : nFlag >= 0 ? parseInt(args[nFlag + 1]) : 5;

  const { data: vendors } = await db
    .from("vendors")
    .select("id, slug, name, website, coa_url, has_coa, lab_testing_score, overall_score, finnrick_tests_count, coa_audit_status, coa_audit_tier, coa_audited_at")
    .in("status", ["active", "flagged"])
    .eq("coa_audit_status", "pending")
    .order("overall_score", { ascending: false });

  if (!vendors || vendors.length === 0) {
    console.log("\n✅ All vendors audited — queue is empty.\n");
    return;
  }

  const { data: transRows } = await db
    .from("vendor_transparency")
    .select("vendor_id, has_lab_disclosure, has_batch_numbers");

  const transMap = new Map<string, { has_lab_disclosure: boolean; has_batch_numbers: boolean }>();
  for (const t of transRows ?? []) {
    transMap.set(t.vendor_id, { has_lab_disclosure: t.has_lab_disclosure, has_batch_numbers: t.has_batch_numbers });
  }

  const rows: VendorRow[] = (vendors as VendorRow[]).map(v => ({
    ...v,
    ...transMap.get(v.id),
  }));

  const prioritized = rows
    .map(v => ({ ...v, tier: lvTier(v) }))
    .filter(v => v.tier >= 1 && v.tier <= 3)
    .sort((a, b) => {
      const tp = (t: number) => t === 3 ? 1 : t === 2 ? 2 : 3;
      const diff = tp(a.tier) - tp(b.tier);
      if (diff !== 0) return diff;
      return (b.overall_score ?? 0) - (a.overall_score ?? 0);
    })
    .slice(0, limit);

  // Progress summary
  const { data: allVendors } = await db
    .from("vendors")
    .select("coa_audit_status")
    .in("status", ["active", "flagged"]);

  const total    = allVendors?.length ?? 0;
  const pending  = allVendors?.filter(v => v.coa_audit_status === "pending").length ?? 0;
  const complete = allVendors?.filter(v => v.coa_audit_status === "complete").length ?? 0;
  const flagged  = allVendors?.filter(v => v.coa_audit_status === "flagged").length ?? 0;
  const skipped  = allVendors?.filter(v => v.coa_audit_status === "skip").length ?? 0;

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║             COA INTEGRITY AUDIT — QUEUE                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\nProgress: ${complete} complete | ${flagged} flagged | ${pending} pending | ${skipped} skipped / ${total} total`);
  console.log(`\nNext ${Math.min(limit, prioritized.length)} vendors to audit:\n`);

  for (let i = 0; i < prioritized.length; i++) {
    const v = prioritized[i];
    const pts = v.lab_testing_score ?? 0;
    console.log(`${i + 1}. [T${v.tier} — ${pts}pts LV] ${v.name} (score: ${v.overall_score ?? "?"})`);
    console.log(`   Slug:    ${v.slug}`);
    console.log(`   Site:    ${v.website ?? "—"}`);
    console.log(`   COA URL: ${v.coa_url ?? "not set"}`);
    console.log();
  }

  console.log("─────────────────────────────────────────────────────────");
  console.log("After auditing, record findings:");
  console.log('  npm run coa:update -- --slug <slug> --tier <0-4> --status complete --notes "..."');
  console.log('  npm run coa:update -- --slug <slug> --tier <0-4> --status flagged  --notes "..."');
  console.log();
}

main().catch(console.error);
