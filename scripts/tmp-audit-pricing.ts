import { db } from "./lib/client.js";

async function main() {
  const { data: vendors } = await db.from('lab_vendors')
    .select('id, slug, name, entry_price_cents, true_annual_cost_cents, section, audience_fit_score')
    .neq('eligibility', 'EXCLUDE')
    .order('slug');
  for (const v of vendors ?? []) {
    const { data: tiers } = await db.from('vendor_tiers').select('tier_name, price_cents, is_entry_tier').eq('vendor_id', v.id).order('price_cents');
    const { data: products } = await db.from('vendor_test_products').select('name, price_cents').eq('vendor_id', v.id).order('price_cents');
    const entryTier = (tiers ?? []).find(t => t.is_entry_tier);
    console.log(`\n=== ${v.slug} (${v.name}) === fit=${v.audience_fit_score} entry_price_cents=${v.entry_price_cents} true_annual=${v.true_annual_cost_cents}`);
    console.log('vendor_tiers:', JSON.stringify(tiers));
    console.log('vendor_test_products:', JSON.stringify(products));
  }
}
main();
