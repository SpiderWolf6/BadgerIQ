/**
 * POST /api/stats/fall26/sync
 *
 * Fall 26 Refresh button. Pulls any unprocessed PlayerData exports from the
 * Google Drive folder, parses them, uploads new session JSONs to
 * stats/fall26/training/, and returns every Fall 26 session so the UI
 * updates in one round trip. See lib/playerdata/sync.ts for the full flow.
 */

import { NextResponse } from "next/server";
import { syncFall26 } from "@/lib/playerdata/sync";
import { getAllSessions } from "@/lib/statsStorage";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Drive download + parse + uploads; typically a few seconds

export async function POST() {
  try {
    const report   = await syncFall26();
    const sessions = await getAllSessions("fall26");

    if (report.warnings.length)    console.log("[fall26 sync] warnings:", report.warnings);
    if (report.failedFiles.length) console.error("[fall26 sync] failed files:", report.failedFiles);

    return NextResponse.json({
      ok:             report.failedFiles.length === 0,
      newSessions:    report.newDates.length,
      processedFiles: report.processedFiles,
      failedFiles:    report.failedFiles,
      skippedDates:   report.skippedDates,
      warnings:       report.warnings,
      sessions,
    });
  } catch (e) {
    console.error("[fall26 sync] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
