/**
 * POST /api/stats/sync
 *
 * Syncs new training sessions from the VXSport API into Supabase.
 *
 * Flow:
 *  1. Find the most recent session date already stored in Supabase
 *  2. Build a list of every calendar day from that date to today
 *  3. For each day, POST to the VXSport API to fetch player rows
 *  4. If data exists, build a TrainingSession object and upload it to Supabase
 *  5. Return all sessions (old + new) so the UI can update immediately
 *
 * Days with no training data are silently skipped — the API returns an empty array.
 */

import { NextResponse } from "next/server";
import { getLatestSessionDate, uploadSession, getAllSessions } from "@/lib/statsStorage";
import { TrainingSession } from "@/types/stats";

export const dynamic = "force-dynamic";

// VXSport returns distances in meters; we display in miles
const M_TO_MI = 0.000621371;

/** Convert a value to an integer, returning 0 for NaN/null/undefined. */
function safeInt(val: unknown): number {
  const v = Number(val);
  return isNaN(v) ? 0 : Math.round(v);
}

/** Convert a value to a float, returning 0 for NaN/null/undefined. */
function safeFloat(val: unknown): number {
  const v = Number(val);
  return isNaN(v) ? 0 : v;
}

/** VXSport returns names as "Last, First" — flip to "First Last". */
function normalizeName(raw: string): string {
  if (raw.includes(",")) {
    const [last, first] = raw.split(",", 2);
    return `${first.trim()} ${last.trim()}`;
  }
  return raw.trim();
}

/** Format "2026-01-26" → "Jan 26" for display. */
function fmtDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Build a TrainingSession from a list of raw VXSport API rows.
 * Session load score is the average of all player load scores.
 */
function buildSession(date: string, rows: Record<string, unknown>[]): TrainingSession {
  const players = rows.map((row) => {
    const distM   = safeFloat(row.distance);
    const hiDistM = safeFloat(row.hiIntensitySpeedDistance);
    return {
      name:      normalizeName(String(row.sAthleteName ?? "")),
      position:  String(row.position ?? ""),
      group:     String(row.group ?? ""),
      sessions:  1,
      loadScore: safeFloat(row.totalLoad),
      metrics: {
        // convert meters to miles for distance fields
        totalDistance:       Math.round(distM * M_TO_MI * 1000) / 1000,
        distanceHISpeed:     Math.round(hiDistM * M_TO_MI * 1000) / 1000,
        sprintsHI:           safeInt(row.hiIntensitySpeedSprint),
        hiDecelerations:     safeInt(row.hiIntensityDecelSprints),
        hiAccelerations:     safeInt(row.hiIntensityAccelSprints),
        durationSecs:        safeInt(row.duration),
        speedMax:            safeFloat(row.speedMax),
        sprintCount:         safeInt(row.sprintCount),
        activityLoad3D:      safeFloat(row.activityLoad3D),
        metabolicEnergyCost: safeFloat(row.metabolicEnergyCost),
      },
    };
  });

  const sessionLoadScore = players.length
    ? Math.round((players.reduce((s, p) => s + p.loadScore, 0) / players.length) * 10) / 10
    : 0;

  return { sessionId: date, date, displayDate: fmtDisplayDate(date), sessionLoadScore, players };
}

/**
 * Generate every calendar date strictly after `start` up to and including `end`.
 * Used to build the list of dates to check against the VXSport API.
 */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor  = new Date(start);
  const endDate = new Date(end);
  cursor.setDate(cursor.getDate() + 1); // start the day after the last stored session
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function POST() {
  try {
    const latestDate = await getLatestSessionDate();
    if (!latestDate) {
      return NextResponse.json({ error: "No existing sessions found" }, { status: 400 });
    }

    const today        = new Date().toISOString().split("T")[0];
    const datesToFetch = dateRange(latestDate, today);

    // Nothing to fetch — already up to date
    if (!datesToFetch.length) {
      const sessions = await getAllSessions();
      return NextResponse.json({ ok: true, newSessions: 0, sessions });
    }

    const url = `https://api.vxsport.com/api/trainingreport?code=${process.env.VXSPORT_FUNCTION_KEY}`;
    const creds = {
      apiKey:         process.env.VXSPORT_API_KEY,
      activationCode: process.env.VXSPORT_ACTIVATION_CODE,
      team:           process.env.VXSPORT_TEAM_NAME,
      SessionOnly:    true,
    };

    const newSessions: TrainingSession[] = [];

    for (const date of datesToFetch) {
      const resp = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...creds,
          startDate: `${date}T00:00:00.000Z`,
          endDate:   `${date}T23:59:59.999Z`,
        }),
      });

      if (!resp.ok) continue;

      const data = await resp.json() as Record<string, unknown>[];
      if (!Array.isArray(data) || !data.length) continue;

      // Filter to "File" type rows — one per player per session file
      const rows = data.filter((r) => !r.type || r.type === "File") as Record<string, unknown>[];
      if (!rows.length) continue;

      const session = buildSession(date, rows);
      await uploadSession(session);
      newSessions.push(session);
    }

    // Return the full updated session list so the UI refreshes in one round trip
    const sessions = await getAllSessions();
    return NextResponse.json({ ok: true, newSessions: newSessions.length, sessions });
  } catch (e) {
    console.error("Sync error:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
