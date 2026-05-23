/**
 * Shared TypeScript types for all stats data.
 *
 * SeasonPlayer — Wyscout season stats (one row per player from the XLSX export).
 * TrainingSession — VXSport GPS session data (one file per training day from the API).
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

// training sessions (VXSport API)

/**
 * Keys for per-player training metrics.
 * Distance fields are in miles; speeds in km/h; duration in seconds; counts are raw integers.
 */
export type TrainingMetricKey =
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

export const METRIC_LABELS: Record<TrainingMetricKey, string> = {
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

export const METRIC_UNITS: Record<TrainingMetricKey, string> = {
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

export interface PlayerSessionData {
  name: string;
  position: string;
  group: string;       // positional group e.g. "Attack", "Midfield", "Defense", "Goalkeeper"
  sessions: number;
  loadScore: number;   // VXSport load score for this session
  metrics: Partial<Record<TrainingMetricKey, number | null>>;
}

export interface TrainingSession {
  sessionId:        string; // same as date, e.g. "2026-01-26"
  date:             string; // ISO date "YYYY-MM-DD"
  displayDate:      string; // short label e.g. "Jan 26"
  sessionLoadScore: number; // average load score across all players in the session
  players:          PlayerSessionData[];
}
