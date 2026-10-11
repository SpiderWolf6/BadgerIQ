/**
 * GET /api/stats/sessions?season=spring26
 *
 * Returns all training sessions stored in Supabase (stats/{season}/training/).
 * Each session is a JSON file named YYYY-MM-DD.json containing player
 * load metrics for that day.
 */

import { NextResponse } from "next/server";
import { getAllSessions } from "@/lib/statsStorage";
import { DEFAULT_STATS_SEASON, isStatsSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const seasonParam = new URL(req.url).searchParams.get("season");
  const season = isStatsSeason(seasonParam) ? seasonParam : DEFAULT_STATS_SEASON;

  try {
    const sessions = await getAllSessions(season);
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("Sessions load error:", e);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
