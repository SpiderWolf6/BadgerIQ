/**
 * PlayerData CSV export → cleaned, typed rows.
 *
 * One raw row = one athlete × one segment of one session. Cleaning rules:
 *  - fully blank rows (every metric empty) are dropped — athlete had no data
 *  - zeros are KEPT as-is; empty cells become null ("not recorded"), never 0
 *  - dates accept MM/DD/YYYY, M/D/YYYY, M/D/YY or YYYY-MM-DD → "YYYY-MM-DD"
 *  - times accept HH:MM, HH:MM:SS, or h:mm AM/PM → "HH:MM:SS"
 *  - group names are normalized ("GK’s" → "Goalkeepers", "Wide-MF-/-Wingers" → "Wide MF / Wingers")
 *  - names are whitespace-collapsed and corrected via NAME_OVERRIDES (keyed by Person ID)
 */

import { PlayerDataMetricKey } from "@/types/stats";
import { parseCsv } from "./csv";
import { NAME_OVERRIDES } from "./athleteOverrides";

export interface CleanRow {
  personId:   string;
  name:       string;
  position:   string;
  group:      string;
  date:       string;   // "YYYY-MM-DD"
  startTime:  string;   // "HH:MM:SS"
  endTime:    string;
  startSec:   number;   // seconds since midnight, for window math
  endSec:     number;
  segment:    string;   // "Whole Session", "Total of Segments", or a tagged segment name
  tags:       string[]; // from the Tags column
  loadScore:  number | null;
  metrics:    Record<PlayerDataMetricKey, number | null>;
  sourceFile: string;
}

export interface ParseResult {
  rows:     CleanRow[];
  warnings: string[];
}

// CSV column → metric key
const METRIC_COLUMNS: Record<PlayerDataMetricKey, string> = {
  durationMin:       "Duration (minutes)",
  totalDistance:     "Distance (yds)",
  yardsPerMinute:    "Yards per Minute (yds)",
  hiRunningDistance: "High Intensity Running (yds)",
  hiEvents:          "No. of High Intensity Events",
  sprintDistance:    "Sprint Distance (yds)",
  sprintCount:       "No. of Sprints",
  topSpeed:          "Top Speed (mph)",
  pctMaxSpeed:       "Percentage of Max Speed",
  avgSpeed:          "Avg Speed (mph)",
  accelerations:     "Accelerations",
  decelerations:     "Decelerations",
};
const LOAD_COLUMN = "Session Load";

const REQUIRED_COLUMNS = ["Person ID", "Athlete Name", "Start Date", "Segment Name"];

const GROUP_ALIASES: Record<string, string> = {
  "GK's": "Goalkeepers",
  "GKs":  "Goalkeepers",
};

// field parsers

/** Numeric cell → number, or null when empty / non-numeric. Strips "," and "%". */
function num(v: string | undefined): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/[,%]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Date cell → "YYYY-MM-DD", or null if unrecognized. */
export function parseDate(v: string): string | null {
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

/** Time cell → seconds since midnight, or null if unrecognized. */
export function parseTimeSec(v: string): number | null {
  const m = v.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const sec = Number(m[3] ?? 0);
  const ampm = m[4]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59 || sec > 59) return null;
  return h * 3600 + min * 60 + sec;
}

export function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function normalizeGroup(raw: string): string {
  const s = raw.replace(/[‘’`´]/g, "'").trim();
  if (GROUP_ALIASES[s]) return GROUP_ALIASES[s];
  return s.replace(/-\/-/g, " / ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeName(personId: string, raw: string): string {
  return NAME_OVERRIDES[personId] ?? raw.replace(/\s+/g, " ").trim();
}

function splitTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
}

// main

export function parseExport(text: string, sourceFile: string): ParseResult {
  const raw = parseCsv(text);
  const warnings: string[] = [];

  if (!raw.length) return { rows: [], warnings: [`${sourceFile}: file is empty`] };

  const columns = new Set(Object.keys(raw[0]));
  const missingRequired = REQUIRED_COLUMNS.filter((c) => !columns.has(c));
  if (missingRequired.length) {
    // not a PlayerData session export — refuse rather than guess
    throw new Error(`${sourceFile}: missing required column(s): ${missingRequired.join(", ")}`);
  }
  if (!columns.has("Start Time (s)") && !columns.has("Start Time")) {
    throw new Error(`${sourceFile}: missing a start time column ("Start Time (s)" or "Start Time")`);
  }
  const missingMetrics = Object.values(METRIC_COLUMNS).concat(LOAD_COLUMN).filter((c) => !columns.has(c));
  if (missingMetrics.length) {
    warnings.push(`${sourceFile}: column(s) not in export, stored as empty: ${missingMetrics.join(", ")}`);
  }

  const rows: CleanRow[] = [];
  let blank = 0;

  raw.forEach((r, i) => {
    const line = i + 2; // +1 header, +1 for 1-based line numbers

    const metrics = Object.fromEntries(
      (Object.keys(METRIC_COLUMNS) as PlayerDataMetricKey[]).map((k) => [k, num(r[METRIC_COLUMNS[k]])])
    ) as Record<PlayerDataMetricKey, number | null>;
    const loadScore = num(r[LOAD_COLUMN]);

    // fully blank row → athlete had no data for this session; drop it
    if (loadScore === null && Object.values(metrics).every((v) => v === null)) { blank++; return; }

    const personId = r["Person ID"];
    const date = parseDate(r["Start Date"]);
    // prefer the seconds-precision column; fall back to the HH:MM one
    const startSec = parseTimeSec(r["Start Time (s)"] || r["Start Time"] || "");
    let endSec = parseTimeSec(r["End Time (s)"] || "");

    if (!personId || !date || startSec === null) {
      warnings.push(`${sourceFile} line ${line}: skipped — unreadable ${!personId ? "Person ID" : !date ? `date "${r["Start Date"]}"` : "start time"}`);
      return;
    }
    // no end time → derive from duration
    if (endSec === null && metrics.durationMin !== null) endSec = startSec + Math.round(metrics.durationMin * 60);
    if (endSec === null) endSec = startSec;

    rows.push({
      personId,
      name:      normalizeName(personId, r["Athlete Name"]),
      position:  r["Athlete Position"] ?? "",
      group:     normalizeGroup(r["Athlete Groups"] ?? ""),
      date,
      startTime: fmtTime(startSec),
      endTime:   fmtTime(endSec),
      startSec,
      endSec,
      segment:   r["Segment Name"] || "Whole Session",
      tags:      splitTags(r["Tags"]),
      loadScore,
      metrics,
      sourceFile,
    });
  });

  if (blank) warnings.push(`${sourceFile}: dropped ${blank} fully blank row(s)`);
  return { rows, warnings };
}
