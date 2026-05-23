"use client";

/**
 * CompareTab — two comparison modes:
 *
 * 1v1: pick two players from the season roster and see a radar chart of their
 *      five skill dimensions side-by-side, plus a mirrored bar chart for every
 *      individual season stat.
 *
 * Multi: pick a training metric and see a ranked bar chart of every player's
 *        season-average value for that metric across all training sessions.
 */

import { useState, useMemo } from "react";
import { SeasonPlayer, TrainingSession, TrainingMetricKey, METRIC_LABELS } from "@/types/stats";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from "recharts";

interface Props {
  players: SeasonPlayer[];
  sessions: TrainingSession[];
}

type Mode = "1v1" | "multi";

// season stats shown in the 1v1 mirrored bar chart
const SEASON_METRICS: { key: keyof SeasonPlayer; label: string }[] = [
  { key: "goals",                label: "Goals" },
  { key: "xGP90",               label: "xG/90" },
  { key: "assistsP90",          label: "A/90" },
  { key: "xAP90",               label: "xA/90" },
  { key: "shotsP90",            label: "Shots/90" },
  { key: "defensiveDuelsWonPct",label: "Def Duel%" },
  { key: "aerialDuelsWonPct",   label: "Aerial%" },
  { key: "interceptionsP90",    label: "Int/90" },
  { key: "accuratePassesPct",   label: "Pass%" },
  { key: "keyPassesP90",        label: "KeyPass/90" },
  { key: "dribblesP90",         label: "Drb/90" },
  { key: "progressiveRunsP90",  label: "ProgRun/90" },
];

/**
 * Build radar chart data for a player — each dimension is a 0-100 score
 * relative to the best player in the squad for that set of metrics.
 */
function buildRadar(player: SeasonPlayer, all: SeasonPlayer[]) {
  const maxOf = (k: keyof SeasonPlayer) => Math.max(...all.map((p) => Number(p[k]) || 0)) || 1;
  const score = (k: keyof SeasonPlayer) => Math.round(((Number(player[k]) || 0) / maxOf(k)) * 100);
  return [
    { dim: "Attack",     value: Math.round((score("goalsP90") + score("xGP90") + score("shotsP90")) / 3) },
    { dim: "Defense",    value: Math.round((score("defensiveDuelsWonPct") + score("interceptionsP90")) / 2) },
    { dim: "Aerial",     value: score("aerialDuelsWonPct") },
    { dim: "Passing",    value: Math.round((score("accuratePassesPct") + score("keyPassesP90")) / 2) },
    { dim: "Dribbling",  value: Math.round((score("dribblesP90") + score("successfulDribblesPct")) / 2) },
    // discipline is inverted — cards hurt the score
    { dim: "Discipline", value: Math.max(0, 100 - (player.yellowCards * 15) - (player.redCards * 40)) },
  ];
}

