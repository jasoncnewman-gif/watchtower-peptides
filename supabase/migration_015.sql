-- migration_015.sql
-- Research articles table for /research section
-- Apply in Supabase SQL Editor

create table if not exists research_articles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  title                text not null,
  meta_description     text,
  content              text not null,        -- markdown
  keyword              text,                 -- target SEO keyword
  peptide              text,                 -- primary peptide (matches peptides.name)
  status               text default 'draft' check (status in ('draft', 'published')),
  reading_time_minutes int,
  published_at         timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table research_articles enable row level security;

-- Public read access for published articles only
create policy "published articles are publicly readable"
  on research_articles for select
  using (status = 'published');
