import { Report } from "@/types/report";

interface ReportCardProps {
  report: Report;
  isActive: boolean;
  onClick: () => void;
}

export default function ReportCard({ report, isActive, onClick }: ReportCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 transition-colors"
      style={{
        background: isActive ? "#140406" : "transparent",
        borderLeft: isActive ? "2px solid #c5050c" : "2px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="font-display font-600 text-sm leading-tight"
          style={{ color: isActive ? "#e8e8ea" : "#888" }}
        >
          {report.opponent}
        </span>
        {isActive && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
            style={{ background: "#c5050c" }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="label-mono" style={{ color: "#444" }}>
          {report.matchDate}
        </span>
        <span className="label-mono" style={{ color: "#555" }}>
          {report.record}
        </span>
      </div>
    </button>
  );
}
