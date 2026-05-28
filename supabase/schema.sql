-- ============================================================
-- Watchtower Peptides — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── vendors ──────────────────────────────────────────────────
create table if not exists vendors (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  website         text,
  overall_score   numeric(3,1),         -- e.g. 8.5
  status          text default 'active' check (status in ('active', 'inactive', 'closed', 'flagged')),
  location        text,
  has_coa         boolean default false,
  date_added      timestamptz default now(),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── ads ──────────────────────────────────────────────────────
create table if not exists ads (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id) on delete cascade,
  ad_text         text,
  platform        text,                 -- e.g. 'Facebook', 'Instagram', 'Google'
  first_seen      date,
  last_seen       date,
  red_flags       text[],               -- array of flag strings
  created_at      timestamptz default now()
);

-- ── lab_tests ────────────────────────────────────────────────
create table if not exists lab_tests (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id) on delete cascade,
  lab_name        text,
  test_type       text,                 -- e.g. 'HPLC', 'LC-MS', 'Endotoxin'
  purity_result   numeric(5,2),         -- percentage, e.g. 99.50
  test_date       date,
  verified        boolean default false,
  created_at      timestamptz default now()
);

-- ── score_history ────────────────────────────────────────────
create table if not exists score_history (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id) on delete cascade,
  previous_score  numeric(3,1),
  new_score       numeric(3,1),
  reason          text,
  changed_date    timestamptz default now()
);

-- ── alerts ───────────────────────────────────────────────────
create table if not exists alerts (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id) on delete cascade,
  alert_type      text,                 -- e.g. 'failed_test', 'scam_report', 'closed'
  message         text,
  created_date    timestamptz default now(),
  resolved        boolean default false,
  resolved_date   timestamptz
);

-- ── updated_at trigger ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_updated_at
  before update on vendors
  for each row execute procedure update_updated_at();

-- ── Row Level Security (enable but open for now) ─────────────
alter table vendors       enable row level security;
alter table ads           enable row level security;
alter table lab_tests     enable row level security;
alter table score_history enable row level security;
alter table alerts        enable row level security;

-- Public read access
create policy "Public read vendors"       on vendors       for select using (true);
create policy "Public read ads"           on ads           for select using (true);
create policy "Public read lab_tests"     on lab_tests     for select using (true);
create policy "Public read score_history" on score_history for select using (true);
create policy "Public read alerts"        on alerts        for select using (true);
