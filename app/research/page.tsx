import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Peptide Research — Expert Analysis & Evidence Reviews',
  description: 'Evidence-based research on peptides — sourced from expert transcripts, clinical studies, and medical literature. BPC-157, TB-500, CJC-1295, and more.',
  alternates: { canonical: '/research' },
}

export const revalidate = 3600

const PEPTIDE_COLORS: Record<string, string> = {
  'BPC-157':          '#186784',
  'TB-500':           '#2D7A4F',
  'CJC-1295':         '#7B4F9E',
  'Ipamorelin':       '#7B4F9E',
  'GHK-Cu':           '#B8860B',
  'Sermorelin':       '#C0392B',
  'Tesamorelin':      '#C0392B',
  'NAD+':             '#1A6B5C',
  'PT-141':           '#D35400',
  'Thymosin Alpha-1': '#2980B9',
  'MOTS-c':           '#1A6B5C',
}

function peptideColor(peptide: string | null): string {
  if (!peptide) return '#6E6E73'
  return PEPTIDE_COLORS[peptide] ?? '#186784'
}

export default async function ResearchPage() {
  const { data: articles } = await supabase
    .from('research_articles')
    .select('slug, title, meta_description, peptide, reading_time_minutes, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      <Nav />

      <div className="pt-20">
        {/* Hero */}
        <section style={{ backgroundColor: '#1D1D1F', minHeight: '280px' }}>
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#5BA4C4' }}>
              Research
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
              Peptide Research
            </h1>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Evidence-based analysis sourced from expert transcripts, clinical literature, and primary research. Every claim attributed and evidence-graded.
            </p>
          </div>
        </section>

        {/* Articles */}
        <section className="px-6 py-16" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="max-w-5xl mx-auto">
            {!articles?.length ? (
              <p className="text-center py-24" style={{ color: '#6E6E73' }}>
                Research articles coming soon.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => (
                  <Link key={a.slug} href={`/research/${a.slug}`}>
                    <article
                      className="h-full rounded-xl p-6 flex flex-col gap-3 transition-shadow hover:shadow-md"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E7' }}
                    >
                      {a.peptide && (
                        <span
                          className="text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-full w-fit"
                          style={{
                            backgroundColor: `${peptideColor(a.peptide)}18`,
                            color: peptideColor(a.peptide),
                          }}
                        >
                          {a.peptide}
                        </span>
                      )}
                      <h2 className="text-base font-semibold leading-snug" style={{ color: '#1D1D1F' }}>
                        {a.title}
                      </h2>
                      {a.meta_description && (
                        <p className="text-sm leading-relaxed flex-1" style={{ color: '#6E6E73' }}>
                          {a.meta_description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #E5E5E7' }}>
                        {a.reading_time_minutes && (
                          <span className="text-xs" style={{ color: '#6E6E73' }}>
                            {a.reading_time_minutes} min read
                          </span>
                        )}
                        {a.published_at && (
                          <span className="text-xs" style={{ color: '#6E6E73' }}>
                            {new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer verseIndex={2} />
    </div>
  )
}
