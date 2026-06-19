import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ArticleBody from '@/components/research/ArticleBody'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from('research_articles')
    .select('title, meta_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return {}
  return {
    title: data.title,
    description: data.meta_description ?? undefined,
    alternates: { canonical: `/research/${slug}` },
  }
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('research_articles')
    .select('slug')
    .eq('status', 'published')
  return (data ?? []).map((a) => ({ slug: a.slug }))
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const { data: article } = await supabase
    .from('research_articles')
    .select('slug, title, meta_description, content, peptide, reading_time_minutes, published_at, keyword')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  // Find the matching peptide slug for cross-linking
  const { data: peptideRow } = article.peptide
    ? await supabase
        .from('peptides')
        .select('slug')
        .ilike('name', `%${article.peptide}%`)
        .single()
    : { data: null }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      <Nav />

      <div className="pt-20">
        {/* Article header */}
        <header style={{ backgroundColor: '#1D1D1F' }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            {article.peptide && (
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#5BA4C4' }}>
                {article.peptide}
              </p>
            )}
            <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: '#FFFFFF' }}>
              {article.title}
            </h1>
            {article.meta_description && (
              <p className="text-lg mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {article.meta_description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {article.published_at && (
                <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              )}
              {article.reading_time_minutes && (
                <span>{article.reading_time_minutes} min read</span>
              )}
            </div>
          </div>
        </header>

        {/* Article body */}
        <div className="max-w-3xl mx-auto px-6 py-12">
          <ArticleBody content={article.content} />

          {/* Cross-link to peptide profile */}
          {peptideRow && (
            <div
              className="mt-12 p-6 rounded-xl"
              style={{ backgroundColor: '#F5F5F7', border: '1px solid #E5E5E7' }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: '#1D1D1F' }}>
                Looking for {article.peptide} vendors?
              </p>
              <p className="text-sm mb-4" style={{ color: '#6E6E73' }}>
                See independently scored suppliers ranked by lab testing, purity, and transparency.
              </p>
              <Link
                href={`/peptides/${peptideRow.slug}`}
                className="inline-block text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#186784', color: '#FFFFFF' }}
              >
                View {article.peptide} Vendor Scores →
              </Link>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/research"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: '#186784' }}
            >
              ← Back to Research
            </Link>
          </div>
        </div>
      </div>

      <Footer verseIndex={0} />
    </div>
  )
}
