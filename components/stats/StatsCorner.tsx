"use client";

/**
 * StatsCorner — top-level stats container.
 *
 * A season toggle (Spring 26 / Fall 26) picks which Supabase season folder
 * to read. Season and training data are fetched whenever the season changes,
 * then one of three sub-tabs is rendered: Season (Wyscout stats),
 * Training (GPS sessions), Compare.
 *
 * Seasons without a Wyscout export show "Coming soon" for Season and Compare.
 * The Refresh button only works for seasons with a syncEndpoint configured
 * (see lib/seasons.ts); Spring 26 is archived so its Refresh is disabled.
 */

import { useState, useEffect } from "react";
import { SeasonPlayer, TrainingSession } from "@/types/stats";
import { STATS_SEASONS, StatsSeason } from "@/lib/seasons";
import SeasonToggle from "@/components/SeasonToggle";
import ComingSoon from "@/components/ComingSoon";
import SeasonTab from "./SeasonTab";
import TrainingTab from "./TrainingTab";
import CompareTab from "./CompareTab";

type SubTab = "season" | "training" | "compare";

const SEASON_OPTIONS = (Object.keys(STATS_SEASONS) as StatsSeason[]).map((id) => ({
  id,
  label: STATS_SEASONS[id].label,
}));

interface Props {
  season: StatsSeason;
  onSeasonChange: (season: StatsSeason) => void;
}

export default function StatsCorner({ season, onSeasonChange }: Props) {
  const [subTab, setSubTab]     = useState<SubTab>("season");
  const [players, setPlayers]   = useState<SeasonPlayer[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const config = STATS_SEASONS[season];

  // reload whenever the season changes; the `cancelled` flag drops responses
  // from a previous season if the user flips the toggle mid-fetch
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setPlayers([]);
      setSessions([]);
      setLastSync(null);
      try {
        // fetch season stats and training sessions in parallel
        const [seasonRes, sessionsRes] = await Promise.all([
          fetch(`/api/stats/season?season=${season}`),
          fetch(`/api/stats/sessions?season=${season}`),
        ]);
        const seasonData   = await seasonRes.json();
        const sessionsData = await sessionsRes.json();
        if (cancelled) return;
        if (seasonData.players)    setPlayers(seasonData.players);
        if (sessionsData.sessions) setSessions(sessionsData.sessions);
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [season]);

  async function handleRefresh() {
    if (!config.syncEndpoint) return;
    setSyncing(true);
    try {
      // sync pulls any new training data into Supabase and returns all sessions
      const res  = await fetch(config.syncEndpoint, { method: "POST" });
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
      setLastSync(`${new Date().toLocaleTimeString()} · ${data.newSessions ?? 0} new`);
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  }

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "season",   label: "Season" },
    { id: "training", label: "Training" },
    { id: "compare",  label: "Compare" },
  ];

  const canSync = !!config.syncEndpoint;

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
            Loading data...
          </span>
        </div>
      );
    }

    // Season + Compare both depend on the Wyscout export
    if ((subTab === "season" || subTab === "compare") && !config.hasSeasonStats) {
      const label = subTab === "season" ? "Season Stats" : "Compare";
      return <ComingSoon title={`${config.fullLabel} ${label}`} />;
    }

    if (subTab === "training" && sessions.length === 0) {
      return (
        <ComingSoon
          title={`${config.fullLabel} Training`}
          detail={canSync ? "No sessions yet — hit Refresh to pull new exports." : "No sessions found."}
        />
      );
    }

    // keyed by season so each tab's internal selections reset on a season switch
    return (
      <div key={season} className="h-full">
        {subTab === "season"   && <SeasonTab players={players} />}
        {subTab === "training" && <TrainingTab sessions={sessions} />}
        {subTab === "compare"  && <CompareTab players={players} sessions={sessions} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tab bar */}
      <div
        className="flex items-center justify-between px-5 border-b shrink-0"
        style={{ background: "#0a0a0b", borderColor: "#1a1a1c" }}
      >
        <div className="flex items-center gap-4">
          <SeasonToggle seasons={SEASON_OPTIONS} active={season} onChange={onSeasonChange} />

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
        </div>

        {/* Refresh — disabled while loading, and for seasons with no sync source */}
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="font-mono text-[13px]" style={{ color: "#555" }}>
              Synced {lastSync}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={!canSync || syncing || loading}
            title={canSync ? undefined : `${config.label} is not syncing`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[13px] uppercase tracking-widest transition-colors"
            style={{
              background: !canSync || syncing ? "#0f0f11" : "#140406",
              border: `1px solid ${canSync ? "#c5050c33" : "#1a1a1c"}`,
              color: !canSync || syncing ? "#444" : "#c5050c",
              cursor: !canSync || syncing ? "not-allowed" : "pointer",
            }}
          >
            <span>{syncing ? "Syncing..." : "↻ Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
