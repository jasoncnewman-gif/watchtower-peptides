import { db } from './lib/client'

async function main() {
  const { data: vendor, error: ve } = await db
    .from('vendors')
    .select('id')
    .eq('slug', 'verified-peptides')
    .single()

  if (ve || !vendor) { console.error('Vendor not found:', ve?.message); process.exit(1) }

  const { error } = await db
    .from('vendor_transparency')
    .update({ has_testing_methodology: false, has_batch_numbers: false })
    .eq('vendor_id', vendor.id)

  if (error) { console.error('Update error:', error.message); process.exit(1) }
  console.log('Updated vendor_transparency for verified-peptides')
  console.log('  has_testing_methodology → false')
  console.log('  has_batch_numbers → false')
  console.log('  Expected: transparency 16→8, overall 62→54 (Acceptable→Watchlist)')
  console.log('Run `npm run compute:scores` to apply.')
}

main()
