/**
 * scripts/seed-vendors.ts
 * Upserts all 44 known vendors (active + flagged/closed) into the vendors table.
 * Safe to re-run — uses upsert on slug so existing rows are updated, not duplicated.
 *
 * Run: npm run seed
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "seed-vendors";

// ── Slug helper ────────────────────────────────────────────────────────────

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Vendor records ─────────────────────────────────────────────────────────

type SeedVendor = {
  name: string;
  website: string;
  slug: string;
  status: "active" | "inactive" | "closed" | "flagged";
  is_gated?: boolean;
  fda_warning?: boolean;
  fda_notes?: string;
  notes?: string;
};

const ACTIVE_VENDORS: SeedVendor[] = [
  { name: "Peptide Partners",       website: "https://peptidepartners.com",       slug: slug("Peptide Partners") },
  { name: "Limitless Biotech",      website: "https://limitlessbiotech.com",      slug: slug("Limitless Biotech") },
  { name: "Core Peptides",          website: "https://corepeptides.com",          slug: slug("Core Peptides") },
  { name: "Ascension Peptides",     website: "https://ascensionpeptides.com",     slug: slug("Ascension Peptides") },
  { name: "Nexaph",                 website: "https://nexaph.com",                slug: slug("Nexaph") },
  { name: "Mile High Compounds",    website: "https://milehighcompounds.com",     slug: slug("Mile High Compounds") },
  { name: "Crush Research",         website: "https://crushresearch.com",         slug: slug("Crush Research") },
  { name: "Omegamino",              website: "https://omegamino.com",             slug: slug("Omegamino") },
  { name: "Orbitrex Peptides",      website: "https://orbitrexpeptides.com",      slug: slug("Orbitrex Peptides") },
  { name: "Peptidology",            website: "https://peptidology.com",           slug: slug("Peptidology") },
  { name: "Swiss Chems",            website: "https://swisschems.is",             slug: slug("Swiss Chems") },
  { name: "Pure Rawz",              website: "https://purerawz.co",               slug: slug("Pure Rawz") },
  { name: "Cernum Biosciences",     website: "https://cernumbiosciences.com",     slug: slug("Cernum Biosciences") },
  { name: "Peptide Crafters",       website: "https://peptidecrafters.com",       slug: slug("Peptide Crafters") },
  { name: "Felix Chemical Supply",  website: "https://chem-llc.com",             slug: slug("Felix Chemical Supply"),  is_gated: true },
  { name: "LVLUP Health",           website: "https://lvluphealth.com",           slug: slug("LVLUP Health") },
  { name: "Healthgevity",           website: "https://healthgevity.com",          slug: slug("Healthgevity") },
  { name: "Loti Labs",              website: "https://lotilabs.com",              slug: slug("Loti Labs") },
  { name: "Biotech Peptides",       website: "https://biotechpeptides.com",       slug: slug("Biotech Peptides") },
  { name: "Sports Technology Labs", website: "https://sportstechnologylabs.com",  slug: slug("Sports Technology Labs") },
  { name: "Polaris Peptides",       website: "https://polarispeptides.com",       slug: slug("Polaris Peptides") },
  { name: "Pivot Labs",             website: "https://pivotlabs.com",             slug: slug("Pivot Labs") },
  { name: "EZ Peptides",            website: "https://ezpeptides.com",            slug: slug("EZ Peptides") },
  { name: "Alpha BioMed Labs",      website: "https://alphabiomedlabs.com",       slug: slug("Alpha BioMed Labs"),      is_gated: true },
  { name: "Skye Peptides",          website: "https://skyepeptides.com",          slug: slug("Skye Peptides") },
  { name: "Bulk Peptide Supply",    website: "https://bulkpeptidesupply.com",     slug: slug("Bulk Peptide Supply") },
  { name: "Astro Peptides",         website: "https://astropeptides.com",         slug: slug("Astro Peptides") },
  { name: "Dynamic Peptide",        website: "https://dynamicpeptide.com",        slug: slug("Dynamic Peptide") },
  { name: "Glacier Aminos",         website: "https://glacieraminos.com",         slug: slug("Glacier Aminos") },
  { name: "Ion Peptide",            website: "https://ionpeptide.com",            slug: slug("Ion Peptide") },
  { name: "Penguin Peptides",       website: "https://penguinpeptides.com",       slug: slug("Penguin Peptides") },
  { name: "Paramount Peptides",     website: "https://paramountpeptides.com",     slug: slug("Paramount Peptides") },
  { name: "Nuscience Peptides",     website: "https://nusciencepeptides.com",     slug: slug("Nuscience Peptides") },
  { name: "Southern Peptides",      website: "https://southernpeptidesllc.com",   slug: slug("Southern Peptides") },
  { name: "Simple Peptide",         website: "https://simplepeptide.com",         slug: slug("Simple Peptide") },
  { name: "Verified Peptides",      website: "https://verifiedpeptides.com",      slug: slug("Verified Peptides") },
  { name: "Aavant Research",        website: "https://aavantresearch.com",        slug: slug("Aavant Research") },
  { name: "NextechLabs",            website: "https://nextechlabs.com",           slug: slug("NextechLabs") },
  { name: "Apollo Peptide Sciences",website: "https://apollopeptidesciences.com", slug: slug("Apollo Peptide Sciences") },
  { name: "Certified Pep",          website: "https://certified-pep.com",         slug: slug("Certified Pep") },
  { name: "Perfect Peptides",       website: "https://perfectpeptides.com",        slug: slug("Perfect Peptides") },
  { name: "Licensed Peptides",      website: "https://licensedpeptides.com",       slug: slug("Licensed Peptides"),     is_gated: true },
  { name: "Maxx Research Supply",   website: "https://maxxresearchsupply.com",     slug: slug("Maxx Research Supply") },
  { name: "RUO Science",            website: "https://ruoscience.com",             slug: slug("RUO Science") },
  { name: "True Research Labs",     website: "https://trueresearchlabs.com",       slug: slug("True Research Labs") },
].map((v) => ({ ...v, status: "active" as const }));

const FLAGGED_AND_CLOSED: SeedVendor[] = [
  {
    name: "Amino Asylum",
    website: "https://aminoasylum-llc.com",
    slug: slug("Amino Asylum"),
    status: "flagged",
    fda_warning: true,
  },
  {
    name: "Paradigm Peptides",
    website: "https://paradigmpeptides.com",
    slug: slug("Paradigm Peptides"),
    status: "flagged",
    fda_notes: "Founders pleaded guilty to federal charges December 2025",
  },
  {
    name: "Peptide Sciences",
    website: "https://peptidesciences.com",
    slug: slug("Peptide Sciences"),
    status: "closed",
    notes: "Voluntarily shut down March 6 2026",
  },
  {
    name: "Science.bio",
    website: "https://science.bio",
    slug: "science-bio",
    status: "closed",
    notes: "Out of business January 2026",
  },
  {
    name: "Prime Peptides",
    website: "https://primepeptides.com",
    slug: slug("Prime Peptides"),
    status: "flagged",
    fda_warning: true,
  },
];

const ALL_VENDORS: SeedVendor[] = [...ACTIVE_VENDORS, ...FLAGGED_AND_CLOSED];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  log(SCRIPT, `Seeding ${ALL_VENDORS.length} vendors…`);

  const { error } = await db
    .from("vendors")
    .upsert(ALL_VENDORS, { onConflict: "slug" });

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  const active = ALL_VENDORS.filter((v) => v.status === "active").length;
  const flagged = ALL_VENDORS.filter((v) => v.status === "flagged").length;
  const closed = ALL_VENDORS.filter((v) => v.status === "closed").length;
  const gated = ALL_VENDORS.filter((v) => v.is_gated).length;

  log(SCRIPT, `Done. ${active} active  |  ${flagged} flagged  |  ${closed} closed  |  ${gated} gated`);
}

main();
