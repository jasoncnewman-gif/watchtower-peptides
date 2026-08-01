-- migration_016.sql
-- Vendor audit infrastructure: audit log + sentiment history
-- Apply in Supabase SQL Editor

-- ── vendor_audit_log ─────────────────────────────────────────────────────────
-- Records every audit run. score_changed=false rows serve as "we looked, nothing changed" entries.
create table if not exists vendor_audit_log (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid references vendors(id) on delete cascade,
  audited_at      timestamptz default now(),
  score_before    numeric(5,1),
  score_after     numeric(5,1),   -- null if no score change proposed
  score_changed   boolean default false,
  change_summary  text,           -- AI-written explanation of what was checked / what changed
  status          text default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_at     timestamptz,
  reviewer_notes  text
);

alter table vendor_audit_log enable row level security;
create policy "Public read vendor_audit_log" on vendor_audit_log for select using (true);

create index if not exists idx_vendor_audit_log_vendor   on vendor_audit_log(vendor_id);
create index if not exists idx_vendor_audit_log_status   on vendor_audit_log(status);
create index if not exists idx_vendor_audit_log_audited  on vendor_audit_log(audited_at desc);

-- ── vendor_sentiment_log ──────────────────────────────────────────────────────
-- Dated Reddit sentiment snapshots per vendor. Flat vendor fields (reddit_sentiment,
-- positive_review_summary, etc.) are updated only when a snapshot is approved.
create table if not exists vendor_sentiment_log (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid references vendors(id) on delete cascade,
  scraped_at      timestamptz default now(),
  post_count      integer,
  sentiment       text check (sentiment in ('positive', 'mixed', 'negative', 'insufficient_data')),
  summary         text,           -- AI-written 2-3 sentence summary of community sentiment
  notable_posts   text[],         -- top Reddit post URLs for reference
  status          text default 'pending' check (status in ('pending', 'approved', 'denied'))
);

alter table vendor_sentiment_log enable row level security;
create policy "Public read vendor_sentiment_log" on vendor_sentiment_log for select using (true);

create index if not exists idx_vendor_sentiment_log_vendor  on vendor_sentiment_log(vendor_id);
create index if not exists idx_vendor_sentiment_log_status  on vendor_sentiment_log(status);
create index if not exists idx_vendor_sentiment_log_scraped on vendor_sentiment_log(scraped_at desc);
