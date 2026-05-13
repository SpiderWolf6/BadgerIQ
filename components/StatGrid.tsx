import { ReportStats } from "@/types/report";

interface StatItem {
  label: string;
  value: string | number;
  note?: string;
}

interface StatGridProps {
  stats: ReportStats;
}

export default function StatGrid({ stats }: StatGridProps) {
  const items: StatItem[] = [
    {
      label: "PPDA",
      value: stats.ppda,
      note: stats.ppda < 9 ? "Aggressive Press" : stats.ppda < 11 ? "Moderate Press" : "Low Press",
    },
    {
      label: "Possession",
      value: `${stats.possession}%`,
      note: stats.possession > 52 ? "Possession Team" : "Direct/Balanced",
    },
    {
      label: "xG / 90",
      value: stats.xgPer90,
      note: stats.xgPer90 > 2 ? "High Threat" : stats.xgPer90 > 1.5 ? "Med Threat" : "Low Threat",
    },
    {
      label: "Passes / Poss",
      value: stats.passesPerPossession,
      note: "Avg sequence length",
    },
    {
      label: stats.stat5Label,
      value: stats.stat5Value,
    },
    {
      label: stats.stat6Label,
      value: stats.stat6Value,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded p-3 flex flex-col gap-1"
          style={{
            background: "#0f0f11",
            border: "1px solid #1a1a1c",
          }}
        >
          <span
            className="label-mono leading-none"
            style={{ color: "#444" }}
          >
            {item.label}
          </span>
          <span
            className="font-display font-600 text-2xl leading-none mt-1"
            style={{ color: "#c5050c" }}
          >
            {item.value}
          </span>
          {item.note && (
            <span
              className="font-mono text-[9px]"
              style={{ color: "#555" }}
            >
              {item.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
