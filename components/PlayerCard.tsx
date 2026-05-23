import { KeyPlayer } from "@/types/report";

interface PlayerCardProps {
  player: KeyPlayer;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div
      className="rounded p-3 flex gap-3 items-start"
      style={{
        background: "#0f0f11",
        border: "1px solid #1a1a1c",
      }}
    >
      {/* Jersey number */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded flex items-center justify-center"
        style={{
          background: "#140406",
          border: "1px solid #c5050c33",
        }}
      >
        <span
          className="font-display font-700 text-base leading-none"
          style={{ color: "#c5050c" }}
        >
          {player.number}
        </span>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="font-display font-600 text-sm leading-tight"
            style={{ color: "#e8e8ea" }}
          >
            {player.name}
          </span>
          <span
            className="font-mono text-[13px] uppercase tracking-wider flex-shrink-0"
            style={{ color: "#555" }}
          >
            {player.position}
          </span>
        </div>
        <p
          className="font-sans text-xs leading-relaxed"
          style={{ color: "#666" }}
        >
          {player.notes}
        </p>
      </div>
    </div>
  );
}
