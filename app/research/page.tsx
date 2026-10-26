import type { Metadata } from 'next'
import Image from 'next/image'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import ResearchLibraryClient from '@/components/research/ResearchLibraryClient'

const title = 'Peptide Research — Expert Analysis & Evidence Reviews'
const description = 'Evidence-based research on peptides — sourced from expert transcripts, clinical studies, and medical literature. BPC-157, TB-500, CJC-1295, and more.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/research' },
  openGraph: { title, description, images: [{ url: '/images/research-hero.png' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/research-hero.png'] },
}

export const revalidate = 0

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
        <section className="relative" style={{ minHeight: '320px' }}>
          <Image
            src="/images/research-hero.png"
            alt="Peptide Research"
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)' }} />
          <div className="relative z-10 px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
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
          </div>
        </section>

        {/* Articles */}
        <section className="px-6 py-16" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="max-w-5xl mx-auto">
            <ResearchLibraryClient articles={articles ?? []} />
          </div>
        </section>
      </div>

      <Footer verseIndex={2} />
    </div>
  )
}
