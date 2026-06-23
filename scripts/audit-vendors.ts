/**
 * scripts/audit-vendors.ts
 * Per-vendor audit — shipping, transparency, score proposals, Reddit sentiment.
 * Processes the 5 least-recently-reviewed active vendors per run.
 *
 *   (1) Shipping info       — auto-updated (plain fetch → browser login fallback)
 *   (2) Transparency fields — auto-updated via plain fetch
 *   (3) Score recompute     — proposed as pending for human approval
 *   (4) Reddit sentiment    — proposed as pending for human approval
 *
 * Run AFTER audit:pricing so CX sub-scores use a fresh market baseline.
 * Run: npm run audit:vendors
 * Approve results at /admin/audits
 */

import OpenAI from "openai";
import { db } from "./lib/client.js";
import { log, sleep } from "./lib/scraper.js";

const SCRIPT     = "audit-vendors";
const BATCH_SIZE = 5;
const UA         = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const NOW        = new Date();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

type VendorRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  has_coa: boolean;
  finnrick_tests_count: number | null;
  status: string;
  overall_score: number | null;
  shipping_free_threshold: number | null;
  shipping_flat_fee: number | null;
  login_email: string | null;
  login_password: string | null;
  login_username: string | null;
  login_path: string | null;
  login_platform: string | null;
};

type LabTestRow = {
  vendor_id: string;
  test_type: string | null;
  purity_result: number | null;
  endotoxin_result: string | null;
  test_date: string | null;
};

type TransparencyRow = {
  vendor_id: string;
  has_contact_info: boolean;
  has_business_address: boolean;
  has_ownership_disclosure: boolean;
  has_lab_disclosure: boolean;
  has_testing_methodology: boolean;
  has_batch_numbers: boolean;
  domain_years: number | null;
  fda_warning: boolean;
  fraud_flags: boolean;
};

type PeptidePriceRow = {
  vendor_id: string;
  peptide_name: string;
  price_per_mg: number | null;
};

// ── Shipping patterns ─────────────────────────────────────────────────────────

