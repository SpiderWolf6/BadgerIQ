/**
 * Shared TypeScript types for all stats data.
 *
 * SeasonPlayer — Wyscout season stats (one row per player from the XLSX export).
 * TrainingSession — GPS session data, one file per training day
 *   (Spring 26: VXSport API; Fall 26: PlayerData CSV exports).
 */

// season stats (Wyscout XLSX)

export interface SeasonPlayer {
  name: string;
  team: string;
  position: string;
  age: number | null;
  marketValue: number;
  foot: string;
  height: number | null;
  weight: number | null;
  matchesPlayed: number;
  minutesPlayed: number;
  // attacking
  goals: number;
  goalsP90: number;
  xG: number;
  xGP90: number;
  assists: number;
  assistsP90: number;
  xA: number;
  xAP90: number;
  shots: number;
  shotsP90: number;
  shotsOnTargetPct: number;
  goalConversionPct: number;
  touchesInBoxP90: number;
  // dribbling
  dribblesP90: number;
  successfulDribblesPct: number;
  progressiveRunsP90: number;
  offensiveDuelsP90: number;
  offensiveDuelsWonPct: number;
  // defending
  defensiveDuelsP90: number;
  defensiveDuelsWonPct: number;
  aerialDuelsP90: number;
  aerialDuelsWonPct: number;
  interceptionsP90: number;
  successfulDefActionsP90: number;
  slidingTacklesP90: number;
  // passing
  passesP90: number;
  accuratePassesPct: number;
  forwardPassesP90: number;
  accurateForwardPassesPct: number;
  longPassesP90: number;
  accurateLongPassesPct: number;
  keyPassesP90: number;
  passesToFinalThirdP90: number;
  accuratePassesToFinalThirdPct: number;
  smartPassesP90: number;
  accurateSmartPassesPct: number;
  throughPassesP90: number;
  progressivePassesP90: number;
  accurateProgressivePassesPct: number;
  // crossing
  crossesP90: number;
  accurateCrossesPct: number;
  // discipline
  foulsP90: number;
  yellowCards: number;
  yellowCardsP90: number;
  redCards: number;
  redCardsP90: number;
  // duels combined
  duelsP90: number;
  duelsWonPct: number;
}

// training sessions
//
// Both sources share one JSON shape (TrainingSession) but use different metric
// keys and units — see lib/trainingDisplay.ts for per-season labels/units.
//   Spring 26: VXSport API    — VxsportMetricKey, miles / km/h
//   Fall 26:   PlayerData CSV — PlayerDataMetricKey, yards / mph

/**
 * VXSport (Spring 26) per-player metric keys.
 * Distance fields are in miles; speeds in km/h; duration in seconds; counts are raw integers.
 */
export type VxsportMetricKey =
  | "totalDistance"        // total GPS distance (mi)
  | "distanceHISpeed"      // distance above high-intensity speed threshold (mi)
  | "sprintsHI"            // high-intensity speed sprint count
  | "hiDecelerations"      // high-intensity deceleration count
  | "hiAccelerations"      // high-intensity acceleration count
  | "durationSecs"         // session duration (seconds)
  | "speedMax"             // max speed recorded (km/h)
  | "sprintCount"          // total sprint count across all speed zones
  | "activityLoad3D"       // 3D activity load (VXSport proprietary measure)
  | "metabolicEnergyCost"; // total metabolic energy expenditure (kJ)

/**
 * PlayerData (Fall 26) per-player metric keys — native units from the CSV export.
 * Distances in yards; speeds in mph; duration in minutes; counts are raw integers.
 */
export type PlayerDataMetricKey =
  | "durationMin"          // session duration (min) — the session window, not the athlete's capture time
  | "totalDistance"        // Distance (yds)
  | "yardsPerMinute"       // Yards per Minute (yds/min)
  | "hiRunningDistance"    // High Intensity Running (yds)
  | "hiEvents"             // No. of High Intensity Events
  | "sprintDistance"       // Sprint Distance (yds)
  | "sprintCount"          // No. of Sprints
  | "topSpeed"             // Top Speed (mph)
  | "pctMaxSpeed"          // Percentage of Max Speed (% of the athlete's own max)
  | "avgSpeed"             // Avg Speed (mph)
  | "accelerations"        // Accelerations
  | "decelerations";       // Decelerations

/** Any metric key from either source. */
export type TrainingMetricKey = VxsportMetricKey | PlayerDataMetricKey;

// VXSport labels/units — still used by the Spring 26 Compare tab
export const METRIC_LABELS: Record<VxsportMetricKey, string> = {
  totalDistance:       "Total Distance",
  distanceHISpeed:     "HI Distance",
  sprintsHI:           "Sprints HI",
  hiDecelerations:     "HI Decelerations",
  hiAccelerations:     "HI Accelerations",
  durationSecs:        "Duration",
  speedMax:            "Max Speed",
  sprintCount:         "Sprint Count",
  activityLoad3D:      "Activity Load 3D",
  metabolicEnergyCost: "Metabolic Cost",
};

export const METRIC_UNITS: Record<VxsportMetricKey, string> = {
  totalDistance:       "mi",
  distanceHISpeed:     "mi",
  sprintsHI:           "",
  hiDecelerations:     "",
  hiAccelerations:     "",
  durationSecs:        "s",
  speedMax:            "km/h",
  sprintCount:         "",
  activityLoad3D:      "",
  metabolicEnergyCost: "kJ",
};

/** A coach-tagged segment inside a session (PlayerData only), e.g. "Full 90". */
export interface PlayerSegment {
  name:      string;
  startTime: string; // "HH:MM:SS"
  endTime:   string;
  loadScore: number | null;
  metrics:   Partial<Record<TrainingMetricKey, number | null>>;
}

export interface PlayerSessionData {
  personId?: string;   // PlayerData Person ID — stable athlete key (Fall 26+)
  name: string;
  position: string;
  group: string;       // positional group e.g. "Defenders", "Central MF", "Goalkeepers"
  sessions: number;
  loadScore: number;   // source's load score for this session (VXSport ~0–100, PlayerData ~0–3000)
  metrics: Partial<Record<TrainingMetricKey, number | null>>; // null = not recorded
  segments?: PlayerSegment[]; // PlayerData only, when the session has tagged segments
}

export interface TrainingSession {
  sessionId:        string; // same as date, e.g. "2026-01-26"
  date:             string; // ISO date "YYYY-MM-DD"
  displayDate:      string; // short label e.g. "Jan 26"
  sessionLoadScore: number; // average load score across all players in the session
  players:          PlayerSessionData[];
  // PlayerData (Fall 26+) only — absent on Spring 26 VXSport files
  source?:      "vxsport" | "playerdata";
  startTime?:   string;   // "HH:MM:SS"
  endTime?:     string;
  durationMin?: number;
  segments?:    string[]; // segment names in start order, e.g. ["Full 90"]
  tags?:        string[]; // values from the export's Tags column
  sourceFile?:  string;   // export file the session was parsed from, e.g. "export1.csv"
}
