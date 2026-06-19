import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TIMEOUT_MS   = 10_000;
const TLD_VARIANTS = [".com", ".co", ".net", ".org", ".io", ".is", ".us", ".shop"];
const ALERT_EMAIL  = "jason@watchtowerpeptides.com";
const FROM_EMAIL   = "alerts@watchtowerpeptides.com";

async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WatchtowerBot/1.0)" },
    });
    return { ok: res.status < 500, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

function tldVariants(website: string): string[] {
  const url   = new URL(website);
  const host  = url.hostname;
  const base  = host.split(".").slice(0, -1).join(".");
  return TLD_VARIANTS
    .map(tld => `${url.protocol}//${base}${tld}`)
    .filter(v => v !== website);
}

export async function GET(request: Request) {
  // Vercel cron auth — reject calls that aren't from Vercel scheduler
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.WATCHTOWER_CRON_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await db
    .from("vendors")
    .select("name, slug, website, status")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const vendors = (data ?? []).filter(v => v.website);
  const dead: Array<{ name: string; slug: string; url: string; suggestion?: string }> = [];

  for (const v of vendors) {
    const result = await probe(v.website);
    if (result.ok) continue;

    let suggestion: string | undefined;
    for (const variant of tldVariants(v.website)) {
      if ((await probe(variant)).ok) { suggestion = variant; break; }
    }
    dead.push({ name: v.name, slug: v.slug, url: v.website, suggestion });
  }

  if (dead.length === 0) {
    return NextResponse.json({ ok: true, checked: vendors.length, dead: 0 });
  }

  // Send alert email
  const rows = dead.map(d => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${d.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-family:monospace;font-size:13px">${d.url}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${d.suggestion ? "#276749" : "#92400e"};font-size:13px">${d.suggestion ? `Try: ${d.suggestion}` : "No variant found"}</td>
    </tr>`).join("");

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Watchtower Alerts", email: FROM_EMAIL },
      to: [{ email: ALERT_EMAIL }],
      subject: `[Watchtower] ${dead.length} dead vendor URL${dead.length > 1 ? "s" : ""} detected`,
      htmlContent: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a1a1a;margin-bottom:4px">Vendor URL Alert</h2>
        <p style="color:#6b7280;margin-top:0">${dead.length} vendor site${dead.length > 1 ? "s" : ""} failed health check on ${new Date().toUTCString()}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f7f8fa">
              <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#374151">Vendor</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#374151">Dead URL</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#374151">Suggestion</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">
          Fix: update the vendor's website field in Supabase, then run <code>npm run check:urls</code> to verify.
        </p>
      </div>`,
    }),
  });

  return NextResponse.json({ ok: false, checked: vendors.length, dead: dead.length, alerted: true });
}
