/**
 * Supabase storage layer for all stats data.
 *
 * Every path is scoped to a season folder (see lib/seasons.ts):
 *   stats/{season}/training/YYYY-MM-DD.json   one JSON per training session
 *   stats/{season}/season/season_stats.xlsx   Wyscout season export
 *
 * Uses the service role key so it can both read and write from server-side routes.
 * Never import this in client components.
 */

import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TrainingSession, SeasonPlayer } from "@/types/stats";
import { STATS_SEASONS, StatsSeason } from "@/lib/seasons";

function trainingDir(season: StatsSeason): string {
  return `${STATS_SEASONS[season].dir}/training`;
}

function getSupabase() {
  // service role key (read/write), never cached — stats files change after every sync
  return getSupabaseAdmin();
}

// training sessions

/** Fetch and parse every training session JSON from Supabase storage. */
export async function getAllSessions(season: StatsSeason): Promise<TrainingSession[]> {
  const supabase = getSupabase();
  const dir = trainingDir(season);

  // List all files in the training folder; limit 1000 to ensure we don't miss any
  // (Supabase paginates at lower limits by default)
  const { data: files, error } = await supabase.storage
    .from("stats")
    .list(dir, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error || !files) {
    console.error("Failed to list training files:", error);
    return [];
  }

  // Only pick files named exactly YYYY-MM-DD.json — ignore any other artifacts
  const jsonFiles = files.filter((f) => f.name.match(/^\d{4}-\d{2}-\d{2}\.json$/));

  const sessions = await Promise.all(
    jsonFiles.map(async (f) => {
      const { data, error } = await supabase.storage
        .from("stats")
        .download(`${dir}/${f.name}`);
      if (error || !data) return null;
      const text = await data.text();
      return JSON.parse(text) as TrainingSession;
    })
  );

  return sessions.filter(Boolean) as TrainingSession[];
}

/**
 * Return the most recent session date string (YYYY-MM-DD) stored in Supabase.
 * Used by the sync route to know where to start fetching new data from.
 */
export async function getLatestSessionDate(season: StatsSeason): Promise<string | null> {
  const supabase = getSupabase();

  // Sort descending so the first result is the newest file
  const { data: files, error } = await supabase.storage
    .from("stats")
    .list(trainingDir(season), { limit: 1000, sortBy: { column: "name", order: "desc" } });

  if (error || !files) return null;

  const jsonFiles = files.filter((f) => f.name.match(/^\d{4}-\d{2}-\d{2}\.json$/));
  if (!jsonFiles.length) return null;

  // Strip ".json" to get the date string
  return jsonFiles[0].name.replace(".json", "");
}

/** Dates (YYYY-MM-DD) that already have a session JSON stored for the season. */
export async function listSessionDates(season: StatsSeason): Promise<Set<string>> {
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage
    .from("stats")
    .list(trainingDir(season), { limit: 1000 });

  if (error || !files) throw new Error(`Failed to list ${season} training files: ${error?.message}`);

  return new Set(
    files
      .filter((f) => f.name.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .map((f) => f.name.replace(".json", ""))
  );
}

/**
 * Write a single session JSON to Supabase.
 * By default overwrites an existing file. With `overwrite: false` an existing
 * file is left untouched and the call returns false (used by the Fall 26 sync,
 * where a date is only ever written the first time it's processed).
 */
export async function uploadSession(
  season: StatsSeason,
  session: TrainingSession,
  { overwrite = true }: { overwrite?: boolean } = {}
): Promise<boolean> {
  const supabase = getSupabase();
  const content = JSON.stringify(session, null, 2);
  const blob = new Blob([content], { type: "application/json" });

  const { error } = await supabase.storage
    .from("stats")
    .upload(`${trainingDir(season)}/${session.date}.json`, blob, { upsert: overwrite });

  if (error) {
    // another sync wrote this date first — not an error when overwrite is off
    if (!overwrite && /exist|duplicate/i.test(error.message)) return false;
    throw new Error(`Failed to upload ${session.date}.json: ${error.message}`);
  }
  return true;
}

// generic JSON files in the stats bucket (e.g. the Fall 26 processed-exports log)

/** Read and parse a JSON file from the stats bucket; null if it doesn't exist. */
export async function readStatsJson<T>(path: string): Promise<T | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from("stats").download(path);
  if (error || !data) return null;
  return JSON.parse(await data.text()) as T;
}

