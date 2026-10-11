/**
 * GET /api/stats/season?season=spring26
 *
 * Returns all players from the season's Wyscout stats spreadsheet stored
 * in Supabase (stats/{season}/season/season_stats.xlsx). Update the
 * spreadsheet in Supabase to refresh player season data.
 */

import { NextResponse } from "next/server";
import { getSeasonPlayers } from "@/lib/statsStorage";
import { DEFAULT_STATS_SEASON, isStatsSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const seasonParam = new URL(req.url).searchParams.get("season");
  const season = isStatsSeason(seasonParam) ? seasonParam : DEFAULT_STATS_SEASON;

  try {
    const players = await getSeasonPlayers(season);
    return NextResponse.json({ players });
  } catch (e) {
    console.error("Season stats error:", e);
    return NextResponse.json({ error: "Failed to load season stats" }, { status: 500 });
  }
}
