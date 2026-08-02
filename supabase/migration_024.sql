-- migration_024.sql
-- COA testing lab verification pages (/labs, /labs/[slug])
-- Publishes docs/lab_registry.md research to the public site.
-- Apply manually in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS labs (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                    text UNIQUE NOT NULL,
  name                    text NOT NULL,
  legal_entity_name       text,                          -- e.g. "Chromate Analytical Group LLC"
  website                 text NOT NULL,

  claimed_location        text,                           -- what the lab's own site/marketing says
  registered_address       text,                           -- from state corporate registry (if found)
  address_mismatch        boolean NOT NULL DEFAULT false,  -- claimed_location != registered_address

  founded_claim           text,                            -- marketing claim, e.g. "2024" or "25+ years"
  founded_actual          date,                            -- real incorporation date if independently confirmed
  founded_mismatch        boolean NOT NULL DEFAULT false,

  accredited              boolean NOT NULL DEFAULT false,
  accreditation_body      text,                            -- e.g. "A2LA"
  accreditation_cert      text,
  accreditation_expiration date,

  verification_portal_url text,
  portal_verified         boolean NOT NULL DEFAULT false,   -- we personally tested a real lookup

  what_it_is              text NOT NULL,
  accreditation_summary   text NOT NULL,
  what_we_verified        text NOT NULL,
  what_we_could_not_verify text NOT NULL,
  caveats                 text,
  bottom_line             text NOT NULL,

  trust_tier              text NOT NULL CHECK (trust_tier IN ('accredited', 'verified_unaccredited', 'unverified')),

  last_reviewed           date NOT NULL,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labs_slug ON labs(slug);

CREATE OR REPLACE TRIGGER labs_updated_at
  BEFORE UPDATE ON labs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Public read access (matches vendors/peptides RLS pattern)
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read labs" ON labs FOR SELECT USING (true);
