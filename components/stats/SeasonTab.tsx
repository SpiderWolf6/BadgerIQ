"use client";

/**
 * SeasonTab — Wyscout season stats leaderboard.
 *
 * Two view modes (Season totals / Per-90 rates) with a scrollable metric
 * selector strip. Clicking a metric sorts the player list by that metric.
 * Clicking a player opens a side drawer with a radar chart and full stat breakdown.
 */

import { useState, useMemo } from "react";
import { SeasonPlayer } from "@/types/stats";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";

interface Props { players: SeasonPlayer[]; }
type MetricKey = keyof SeasonPlayer;

interface MetricDef {
  key: MetricKey;
  label: string;
  shortLabel: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

// season totals and percentage stats
const SEASON_METRICS: MetricDef[] = [
  { key: "minutesPlayed",         label: "Minutes Played",        shortLabel: "Min",    format: (v) => String(Math.round(v)), higherIsBetter: true },
  { key: "matchesPlayed",         label: "Matches Played",        shortLabel: "MP",     format: (v) => String(v),             higherIsBetter: true },
  { key: "goals",                 label: "Goals",                 shortLabel: "G",      format: (v) => String(v),             higherIsBetter: true },
  { key: "xG",                    label: "xG",                    shortLabel: "xG",     format: (v) => v.toFixed(2),          higherIsBetter: true },
  { key: "assists",               label: "Assists",               shortLabel: "A",      format: (v) => String(v),             higherIsBetter: true },
  { key: "xA",                    label: "xA",                    shortLabel: "xA",     format: (v) => v.toFixed(2),          higherIsBetter: true },
  { key: "shots",                 label: "Shots",                 shortLabel: "Sh",     format: (v) => String(v),             higherIsBetter: true },
  { key: "shotsOnTargetPct",      label: "Shots on Target %",     shortLabel: "SoT%",   format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "goalConversionPct",     label: "Goal Conversion %",     shortLabel: "GConv%", format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "duelsWonPct",           label: "Duels Won %",           shortLabel: "DW%",    format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "defensiveDuelsWonPct",  label: "Def Duels Won %",       shortLabel: "DDW%",   format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "aerialDuelsWonPct",     label: "Aerial Duels Won %",    shortLabel: "ADW%",   format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "offensiveDuelsWonPct",  label: "Off Duels Won %",       shortLabel: "ODW%",   format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "successfulDribblesPct", label: "Dribble Success %",     shortLabel: "Drb%",   format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "accuratePassesPct",     label: "Pass Accuracy %",       shortLabel: "Pass%",  format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "accurateLongPassesPct", label: "Long Pass Acc %",       shortLabel: "LP%",    format: (v) => v.toFixed(1) + "%",    higherIsBetter: true },
  { key: "yellowCards",           label: "Yellow Cards",          shortLabel: "YC",     format: (v) => String(v),             higherIsBetter: false },
  { key: "redCards",              label: "Red Cards",             shortLabel: "RC",     format: (v) => String(v),             higherIsBetter: false },
];

// per-90 rate stats
const P90_METRICS: MetricDef[] = [
  { key: "goalsP90",              label: "Goals / 90",            shortLabel: "G/90",   format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "xGP90",                 label: "xG / 90",               shortLabel: "xG/90",  format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "assistsP90",            label: "Assists / 90",          shortLabel: "A/90",   format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "xAP90",                 label: "xA / 90",               shortLabel: "xA/90",  format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "shotsP90",              label: "Shots / 90",            shortLabel: "Sh/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "touchesInBoxP90",       label: "Box Touches / 90",      shortLabel: "BxT/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "dribblesP90",           label: "Dribbles / 90",         shortLabel: "Drb/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "progressiveRunsP90",    label: "Progressive Runs / 90", shortLabel: "PR/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "offensiveDuelsP90",     label: "Off Duels / 90",        shortLabel: "OD/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "defensiveDuelsP90",     label: "Def Duels / 90",        shortLabel: "DD/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "aerialDuelsP90",        label: "Aerial Duels / 90",     shortLabel: "AD/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "interceptionsP90",      label: "Interceptions / 90",    shortLabel: "Int/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "successfulDefActionsP90",label:"Def Actions / 90",      shortLabel: "DA/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "slidingTacklesP90",     label: "Tackles / 90",          shortLabel: "Tkl/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "passesP90",             label: "Passes / 90",           shortLabel: "Pas/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "forwardPassesP90",      label: "Fwd Passes / 90",       shortLabel: "FP/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "longPassesP90",         label: "Long Passes / 90",      shortLabel: "LP/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "keyPassesP90",          label: "Key Passes / 90",       shortLabel: "KP/90",  format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "progressivePassesP90",  label: "Progressive Passes/90", shortLabel: "PP/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "passesToFinalThirdP90", label: "Passes Final 3rd / 90", shortLabel: "PF3/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "smartPassesP90",        label: "Smart Passes / 90",     shortLabel: "SP/90",  format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "throughPassesP90",      label: "Through Passes / 90",   shortLabel: "TP/90",  format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: "crossesP90",            label: "Crosses / 90",          shortLabel: "Crs/90", format: (v) => v.toFixed(1), higherIsBetter: true },
  { key: "foulsP90",              label: "Fouls / 90",            shortLabel: "Fls/90", format: (v) => v.toFixed(1), higherIsBetter: false },
  { key: "yellowCardsP90",        label: "Yellow Cards / 90",     shortLabel: "YC/90",  format: (v) => v.toFixed(2), higherIsBetter: false },
];

/**
 * Build radar chart data for a single player.
 * Each of the six dimensions is a 0-100 score relative to the squad maximum,
 * combining multiple Wyscout metrics into a single dimension value.
 */
function buildRadarData(player: SeasonPlayer, allPlayers: SeasonPlayer[]) {
  const maxOf = (key: MetricKey) => Math.max(...allPlayers.map((p) => Number(p[key]) || 0)) || 1;
  const score = (key: MetricKey) => Math.round(((Number(player[key]) || 0) / maxOf(key)) * 100);
  return [
    { dim: "Attacking",  value: Math.round((score("goalsP90") + score("xGP90") + score("shotsP90") + score("touchesInBoxP90")) / 4) },
    { dim: "Defending",  value: Math.round((score("defensiveDuelsWonPct") + score("interceptionsP90") + score("successfulDefActionsP90")) / 3) },
    { dim: "Aerial",     value: Math.round((score("aerialDuelsP90") + score("aerialDuelsWonPct")) / 2) },
    { dim: "Passing",    value: Math.round((score("accuratePassesPct") + score("keyPassesP90") + score("progressivePassesP90")) / 3) },
    { dim: "Dribbling",  value: Math.round((score("dribblesP90") + score("successfulDribblesPct") + score("offensiveDuelsWonPct")) / 3) },
    // discipline is inverted — cards hurt the score
    { dim: "Discipline", value: Math.max(0, 100 - (player.yellowCards * 15) - (player.redCards * 40)) },
  ];
}

// progress bar color — green at top of leaderboard, amber middle, red bottom
function barColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#c5050c";
}

export default function SeasonTab({ players }: Props) {
  const [mode, setSortMode]   = useState<"season" | "p90">("season");
  const [sortKey, setSortKey] = useState<MetricKey>("minutesPlayed");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<SeasonPlayer | null>(null);

  const metrics = mode === "season" ? SEASON_METRICS : P90_METRICS;
  const metric  = metrics.find((m) => m.key === sortKey) ?? metrics[0];

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [players, sortKey, sortDir]);

