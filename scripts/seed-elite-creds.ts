import { db } from './lib/client.js';

async function main() {
  const { error } = await db.from('vendors')
    .update({
      login_email:    'info@watchtowerpeptides.com',
      login_password: 'jikHip-6dewje-xytgih',
      login_username: 'watchtower',
      login_phone:    '2145777287',
      login_platform: 'custom',
      login_path:     '/login',
    })
    .eq('slug', 'elite-research-usa');

  if (error) { console.error(error.message); process.exit(1); }
  console.log('✓ elite-research-usa credentials seeded');
}

main();
