import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('vendors')
    .select('name, slug, website, status')
    .eq('status', 'active')
    .order('name')

  if (error) { console.error(error); process.exit(1) }

  console.log('\n=== VENDOR URL AUDIT ===\n')
  for (const v of data!) {
    const slugOk    = v.slug ? '✓' : '✗ NO SLUG'
    const websiteOk = v.website ? '✓' : '✗ NO WEBSITE'
    const hasProto  = v.website && !v.website.startsWith('http') ? ' ← missing protocol' : ''
    console.log(`${v.name}`)
    console.log(`  slug:    ${slugOk} ${v.slug ?? ''}`)
    console.log(`  website: ${websiteOk} ${v.website ?? ''}${hasProto}`)
  }
}
main()
