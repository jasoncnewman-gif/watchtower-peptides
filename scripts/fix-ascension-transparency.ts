/**
 * Ascension Peptides uses MZ Biolabs (mzbiolabs.com) with batch-specific COAs.
 * Their transparency record needs has_lab_disclosure=true, has_batch_numbers=true
 * so the LV tier correctly reflects T3 (batch-specific 3rd-party COA).
 */
import { db } from "./lib/client.js";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id, slug").eq("slug", "ascension-peptides").single();
  if (!vendor) throw new Error("ascension-peptides not found");

  // Check current transparency
  const { data: trans } = await db.from("vendor_transparency").select("*").eq("vendor_id", vendor.id).single();
  console.log("Current transparency:", JSON.stringify(trans, null, 2));

  if (!trans) {
    console.log("No transparency record — inserting");
    await db.from("vendor_transparency").insert({
      vendor_id: vendor.id,
      has_lab_disclosure: true,
      has_batch_numbers: true,
      has_contact_info: true,
      has_business_address: false,
      has_ownership_disclosure: false,
      has_testing_methodology: true,
      fda_warning: false,
      fraud_flags: false,
    });
  } else {
    // Only update the fields we know are definitively true from MZ Biolabs COAs
    await db.from("vendor_transparency").update({
      has_lab_disclosure: true,
      has_batch_numbers: true,
    }).eq("vendor_id", vendor.id);
  }
  console.log("Updated: has_lab_disclosure=true, has_batch_numbers=true");

  // Also update Polaris transparency — they have Finnrick tests so LV=T4, but check transparency
  const { data: polaris } = await db.from("vendors").select("id").eq("slug", "polaris-peptides").single();
  if (polaris) {
    const { data: ptrans } = await db.from("vendor_transparency").select("*").eq("vendor_id", polaris.id).single();
    console.log("\nPolaris transparency:", JSON.stringify(ptrans, null, 2));
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
