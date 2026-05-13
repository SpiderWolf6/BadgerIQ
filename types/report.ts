export interface KeyPlayer {
  number: number;
  name: string;
  position: string;
  notes: string;
}

export interface ExploitZone {
  title: string;
  description: string;
}

export interface ReportStats {
  ppda: number;
  possession: number;
  xgPer90: number;
  passesPerPossession: number;
  stat5Label: string;
  stat5Value: number | string;
  stat6Label: string;
  stat6Value: number | string;
}

export interface Report {
  slug: string;
  opponent: string;
  matchDate: string;
  record: string;
  lastResult: string;
  compiledBy: string;
  overview: string;
  stats: ReportStats;
  formation: string;
  inPossession: string[];
  outOfPossession: string[];
  keyPlayers: KeyPlayer[];
  exploitZones: ExploitZone[];
  aiPerspective: string;
  setPieceTargets?: string[];
  pdfPath: string;
  wisconsinResult?: string; // "W 2-1" / "L 1-3" / "D 1-1"
}
