export type TrustTier = "accredited" | "verified_unaccredited" | "unverified";

export type Lab = {
  id: string;
  slug: string;
  name: string;
  legal_entity_name: string | null;
  website: string;

  claimed_location: string | null;
  registered_address: string | null;
  address_mismatch: boolean;

  founded_claim: string | null;
  founded_actual: string | null;
  founded_mismatch: boolean;

  accredited: boolean;
  accreditation_body: string | null;
  accreditation_cert: string | null;
  accreditation_expiration: string | null;

  verification_portal_url: string | null;
  portal_verified: boolean;

  what_it_is: string;
  accreditation_summary: string;
  what_we_verified: string;
  what_we_could_not_verify: string;
  caveats: string | null;
  bottom_line: string;

  trust_tier: TrustTier;
  last_reviewed: string;
};

export const TRUST_TIER_LABEL: Record<TrustTier, { label: string; bg: string; text: string }> = {
  accredited:             { label: "Accredited",           bg: "#DCFCE7", text: "#16A34A" },
  verified_unaccredited:  { label: "Verified, Unaccredited", bg: "#FEF3C7", text: "#D97706" },
  unverified:             { label: "Unverified",            bg: "#FEE2E2", text: "#DC2626" },
};