const FREE_ALL_RE = [
  /free\s+shipping\s+on\s+all\s+(?:domestic\s+)?orders?(?:\s+in\s+the\s+(?:US|USA|United\s+States))?(?!\s+over|\s+above|\s+of|\s+\$)/i,
  /always\s+free\s+(?:domestic\s+)?shipping/i,
  /free\s+(?:standard\s+)?shipping\s+always/i,
  /we\s+offer\s+free\s+shipping\s+on\s+(?:all\s+)?(?:domestic\s+)?orders?(?!\s+over|\s+above)/i,
];
const FREE_THRESH_RE = [
  /free\s+shipping\s+on\s+(?:all\s+)?orders?\s+(?:over|above|of)?\s*\$\s*(\d+(?:\.\d+)?)/i,
  /free\s+shipping\s+(?:on\s+orders?\s+)?\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more|and\s+over)/i,
  /orders?\s+(?:over|above)\s+\$\s*(\d+(?:\.\d+)?)\s+(?:get|receive|qualify\s+for)?\s*free\s+shipping/i,
  /\$\s*(\d+(?:\.\d+)?)\s*(?:\+|or\s+more)\s+(?:gets?\s+)?free\s+shipping/i,
  /free\s+shipping\s+with\s+(?:a\s+)?\$\s*(\d+(?:\.\d+)?)\s+(?:minimum|order)/i,
  /spend\s+\$\s*(\d+(?:\.\d+)?)\s+(?:or\s+more\s+)?(?:to\s+get\s+|for\s+)?free\s+shipping/i,
  /free\s+(?:standard\s+)?shipping\s+on\s+(?:all\s+)?(?:domestic\s+)?orders?\s+(?:over|above|exceeding|of)\s+\$\s*(\d+(?:\.\d+)?)/i,
];
const FLAT_FEE_RE = [
  /flat[\s-]rate\s+shipping\s+(?:fee\s+)?(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /\$\s*(\d+(?:\.\d+)?)\s+flat[\s-]rate\s+shipping/i,
  /flat\s+(?:shipping\s+)?fee\s+(?:of\s+)?\$\s*(\d+(?:\.\d+)?)/i,
  /shipping\s+fee\s+(?:is\s+)?(?:only\s+)?\$\s*(\d+(?:\.\d+)?)/i,
];

interface ShippingResult {
  shipping_free_threshold?: number;
  shipping_flat_fee?: number;
  ships_internationally?: boolean;
  credit_card_accepted?: boolean;
  crypto_accepted?: boolean;
  paypal_accepted?: boolean;
}

function extractShipping(text: string): ShippingResult {
  const t = text.replace(/\s+/g, " ");
  const r: ShippingResult = {};
  for (const pat of FREE_ALL_RE) {
    if (pat.test(t)) { r.shipping_free_threshold = 0; break; }
  }
  if (r.shipping_free_threshold === undefined) {
    for (const pat of FREE_THRESH_RE) {
      const m = t.match(pat);
      if (m) { r.shipping_free_threshold = parseFloat(m[1]); break; }
    }
  }
  for (const pat of FLAT_FEE_RE) {
    const m = t.match(pat);
    if (m) { r.shipping_flat_fee = parseFloat(m[1]); break; }
  }
  if (/we\s+ship\s+(?:world[-\s]?wide|internationally)|international\s+(?:orders?|shipping)\s+(?:are\s+)?(?:accepted|welcome|available)/i.test(t)) r.ships_internationally = true;
  if (/\b(visa|mastercard|credit\s+card|debit\s+card|amex|american\s+express)\b/i.test(t)) r.credit_card_accepted = true;
  if (/\b(bitcoin|ethereum|crypto(?:currency)?|btc|eth|usdc|usdt)\b/i.test(t)) r.crypto_accepted = true;
  if (/\b(paypal)\b/i.test(t)) r.paypal_accepted = true;
  return r;
}

// ── Plain fetch helpers ───────────────────────────────────────────────────────

async function tryFetch(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.text() : "";
  } catch { return ""; }
}

async function scrapeShippingPlain(website: string): Promise<ShippingResult> {
  const origin = new URL(website).origin;
  const merged: ShippingResult = {};
  for (const path of ["/policies/shipping", "/shipping-policy", "/pages/shipping-policy", "/pages/shipping", "/shipping", "/"]) {
    const text = await tryFetch(origin + path);
    if (!text) continue;
    const r = extractShipping(text);
    if (r.shipping_free_threshold !== undefined && merged.shipping_free_threshold === undefined) merged.shipping_free_threshold = r.shipping_free_threshold;
    if (r.shipping_flat_fee       !== undefined && merged.shipping_flat_fee       === undefined) merged.shipping_flat_fee       = r.shipping_flat_fee;
    if (r.ships_internationally)  merged.ships_internationally  = true;
    if (r.credit_card_accepted)   merged.credit_card_accepted   = true;
    if (r.crypto_accepted)        merged.crypto_accepted        = true;
    if (r.paypal_accepted)        merged.paypal_accepted        = true;
    if (merged.shipping_free_threshold !== undefined || merged.shipping_flat_fee !== undefined) break;
    await sleep(200);
  }
  return merged;
}

// ── Browser-based scraping (for shipping fallback on gated sites) ────────────

import type { Browser, Page } from "puppeteer";

async function launchBrowser(): Promise<Browser> {
  const { default: puppeteerExtra } = await import("puppeteer-extra");
  const { default: StealthPlugin }  = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.use(StealthPlugin());
  return (puppeteerExtra as any).launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled", "--window-size=1280,900"],
  }) as Promise<Browser>;
}