  function handleSort(key: MetricKey) {
    // clicking the same column flips direction; clicking a new column defaults to desc
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function switchMode(m: "season" | "p90") {
    setSortMode(m);
    // pick a sensible default sort key when switching modes
    setSortKey(m === "season" ? "minutesPlayed" : "xGP90");
    setSortDir("desc");
  }

  const maxVal = Math.max(...players.map((p) => Number(p[sortKey]) || 0)) || 1;

  // bar chart shows top 15 only to keep it readable
  const chartData = sorted.slice(0, 15).map((p) => ({
    name:  p.name.split(" ").pop() ?? p.name,
    value: +(Number(p[sortKey]) || 0).toFixed(2),
  }));

  return (
    <div className="flex h-full overflow-hidden">

      {/* main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mode toggle + metric selector strip */}
        <div className="px-5 py-2.5 border-b shrink-0 space-y-2" style={{ borderColor: "#1a1a1c" }}>
          {/* Season / Per-90 toggle */}
          <div className="flex items-center gap-2">
            <div className="flex rounded overflow-hidden" style={{ border: "1px solid #1a1a1c" }}>
              <button
                onClick={() => switchMode("season")}
                className="px-3 py-1 font-mono text-[13px] uppercase tracking-widest transition-colors"
                style={{
                  background: mode === "season" ? "#140406" : "#0f0f11",
                  color: mode === "season" ? "#c5050c" : "#555",
                  borderRight: "1px solid #1a1a1c",
                }}
              >
                Season
              </button>
              <button
                onClick={() => switchMode("p90")}
                className="px-3 py-1 font-mono text-[13px] uppercase tracking-widest transition-colors"
                style={{
                  background: mode === "p90" ? "#140406" : "#0f0f11",
                  color: mode === "p90" ? "#c5050c" : "#555",
                }}
              >
                Per 90
              </button>
            </div>
            <span className="font-mono text-[13px]" style={{ color: "#555" }}>
              {mode === "season" ? "Season totals & %s" : "Per 90 min rates"}
            </span>
          </div>

          {/* Scrollable metric pill strip */}
          <div className="overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {metrics.map((m) => (
                <button
                  key={m.key as string}
                  onClick={() => handleSort(m.key)}
                  className="px-2.5 py-1 rounded font-mono text-[13px] uppercase tracking-wider transition-colors whitespace-nowrap"
                  style={{
                    background: sortKey === m.key ? "#140406" : "#0f0f11",
                    border: `1px solid ${sortKey === m.key ? "#c5050c" : "#1a1a1c"}`,
                    color: sortKey === m.key ? "#c5050c" : "#555",
                  }}
                >
                  {m.shortLabel}
                  {/* show sort direction arrow on the active metric */}
                  {sortKey === m.key && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top-15 bar chart */}
        <div className="px-5 pt-3 pb-1 shrink-0" style={{ height: "120px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: "#444", fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f0f11", border: "1px solid #1a1a1c", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
                labelStyle={{ color: "#888" }}
                itemStyle={{ color: "#c5050c" }}
                formatter={(v) => [v]}
              />
              <Bar dataKey="value" radius={[2, 2, 0, 0]} name={metric.label}>
                {/* highlight the leader in red, others in dark grey */}
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#c5050c" : "#1a1a1c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard — click any row to open the player drawer */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="space-y-1">
            {sorted.map((player, i) => {
              const val      = Number(player[sortKey]) || 0;
              const pct      = (val / maxVal) * 100;
              const isActive = selected?.name === player.name;
              return (
                <div
                  key={player.name}
                  onClick={() => setSelected(isActive ? null : player)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors"
                  style={{
                    background: isActive ? "#140406" : "#0f0f11",
                    border: `1px solid ${isActive ? "#c5050c33" : "#1a1a1c"}`,
                  }}
                >
                  {/* rank — top 3 highlighted */}
                  <span className="font-mono text-[12px] w-5 text-right flex-shrink-0" style={{ color: i < 3 ? "#c5050c" : "#555" }}>
                    {i + 1}
                  </span>

                  {/* name, position, progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display font-600 text-sm" style={{ color: "#e8e8ea" }}>{player.name}</span>
                      <span className="font-mono text-[13px] uppercase" style={{ color: "#444" }}>{player.position}</span>
                    </div>
                    <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: "#1a1a1c" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColor(pct) }}
                      />
                    </div>
                  </div>

                  {/* sorted metric value — primary stat */}
                  <span className="font-display font-600 text-base flex-shrink-0" style={{ color: "#c5050c" }}>
                    {metric.format(val)}
                  </span>

                  {/* always-visible secondary stats */}
                  <div className="flex gap-3 flex-shrink-0">
                    {[
                      { label: "MP", val: player.matchesPlayed },
                      { label: "G",  val: player.goals },
                      { label: "A",  val: player.assists },
                    ].map(({ label, val: sv }) => (
                      <div key={label} className="text-right">
                        <div className="font-mono text-[13px]" style={{ color: "#444" }}>{label}</div>
                        <div className="font-mono text-[12px]" style={{ color: "#666" }}>{sv}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* player detail drawer */}
      {selected && (
        <div
          className="w-80 border-l flex flex-col overflow-hidden shrink-0"
          style={{ background: "#0d0d0e", borderColor: "#1a1a1c" }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#1a1a1c" }}>
            <div>
              <div className="font-display font-700 text-base" style={{ color: "#e8e8ea" }}>{selected.name}</div>
              <div className="font-mono text-[13px] uppercase" style={{ color: "#555" }}>{selected.position}</div>
            </div>
            <button onClick={() => setSelected(null)} className="font-mono text-[13px]" style={{ color: "#444" }}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Radar — 0-100 relative scores across six dimensions */}
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={buildRadarData(selected, players)}>
                  <PolarGrid stroke="#1a1a1c" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#555", fontSize: 9, fontFamily: "var(--font-ibm-plex-mono)" }} />
                  <Radar dataKey="value" stroke="#c5050c" fill="#c5050c" fillOpacity={0.15} dot={{ fill: "#c5050c", r: 2 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Stat groups */}
            {[
              {
                label: "Attacking",
                stats: [
                  ["Goals", selected.goals],       ["xG",  selected.xG.toFixed(2)],
                  ["Assists", selected.assists],    ["xA",  selected.xA.toFixed(2)],
                  ["Shots", selected.shots],        ["SoT%", selected.shotsOnTargetPct.toFixed(1) + "%"],
                  ["xG/90", selected.xGP90.toFixed(2)], ["xA/90", selected.xAP90.toFixed(2)],
                  ["Sh/90", selected.shotsP90.toFixed(1)], ["BxT/90", selected.touchesInBoxP90.toFixed(1)],
                ],
              },
              {
                label: "Defending",
                stats: [
                  ["DDW%",  selected.defensiveDuelsWonPct.toFixed(1) + "%"],
                  ["Aerial%", selected.aerialDuelsWonPct.toFixed(1) + "%"],
                  ["Int/90", selected.interceptionsP90.toFixed(1)],
                  ["DA/90",  selected.successfulDefActionsP90.toFixed(1)],
                  ["Tkl/90", selected.slidingTacklesP90.toFixed(1)],
                ],
              },
              {
                label: "Passing",
                stats: [
                  ["Pass%",  selected.accuratePassesPct.toFixed(1) + "%"],
                  ["KP/90",  selected.keyPassesP90.toFixed(2)],
                  ["PP/90",  selected.progressivePassesP90.toFixed(1)],
                  ["xA/90",  selected.xAP90.toFixed(2)],
                  ["Crs/90", selected.crossesP90.toFixed(1)],
                  ["LP%",    selected.accurateLongPassesPct.toFixed(1) + "%"],
                ],
              },
              {
                label: "Dribbling",
                stats: [
                  ["Drb/90", selected.dribblesP90.toFixed(1)],
                  ["Drb%",   selected.successfulDribblesPct.toFixed(1) + "%"],
                  ["ODW%",   selected.offensiveDuelsWonPct.toFixed(1) + "%"],
                  ["PR/90",  selected.progressiveRunsP90.toFixed(1)],
                ],
              },
              {
                label: "Discipline",
                stats: [
                  ["Yellow",    selected.yellowCards],
                  ["Red",       selected.redCards],
                  ["Fouls/90",  selected.foulsP90.toFixed(1)],
                ],
              },
            ].map((group) => (
              <div key={group.label}>
                <div className="label-mono mb-2" style={{ color: "#444" }}>{group.label}</div>
                <div className="grid grid-cols-2 gap-1">
                  {group.stats.map(([label, val]) => (
                    <div key={label as string} className="px-2 py-1.5 rounded" style={{ background: "#0f0f11", border: "1px solid #1a1a1c" }}>
                      <div className="font-mono text-[12px] uppercase" style={{ color: "#444" }}>{label}</div>
                      <div className="font-display font-600 text-sm" style={{ color: "#e8e8ea" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
