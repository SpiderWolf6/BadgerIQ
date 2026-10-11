/**
 * Season configuration for Reports and Stats Corner.
 *
 * Maps each season to its Supabase storage folders. Safe to import from
 * client components — contains no secrets, only labels and paths.
 *
 * Supabase layout:
 *   reports/{season}/json_XX/   parsed report JSON  (Analysis view)
 *   reports/{season}/pdfs_XX/   raw report PDFs     (PDF view)
 *   stats/{season}/season/      season_stats.xlsx   (Wyscout export)
 *   stats/{season}/training/    YYYY-MM-DD.json     (one per training session)
 */

// reports

export type ReportSeason = "fall25" | "fall26";

export interface ReportSeasonConfig {
  label:     string;  // short, for toggles
  fullLabel: string;  // long, for the Topbar season indicator
  jsonDir:   string;  // folder in the "reports" bucket
  pdfDir:    string;
  available: boolean; // false → UI shows "Coming soon"
}

export const REPORT_SEASONS: Record<ReportSeason, ReportSeasonConfig> = {
  fall25: { label: "Fall 25", fullLabel: "Fall 2025", jsonDir: "fall25/json_25", pdfDir: "fall25/pdfs_25", available: true },
  fall26: { label: "Fall 26", fullLabel: "Fall 2026", jsonDir: "fall26/json_26", pdfDir: "fall26/pdfs_26", available: false },
};

export const DEFAULT_REPORT_SEASON: ReportSeason = "fall25";

export function isReportSeason(s: unknown): s is ReportSeason {
  return typeof s === "string" && s in REPORT_SEASONS;
}

// stats corner

export type StatsSeason = "spring26" | "fall26";

export interface StatsSeasonConfig {
  label:            string;
  fullLabel:        string;
  dir:              string;  // folder in the "stats" bucket
  hasSeasonStats:   boolean; // false → Season + Compare sub-tabs show "Coming soon"
  syncEndpoint?:    string;  // Refresh button target; omitted → Refresh disabled
}

export const STATS_SEASONS: Record<StatsSeason, StatsSeasonConfig> = {
  // Spring 26 is archived VXSport data — no more syncing
  spring26: { label: "Spring 26", fullLabel: "Spring 2026", dir: "spring26", hasSeasonStats: true },
  // Fall 26 is PlayerData CSV exports — sync endpoint added with the parser
  fall26:   { label: "Fall 26",   fullLabel: "Fall 2026",   dir: "fall26",   hasSeasonStats: false },
};

export const DEFAULT_STATS_SEASON: StatsSeason = "spring26";

export function isStatsSeason(s: unknown): s is StatsSeason {
  return typeof s === "string" && s in STATS_SEASONS;
}
