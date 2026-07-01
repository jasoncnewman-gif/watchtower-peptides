import { db } from './lib/client.js';

async function main() {
  const [arts, pendingAudits, pendingSents, claims] = await Promise.all([
    db.from('research_articles').select('title, published_at, status').order('published_at', { ascending: false }).limit(15),
    db.from('vendor_audit_log').select('vendor_slug, status').eq('status','pending'),
    db.from('vendor_sentiment_log').select('vendor_slug, status').eq('status','pending'),
    db.from('kb_claims').select('peptide').order('created_at', {ascending: false}),
  ]);

  console.log('=== ARTICLES ===');
  arts.data?.forEach(a => console.log(a.published_at?.slice(0,10), a.status?.padEnd(8), a.title?.slice(0,60)));

  console.log('\n=== PENDING AUDITS ===', pendingAudits.data?.length ?? 0);
  pendingAudits.data?.forEach(p => console.log(' -', p.vendor_slug));

  console.log('\n=== PENDING SENTIMENTS ===', pendingSents.data?.length ?? 0);
  pendingSents.data?.forEach(s => console.log(' -', s.vendor_slug));

  const claimCounts: Record<string, number> = {};
  claims.data?.forEach(c => { if(c.peptide) claimCounts[c.peptide] = (claimCounts[c.peptide] || 0) + 1; });
  const sorted = Object.entries(claimCounts).sort((a,b) => b[1]-a[1]).slice(0,15);
  console.log('\n=== KB CLAIMS (top 15) ===');
  sorted.forEach(([p, n]) => console.log(`  ${String(n).padStart(3)} ${p}`));
}

main();