async function loginWooCommerce(page: Page, v: VendorRow): Promise<boolean> {
  const baseUrl   = new URL(v.website!).origin;
  const loginUrl  = `${baseUrl}${v.login_path ?? "/my-account/"}`;
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);
    for (const sel of ["#zc-manage", ".zcb-button-primary", "button[class*='accept']", "button[class*='age']"]) {
      try { const el = await page.$(sel); if (el) { await el.click(); await sleep(600); break; } } catch { /* continue */ }
    }
    const userSel = "input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']";
    const loginVal = (await page.$(userSel)) && v.login_username ? v.login_username : v.login_email!;
    await page.waitForSelector(userSel, { timeout: 8000 });
    await page.evaluate((sel: string, val: string) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (el) { el.value = val; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    }, userSel, loginVal);
    const passSel = "input[name='pwd'], input[name='password'], input[name='xoo-el-password'], input[type='password']";
    await page.waitForSelector(passSel, { timeout: 8000 });
    await page.evaluate((sel: string, val: string) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (el) { el.value = val; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    }, passSel, v.login_password!);
    const clicked = await page.evaluate(() => {
      const f = (document.querySelector("input[name='log'], input[name='username'], input[name='xoo-el-username'], input[type='email']") as HTMLInputElement)?.closest("form");
      const btn = f?.querySelector("input[type='submit'], button[type='submit']") as HTMLElement | null;
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) await page.evaluate(() => {
      const btn = document.querySelector("input[name='wp-submit'], button[type='submit'], input[type='submit']") as HTMLElement | null;
      if (btn) btn.click();
    }).catch(() => {});
    await Promise.race([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }), sleep(6000)]).catch(() => {});
    await sleep(1500);
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    if (text.includes("incorrect") || text.includes("invalid username") || text.includes("wrong password")) return false;
    return text.includes("log out") || text.includes("logout") || text.includes("my account") || text.includes("dashboard") || text.includes("orders");
  } catch { return false; }
}

async function loginShopify(page: Page, v: VendorRow): Promise<boolean> {
  const baseUrl  = new URL(v.website!).origin;
  const loginUrl = `${baseUrl}${v.login_path ?? "/account/login"}`;
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(1500);
    const emailSel = "input[type='email'], input[name='customer[email]']";
    const passSel  = "input[type='password'], input[name='customer[password]']";
    await page.waitForSelector(emailSel, { timeout: 8000 });
    await page.click(emailSel);
    await page.type(emailSel, v.login_email!, { delay: 40 });
    await page.click(passSel);
    await page.type(passSel, v.login_password!, { delay: 40 });
    await page.click("button[type='submit'], input[type='submit']");
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).toLowerCase();
    return !text.includes("incorrect email or password");
  } catch { return false; }
}

async function scrapeShippingBrowser(page: Page, origin: string): Promise<ShippingResult> {
  const merged: ShippingResult = {};
  for (const path of ["/policies/shipping", "/shipping-policy", "/pages/shipping-policy", "/pages/shipping", "/shipping", "/"]) {
    try {
      await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded", timeout: 10000 });
      const text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
      if (text.length < 100) continue;
      const r = extractShipping(text);
      if (r.shipping_free_threshold !== undefined && merged.shipping_free_threshold === undefined) merged.shipping_free_threshold = r.shipping_free_threshold;
      if (r.shipping_flat_fee       !== undefined && merged.shipping_flat_fee       === undefined) merged.shipping_flat_fee       = r.shipping_flat_fee;
      if (r.ships_internationally)  merged.ships_internationally  = true;
      if (r.credit_card_accepted)   merged.credit_card_accepted   = true;
      if (r.crypto_accepted)        merged.crypto_accepted        = true;
      if (r.paypal_accepted)        merged.paypal_accepted        = true;
      if (merged.shipping_free_threshold !== undefined || merged.shipping_flat_fee !== undefined) break;
    } catch { /* continue */ }
  }
  return merged;
}

// ── Transparency (always plain fetch — contact/about usually public) ───────────

