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

export const db: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
