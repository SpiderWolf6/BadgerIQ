import { Report } from "@/types/report";
import { createClient } from "@supabase/supabase-js";
import { REPORT_SEASONS, ReportSeason, DEFAULT_REPORT_SEASON } from "@/lib/seasons";

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

/** Download and parse one report JSON from the season's json folder. */
async function downloadReport(season: ReportSeason, filename: string): Promise<Report | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("reports")
    .download(`${REPORT_SEASONS[season].jsonDir}/${filename}`);

  if (error || !data) {
    console.error(`Failed to fetch ${season}/${filename}:`, error);
    return null;
  }

  const text = await data.text();
  return JSON.parse(text) as Report;
}

export async function getAllReports(season: ReportSeason = DEFAULT_REPORT_SEASON): Promise<Report[]> {
  // seasons without reports yet (e.g. Fall 26) render a "Coming soon" page instead
  if (!REPORT_SEASONS[season].available) return [];

  const results = await Promise.all(
    SLUGS.map((slug) => downloadReport(season, JSON_FILENAMES[slug]))
  );
  return results.filter(Boolean) as Report[];
}

export async function getReport(
  slug: string,
  season: ReportSeason = DEFAULT_REPORT_SEASON
): Promise<Report | undefined> {
  const filename = JSON_FILENAMES[slug];
  if (!filename || !REPORT_SEASONS[season].available) return undefined;
  return (await downloadReport(season, filename)) ?? undefined;
}
