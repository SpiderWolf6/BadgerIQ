"use client";

/**
 * TrainingTab — VXSport GPS session viewer.
 *
 * Two sections:
 *  1. Session timeline — dots for each training date; clicking one expands a
 *     full player table with load scores and all GPS metrics for that session.
 *  2. Player trends — select up to 8 players and a metric to see a line chart
 *     of their values across every session.
 */

import { useState, useMemo } from "react";
import { TrainingSession, TrainingMetricKey, METRIC_LABELS, METRIC_UNITS } from "@/types/stats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props { sessions: TrainingSession[]; }

// load score color thresholds — green ≥ 60, amber ≥ 30, red below
function loadColor(score: number): string {
  if (score >= 60) return "#22c55e";
  if (score >= 30) return "#f59e0b";
  return "#c5050c";
}

function loadBg(score: number): string {
  if (score >= 60) return "#0a1a0e";
  if (score >= 30) return "#1a1408";
  return "#140406";
}

// up to 8 players can be selected for the trend chart
const PLAYER_COLORS = ["#c5050c", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

export default function TrainingTab({ sessions }: Props) {
  const [expandedSession, setExpandedSession] = useState<string | null>(sessions[0]?.sessionId ?? null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [trendMetric, setTrendMetric] = useState<"loadScore" | TrainingMetricKey>("loadScore");

  // deduplicated sorted list of all player names seen across every session
  const allPlayers = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.players.forEach((p) => set.add(p.name)));
    return Array.from(set).sort();
  }, [sessions]);

  // all metric keys that actually appear in the data (some may be missing for older sessions)
  const allMetrics = useMemo(() => {
    const set = new Set<TrainingMetricKey>();
    sessions.forEach((s) =>
      s.players.forEach((p) =>
        Object.keys(p.metrics).forEach((k) => set.add(k as TrainingMetricKey))
      )
    );
    return Array.from(set);
  }, [sessions]);

  // one data point per session per selected player for the trend chart
  const trendData = useMemo(() => {
    return sessions.map((s) => {
      const row: Record<string, string | number> = { date: s.displayDate };
      selectedPlayers.forEach((name) => {
        const p = s.players.find((pl) => pl.name === name);
        if (p) {
          row[name] = trendMetric === "loadScore"
            ? p.loadScore
            : (p.metrics[trendMetric as TrainingMetricKey] ?? 0) as number;
        }
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
                background: expandedSession === s.sessionId ? loadBg(s.sessionLoadScore) : "#0f0f11",
                border: `1px solid ${expandedSession === s.sessionId ? loadColor(s.sessionLoadScore) + "66" : "#1a1a1c"}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: loadColor(s.sessionLoadScore) }} />
              <span className="font-mono text-[12px]" style={{ color: "#555" }}>{s.displayDate}</span>
              <span className="font-display font-600 text-xs" style={{ color: loadColor(s.sessionLoadScore) }}>
                {s.sessionLoadScore}
              </span>
            </button>
          ))}
        </div>

        {/* Expanded session player table */}
        {expandedSesh && (
          <div className="rounded overflow-hidden" style={{ border: "1px solid #1a1a1c" }}>
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: loadBg(expandedSesh.sessionLoadScore), borderBottom: "1px solid #1a1a1c" }}
            >
              <div>
                <span className="font-display font-700 text-sm" style={{ color: "#e8e8ea" }}>
                  {expandedSesh.displayDate} Session
                </span>
                <span className="font-mono text-[13px] ml-3" style={{ color: "#555" }}>
                  {expandedSesh.players.length} players
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="label-mono" style={{ color: "#444" }}>Session Load</span>
                <span
                  className="font-display font-700 text-xl px-3 py-0.5 rounded"
                  style={{
                    color: loadColor(expandedSesh.sessionLoadScore),
                    background: "#0a0a0b",
                    border: `1px solid ${loadColor(expandedSesh.sessionLoadScore)}33`,
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
                    {expandedSesh.players[0] &&
                      Object.keys(expandedSesh.players[0].metrics).map((k) => (
                        <th key={k} className="px-3 py-2 label-mono text-center" style={{ color: "#555" }}>
                          {METRIC_LABELS[k as TrainingMetricKey]}
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
                            color: loadColor(p.loadScore),
                            background: loadBg(p.loadScore),
                            border: `1px solid ${loadColor(p.loadScore)}33`,
                          }}
                        >
                          {p.loadScore}
                        </span>
                      </td>
                      {Object.entries(p.metrics).map(([k, val]) => (
                        <td key={k} className="px-3 py-2.5 text-center">
                          <div className="font-mono text-[12px]" style={{ color: "#888" }}>
                            {/* show 2 decimal places for floats, raw value for integers */}
                            {val != null
                              ? (typeof val === "number" && !Number.isInteger(val) ? val.toFixed(2) : val)
                              : "—"}{" "}
                            <span style={{ color: "#555" }}>{METRIC_UNITS[k as TrainingMetricKey]}</span>
                          </div>
                        </td>
                      ))}
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
          {[{ key: "loadScore", label: "Load Score" }, ...allMetrics.map((k) => ({ key: k, label: METRIC_LABELS[k] }))].map((m) => (
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

        {/* Player selector — shows last name only to save space */}
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
                {name.split(" ").pop()}
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
