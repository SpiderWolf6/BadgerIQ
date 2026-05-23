/**
 * GET /api/stats/season
 *
 * Returns all players from the Wyscout season stats spreadsheet stored
 * in Supabase (stats/season/season_stats.xlsx). Update the spreadsheet
 * in Supabase to refresh player season data.
 */

import { NextResponse } from "next/server";
import { getSeasonPlayers } from "@/lib/statsStorage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const players = await getSeasonPlayers();
    return NextResponse.json({ players });
  } catch (e) {
    console.error("Season stats error:", e);
    return NextResponse.json({ error: "Failed to load season stats" }, { status: 500 });
  }
}
