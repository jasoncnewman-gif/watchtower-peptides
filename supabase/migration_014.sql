-- migration_014.sql
-- Knowledge base: sources, episodes, transcript chunks (with embeddings), claims
-- Apply in Supabase SQL Editor

-- Required for vector search
create extension if not exists vector;

-- ── kb_sources ─────────────────────────────────────────────────────────────
-- The people whose content we track

create table if not exists kb_sources (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  handle              text,                          -- @hubermanlab
  specialty           text,                          -- neuroscience, functional_medicine, etc.
  known_conflicts     text,                          -- AG1 deal, supplement line, etc.
  verified_credentials boolean default false,
  notes               text,
  created_at          timestamptz default now()
);

-- ── kb_episodes ────────────────────────────────────────────────────────────
-- Individual pieces of content (video, podcast, article, paper, etc.)

create table if not exists kb_episodes (
  id                  uuid primary key default gen_random_uuid(),
  source_id           uuid references kb_sources(id),
  title               text not null,
  url                 text,
  published_date      date,
  content_type        text check (content_type in ('youtube', 'podcast', 'blog', 'paper', 'newsletter', 'conference')),
  transcript_source   text check (transcript_source in ('youtube_captions', 'official', 'manual', 'whisper', 'third_party')),
  transcript_raw      text,
  transcript_status   text default 'pending' check (transcript_status in ('pending', 'processing', 'complete', 'failed')),
  peptides_mentioned  text[] default '{}',
  topics              text[] default '{}',
  vendor_mentions     text[] default '{}',
  duration_seconds    int,
  created_at          timestamptz default now()
);

-- ── kb_chunks ──────────────────────────────────────────────────────────────
-- 500–1000 word searchable segments from each transcript, with embeddings

create table if not exists kb_chunks (
  id                  uuid primary key default gen_random_uuid(),
  episode_id          uuid references kb_episodes(id) on delete cascade,
  chunk_index         int not null,
  speaker             text,
  timestamp_start     text,                          -- "00:42:18"
  timestamp_end       text,
  content             text not null,
  embedding           vector(1536),                  -- OpenAI text-embedding-3-small
  peptides_mentioned  text[] default '{}',
  created_at          timestamptz default now()
);

-- HNSW index: fast approximate nearest-neighbor for cosine similarity search
create index if not exists kb_chunks_embedding_idx
  on kb_chunks using hnsw (embedding vector_cosine_ops);

-- ── kb_claims ──────────────────────────────────────────────────────────────
-- AI-extracted assertions from transcript chunks

create table if not exists kb_claims (
  id                  uuid primary key default gen_random_uuid(),
  chunk_id            uuid references kb_chunks(id) on delete set null,
  episode_id          uuid references kb_episodes(id),
  speaker             text,
  peptide             text,                          -- matches peptides.name where possible
  claim_text          text not null,
  claim_type          text check (claim_type in ('benefit', 'risk', 'mechanism', 'dosing', 'sourcing', 'legal', 'anecdotal')),
  benefit_described   text,
  risk_described      text,
  evidence_cited      text,
  evidence_level      text check (evidence_level in ('human_rct', 'human_observational', 'animal', 'in_vitro', 'anecdotal', 'expert_opinion', 'unknown')),
  timestamp_ref       text,
  confidence          numeric check (confidence between 0 and 1),
  potential_bias      text,
  commercial_conflict boolean,
  conflict_notes      text,
  vendor_mentioned    text,
  created_at          timestamptz default now()
);

-- ── Semantic search function ───────────────────────────────────────────────
-- Usage: select * from kb_search('[0.1,0.2,...]'::vector, 10);

create or replace function kb_search(query_embedding vector(1536), match_count int default 10)
returns table (
  chunk_id    uuid,
  episode_id  uuid,
  speaker     text,
  content     text,
  timestamp_start text,
  source_name text,
  episode_title text,
  episode_url text,
  published_date date,
  similarity  float
)
language sql stable
as $$
  select
    c.id          as chunk_id,
    c.episode_id,
    c.speaker,
    c.content,
    c.timestamp_start,
    s.name        as source_name,
    e.title       as episode_title,
    e.url         as episode_url,
    e.published_date,
    1 - (c.embedding <=> query_embedding) as similarity
  from kb_chunks c
  join kb_episodes e on e.id = c.episode_id
  join kb_sources s  on s.id = e.source_id
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ── Seed: sources ──────────────────────────────────────────────────────────

insert into kb_sources (name, handle, specialty, known_conflicts, verified_credentials) values
  ('Andrew Huberman',  '@hubermanlab',         'neuroscience',               'AG1 partner, LMNT partner, Momentous supplements',       false),
  ('Kyle Gillett',     '@gilletthealth',       'integrative/hormone medicine','private practice, supplement formulations',              true),
  ('Craig Koniver',    '@craiglkoniver',       'performance medicine',        'private practice, peptide protocols',                    true),
  ('Peter Attia',      '@peterattiamd',        'longevity medicine',          'Eight Sleep, Momentous supplements partner',             true),
  ('Ben Greenfield',   '@bengreenfieldfitness','biohacking/performance',      'Kion supplements owner, multiple affiliates',            false),
  ('Dave Asprey',      '@bulletproof',         'biohacking',                  'Bulletproof/Danger Coffee founder, Upgrade Labs owner',  false),
  ('Joe Rogan',        '@joerogan',            'media/generalist',            'none declared',                                         false),
  ('Layne Norton',     '@biolayne',            'nutrition science',           'Carbon Diet Coach, supplement partnerships',             true),
  ('William Seeds',    null,                   'peptide medicine',            'private practice',                                      true),
  ('Tina Peers',       null,                   'functional medicine',         'private practice',                                      true)
on conflict do nothing;
