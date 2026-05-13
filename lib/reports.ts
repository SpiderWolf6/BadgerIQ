import { Report } from "@/types/report";
import { createClient } from "@supabase/supabase-js";

const JSON_FILENAMES: Record<string, string> = {
  washington: "washington.json",
  "ohio-state": "ohio-state.json",
  ucla: "ucla.json",
  rutgers: "rutgers.json",
  indiana: "indiana.json",
  michigan: "michigan.json",
  "michigan-state": "michigan-state.json",
  "penn-state": "penn-state.json",
  northwestern: "northwestern.json",
};

const SLUGS = Object.keys(JSON_FILENAMES);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getAllReports(): Promise<Report[]> {
  const supabase = getSupabase();

  const results = await Promise.all(
    SLUGS.map(async (slug) => {
      const filename = JSON_FILENAMES[slug];
      const { data, error } = await supabase.storage
        .from("reports")
        .download(`json_25-26/${filename}`);

      if (error || !data) {
        console.error(`Failed to fetch ${filename}:`, error);
        return null;
      }

      const text = await data.text();
      const report = JSON.parse(text) as Report;
      return report;
    })
  );

  return results.filter(Boolean) as Report[];
}

export async function getReport(slug: string): Promise<Report | undefined> {
  const supabase = getSupabase();
  const filename = JSON_FILENAMES[slug];
  if (!filename) return undefined;

  const { data, error } = await supabase.storage
    .from("reports")
    .download(`json_25-26/${filename}`);

  if (error || !data) {
    console.error(`Failed to fetch ${filename}:`, error);
    return undefined;
  }

  const text = await data.text();
  return JSON.parse(text) as Report;
}
