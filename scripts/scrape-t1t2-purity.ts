/**
 * Scrapes purity data from COA pages for T1/T2 vendors.
 * Fetches COA pages, finds PDF links, downloads PDFs, extracts purity %.
 */
import * as https from "https";
import * as http from "http";
import { db } from "./lib/client.js";

const VENDORS = [
  { slug: "licensed-peptides",  coaUrl: "https://licensedpeptides.com/purity-reports/" },
  { slug: "core-peptides",      coaUrl: "https://www.corepeptides.com/coas/" },
  { slug: "crush-research",     coaUrl: "https://crushresearch.shop/testing" },
  { slug: "penguin-peptides",   coaUrl: "https://penguinpeptides.com/pages/lab-testing" },
  { slug: "biotech-peptides",   coaUrl: "https://biotechpeptides.com/coas/" },
];

function fetchText(url: string, depth = 0): Promise<string> {
  if (depth > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = (mod as any).get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Encoding": "identity",
      }
    }, (res: any) => {
      if ([301,302,307,308].includes(res.statusCode)) {
        const loc = res.headers.location || "";
        const next = loc.startsWith("http") ? loc : new URL(loc, url).href;
        resolve(fetchText(next, depth + 1));
        return;
      }
      let body = "";
      res.on("data", (c: any) => body += c);
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
  });
}

// Extract purity % from raw PDF text or HTML
function extractPurityValues(text: string): { peptide: string; purity: number; date: string }[] {
  const results: { peptide: string; purity: number; date: string }[] = [];

  // Pattern: look for XX.XX% or XX.X% near "purity" keyword
  const purityPattern = /(\d{2,3}\.\d{1,2})\s*%/g;
  const matches = [...text.matchAll(purityPattern)];
  for (const m of matches) {
    const val = parseFloat(m[1]);
    if (val >= 85 && val <= 100.5) {
      // Try to get context around this match for peptide name and date
      const start = Math.max(0, m.index! - 200);
      const end = Math.min(text.length, m.index! + 200);
      const ctx = text.slice(start, end).replace(/\s+/g, " ");

      // Date
      const dateM = ctx.match(/(\d{4}-\d{2}-\d{2})|(\w+ \d{1,2},?\s*\d{4})|(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      const date = dateM ? dateM[0] : "";

      results.push({ peptide: "Unknown", purity: val, date });
    }
  }
  return results;
}

// Find PDF and image links on a page
function findCoaLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const base = new URL(baseUrl);

  // href and src patterns for PDFs
  const patterns = [
    /href=["']([^"']*\.pdf[^"']*)/gi,
    /src=["']([^"']*\.pdf[^"']*)/gi,
  ];

  for (const pat of patterns) {
    for (const m of html.matchAll(pat)) {
      try {
        const url = new URL(m[1], base).href;
        if (!links.includes(url)) links.push(url);
      } catch {}
    }
  }
  return links;
}

async function scrapePage(slug: string, coaUrl: string) {
  console.log(`\n=== ${slug} ===`);
  console.log(`  Fetching: ${coaUrl}`);

  let html: string;
  try {
    html = await fetchText(coaUrl);
  } catch (e: any) {
    console.log(`  ERROR fetching page: ${e.message}`);
    return;
  }

  console.log(`  Page fetched (${html.length} chars)`);

  // Check for PDF links
  const pdfLinks = findCoaLinks(html, coaUrl);
  console.log(`  PDF links found: ${pdfLinks.length}`);
  if (pdfLinks.length > 0) {
    console.log(`  First 5 PDFs:`);
    pdfLinks.slice(0, 5).forEach(l => console.log(`    ${l}`));
  }

  // Look for purity numbers directly in page HTML
  const pageText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const purities = [...pageText.matchAll(/(\d{2,3}\.\d{1,2})\s*%/g)]
    .map(m => parseFloat(m[1]))
    .filter(v => v >= 85 && v <= 100.5);
  console.log(`  Purity-like values in page HTML: ${purities.slice(0, 20).join(", ")}${purities.length > 20 ? "..." : ""}`);
  console.log(`  Total purity-like values: ${purities.length}`);

  // Sample of page text around "purity"
  const purityIdx = pageText.toLowerCase().indexOf("purity");
  if (purityIdx >= 0) {
    console.log(`  Context around "purity": ...${pageText.slice(Math.max(0, purityIdx - 100), purityIdx + 200)}...`);
  }
}

async function main() {
  for (const v of VENDORS) {
    await scrapePage(v.slug, v.coaUrl);
  }
}

main().catch(console.error);
