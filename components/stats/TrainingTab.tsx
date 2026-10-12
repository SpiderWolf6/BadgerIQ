"use client";

/**
 * TrainingTab — GPS session viewer (VXSport for Spring 26, PlayerData for Fall 26).
 *
 * Two sections:
 *  1. Session timeline — dots for each training date (with any segment/tag
 *     labels underneath); clicking one expands a full player table with load
 *     scores and all GPS metrics for that session.
 *  2. Player trends — select up to 8 players and a metric to see a line chart
 *     of their values across every session.
 *
 * Which metrics appear, their labels/units, and the load color bands come from
 * the season's TrainingDisplayConfig (lib/trainingDisplay.ts).
 */

import { useState, useMemo } from "react";
import { TrainingSession, TrainingMetricKey } from "@/types/stats";
import { TrainingDisplayConfig, loadColor, loadBg } from "@/lib/trainingDisplay";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  sessions: TrainingSession[];
  display:  TrainingDisplayConfig;
}

// up to 8 players can be selected for the trend chart
const PLAYER_COLORS = ["#c5050c", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

/** Segment names + tags for a session, e.g. ["Full 90"]; empty for VXSport sessions. */
function sessionLabels(s: TrainingSession): string[] {
  return Array.from(new Set([...(s.segments ?? []), ...(s.tags ?? [])]));
}

/** "18:00:00" → "18:00" */
function hhmm(t?: string): string {
  return t ? t.slice(0, 5) : "";
}

export default function TrainingTab({ sessions, display }: Props) {
  const playerColor = (score: number) => loadColor(score, display.playerLoad);
  const playerBg    = (score: number) => loadBg(score, display.playerLoad);
  const sessionColor = (score: number) => loadColor(score, display.sessionLoad);
  const sessionBg    = (score: number) => loadBg(score, display.sessionLoad);

  const [expandedSession, setExpandedSession] = useState<string | null>(sessions[0]?.sessionId ?? null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [trendMetric, setTrendMetric] = useState<"loadScore" | TrainingMetricKey>("loadScore");

  // deduplicated sorted list of all player names seen across every session
  const allPlayers = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.players.forEach((p) => set.add(p.name)));
    return Array.from(set).sort();
  }, [sessions]);

  // chip label per player — last name, or "C. Smith" style when two share a last name
  const chipLabels = useMemo(() => {
    const last = (n: string) => n.split(" ").pop() ?? n;
    const counts = new Map<string, number>();
    allPlayers.forEach((n) => counts.set(last(n), (counts.get(last(n)) ?? 0) + 1));
    return new Map(allPlayers.map((n) => [
      n,
      (counts.get(last(n)) ?? 0) > 1 ? `${n[0]}. ${last(n)}` : last(n),
    ]));
  }, [allPlayers]);

  // configured metrics that actually appear in the data, in configured order
  const allMetrics = useMemo(() => {
    const present = new Set<TrainingMetricKey>();
    sessions.forEach((s) =>
      s.players.forEach((p) =>
        Object.keys(p.metrics).forEach((k) => present.add(k as TrainingMetricKey))
      )
    );
    return display.metrics.filter((m) => present.has(m.key));
  }, [sessions, display]);

  // one data point per session per selected player for the trend chart
  const trendData = useMemo(() => {
    return sessions.map((s) => {
      const row: Record<string, string | number> = { date: s.displayDate };
      selectedPlayers.forEach((name) => {
        const p = s.players.find((pl) => pl.name === name);
        if (!p) return; // absent that day → gap in the line
        const val = trendMetric === "loadScore" ? p.loadScore : p.metrics[trendMetric];
        if (val != null) row[name] = val; // not recorded → gap, not a fake 0
      });
      return row;
    });
  }, [sessions, selectedPlayers, trendMetric]);

  function togglePlayer(name: string) {
    setSelectedPlayers((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 8 ? [...prev, name] : prev // cap at 8 for chart readability
    );
  }

  const expandedSesh = sessions.find((s) => s.sessionId === expandedSession);

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5">

      {/* session timeline */}
      <section>
        <div className="section-divider mb-3">
          <span className="label-mono" style={{ color: "#444" }}>Sessions ({sessions.length})</span>
        </div>

        {/* One dot per session — click to expand the player table below */}
        <div className="flex flex-wrap gap-2 mb-4">
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded transition-colors"
              style={{
                background: expandedSession === s.sessionId ? sessionBg(s.sessionLoadScore) : "#0f0f11",
                border: `1px solid ${expandedSession === s.sessionId ? sessionColor(s.sessionLoadScore) + "66" : "#1a1a1c"}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: sessionColor(s.sessionLoadScore) }} />
              <span className="font-mono text-[12px]" style={{ color: "#555" }}>{s.displayDate}</span>
              <span className="font-display font-600 text-xs" style={{ color: sessionColor(s.sessionLoadScore) }}>
                {s.sessionLoadScore}
              </span>
              {/* segment / tag labels, only on sessions that have them */}
              {sessionLabels(s).map((label) => (
                <span
                  key={label}
                  className="font-mono text-[10px] uppercase tracking-wider px-1.5 rounded max-w-[96px] truncate"
                  style={{ color: "#c5050c", background: "#140406", border: "1px solid #c5050c33" }}
                  title={label}
                >
                  {label}
                </span>
              ))}
            </button>
          ))}
        </div>

        {/* Expanded session player table */}
        {expandedSesh && (
          <div className="rounded overflow-hidden" style={{ border: "1px solid #1a1a1c" }}>
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: sessionBg(expandedSesh.sessionLoadScore), borderBottom: "1px solid #1a1a1c" }}
            >
              <div className="flex items-center flex-wrap gap-y-1">
                <span className="font-display font-700 text-sm" style={{ color: "#e8e8ea" }}>
                  {expandedSesh.displayDate} Session
                </span>
                <span className="font-mono text-[13px] ml-3" style={{ color: "#555" }}>
                  {expandedSesh.players.length} players
                </span>
                {expandedSesh.startTime && (
                  <span className="font-mono text-[13px] ml-3" style={{ color: "#555" }}>
                    {hhmm(expandedSesh.startTime)}–{hhmm(expandedSesh.endTime)}
                  </span>
                )}
                {sessionLabels(expandedSesh).map((label) => (
                  <span
                    key={label}
                    className="font-mono text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded ml-3"
                    style={{ color: "#c5050c", background: "#0a0a0b", border: "1px solid #c5050c33" }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="label-mono" style={{ color: "#444" }}>Session Load</span>
                <span
                  className="font-display font-700 text-xl px-3 py-0.5 rounded"
                  style={{
                    color: sessionColor(expandedSesh.sessionLoadScore),
                    background: "#0a0a0b",
                    border: `1px solid ${sessionColor(expandedSesh.sessionLoadScore)}33`,
                  }}
                >
                  {expandedSesh.sessionLoadScore}
                </span>
              </div>
            </div>

            {/* Player table — keyed by sessionId so React fully remounts on session change,
                preventing stale rows from lingering when switching sessions quickly */}
            <div className="overflow-x-auto">
              <table key={expandedSesh.sessionId} className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1c", background: "#0a0a0b" }}>
                    <th className="text-left px-4 py-2 label-mono" style={{ color: "#555" }}>Player</th>
                    <th className="text-left px-3 py-2 label-mono" style={{ color: "#555" }}>Pos</th>
                    <th className="px-3 py-2 label-mono text-center" style={{ color: "#555" }}>Load</th>
                    {allMetrics.map((m) => (
                      <th key={m.key} className="px-3 py-2 label-mono text-center" style={{ color: "#555" }}>
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expandedSesh.players.map((p, i) => (
                    // compound key prevents React from reusing rows across session switches
                    <tr
                      key={`${expandedSesh.sessionId}-${p.name}`}
                      style={{
                        borderBottom: "1px solid #1a1a1c",
                        background: i % 2 === 0 ? "#0f0f11" : "#0a0a0b",
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-display font-600 text-sm" style={{ color: "#e8e8ea" }}>{p.name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[13px] uppercase" style={{ color: "#555" }}>{p.position}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="font-display font-700 text-sm px-2 py-0.5 rounded"
                          style={{
                            color: playerColor(p.loadScore),
                            background: playerBg(p.loadScore),
                            border: `1px solid ${playerColor(p.loadScore)}33`,
                          }}
                        >
                          {p.loadScore}
                        </span>
                      </td>
                      {allMetrics.map((m) => {
                        const val = p.metrics[m.key];
                        return (
                          <td key={m.key} className="px-3 py-2.5 text-center">
                            <div className="font-mono text-[12px]" style={{ color: "#888" }}>
                              {/* show 2 decimal places for floats, raw value for integers */}
                              {val != null
                                ? (!Number.isInteger(val) ? val.toFixed(2) : val)
                                : "—"}{" "}
                              {val != null && <span style={{ color: "#555" }}>{m.unit}</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* player trend chart */}
      <section>
        <div className="section-divider mb-3">
          <span className="label-mono" style={{ color: "#444" }}>Player Trends</span>
        </div>

        {/* Metric selector */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {[{ key: "loadScore", label: "Load Score" }, ...allMetrics.map((m) => ({ key: m.key, label: m.label }))].map((m) => (
            <button
              key={m.key}
              onClick={() => setTrendMetric(m.key as "loadScore" | TrainingMetricKey)}
              className="px-2.5 py-1 rounded font-mono text-[13px] uppercase tracking-wider"
              style={{
                background: trendMetric === m.key ? "#140406" : "#0f0f11",
                border: `1px solid ${trendMetric === m.key ? "#c5050c" : "#1a1a1c"}`,
                color: trendMetric === m.key ? "#c5050c" : "#555",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Player selector — last name only to save space ("C. Smith" when last names collide) */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {allPlayers.map((name) => {
            const isSelected = selectedPlayers.includes(name);
            const color = isSelected ? PLAYER_COLORS[selectedPlayers.indexOf(name)] : "#1a1a1c";
            return (
              <button
                key={name}
                onClick={() => togglePlayer(name)}
                className="px-2.5 py-1 rounded font-mono text-[13px] transition-colors"
                style={{
                  background: isSelected ? "#0f0f11" : "transparent",
                  border: `1px solid ${color}`,
                  color: isSelected ? "#e8e8ea" : "#555",
                }}
              >
                {chipLabels.get(name)}
              </button>
            );
          })}
        </div>

        {selectedPlayers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
              Select players above to see trends
            </span>
          </div>
        ) : (
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                <XAxis dataKey="date" tick={{ fill: "#444", fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0f0f11", border: "1px solid #1a1a1c", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
                  labelStyle={{ color: "#888" }}
                />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)", color: "#555" }} />
                {selectedPlayers.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={PLAYER_COLORS[i]}
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: PLAYER_COLORS[i] }}
                    connectNulls // skip gaps when a player missed a session
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
