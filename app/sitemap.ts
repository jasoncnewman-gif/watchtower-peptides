import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const revalidate = 86400

const BASE = 'https://www.watchtowerpeptides.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: vendors }, { data: peptides }] = await Promise.all([
    supabase.from('vendors').select('slug, updated_at').in('status', ['active', 'flagged']),
    supabase.from('peptides').select('slug, updated_at'),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/vendors`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/peptides`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/about`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/calculator`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`,    lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const vendorPages: MetadataRoute.Sitemap = (vendors ?? []).map(v => ({
    url: `${BASE}/vendors/${v.slug}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const peptidePages: MetadataRoute.Sitemap = (peptides ?? []).map(p => ({
    url: `${BASE}/peptides/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticPages, ...vendorPages, ...peptidePages]
}
