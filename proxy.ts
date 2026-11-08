import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Temporary diagnostic instrumentation (added 2026-11-08) — see
// supabase/migration_026.sql for why. Logs the real User-Agent per page
// request so the CN/SG/HK traffic pattern found in Vercel Analytics can be
// identified (named crawler vs. real VPN-routed users) instead of guessed
// at. Fire-and-forget via waitUntil so it never adds latency to a real
// response. A self-contained client (not the shared lib/supabase.ts) per
// Next.js's own guidance not to rely on shared modules in Proxy.

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  event.waitUntil(
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) return;

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

        const row = {
          path: request.nextUrl.pathname,
          method: request.method,
          user_agent: request.headers.get("user-agent"),
          referer: request.headers.get("referer"),
          country: request.headers.get("x-vercel-ip-country"),
          city: request.headers.get("x-vercel-ip-city"),
          ip_hash: ip ? await hashIp(ip) : null,
        };

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        await supabase.from("traffic_log").insert(row);
      } catch {
        // Diagnostic logging must never break a real page request.
      }
    })()
  );

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|ttf)$).*)",
  ],
};
