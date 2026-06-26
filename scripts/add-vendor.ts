/**
 * scripts/add-vendor.ts
 * Onboard a new vendor with sensible defaults, ready for a full audit.
 *
 * Run: npm run add:vendor -- --name "Vendor Name" --website "https://vendor.com"
 * Optional flags:
 *   --location "USA"         (default: "USA")
 *   --country "US"           (default: "US")
 */

import { db } from "./lib/client.js";
import { log } from "./lib/scraper.js";

const SCRIPT = "add-vendor";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const name    = arg("--name");
const website = arg("--website");

if (!name || !website) {
  console.error("Usage: npm run add:vendor -- --name \"Vendor Name\" --website \"https://vendor.com\"");
  process.exit(1);
}

async function main() {
  const slug = slugify(name!);
  const origin = new URL(website!).origin;

  // Check for duplicates
  const { data: existing } = await db.from("vendors").select("id, name").or(`slug.eq.${slug},website.ilike.${origin}%`);
  if (existing?.length) {
    log(SCRIPT, `Vendor already exists: ${existing[0].name} (${existing[0].id})`);
    process.exit(1);
  }

  const record = {
    name:               name!,
    slug,
    website:            origin,
    status:             "active",
    location:           arg("--location") ?? "USA",
    country:            arg("--country") ?? "US",
    has_coa:            false,
    overall_score:      null,
    lab_testing_score:  null,
    purity_accuracy_score: null,
    transparency_score: null,
    pricing_reliability_score: null,
    verdict:            null,
    last_reviewed:      null,
    verified_domain:    false,
  };

  const { data, error } = await db.from("vendors").insert(record).select("id, slug").single();

  if (error) {
    log(SCRIPT, `✗ Insert failed: ${error.message}`);
    process.exit(1);
  }

  log(SCRIPT, `✓ Added: ${name} (${data.id})`);
  log(SCRIPT, `  Slug:    /vendors/${data.slug}`);
  log(SCRIPT, `  Website: ${origin}`);
  log(SCRIPT, `\nNext steps:`);
  log(SCRIPT, `  1. Run: npm run audit:vendors   (will pick this up in the next batch)`);
  log(SCRIPT, `  2. Review at /admin/audits`);
}

main();