const MAILTO_RE    = /href=["']mailto:[^"'@]+@[^"']+["']/i;
const EMAIL_RE     = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const STREET_RE    = /\b\d{1,5}\s+(?:[NSEW]\.?\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b/i;
const ZIP_RE       = /\b\d{5}(?:-\d{4})?\b/;
const OWNERSHIP_RE = /\b(?:founded|owned|operated|created|started)\s+by\s+[A-Z][a-z]+|(?:CEO|owner|president|founder|director|managing partner)[:\s"']+[A-Z][a-z]+\s+[A-Z][a-z]+|Hi,?\s+I'?m\s+[A-Z][a-z]+|my name is\s+[A-Z][a-z]+/i;

async function checkTransparency(website: string) {
  const origin = new URL(website).origin;
  const pages: string[] = [];
  for (const path of ["/", "/contact/", "/about/", "/pages/contact", "/pages/about-us"]) {
    pages.push(await tryFetch(origin + path));
    await sleep(200);
  }
  const html = pages.join("\n");
  return {
    has_contact_info:         MAILTO_RE.test(html) || EMAIL_RE.test(html),
    has_business_address:     STREET_RE.test(html) && ZIP_RE.test(html),
    has_ownership_disclosure: OWNERSHIP_RE.test(html),
  };
}

// ── Score computation (mirrors compute-scores.ts) ─────────────────────────────

function lvTier(v: VendorRow, trans: TransparencyRow | undefined): number {
  if ((v.finnrick_tests_count ?? 0) > 0) return 4;
  if (!v.has_coa) return 0;
  if (trans?.has_lab_disclosure && trans?.has_batch_numbers) return 3;
  if (trans?.has_lab_disclosure) return 2;
  return 1;
}

const TIER_BASE: Record<number, number> = { 0: 0, 1: 5, 2: 15, 3: 25, 4: 40 };

function labVerificationScore(v: VendorRow, trans: TransparencyRow | undefined): number {
  const tier = lvTier(v, trans);
  if (tier < 4) return TIER_BASE[tier];
  const n = v.finnrick_tests_count ?? 0;
  if (n >= 10) return 40;
  if (n >= 4)  return 30 + Math.round((n - 4) * 1.5);
  return 25 + Math.round((n - 1) * 2);
}

const PQ_TABLE: Record<number, [number, number, number, number]> = {
  1: [0, 4, 7, 10], 2: [0, 6, 11, 15], 3: [0, 8, 14, 20], 4: [0, 10, 18, 25],
};

function monthsSince(d: string | null): number {
  if (!d) return 24;
  return (NOW.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function purityBandPoints(purity: number, tier: number): number {
  const row = PQ_TABLE[tier];
  if (!row) return 0;
  if (purity >= 98) return row[3]; if (purity >= 95) return row[2]; if (purity >= 90) return row[1]; return row[0];
}

function productQualityScore(vendorId: string, tier: number, tests: LabTestRow[]): { score: number; hasQualityWarning: boolean } {
  const vt = tests.filter((t) => t.vendor_id === vendorId && t.test_type !== "Endotoxin" && t.purity_result !== null);
  const recentTests = tests.filter((t) => t.vendor_id === vendorId && monthsSince(t.test_date) <= 6);
  const hasQualityWarning = recentTests.some((t) => (t.purity_result !== null && t.purity_result < 95) || (t as any).endotoxin_result === "high");
  if (!vt.length || tier === 0) return { score: 0, hasQualityWarning };
  let wSum = 0, wTot = 0;
  for (const t of vt) { const w = Math.exp(-0.04 * monthsSince(t.test_date)); wSum += t.purity_result! * w; wTot += w; }
  const avg = wTot > 0 ? wSum / wTot : 0;
  return { score: purityBandPoints(avg, tier), hasQualityWarning };
}

function transparencyScore(trans: TransparencyRow | undefined): number {
  if (!trans || trans.fraud_flags) return 0;
  const pts = (trans.has_business_address ? 5 : 0) + (trans.has_ownership_disclosure ? 5 : 0) +
    (trans.has_lab_disclosure ? 5 : 0) + (trans.has_contact_info ? 3 : 0) +
    (trans.has_testing_methodology ? 3 : 0) + (trans.has_batch_numbers ? 2 : 0) +
    ((trans.domain_years ?? 0) >= 2 ? 2 : 0);
  const p = Math.max(0, pts - (trans.fda_warning ? 10 : 0));
  if (p >= 18) return 25; if (p >= 9) return 16; if (p >= 1) return 8; return 0;
}

const BLEND_RE = /\s*[&+]\s*|\b(?:mix|blend|stack|combo|combination|complex)\b/i;

function normalizePeptideName(raw: string): string {
  return raw.toLowerCase().replace(/\s*[-–]\s*\d+\s*mg\b/gi, "").replace(/\s+\d+\s*mg\b/gi, "")
    .replace(/\s*\([^)]*\)/g, "").replace(/\bvial\b|\bpeptide\b/gi, "").replace(/[-\s]+/g, "-").replace(/^-+|-+$/g, "").trim();
}

function pricingScore(vendorId: string, prices: PeptidePriceRow[], market: Map<string, number>): number {
  const ratios = prices
    .filter((p) => p.vendor_id === vendorId && p.price_per_mg !== null && !BLEND_RE.test(p.peptide_name))
    .map((p) => { const m = market.get(normalizePeptideName(p.peptide_name)); return m ? p.price_per_mg! / m : null; })
    .filter((r): r is number => r !== null);
  if (!ratios.length) return 3;
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  if (avg < 0.85) return 6; if (avg < 0.95) return 5; if (avg < 1.05) return 3; if (avg < 1.15) return 1; return 0;
}

function shippingScore(v: VendorRow): number {
  const { shipping_free_threshold: t, shipping_flat_fee: f } = v;
  if (t == null && f == null) return 2;
  if (t === 0 || f === 0) return 4;
  if (t != null) { if (t <= 100) return 4; if (t <= 200) return 3; return 2; }
  if (f != null && f > 0) return 1;
  return 2;
}

async function recomputeScore(v: VendorRow): Promise<{ score: number; lv: number; pq: number; tr: number; cx: number }> {
  const [{ data: tests }, { data: trans }, { data: prices }, { data: market }] = await Promise.all([
    db.from("lab_tests").select("vendor_id, test_type, purity_result, endotoxin_result, test_date").eq("vendor_id", v.id),
    db.from("vendor_transparency").select("vendor_id, has_contact_info, has_business_address, has_ownership_disclosure, has_lab_disclosure, has_testing_methodology, has_batch_numbers, domain_years, fda_warning, fraud_flags").eq("vendor_id", v.id).maybeSingle(),
    db.from("vendor_peptides").select("vendor_id, peptide_name, price_per_mg").eq("vendor_id", v.id).not("price_per_mg", "is", null),
    db.from("peptide_market_prices").select("peptide_key, avg_price_per_mg"),
  ]);
  const transRow  = trans as TransparencyRow | null;
  const priceRows = (prices ?? []) as PeptidePriceRow[];
  const marketMap = new Map((market ?? []).map((m: any) => [m.peptide_key as string, m.avg_price_per_mg as number]));
  const tier = lvTier(v, transRow ?? undefined);
  const lv = labVerificationScore(v, transRow ?? undefined);
  const { score: pq } = productQualityScore(v.id, tier, (tests ?? []) as LabTestRow[]);
  const tr = transparencyScore(transRow ?? undefined);
  const cx = pricingScore(v.id, priceRows, marketMap) + shippingScore(v);
  return { score: lv + pq + tr + cx, lv, pq, tr, cx };
}

// ── Reddit sentiment ───────────────────────────────────────────────────────────

type RedditPost = { title: string; selftext: string; permalink: string };
type SentimentResult = { sentiment: "positive" | "neutral" | "mixed" | "negative" | "insufficient_data"; summary: string };

async function fetchRedditPosts(vendorName: string): Promise<RedditPost[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) { log(SCRIPT, "WARN: SERPER_API_KEY not set"); return []; }
  const posts: RedditPost[] = [];
  for (const q of [`"${vendorName}" peptide site:reddit.com`, `"${vendorName}" peptides vendor site:reddit.com`]) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST", headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" }, body: JSON.stringify({ q, num: 10 }),
      });
      if (!res.ok) continue;
      for (const item of ((await res.json() as any).organic ?? [])) {
        if (!posts.some((p) => p.permalink === item.link))
          posts.push({ title: item.title ?? "", selftext: item.snippet ?? "", permalink: item.link ?? "" });
      }
      await sleep(300);
    } catch { /* skip */ }
  }
  return posts;
}

