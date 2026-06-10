/**
 * One-off script to generate the Watchtower Peptides launch action register.
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/gen-action-register.ts
 */

import * as XLSX from "xlsx";
import path from "path";

type Row = {
  ID: number;
  Phase: "Pre-Launch" | "Post-Launch";
  Category: string;
  "Action Item": string;
  Priority: "High" | "Medium" | "Low";
  Status: "Not Started" | "In Progress" | "Complete" | "Blocked";
  Owner: string;
  Notes: string;
};

const rows: Row[] = [
  // ── PRE-LAUNCH ────────────────────────────────────────────────────────────
  {
    ID: 1,
    Phase: "Pre-Launch",
    Category: "Content",
    "Action Item": "Update About page scoring text to reflect new strategy (gate system + community module)",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Scoring strategy overhauled this session. About page needs to reflect: (1) two-gate legitimacy check, (2) lab quality + value ranking, (3) community reputation as supplemental module not part of score. Also still needs +5 COA lab credit explanation.",
  },
  {
    ID: 2,
    Phase: "Pre-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Resolve Polaris Peptides COA access (login-gated)",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "COA page redirects to /my-account/ — need credentials. 99 Finnrick tests already in. If has_coa flips to true, score goes 76→84 (crosses 'recommended' tier).",
  },
  {
    ID: 3,
    Phase: "Pre-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Verify Pure Rawz COA page (blocked by CloudFlare)",
    Priority: "Medium",
    Status: "Blocked",
    Owner: "",
    Notes: "Configured coa_url is /pages/coa but CloudFlare blocks all automated access. Score=65. Manual browser check needed to confirm URL is valid.",
  },
  {
    ID: 4,
    Phase: "Pre-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Find Skye Peptides COA page",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "75 Finnrick tests in DB. No dedicated COA page found via static scrape, sitemap, nav, or Puppeteer. Score=71. Manual check recommended.",
  },
  {
    ID: 5,
    Phase: "Pre-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Find Astro Peptides COA page",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "29 Finnrick tests in DB. No dedicated COA page found. Score=63.",
  },
  {
    ID: 6,
    Phase: "Pre-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Resolve NextechLabs COA (per-product, no dedicated page)",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "COAs are embedded per product page — no central COA library. 31 Finnrick tests. Score=60. Consider setting has_coa=true if per-product PDFs are publicly linked.",
  },
  {
    ID: 7,
    Phase: "Pre-Launch",
    Category: "Data — Shipping",
    "Action Item": "Scrape Ascension Peptides shipping policy",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Shipping page is behind login. Research account (info@watchtowerpeptides.com) can log in — scrape:gated already handles login. Check /policies/shipping after login.",
  },
  {
    ID: 8,
    Phase: "Pre-Launch",
    Category: "Data — Shipping",
    "Action Item": "Scrape Mile High Compounds shipping policy",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Shipping page not found during scrape. Login-gated site (WooCommerce). Products available via public API but shipping page behind auth.",
  },
  {
    ID: 9,
    Phase: "Pre-Launch",
    Category: "Data — Shipping",
    "Action Item": "Scrape Peptidology shipping policy",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Peptidology.co — WooCommerce, login-gated for shipping. Also: Peptidology accepts Zelle (5% discount) — no DB field exists yet to display this.",
  },
  {
    ID: 10,
    Phase: "Pre-Launch",
    Category: "Data — Peptide Profiles",
    "Action Item": "Seed missing blend profiles (Tesamorelin stacks, Fragment blends)",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "9 blend gaps remain: Tesamorelin-based stacks and hGH Fragment combination blends. Low priority — core 48 profiles are live.",
  },
  {
    ID: 11,
    Phase: "Pre-Launch",
    Category: "Data — Vendors",
    "Action Item": "Review flagged vendor entries (Amino Asylum, Paradigm, Prime Peptides)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "All three are flagged status. No public COA found for any. Decide: keep flagged with current scores, or add editorial notes on why they're flagged.",
  },
  {
    ID: 12,
    Phase: "Pre-Launch",
    Category: "Legal / Compliance",
    "Action Item": "Add research-use-only disclaimer",
    Priority: "High",
    Status: "Complete",
    Owner: "",
    Notes: "Built and deployed. /disclaimer page live. Inline one-liner in footer on every page. Correctly scoped — does not conflict with FDA-approved peptides (semaglutide, tirzepatide). Pushed to Vercel June 2026.",
  },
  {
    ID: 13,
    Phase: "Pre-Launch",
    Category: "Legal / Compliance",
    "Action Item": "Add privacy policy page",
    Priority: "High",
    Status: "Complete",
    Owner: "",
    Notes: "Built and deployed. /privacy page live. Covers Vercel Analytics, Google Fonts, Supabase. No cookies, no data sold. Contact info@watchtowerpeptides.com. Pushed to Vercel June 2026.",
  },
  {
    ID: 14,
    Phase: "Pre-Launch",
    Category: "Legal / Compliance",
    "Action Item": "Add terms of service page",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "",
  },
  {
    ID: 14,
    Phase: "Pre-Launch",
    Category: "Legal / Compliance",
    "Action Item": "Add FTC disclosure if affiliate/monetization added",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "No affiliate relationships currently. If affiliate links or referral fees are ever added to vendor pages, FTC requires a disclosure statement. One-liner suffices.",
  },
  {
    ID: 15,
    Phase: "Pre-Launch",
    Category: "SEO",
    "Action Item": "Verify meta titles and descriptions on all pages",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Check /, /vendors, /peptides, /about, /calculator and key detail pages.",
  },
  {
    ID: 17,
    Phase: "Pre-Launch",
    Category: "Technical",
    "Action Item": "Verify Vercel production environment variables are set",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in Vercel dashboard for the production environment.",
  },
  {
    ID: 18,
    Phase: "Pre-Launch",
    Category: "Technical",
    "Action Item": "Set up custom domain (watchtowerpeptides.com)",
    Priority: "High",
    Status: "In Progress",
    Owner: "",
    Notes: "Bluehost DNS updated June 2026: A @ → 216.198.79.1, CNAME www → 07881ea9cc48d3fa.vercel-dns-017.com. Both domains added in Vercel. Awaiting DNS propagation (up to 48hrs). Mail/MX/TXT records preserved.",
  },
  {
    ID: 18,
    Phase: "Pre-Launch",
    Category: "Technical",
    "Action Item": "Submit sitemap to Google Search Console",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Do immediately after domain propagates. Next.js generates /sitemap.xml. Every day without indexing is lost SEO — Google takes 3-6 months to rank new sites regardless, so start the clock ASAP.",
  },
  {
    ID: 19,
    Phase: "Pre-Launch",
    Category: "QA",
    "Action Item": "Mobile responsiveness QA across all pages",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Test on iOS Safari and Android Chrome. Key pages: homepage, vendor detail, peptide detail.",
  },
  {
    ID: 20,
    Phase: "Pre-Launch",
    Category: "QA",
    "Action Item": "Cross-browser QA (Safari, Firefox, Chrome)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "",
  },
  {
    ID: 21,
    Phase: "Pre-Launch",
    Category: "QA",
    "Action Item": "Validate reconstitution calculator math",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Spot-check with known values: e.g. 5mg vial + 2mL BAC water = 2.5mcg/0.01mL.",
  },

  // ── POST-LAUNCH ───────────────────────────────────────────────────────────
  {
    ID: 22,
    Phase: "Post-Launch",
    Category: "Scoring — Strategy",
    "Action Item": "Implement two-gate scoring system overhaul",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Agreed strategy: Gate 1 = legitimacy pass/fail (COA verified, no FDA warning, domain age, known peptide sequences). Gate 2 = lab quality score (Finnrick purity avg + test count + COA breadth). Final ranking = value (price per mg vs peers, shipping threshold, discounts). Vendors failing Gate 1 show 'Not Verified' not a score.",
  },
  {
    ID: 23,
    Phase: "Post-Launch",
    Category: "Scoring — Strategy",
    "Action Item": "Redefine pricing sub-score with measurable criteria",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Current pricing score is not meaningfully differentiating vendors. New approach: price per mg vs peer average for same peptide, shipping free threshold (lower = better), crypto/discount availability. All data is already scraped.",
  },
  {
    ID: 24,
    Phase: "Post-Launch",
    Category: "Scoring — Strategy",
    "Action Item": "Build per-vendor score breakdown card on vendor detail page",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Visitors can't verify or trust a black-box number. Each vendor page should show exactly why they scored what they scored: gate status, Finnrick test count + purity avg, COA verified Y/N, price vs peer avg, shipping threshold. Transparency builds trust.",
  },
  {
    ID: 25,
    Phase: "Post-Launch",
    Category: "Community Module",
    "Action Item": "Build Reddit sentiment pipeline (automated, Claude API)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Architecture: (1) scrape r/Peptides by vendor name + aliases, (2) filter to purchase-experience comments, (3) Claude API sentiment per comment, (4) aggregate with recency decay, min n≥10 threshold, (5) display as supplemental module — NOT part of score. Vendors below threshold show 'insufficient data'. Reddit API has cost at scale; evaluate scraping vs API.",
  },
  {
    ID: 26,
    Phase: "Post-Launch",
    Category: "Community Module",
    "Action Item": "Build vendor alias map for Reddit name matching",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "One-time manual build. e.g. 'Sports Tech', 'STL', 'Sports Technology Labs' all map to same vendor. Required before Reddit pipeline can match comments to vendors accurately.",
  },
  {
    ID: 27,
    Phase: "Post-Launch",
    Category: "Marketing",
    "Action Item": "Post launch announcement to r/Peptides and r/PeptidesResearch",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Site needs to be more complete before posting. Lead with methodology and independence — not vendor rankings. Community is deeply skeptical of ranking sites due to affiliate relationships elsewhere. Preemptively address 'who paid you' before it's asked.",
  },
  {
    ID: 28,
    Phase: "Post-Launch",
    Category: "Marketing",
    "Action Item": "Set up social media presence (Twitter/X, possibly Instagram)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Share new COA findings, score updates, vendor alerts.",
  },
  {
    ID: 29,
    Phase: "Post-Launch",
    Category: "Data — Ongoing",
    "Action Item": "Quarterly vendor score recompute",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Run scrape:products, scrape:coas, scrape:gated, compute:scores each quarter to keep data fresh.",
  },
  {
    ID: 30,
    Phase: "Post-Launch",
    Category: "Data — Ongoing",
    "Action Item": "Monitor for new vendor entries",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Periodically check r/Peptides and peptide communities for vendors not yet in DB.",
  },
  {
    ID: 31,
    Phase: "Post-Launch",
    Category: "Data — Ongoing",
    "Action Item": "Pull Finnrick data updates when available",
    Priority: "High",
    Status: "Not Started",
    Owner: "",
    Notes: "Finnrick rating and test count drive lab_testing and purity sub-scores. Update when new Finnrick reports publish. Note: Finnrick is a single point of failure — if it goes away, two sub-scores lose their data source.",
  },
  {
    ID: 32,
    Phase: "Post-Launch",
    Category: "Data — Ongoing",
    "Action Item": "Monitor vendor domain / site status (inactive detection)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Run verify:domains script periodically. Any domain parked or 404ing → status=inactive.",
  },
  {
    ID: 33,
    Phase: "Post-Launch",
    Category: "Features",
    "Action Item": "User-submitted vendor reviews",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "Allow community to submit ratings or flag outdated info. Requires auth.",
  },
  {
    ID: 34,
    Phase: "Post-Launch",
    Category: "Features",
    "Action Item": "Peptide comparison tool",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "Side-by-side peptide profile comparison (e.g. BPC-157 vs TB-500).",
  },
  {
    ID: 35,
    Phase: "Post-Launch",
    Category: "Features",
    "Action Item": "Vendor price alert / watchlist",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "Email or browser notification when a tracked vendor drops price on a peptide.",
  },
  {
    ID: 36,
    Phase: "Post-Launch",
    Category: "Features",
    "Action Item": "Add Peptidology Zelle payment option to DB and vendor detail UI",
    Priority: "Low",
    Status: "Not Started",
    Owner: "",
    Notes: "Peptidology accepts Zelle with 5% discount. No DB field exists currently. Low priority unless payment data becomes a search filter.",
  },
  {
    ID: 37,
    Phase: "Post-Launch",
    Category: "Data — Vendor COAs",
    "Action Item": "Pursue Polaris Peptides COA credentials if pre-launch attempt fails",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Score 76→84 if resolved. Could reach out directly to Polaris for a research account.",
  },
  {
    ID: 38,
    Phase: "Post-Launch",
    Category: "Analytics",
    "Action Item": "Set up analytics (Plausible or Vercel Analytics)",
    Priority: "Medium",
    Status: "Not Started",
    Owner: "",
    Notes: "Track top-visited vendor pages and peptide profiles to guide content priorities.",
  },
];

const wb = XLSX.utils.book_new();

// ── Main sheet ─────────────────────────────────────────────────────────────

const ws = XLSX.utils.json_to_sheet(rows);

// Column widths
ws["!cols"] = [
  { wch: 4 },   // ID
  { wch: 13 },  // Phase
  { wch: 22 },  // Category
  { wch: 58 },  // Action Item
  { wch: 10 },  // Priority
  { wch: 13 },  // Status
  { wch: 12 },  // Owner
  { wch: 70 },  // Notes
];

XLSX.utils.book_append_sheet(wb, ws, "Action Register");

const outPath = path.join(process.cwd(), "watchtower-launch-action-register.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`Written: ${outPath}`);