export default function CompareTab({ players, sessions }: Props) {
  const [mode, setMode]           = useState<Mode>("1v1");
  const [playerA, setPlayerA]     = useState<string>(players[0]?.name ?? "");
  const [playerB, setPlayerB]     = useState<string>(players[1]?.name ?? "");
  const [multiMetric, setMultiMetric] = useState<"loadScore" | TrainingMetricKey>("loadScore");

  const pA = players.find((p) => p.name === playerA);
  const pB = players.find((p) => p.name === playerB);

  // mirrored bar data — one row per season metric, value for each player
  const mirrorData = useMemo(() => {
    if (!pA || !pB) return [];
    return SEASON_METRICS.map(({ key, label }) => ({
      label,
      a: Number(pA[key]) || 0,
      b: Number(pB[key]) || 0,
      maxVal: Math.max(Number(pA[key]) || 0, Number(pB[key]) || 0) || 1,
    }));
  }, [pA, pB]);

  // unique player names seen across all training sessions for the multi tab
  const allSessionPlayers = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.players.forEach((p) => set.add(p.name)));
    return Array.from(set).sort();
  }, [sessions]);

  // season-average of selected metric per player, sorted descending
  const multiData = useMemo(() => {
    return allSessionPlayers.map((name) => {
      let total = 0;
      let count = 0;
      sessions.forEach((s) => {
        const p = s.players.find((pl) => pl.name === name);
        if (p) {
          const val = multiMetric === "loadScore"
            ? p.loadScore
            : (p.metrics[multiMetric as TrainingMetricKey] ?? null) as number | null;
          if (val !== null) { total += val; count++; }
        }
      });
      return {
        name:     name.split(" ").pop() ?? name, // last name for the y-axis label
        fullName: name,
        avg:      count > 0 ? +(total / count).toFixed(2) : 0,
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [sessions, multiMetric, allSessionPlayers]);

  // radar overlay data — one object per dimension with both players' scores
  const radarOverlay = useMemo(() => {
    if (!pA || !pB) return [];
    const ra = buildRadar(pA, players);
    const rb = buildRadar(pB, players);
    return ra.map((r, i) => ({
      dim: r.dim,
      [playerA.split(" ").pop()!]: r.value,
      [playerB.split(" ").pop()!]: rb[i].value,
    }));
  }, [pA, pB, players, playerA, playerB]);

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5">

      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {(["1v1", "multi"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded font-mono text-[13px] uppercase tracking-widest"
            style={{
              background: mode === m ? "#140406" : "#0f0f11",
              border: `1px solid ${mode === m ? "#c5050c" : "#1a1a1c"}`,
              color: mode === m ? "#c5050c" : "#555",
            }}
          >
            {m === "1v1" ? "1v1 Player" : "Multi-Player Session"}
          </button>
        ))}
      </div>

      {/* 1v1 mode */}
      {mode === "1v1" && (
        <>
          {/* Player pickers */}
          <div className="grid grid-cols-2 gap-3">
            {[{ val: playerA, set: setPlayerA, color: "#c5050c" }, { val: playerB, set: setPlayerB, color: "#3b82f6" }].map(({ val, set, color }, i) => (
              <div key={i}>
                <div className="label-mono mb-1.5" style={{ color: "#444" }}>{i === 0 ? "Player A" : "Player B"}</div>
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2 rounded font-mono text-xs outline-none"
                  style={{ background: "#0f0f11", border: `1px solid ${color}33`, color: "#e8e8ea" }}
                >
                  {players.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            ))}
          </div>

          {pA && pB && (
            <>
              {/* Radar overlay — relative scores 0-100 vs rest of squad */}
              <div>
                <div className="label-mono mb-2" style={{ color: "#444" }}>Radar Comparison</div>
                <div style={{ height: "220px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarOverlay}>
                      <PolarGrid stroke="#1a1a1c" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill: "#555", fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)" }} />
                      <Radar dataKey={playerA.split(" ").pop()!} stroke="#c5050c" fill="#c5050c" fillOpacity={0.15} />
                      <Radar dataKey={playerB.split(" ").pop()!} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mirrored bar chart — A on the left, B on the right, bars scaled to the higher value */}
              <div>
                <div className="label-mono mb-2" style={{ color: "#444" }}>Season Stats Head to Head</div>
                <div className="space-y-1.5">
                  {mirrorData.map(({ label, a, b, maxVal }) => (
                    <div key={label} className="flex items-center gap-2">
                      {/* player A bar — right-aligned */}
                      <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[13px]" style={{ color: "#c5050c" }}>
                            {typeof a === "number" ? a.toFixed(2).replace(/\.00$/, "") : a}
                          </span>
                          <div className="h-3 rounded-l" style={{ width: `${(a / maxVal) * 80}px`, background: "#c5050c", minWidth: a > 0 ? 2 : 0 }} />
                        </div>
                      </div>
                      {/* metric label centered */}
                      <span className="font-mono text-[12px] uppercase text-center w-24 flex-shrink-0" style={{ color: "#444" }}>{label}</span>
                      {/* player B bar — left-aligned */}
                      <div className="flex-1 flex justify-start">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 rounded-r" style={{ width: `${(b / maxVal) * 80}px`, background: "#3b82f6", minWidth: b > 0 ? 2 : 0 }} />
                          <span className="font-mono text-[13px]" style={{ color: "#3b82f6" }}>
                            {typeof b === "number" ? b.toFixed(2).replace(/\.00$/, "") : b}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-[13px]" style={{ color: "#c5050c" }}>{pA.name}</span>
                  <span className="font-mono text-[13px]" style={{ color: "#3b82f6" }}>{pB.name}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* multi-player mode */}
      {mode === "multi" && (
        <>
          {/* Metric selector */}
          <div>
            <div className="label-mono mb-2" style={{ color: "#444" }}>Metric</div>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "loadScore", label: "Load Score" }, ...Object.entries(METRIC_LABELS).map(([k, l]) => ({ key: k, label: l }))].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMultiMetric(m.key as "loadScore" | TrainingMetricKey)}
                  className="px-2.5 py-1 rounded font-mono text-[13px] uppercase tracking-wider"
                  style={{
                    background: multiMetric === m.key ? "#140406" : "#0f0f11",
                    border: `1px solid ${multiMetric === m.key ? "#c5050c" : "#1a1a1c"}`,
                    color: multiMetric === m.key ? "#c5050c" : "#555",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ranked horizontal bar chart — height grows with player count so all names fit */}
          <div>
            <div className="label-mono mb-2" style={{ color: "#444" }}>
              Season Average — {multiMetric === "loadScore" ? "Load Score" : METRIC_LABELS[multiMetric as TrainingMetricKey]}
            </div>
            <div style={{ height: `${Math.max(300, multiData.length * 28)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={multiData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 80 }}>
                  <XAxis type="number" tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} />
                  {/* interval={0} forces every label to render — without it Recharts skips labels when bars are short */}
                  <YAxis type="category" dataKey="name" interval={0} tick={{ fill: "#888", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#0f0f11", border: "1px solid #1a1a1c", borderRadius: 4, fontSize: 11 }}
                    formatter={(v) => [typeof v === "number" ? v.toFixed(2) : v, multiMetric === "loadScore" ? "Load Score" : METRIC_LABELS[multiMetric as TrainingMetricKey]]}
                    labelFormatter={(l) => multiData.find((d) => d.name === l)?.fullName ?? l}
                  />
                  <Bar dataKey="avg" radius={[0, 2, 2, 0]}>
                    {/* top 3 get highlighted in red */}
                    {multiData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#c5050c" : i < 3 ? "#c5050c88" : "#1a1a1c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
