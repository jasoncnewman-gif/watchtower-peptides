import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from project root
config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "Find it at: Supabase dashboard → Project Settings → API → service_role key"
  );
  process.exit(1);
}

// Cheerio (imported in scraper scripts) patches Node 26's native fetch in a way
// that causes gzip-encoded PostgREST responses to arrive un-decoded. Force
// identity encoding so responses are always plain JSON.
const noGzipFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  headers.set("Accept-Encoding", "identity");
  return fetch(input, { ...init, headers });
};

export const db: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
  global: { fetch: noGzipFetch },
});
