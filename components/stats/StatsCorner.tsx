"use client";

/**
 * StatsCorner — top-level stats container.
 *
 * Fetches season and training data on mount, then renders one of three
 * sub-tabs: Season (Wyscout stats), Training (VXSport GPS sessions), Compare.
 * The Refresh button hits /api/stats/sync which pulls any new training sessions
 * from the VXSport API, writes them to Supabase, and returns the updated list.
 */

import { useState, useEffect } from "react";
import { SeasonPlayer, TrainingSession } from "@/types/stats";
import SeasonTab from "./SeasonTab";
import TrainingTab from "./TrainingTab";
import CompareTab from "./CompareTab";

type SubTab = "season" | "training" | "compare";

export default function StatsCorner() {
  const [subTab, setSubTab]     = useState<SubTab>("season");
  const [players, setPlayers]   = useState<SeasonPlayer[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      // fetch season stats and training sessions in parallel
      const [seasonRes, sessionsRes] = await Promise.all([
        fetch("/api/stats/season"),
        fetch("/api/stats/sessions"),
      ]);
      const seasonData   = await seasonRes.json();
      const sessionsData = await sessionsRes.json();
      if (seasonData.players)    setPlayers(seasonData.players);
      if (sessionsData.sessions) setSessions(sessionsData.sessions);
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setSyncing(true);
    try {
      // sync fetches new VXSport data since the last stored date and returns all sessions
      const res  = await fetch("/api/stats/sync", { method: "POST" });
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
      setLastSync(`${new Date().toLocaleTimeString()} · ${data.newSessions ?? 0} new`);
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "season",   label: "Season" },
    { id: "training", label: "Training" },
    { id: "compare",  label: "Compare" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tab bar */}
      <div
        className="flex items-center justify-between px-5 border-b shrink-0"
        style={{ background: "#0a0a0b", borderColor: "#1a1a1c" }}
      >
        <div className="flex items-center gap-0.5">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className="relative px-4 py-3 font-mono text-[12px] uppercase tracking-widest transition-colors"
              style={{ color: subTab === t.id ? "#e8e8ea" : "#555" }}
            >
              {t.label}
              {subTab === t.id && (
                <span className="absolute bottom-0 left-4 right-4 h-px" style={{ background: "#c5050c" }} />
              )}
            </button>
          ))}
        </div>

        {/* Refresh — disabled while loading to prevent double-fetches */}
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="font-mono text-[13px]" style={{ color: "#555" }}>
              Synced {lastSync}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[13px] uppercase tracking-widest transition-colors"
            style={{
              background: syncing ? "#0f0f11" : "#140406",
              border: "1px solid #c5050c33",
              color: syncing ? "#444" : "#c5050c",
              cursor: syncing ? "not-allowed" : "pointer",
            }}
          >
            <span>{syncing ? "Syncing..." : "↻ Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
              Loading data...
            </span>
          </div>
        ) : (
          <>
            {subTab === "season"   && <SeasonTab players={players} />}
            {subTab === "training" && <TrainingTab sessions={sessions} />}
            {subTab === "compare"  && <CompareTab players={players} sessions={sessions} />}
          </>
        )}
      </div>
    </div>
  );
}
