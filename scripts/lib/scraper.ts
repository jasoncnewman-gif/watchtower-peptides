import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtml(
  url: string,
  delayMs = 1500
): Promise<cheerio.CheerioAPI> {
  await sleep(delayMs);
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const html = await res.text();
  return cheerio.load(html);
}

// Strip whitespace and return null for empty strings
export function clean(val: string | null | undefined): string | null {
  const s = (val ?? "").trim();
  return s.length > 0 ? s : null;
}

// Parse "$49.95", "49.95", "$49" → 49.95 or null
export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/[\d]+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

// Parse "5mg", "5 mg", "5MG" → 5 or null
export function parseMg(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.toLowerCase().match(/([\d.]+)\s*mg/);
  return match ? parseFloat(match[1]) : null;
}

export function log(script: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${script}] ${msg}`);
}
