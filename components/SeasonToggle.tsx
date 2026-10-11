"use client";

/**
 * SeasonToggle — compact segmented control for flipping between seasons.
 * Styled to match the Analysis / PDF toggle in ReportView.
 */

interface Props<T extends string> {
  seasons: { id: T; label: string }[];
  active: T;
  onChange: (season: T) => void;
}

export default function SeasonToggle<T extends string>({ seasons, active, onChange }: Props<T>) {
  return (
    <div className="flex rounded overflow-hidden flex-shrink-0" style={{ border: "1px solid #1a1a1c" }}>
      {seasons.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className="px-2.5 py-1 font-mono text-[12px] uppercase tracking-widest transition-colors whitespace-nowrap"
          style={{
            background: active === s.id ? "#140406" : "#0f0f11",
            color: active === s.id ? "#c5050c" : "#555",
            borderRight: i < seasons.length - 1 ? "1px solid #1a1a1c" : undefined,
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
