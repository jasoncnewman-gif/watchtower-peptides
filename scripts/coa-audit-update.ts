/**
 * scripts/coa-audit-update.ts
 * Records COA audit findings for a vendor and updates transparency flags if tier changed.
 *
 * Usage:
 *   npm run coa:update -- --slug <slug> --tier <0-4> --status <complete|flagged|skip> --notes "..."
 *
 * If --tier differs from the vendor's current computed LV tier, transparency flags are
 * updated to match the confirmed tier, and a score recompute is suggested.
 *
 * Examples:
 *   npm run coa:update -- --slug polaris-peptides --tier 3 --status complete --notes "Janoshik verified via public.janoshik.com, batch numbers on all COAs"
 *   npm run coa:update -- --slug certified-pep --tier 1 --status flagged --notes "Vanguard letterhead not on actual COAs — vendor-branded PDFs only"
 */

import { db } from "./lib/client.js";

type TransparencyRow = {
  vendor_id: string;
  has_lab_disclosure: boolean;
  has_batch_numbers: boolean;
};

type VendorRow = {
  id: string;
  name: string;
  lab_testing_score: number | null;
  has_coa: boolean;
  finnrick_tests_count: number | null;
  vendor_transparency: TransparencyRow[];
};

function currentTier(v: VendorRow): number {
  if ((v.finnrick_tests_count ?? 0) > 0) return 4;
  if (!v.has_coa) return 0;
  const t = v.vendor_transparency?.[0] ?? null;
  if (t?.has_lab_disclosure && t?.has_batch_numbers) return 3;
  if (t?.has_lab_disclosure) return 2;
  return 1;
}

async function main() {
  const args = process.argv.slice(2);
  function getArg(flag: string): string | undefined {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  }

  const slug   = getArg("--slug");
  const tier   = getArg("--tier");
  const status = getArg("--status");
  const notes  = getArg("--notes");

  if (!slug || !tier || !status) {
    console.error('\nUsage: npm run coa:update -- --slug <slug> --tier <0-4> --status <complete|flagged|skip> [--notes "..."]');
    process.exit(1);
  }

  const tierNum = parseInt(tier);
  if (isNaN(tierNum) || tierNum < 0 || tierNum > 4) {
    console.error("\n--tier must be 0–4");
    process.exit(1);
  }

  if (!["complete", "flagged", "skip"].includes(status)) {
    console.error("\n--status must be: complete | flagged | skip");
    process.exit(1);
  }

  const { data: vendor, error } = await db
    .from("vendors")
    .select("id, name, lab_testing_score, has_coa, finnrick_tests_count, vendor_transparency(vendor_id, has_lab_disclosure, has_batch_numbers)")
    .eq("slug", slug)
    .single();

  if (error || !vendor) {
    console.error(`\nVendor not found: ${slug}`);
    process.exit(1);
  }

  const v = vendor as unknown as VendorRow;
  const existingTier = currentTier(v);
  const tierChanged  = tierNum !== existingTier;

  await db.from("vendors").update({
    coa_audit_status: status,
    coa_audit_tier:   tierNum,
    coa_audit_notes:  notes ?? null,
    coa_audited_at:   new Date().toISOString(),
  }).eq("slug", slug);

  console.log(`\n✅ Audit recorded for ${v.name}`);
  console.log(`   Status: ${status}`);
  console.log(`   Tier:   T${tierNum} (was T${existingTier})`);
  if (notes) console.log(`   Notes:  ${notes}`);

  if (tierChanged) {
    console.log(`\n⚠️  Tier changed T${existingTier} → T${tierNum}. Updating transparency flags...`);

    const updates: Partial<TransparencyRow> = {};
    if (tierNum <= 1) {
      updates.has_lab_disclosure = false;
      updates.has_batch_numbers  = false;
    } else if (tierNum === 2) {
      updates.has_lab_disclosure = true;
      updates.has_batch_numbers  = false;
    } else if (tierNum === 3) {
      updates.has_lab_disclosure = true;
      updates.has_batch_numbers  = true;
    }

    if (Object.keys(updates).length > 0) {
      const trans = v.vendor_transparency?.[0];
      if (trans) {
        await db.from("vendor_transparency").update(updates).eq("vendor_id", v.id);
        console.log(`   Transparency flags updated: ${JSON.stringify(updates)}`);
      } else {
        console.log(`   ⚠️  No vendor_transparency row found — update manually in Supabase`);
      }
    }

    console.log(`\n   ➜ Run: npm run compute:scores  (to recalculate LV and overall score)`);
  }

  console.log();
}

main().catch(console.error);