async function summarizeSentiment(vendorName: string, posts: RedditPost[]): Promise<SentimentResult> {
  if (posts.length < 3) return { sentiment: "insufficient_data", summary: `Fewer than 3 Reddit posts found for ${vendorName}. Insufficient data to assess community sentiment.` };
  const postsText = posts.slice(0, 20).map((p) => `TITLE: ${p.title}\nBODY: ${p.selftext}`).join("\n\n---\n\n");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You analyze Reddit posts about peptide vendors. Be concise and factual." },
      { role: "user", content: `Analyze these Reddit posts about "${vendorName}" and respond with JSON:\n{"sentiment":"positive"|"neutral"|"mixed"|"negative"|"insufficient_data","summary":"2-3 sentence summary."}\n\nSentiment: positive=actively recommended, neutral=mentioned without strong opinion, mixed=praise+complaints, negative=criticized/warned against, insufficient_data=too few posts.\n\nPosts:\n${postsText}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const VALID = ["positive", "neutral", "mixed", "negative", "insufficient_data"];
  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Partial<SentimentResult>;
  if (!parsed.sentiment || !VALID.includes(parsed.sentiment)) {
    return { sentiment: "insufficient_data", summary: `Unable to parse sentiment response for ${vendorName}.` };
  }
  return parsed as SentimentResult;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(SCRIPT, `Selecting ${BATCH_SIZE} vendors for audit (least recently reviewed)…`);

  const { data: vendors, error: e1 } = await db
    .from("vendors")
    .select("id, name, slug, website, has_coa, finnrick_tests_count, status, overall_score, shipping_free_threshold, shipping_flat_fee, login_email, login_password, login_username, login_path, login_platform")
    .in("status", ["active", "flagged"])
    .order("last_reviewed", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE * 4);

  if (e1 || !vendors?.length) { log(SCRIPT, `No vendors: ${e1?.message ?? "empty"}`); process.exit(1); }

  const [{ data: pendingAudits }, { data: pendingSentiments }] = await Promise.all([
    db.from("vendor_audit_log").select("vendor_id").eq("status", "pending"),
    db.from("vendor_sentiment_log").select("vendor_id").eq("status", "pending"),
  ]);
  const pendingSet = new Set([
    ...(pendingAudits    ?? []).map((r) => r.vendor_id),
    ...(pendingSentiments ?? []).map((r) => r.vendor_id),
  ]);

  const toAudit = (vendors as VendorRow[]).filter((v) => !pendingSet.has(v.id)).slice(0, BATCH_SIZE);
  if (!toAudit.length) { log(SCRIPT, "All selected vendors have pending records. Approve or deny them first."); process.exit(0); }

  log(SCRIPT, `Auditing: ${toAudit.map((v) => v.name).join(", ")}\n`);

  // Lazy-launch browser only if needed (after all initial DB queries, to avoid stealth plugin patching fetch)
  const needsBrowser = toAudit.some((v) => v.login_email && v.login_password);
  let browser: Browser | null = null;
  if (needsBrowser) {
    log(SCRIPT, "Launching browser for gated vendor access…");
    browser = await launchBrowser();
  }

  try {
    for (const vendor of toAudit) {
      log(SCRIPT, `── ${vendor.name} ──`);
      const scoreBefore = vendor.overall_score ?? 0;
      const changes: string[] = [];

      if (!vendor.website) {
        log(SCRIPT, "  — no website, skipping scraping steps");
      } else {
        const origin       = new URL(vendor.website).origin;
        const hasCreds     = !!(vendor.login_email && vendor.login_password);
        let   browserPage: Page | null = null;
        let   loggedIn     = false;

        // Helper: ensure browser page is open and logged in (created lazily)
        async function ensureLogin(): Promise<Page | null> {
          if (!browser || !hasCreds) return null;
          if (browserPage && loggedIn) return browserPage;
          if (!browserPage) {
            browserPage = await browser.newPage();
            await browserPage.setUserAgent(UA);
            await browserPage.setViewport({ width: 1280, height: 900 });
            browserPage.setDefaultNavigationTimeout(20000);
          }
          const platform = (vendor.login_platform ?? "woocommerce") as "woocommerce" | "shopify";
          log(SCRIPT, `  → Logging in to ${vendor.name}…`);
          loggedIn = platform === "shopify"
            ? await loginShopify(browserPage, vendor)
            : await loginWooCommerce(browserPage, vendor);
          if (loggedIn) log(SCRIPT, `  ✓ Login successful`);
          else log(SCRIPT, `  ✗ Login failed — proceeding without auth`);
          return loggedIn ? browserPage : null;
        }

        // ── Step 1: Shipping ─────────────────────────────────────────────────
        log(SCRIPT, `  [1/4] Shipping…`);
        let shipping = await scrapeShippingPlain(vendor.website);
        const foundShipping = shipping.shipping_free_threshold !== undefined || shipping.shipping_flat_fee !== undefined;
        if (!foundShipping && hasCreds) {
          const page = await ensureLogin();
          if (page) shipping = await scrapeShippingBrowser(page, origin);
        }
        const shippingFields: Partial<ShippingResult> = {};
        if (shipping.shipping_free_threshold !== undefined) shippingFields.shipping_free_threshold = shipping.shipping_free_threshold;
        if (shipping.shipping_flat_fee       !== undefined) shippingFields.shipping_flat_fee       = shipping.shipping_flat_fee;
        if (shipping.ships_internationally   !== undefined) shippingFields.ships_internationally   = shipping.ships_internationally;
        if (shipping.credit_card_accepted    !== undefined) shippingFields.credit_card_accepted    = shipping.credit_card_accepted;
        if (shipping.crypto_accepted         !== undefined) shippingFields.crypto_accepted         = shipping.crypto_accepted;
        if (shipping.paypal_accepted         !== undefined) shippingFields.paypal_accepted         = shipping.paypal_accepted;
        if (Object.keys(shippingFields).length > 0) {
          await db.from("vendors").update(shippingFields).eq("id", vendor.id);
          if (shipping.shipping_free_threshold === 0)       { changes.push("shipping: free on all orders"); vendor.shipping_free_threshold = 0; }
          else if (shipping.shipping_free_threshold != null) { changes.push(`shipping: free $${shipping.shipping_free_threshold}+`); vendor.shipping_free_threshold = shipping.shipping_free_threshold; }
          else if (shipping.shipping_flat_fee != null)       { changes.push(`shipping: flat fee $${shipping.shipping_flat_fee}`); vendor.shipping_flat_fee = shipping.shipping_flat_fee; }
          else changes.push("shipping: payment data updated");
          log(SCRIPT, `  ✓ updated`);
        } else {
          log(SCRIPT, `  — not found`);
        }

        // ── Step 2: Transparency ─────────────────────────────────────────────
        log(SCRIPT, `  [2/4] Transparency…`);
        try {
          const webFields = await checkTransparency(vendor.website);
          const { data: existing } = await db.from("vendor_transparency").select("has_contact_info, has_business_address, has_ownership_disclosure").eq("vendor_id", vendor.id).maybeSingle();
          const upgrades: Record<string, boolean> = {};
          if (webFields.has_contact_info        && !existing?.has_contact_info)        upgrades.has_contact_info        = true;
          if (webFields.has_business_address     && !existing?.has_business_address)     upgrades.has_business_address     = true;
          if (webFields.has_ownership_disclosure && !existing?.has_ownership_disclosure) upgrades.has_ownership_disclosure = true;
          if (Object.keys(upgrades).length > 0) {
            await db.from("vendor_transparency").update(upgrades).eq("vendor_id", vendor.id);
            const labels = Object.keys(upgrades).map((k) => k.replace("has_", "").replace(/_/g, " "));
            changes.push(`transparency: +${labels.join(", ")}`);
            log(SCRIPT, `  ✓ found: ${labels.join(", ")}`);
          } else {
            log(SCRIPT, `  — no new signals`);
          }
        } catch (err) { log(SCRIPT, `  ✗ error: ${err}`); }

        if (browserPage) await browserPage.close().catch(() => {});
      }

      // ── Step 3: Score ──────────────────────────────────────────────────────
      log(SCRIPT, `  [3/4] Computing score…`);
      let scoreAfter = scoreBefore;
      let subScores: { lv: number; pq: number; tr: number; cx: number } | null = null;
      try {
        const result = await recomputeScore(vendor);
        scoreAfter = result.score;
        subScores = { lv: result.lv, pq: result.pq, tr: result.tr, cx: result.cx };
        log(SCRIPT, `  Score: ${scoreBefore} → ${scoreAfter}`);
      } catch (err) { log(SCRIPT, `  ✗ score error: ${err}`); }

      const changeSummary = changes.length > 0
        ? `Auto-updated: ${changes.join("; ")}. Score: ${scoreBefore} → ${scoreAfter}.`
        : `No data changes for ${vendor.name}. Score: ${scoreBefore}${scoreAfter !== scoreBefore ? ` → ${scoreAfter}` : " (unchanged)"}.`;

      const { error: ae } = await db.from("vendor_audit_log").insert({
        vendor_id: vendor.id, score_before: scoreBefore, score_after: scoreAfter,
        score_changed: scoreAfter !== scoreBefore, change_summary: changeSummary,
        sub_scores: subScores, status: "pending",
      });
      if (ae) log(SCRIPT, `  ✗ audit log error: ${ae.message}`);
      else log(SCRIPT, `  ✓ audit record written (pending)`);

      // ── Step 4: Reddit sentiment ────────────────────────────────────────────
      log(SCRIPT, `  [4/4] Reddit…`);
      try {
        const posts     = await fetchRedditPosts(vendor.name);
        log(SCRIPT, `  Found ${posts.length} posts`);
        const sentiment = await summarizeSentiment(vendor.name, posts);
        log(SCRIPT, `  Sentiment: ${sentiment.sentiment}`);
        const { error: se } = await db.from("vendor_sentiment_log").insert({
          vendor_id: vendor.id, post_count: posts.length, sentiment: sentiment.sentiment,
          summary: sentiment.summary, notable_posts: posts.slice(0, 5).map((p) => p.permalink), status: "pending",
        });
        if (se) log(SCRIPT, `  ✗ sentiment error: ${se.message}`);
        else log(SCRIPT, `  ✓ sentiment written (pending)`);
      } catch (err) { log(SCRIPT, `  ✗ Reddit error: ${err}`); }

      log(SCRIPT, "");
      await sleep(2000);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  log(SCRIPT, `Done. ${toAudit.length} vendors audited. Review at /admin/audits`);
}

main();
