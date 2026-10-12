/**
 * Server-side Supabase client (service role key — never import client-side).
 *
 * Next.js 14 caches every server-side fetch() in its Data Cache by default —
 * including supabase-js's storage calls — for up to a year. Without this,
 * a new training JSON or a replaced season_stats.xlsx would never show up.
 *
 *   getSupabaseAdmin()                     → never cached (stats data)
 *   getSupabaseAdmin({ revalidate: 300 })  → cached up to 5 min (reports)
 */

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin({ revalidate }: { revalidate?: number } = {}) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (input, init) =>
          fetch(input, revalidate === undefined
            ? { ...init, cache: "no-store" }
            : { ...init, next: { revalidate } }),
      },
    }
  );
}
