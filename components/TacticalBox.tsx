interface TacticalBoxProps {
  inPossession: string[];
  outOfPossession: string[];
  formation: string;
}

export default function TacticalBox({
  inPossession,
  outOfPossession,
  formation,
}: TacticalBoxProps) {
  return (
    <div className="space-y-3">
      {/* Formation badge */}
      <div className="flex items-center gap-2">
        <span className="label-mono" style={{ color: "#444" }}>
          Formation
        </span>
        <span
          className="font-display font-600 text-sm px-2 py-0.5 rounded"
          style={{
            background: "#140406",
            border: "1px solid #c5050c33",
            color: "#c5050c",
            letterSpacing: "0.05em",
          }}
        >
          {formation}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* In Possession */}
        <div
          className="rounded p-3 space-y-2"
          style={{ background: "#0f0f11", border: "1px solid #1a1a1c" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
            <span className="label-mono" style={{ color: "#444" }}>
              In Possession
            </span>
          </div>
          <ul className="space-y-1.5">
            {inPossession.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="font-mono text-[9px] mt-0.5 flex-shrink-0"
                  style={{ color: "#c5050c" }}
                >
                  →
                </span>
                <span
                  className="font-sans text-xs leading-relaxed"
                  style={{ color: "#888" }}
                >
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out of Possession */}
        <div
          className="rounded p-3 space-y-2"
          style={{ background: "#0f0f11", border: "1px solid #1a1a1c" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#ef4444" }}
            />
            <span className="label-mono" style={{ color: "#444" }}>
              Out of Possession
            </span>
          </div>
          <ul className="space-y-1.5">
            {outOfPossession.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="font-mono text-[9px] mt-0.5 flex-shrink-0"
                  style={{ color: "#c5050c" }}
                >
                  →
                </span>
                <span
                  className="font-sans text-xs leading-relaxed"
                  style={{ color: "#888" }}
                >
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
