/**
 * Per-season display config for the Training tab.
 *
 * Training JSON stores each source's native metric keys and units; this file
 * decides which metrics to show, in what order, with what label/unit, and how
 * to color load scores. Safe to import from client components.
 */

import { TrainingMetricKey, METRIC_LABELS, METRIC_UNITS, VxsportMetricKey } from "@/types/stats";
import { StatsSeason } from "@/lib/seasons";

export interface MetricDisplay {
  key:   TrainingMetricKey;
  label: string;
  unit:  string;
}

/** Load color bands: green at or above `high`, amber at or above `mid`, red below. */
export interface LoadThresholds {
  high: number;
  mid:  number;
}

export interface TrainingDisplayConfig {
  metrics:     MetricDisplay[];
  playerLoad:  LoadThresholds; // per-player session load
  sessionLoad: LoadThresholds; // session average (timeline dots + session header)
}

// Spring 26 — VXSport, same order and thresholds as before the season split
const VXSPORT_ORDER: VxsportMetricKey[] = [
  "totalDistance", "distanceHISpeed", "sprintsHI", "hiDecelerations", "hiAccelerations",
  "durationSecs", "speedMax", "sprintCount", "activityLoad3D", "metabolicEnergyCost",
];

export const TRAINING_DISPLAY: Record<StatsSeason, TrainingDisplayConfig> = {
  spring26: {
    metrics: VXSPORT_ORDER.map((key) => ({ key, label: METRIC_LABELS[key], unit: METRIC_UNITS[key] })),
    playerLoad:  { high: 60, mid: 30 },
    sessionLoad: { high: 60, mid: 30 },
  },

  // Fall 26 — PlayerData, native yards / mph.
  // Load thresholds are a first guess from the Sep 5 – Oct 2 export (Whole Session
  // rows with load > 0): ~33rd pct ≈ 540, ~66th pct ≈ 950; session averages run
  // ~300–1100. Tune these once coaches have a feel for the numbers.
  fall26: {
    metrics: [
      { key: "durationMin",       label: "Duration",        unit: "min"  },
      { key: "totalDistance",     label: "Distance",        unit: "yds"  },
      { key: "yardsPerMinute",    label: "Yds / Min",       unit: ""     },
      { key: "hiRunningDistance", label: "HI Running",      unit: "yds"  },
      { key: "hiEvents",          label: "HI Events",       unit: ""     },
      { key: "sprintDistance",    label: "Sprint Distance", unit: "yds"  },
      { key: "sprintCount",       label: "Sprints",         unit: ""     },
      { key: "topSpeed",          label: "Top Speed",       unit: "mph"  },
      { key: "pctMaxSpeed",       label: "% Max Speed",     unit: "%"    },
      { key: "avgSpeed",          label: "Avg Speed",       unit: "mph"  },
      { key: "accelerations",     label: "Accels",          unit: ""     },
      { key: "decelerations",     label: "Decels",          unit: ""     },
    ],
    playerLoad:  { high: 950, mid: 540 },
    sessionLoad: { high: 900, mid: 500 },
  },
};

// load colors — green / amber / red (text + dark background tint)

export function loadColor(score: number, t: LoadThresholds): string {
  if (score >= t.high) return "#22c55e";
  if (score >= t.mid)  return "#f59e0b";
  return "#c5050c";
}

export function loadBg(score: number, t: LoadThresholds): string {
  if (score >= t.high) return "#0a1a0e";
  if (score >= t.mid)  return "#1a1408";
  return "#140406";
}
