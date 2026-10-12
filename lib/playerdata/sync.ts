/**
 * Fall 26 training sync: Google Drive exports → Supabase session JSONs.
 *
 *  1. Read the processed-exports log  (stats/fall26/processed_exports.json)
 *  2. List exportN.csv files in the Drive folder; keep the ones not in the log
 *  3. Download + parse + clean each new file (a bad file is reported and left
 *     unprocessed so it's retried next time; the others still go through)
 *  4. Build one session per date from all new rows combined
 *  5. Upload sessions for dates that don't exist yet — existing dates are never touched
 *  6. Append the successfully parsed files to the log
 *
 * Re-processing a date: delete its JSON from stats/fall26/training/ and remove
 * the export(s) that contain it from processed_exports.json, then Refresh.
 *
 * Used by POST /api/stats/fall26/sync and scripts/fall26_sync.ts (dry run).
 */

import { TrainingSession } from "@/types/stats";
import { STATS_SEASONS, StatsSeason } from "@/lib/seasons";
import { listSessionDates, uploadSession, readStatsJson, writeStatsJson } from "@/lib/statsStorage";
import { DriveClient } from "./drive";
import { parseExport, CleanRow } from "./parseExport";
import { buildSessions } from "./buildSessions";

const SEASON: StatsSeason = "fall26";
export const PROCESSED_LOG_PATH = `${STATS_SEASONS[SEASON].dir}/processed_exports.json`;

export interface ProcessedEntry {
  file:         string;   // name in Drive, e.g. "export3.csv"
  driveId:      string;
  processedAt:  string;   // ISO timestamp
  newDates:     string[]; // dates this file added
  skippedDates: string[]; // dates in this file that already existed
}

export interface ProcessedLog {
  files: ProcessedEntry[];
}

export interface SyncReport {
  dryRun:         boolean;
  processedFiles: string[];
  failedFiles:    { file: string; error: string }[];
  newDates:       string[];
  skippedDates:   string[]; // already in Supabase — left as-is
  warnings:       string[];
  newSessions:    TrainingSession[];
}

/** "export3.csv" and a converted Sheet named "export3" are the same export. */
function exportNumber(name: string): number | null {
  const m = name.match(/^export(\d+)/i);
  return m ? Number(m[1]) : null;
}

export async function syncFall26({ dryRun = false } = {}): Promise<SyncReport> {
  const report: SyncReport = {
    dryRun, processedFiles: [], failedFiles: [], newDates: [], skippedDates: [], warnings: [], newSessions: [],
  };

  // 1–2. what's new in Drive
  const log = (await readStatsJson<ProcessedLog>(PROCESSED_LOG_PATH)) ?? { files: [] };
  const done = new Set(log.files.map((f) => exportNumber(f.file)));

  const drive = await DriveClient.connect();
  const all = await drive.listExports();

  const seenNumbers = new Set<number>();
  const pending = all.filter((f) => {
    if (seenNumbers.has(f.number)) {
      report.warnings.push(`Drive has more than one export${f.number} — using the first, ignoring "${f.name}"`);
      return false;
    }
    seenNumbers.add(f.number);
    return !done.has(f.number);
  });

  if (!pending.length) return report;

  // 3. download + parse each new file
  const rows: CleanRow[] = [];
  const parsed: typeof pending = [];
  for (const file of pending) {
    try {
      const text = await drive.download(file);
      const result = parseExport(text, file.name);
      rows.push(...result.rows);
      report.warnings.push(...result.warnings);
      parsed.push(file);
    } catch (e) {
      report.failedFiles.push({ file: file.name, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // 4. one session per date across all new files
  const built = buildSessions(rows);
  report.warnings.push(...built.warnings);

  // 5. upload dates that don't exist yet
  const existing = await listSessionDates(SEASON);
  for (const session of built.sessions) {
    if (existing.has(session.date)) {
      report.skippedDates.push(session.date);
      continue;
    }
    // overwrite: false → if a concurrent sync wrote this date first, keep theirs
    const written = dryRun || await uploadSession(SEASON, session, { overwrite: false });
    if (written) {
      report.newDates.push(session.date);
      report.newSessions.push(session);
    } else {
      report.skippedDates.push(session.date);
    }
  }

  // 6. record the files that parsed (failed ones stay pending for the next Refresh)
  const now = new Date().toISOString();
  const datesIn = (file: string) => new Set(rows.filter((r) => r.sourceFile === file).map((r) => r.date));
  const entries: ProcessedEntry[] = parsed.map((f) => {
    const dates = datesIn(f.name);
    return {
      file:         f.name,
      driveId:      f.id,
      processedAt:  now,
      newDates:     report.newDates.filter((d) => dates.has(d)),
      skippedDates: report.skippedDates.filter((d) => dates.has(d)),
    };
  });
  report.processedFiles = entries.map((e) => e.file);

  if (!dryRun && entries.length) {
    await writeStatsJson(PROCESSED_LOG_PATH, { files: [...log.files, ...entries] } satisfies ProcessedLog);
  }

  return report;
}
