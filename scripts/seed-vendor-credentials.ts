/**
 * Seeds shared Watchtower research account credentials into the vendors table.
 * All RCV vendor accounts use the same email + password.
 * Run after applying migration_013.sql.
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-vendor-credentials.ts
 */
import { db } from './lib/client'

const EMAIL    = 'info@watchtowerpeptides.com'
const PASSWORD = 'jikHip-6dewje-xytgih'
const PHONE    = '2145777287'

// Vendors confirmed or likely to require login to access COAs or catalog.
// login_platform values: 'woocommerce' | 'shopify' | 'custom'
// login_username: use when the site accepts a username separate from email.
// login_path: custom login URL path (default /my-account/ for WooCommerce).
const GATED: Record<string, {
  platform: string
  username?: string
  path?: string
}> = {
  // Already seeded — preserving with explicit platform
  'ascension-peptides':   { platform: 'woocommerce' },
  'mile-high-compounds':  { platform: 'woocommerce' },
  'loti-labs':            { platform: 'woocommerce', username: 'watchtower' },
  'felix-chemical-supply':{ platform: 'woocommerce', username: 'watchtower' },
  'omegamino':            { platform: 'woocommerce' },
  'licensed-peptides':    { platform: 'woocommerce', username: 'watchtower' },
  'peptidology':          { platform: 'custom' },
  'ion-peptide':          { platform: 'custom' },
  'polaris-peptides':     { platform: 'woocommerce' },

  // Newly confirmed gated
  'certified-pep':        { platform: 'woocommerce', username: 'watchtower', path: '/coas/' },
  'perfect-peptides':     { platform: 'woocommerce' },

  // Other WooCommerce vendors likely to gate content or catalog
  'pure-rawz':            { platform: 'woocommerce' },
  'swiss-chems':          { platform: 'woocommerce' },
  'paradigm-peptides':    { platform: 'woocommerce' },
  'sports-technology-labs':{ platform: 'woocommerce' },
  'science-bio':          { platform: 'woocommerce' },
  'biotech-peptides':     { platform: 'woocommerce' },
  'nextechlabs':          { platform: 'woocommerce' },
  'simple-peptide':       { platform: 'woocommerce' },
  'true-research-labs':   { platform: 'woocommerce' },

  // Gated — confirmed from Gated Vendor List
  'elite-research-usa':  { platform: 'custom', username: 'watchtower', path: '/login' },
}

async function main() {
  const { data: vendors, error } = await db
    .from('vendors')
    .select('id, slug, login_email, login_password')
    .in('slug', Object.keys(GATED))

  if (error) { console.error(error.message); return }

  let updated = 0
  for (const vendor of vendors ?? []) {
    const cfg = GATED[vendor.slug]
    const patch: Record<string, string | null> = {
      login_email:    EMAIL,
      login_password: PASSWORD,
      login_platform: cfg.platform,
      login_username: cfg.username ?? null,
      login_path:     cfg.path ?? null,
    }
    patch['login_phone'] = PHONE
    const { error: ue } = await db.from('vendors').update(patch).eq('id', vendor.id)
    if (ue) { console.error(`${vendor.slug}: ${ue.message}`); continue }
    console.log(`✓ ${vendor.slug}`)
    updated++
  }
  console.log(`\nUpdated ${updated}/${Object.keys(GATED).length} vendors`)
}

main().catch(console.error)
