/**
 * GET /api/stats/sessions
 *
 * Returns all training sessions stored in Supabase (stats/training/).
 * Each session is a JSON file named YYYY-MM-DD.json containing player
 * load metrics fetched from the VXSport API.
 */

import { NextResponse } from "next/server";
import { getAllSessions } from "@/lib/statsStorage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await getAllSessions();
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("Sessions load error:", e);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
