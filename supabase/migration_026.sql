-- migration_026.sql
-- Temporary diagnostic instrumentation (2026-11-08): Vercel Web Analytics showed a
-- large, ongoing chunk of traffic from China/Singapore/Hong Kong with blank referrers
-- and a flat ~1-page-per-visit pattern — looks non-organic, but Analytics is
-- privacy-first and never exposes a raw User-Agent or IP, and this project has never
-- had Vercel's Bot Protection/Firewall product configured (that's the one thing that
-- would classify it by bot_name). This table captures the real User-Agent on every
-- page request going forward via proxy.ts, so the traffic can actually be identified
-- (a named AI crawler vs. a scraper vs. real VPN-routed users) instead of guessed at.
--
-- Not meant to run forever — intended to be reviewed after a few days of data via
-- scripts/report-traffic-log.ts, then either dropped or kept running if the finding
-- warrants it.
--
-- Apply manually in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS traffic_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null,
  method      text not null,
  user_agent  text,
  referer     text,
  country     text,              -- from Vercel's x-vercel-ip-country header
  city        text,              -- from Vercel's x-vercel-ip-city header
  ip_hash     text                -- SHA-256 of the client IP, never the raw IP
);

CREATE INDEX IF NOT EXISTS idx_traffic_log_created_at ON traffic_log(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_log_country    ON traffic_log(country);

ALTER TABLE traffic_log ENABLE ROW LEVEL SECURITY;

-- Write-only from the public/anon key (used by proxy.ts) — no public read policy,
-- so only the service-role key (scripts) can query it back.
CREATE POLICY "Public insert traffic_log" ON traffic_log FOR INSERT TO anon WITH CHECK (true);
