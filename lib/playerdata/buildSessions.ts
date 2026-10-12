/**
 * Cleaned PlayerData rows → one TrainingSession per date.
 *
 * Rules (agreed for Fall 26):
 *  - one session per date: "Whole Session" rows are clustered into sessions by
 *    overlapping time windows; if a day has several, the longest is kept
 *  - each athlete's Whole Session row is their headline numbers
 *  - tagged segments (e.g. "Full 90", "S&C w george") inside the kept session are
 *    attached to each athlete and listed on the session; "Total of Segments" is a
 *    roll-up of those segments and is dropped as redundant
 *  - athletes with no row that day are simply absent (never zero-filled)
 *  - duplicate rows (same athlete/segment/window, e.g. overlapping exports) are deduped
 */

import { PlayerSegment, PlayerSessionData, TrainingSession } from "@/types/stats";
import { CleanRow, fmtTime } from "./parseExport";

const WHOLE = "Whole Session";
const ROLLUP = "Total of Segments";

export interface BuildResult {
  sessions: TrainingSession[]; // sorted by date
  warnings: string[];
}

/** "2026-09-28" → "Sep 28" (same format as Spring 26 sessions). */
function fmtDisplayDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Group rows whose [startSec, endSec] windows overlap into clusters (one per session). */
function clusterByWindow(rows: CleanRow[]): CleanRow[][] {
  const sorted = [...rows].sort((a, b) => a.startSec - b.startSec);
  const clusters: { end: number; rows: CleanRow[] }[] = [];
  for (const r of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && r.startSec < last.end) {
      last.rows.push(r);
      last.end = Math.max(last.end, r.endSec);
    } else {
      clusters.push({ end: r.endSec, rows: [r] });
    }
  }
  return clusters.map((c) => c.rows);
}

function span(rows: CleanRow[]): { start: number; end: number } {
  return {
    start: Math.min(...rows.map((r) => r.startSec)),
    end:   Math.max(...rows.map((r) => r.endSec)),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildDate(date: string, dayRows: CleanRow[], warnings: string[]): TrainingSession | null {
  // dedupe identical athlete/segment/window rows (same session in two exports)
  const seen = new Set<string>();
  const rows = dayRows.filter((r) => {
    const key = `${r.personId}|${r.segment}|${r.startSec}|${r.endSec}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const wholeRows = rows.filter((r) => r.segment === WHOLE);
  if (!wholeRows.length) {
    warnings.push(`${date}: no "Whole Session" rows — date skipped`);
    return null;
  }

  // pick the longest session of the day
  const clusters = clusterByWindow(wholeRows);
  const length = (c: CleanRow[]) => { const s = span(c); return s.end - s.start; };
  clusters.sort((a, b) => length(b) - length(a) || b.length - a.length);
  const kept = clusters[0];
  const { start, end } = span(kept);

  if (clusters.length > 1) {
    const dropped = clusters.slice(1).map((c) => { const s = span(c); return `${fmtTime(s.start).slice(0, 5)}–${fmtTime(s.end).slice(0, 5)}`; });
    warnings.push(`${date}: ${clusters.length} sessions found — kept longest (${fmtTime(start).slice(0, 5)}–${fmtTime(end).slice(0, 5)}), dropped ${dropped.join(", ")}`);
  }

  // tagged segments that fall inside the kept session's window
  const segmentRows = rows.filter(
    (r) => r.segment !== WHOLE && r.segment !== ROLLUP && r.startSec < end && r.endSec > start
  );

  // one Whole Session row per athlete (keep the longest if PlayerData ever splits one)
  const byAthlete = new Map<string, CleanRow>();
  for (const r of kept) {
    const prev = byAthlete.get(r.personId);
    if (!prev || r.endSec - r.startSec > prev.endSec - prev.startSec) byAthlete.set(r.personId, r);
  }

  let missingLoad = 0;
  const players: PlayerSessionData[] = Array.from(byAthlete.values()).map((r) => {
    if (r.loadScore === null) missingLoad++;
    const segments: PlayerSegment[] = segmentRows
      .filter((s) => s.personId === r.personId)
      .sort((a, b) => a.startSec - b.startSec)
      .map((s) => ({
        name:      s.segment,
        startTime: s.startTime,
        endTime:   s.endTime,
        loadScore: s.loadScore,
        metrics:   s.metrics,
      }));
    return {
      personId:  r.personId,
      name:      r.name,
      position:  r.position,
      group:     r.group,
      sessions:  1,
      loadScore: r.loadScore ?? 0,
      metrics:   r.metrics,
      ...(segments.length ? { segments } : {}),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (missingLoad) warnings.push(`${date}: ${missingLoad} athlete(s) had metrics but no Session Load — load shown as 0`);

  // session-level labels
  const segmentNames: string[] = [];
  [...segmentRows].sort((a, b) => a.startSec - b.startSec).forEach((s) => {
    if (!segmentNames.includes(s.segment)) segmentNames.push(s.segment);
  });
  const tags = Array.from(new Set([...kept, ...segmentRows].flatMap((r) => r.tags)));
  const sourceFiles = Array.from(new Set(kept.map((r) => r.sourceFile)));

  const durations = kept.map((r) => r.metrics.durationMin).filter((d): d is number => d !== null);
  const durationMin = durations.length ? Math.max(...durations) : Math.round((end - start) / 60);

  const sessionLoadScore = players.length
    ? round1(players.reduce((sum, p) => sum + p.loadScore, 0) / players.length)
    : 0;

  return {
    sessionId:   date,
    date,
    displayDate: fmtDisplayDate(date),
    sessionLoadScore,
    players,
    source:      "playerdata",
    startTime:   fmtTime(start),
    endTime:     fmtTime(end),
    durationMin,
    segments:    segmentNames,
    tags,
    sourceFile:  sourceFiles.join(", "),
  };
}

export function buildSessions(rows: CleanRow[]): BuildResult {
  const warnings: string[] = [];
  const byDate = new Map<string, CleanRow[]>();
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push(r);
  }

  const sessions = Array.from(byDate.keys())
    .sort()
    .map((date) => buildDate(date, byDate.get(date)!, warnings))
    .filter((s): s is TrainingSession => s !== null);

  return { sessions, warnings };
}
