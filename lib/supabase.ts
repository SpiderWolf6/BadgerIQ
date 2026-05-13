import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export function getPdfUrl(filename: string): string {
  // Supabase public storage URL is deterministic — no client needed
  return `${url}/storage/v1/object/public/reports/${filename}`;
}