/** Write a JSON file to the stats bucket, overwriting it. */
export async function writeStatsJson(path: string, value: unknown): Promise<void> {
  const supabase = getSupabase();
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const { error } = await supabase.storage.from("stats").upload(path, blob, { upsert: true });
  if (error) throw new Error(`Failed to write ${path}: ${error.message}`);
}

// season stats (Wyscout XLSX)

/** Parse a numeric cell — returns 0 for missing, empty, or non-numeric values. */
function n(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

/** Parse a string cell — returns empty string for null/undefined. */
function s(v: unknown): string {
  return v == null ? "" : String(v);
}

/**
 * Download season_stats.xlsx from Supabase and parse it into SeasonPlayer objects.
 * Column indices are based on the Wyscout export format — do not reorder columns
 * in the spreadsheet or these indices will break.
 */
export async function getSeasonPlayers(season: StatsSeason): Promise<SeasonPlayer[]> {
  // seasons without a Wyscout export yet (e.g. Fall 26) show "Coming soon"
  if (!STATS_SEASONS[season].hasSeasonStats) return [];

  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from("stats")
    .download(`${STATS_SEASONS[season].dir}/season/season_stats.xlsx`);

  if (error || !data) {
    console.error(`Failed to fetch ${season} season_stats.xlsx:`, error);
    return [];
  }

  const arrayBuffer = await data.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // header:1 gives raw arrays instead of objects so we can access by column index
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  // Row 0 is the header — skip it. Filter out any completely empty rows.
  return rows.slice(1).filter((row) => row.length > 0 && row[0]).map((r) => ({
    name:     s(r[0]),
    team:     s(r[1]),
    position: s(r[2]),
    age:      r[3] != null ? n(r[3]) : null,
    marketValue: n(r[4]),
    foot:     s(r[16]),
    height:   r[17] != null ? n(r[17]) : null,
    weight:   r[18] != null ? n(r[18]) : null,
    matchesPlayed: n(r[6]),
    minutesPlayed: n(r[7]),
    // attacking
    goals:              n(r[8]),
    xG:                 n(r[9]),
    assists:            n(r[10]),
    xA:                 n(r[11]),
    goalsP90:           n(r[36]),
    xGP90:              n(r[39]),
    assistsP90:         n(r[46]),
    xAP90:              n(r[47]),
    shots:              n(r[42]),
    shotsP90:           n(r[43]),
    shotsOnTargetPct:   n(r[44]),
    goalConversionPct:  n(r[45]),
    touchesInBoxP90:    n(r[59]),
    // dribbling
    dribblesP90:           n(r[54]),
    successfulDribblesPct: n(r[55]),
    progressiveRunsP90:    n(r[60]),
    offensiveDuelsP90:     n(r[56]),
    offensiveDuelsWonPct:  n(r[57]),
    // defending
    successfulDefActionsP90: n(r[20]),
    defensiveDuelsP90:       n(r[21]),
    defensiveDuelsWonPct:    n(r[22]),
    aerialDuelsP90:          n(r[23]),
    aerialDuelsWonPct:       n(r[24]),
    slidingTacklesP90:       n(r[25]),
    interceptionsP90:        n(r[28]),
    // passing
    passesP90:                    n(r[64]),
    accuratePassesPct:            n(r[65]),
    forwardPassesP90:             n(r[66]),
    accurateForwardPassesPct:     n(r[67]),
    longPassesP90:                n(r[76]),
    accurateLongPassesPct:        n(r[77]),
    keyPassesP90:                 n(r[83]),
    passesToFinalThirdP90:        n(r[84]),
    accuratePassesToFinalThirdPct: n(r[85]),
    smartPassesP90:               n(r[81]),
    accurateSmartPassesPct:       n(r[82]),
    throughPassesP90:             n(r[86]),
    progressivePassesP90:         n(r[90]),
    accurateProgressivePassesPct: n(r[91]),
    // crossing
    crossesP90:         n(r[48]),
    accurateCrossesPct: n(r[49]),
    // discipline
    foulsP90:      n(r[30]),
    yellowCards:   n(r[31]),
    yellowCardsP90: n(r[32]),
    redCards:      n(r[33]),
    redCardsP90:   n(r[34]),
    // duels combined
    duelsP90:    n(r[12]),
    duelsWonPct: n(r[13]),
  }));
}
