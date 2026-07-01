import { db } from './lib/client.js';

const URLS: Record<string, string> = {
  'eternal-peptides':   'https://www.finnrick.com/vendors/eternal-peptides',
  'oasis-peptides':     'https://www.finnrick.com/vendors/oasis-peptides',
  'accelerate-labs':    'https://www.finnrick.com/vendors/accelerate-labs',
  'zen-peptides':       'https://www.finnrick.com/vendors/zen-peptides',
  'biolongevity-labs':  'https://www.finnrick.com/vendors/biolongevity-labs',
  'elite-research-usa': 'https://www.finnrick.com/vendors/elite-research-usa',
};

async function main() {
  for (const [slug, url] of Object.entries(URLS)) {
    const { error } = await db.from('vendors').update({ finnrick_url: url }).eq('slug', slug);
    if (error) console.error(`✗ ${slug}: ${error.message}`);
    else console.log(`✓ ${slug}`);
  }
}

main();
