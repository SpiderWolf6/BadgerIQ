"use client";

import { Report } from "@/types/report";

interface SidebarProps {
  reports: Report[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

// Maryland: no report, just a result entry
const MARYLAND_ENTRY = {
  slug: null,
  opponent: "Maryland Terrapins",
  matchDate: "09/12",
  record: "—",
  wisconsinResult: "L 1-3",
};

function resultColor(result: string) {
  if (result.startsWith("W")) return "#22c55e";
  if (result.startsWith("D")) return "#f59e0b";
  return "#c5050c";
}

export default function Sidebar({ reports, activeSlug, onSelect }: SidebarProps) {
  // Build combined list with Maryland injected at the top (earliest date)
  type SidebarEntry =
    | { type: "report"; report: Report }
    | { type: "no-report"; slug: null; opponent: string; matchDate: string; record: string; wisconsinResult: string };

  const entries: SidebarEntry[] = [
    { type: "no-report" as const, ...MARYLAND_ENTRY },
    ...reports.map((r) => ({ type: "report" as const, report: r })),
  ].sort((a, b) => {
    const dateA = a.type === "report" ? a.report.matchDate : (a as Extract<SidebarEntry, { type: "no-report" }>).matchDate;
    const dateB = b.type === "report" ? b.report.matchDate : (b as Extract<SidebarEntry, { type: "no-report" }>).matchDate;
    const [am, ad] = dateA.split("/").map(Number);
    const [bm, bd] = dateB.split("/").map(Number);
    return am !== bm ? am - bm : ad - bd;
  });

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden border-r"
      style={{ width: "220px", background: "#0d0d0e", borderColor: "#1a1a1c" }}
    >
      {/* Section header */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: "#1a1a1c" }}>
        <span className="label-mono" style={{ color: "#444" }}>
          Season Reports
        </span>
      </div>

      {/* Report list */}
      <nav className="flex-1 overflow-y-auto py-1">
        {entries.map((entry) => {
          if (entry.type === "no-report") {
            // Maryland — no report, non-clickable
            return (
              <div
                key="maryland"
                className="w-full px-3 py-2.5 relative flex items-start gap-2.5 opacity-50"
                style={{ borderLeft: "2px solid transparent", cursor: "default" }}
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span
                    className="font-display font-600 text-sm leading-tight truncate"
                    style={{ color: "#666" }}
                  >
                    {entry.opponent}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#444" }}>
                      {entry.matchDate}
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: resultColor(entry.wisconsinResult) }}>
                      {entry.wisconsinResult}
                    </span>
                  </div>
                  <span className="label-mono" style={{ color: "#333" }}>
                    No report
                  </span>
                </div>
              </div>
            );
          }

          const { report } = entry;
          const isActive = report.slug === activeSlug;
          const result = report.wisconsinResult;

          return (
            <button
              key={report.slug}
              onClick={() => onSelect(report.slug)}
              className="w-full text-left px-3 py-2.5 transition-colors relative flex items-start gap-2.5"
              style={{
                background: isActive ? "#140406" : "transparent",
                borderLeft: isActive ? "2px solid #c5050c" : "2px solid transparent",
              }}
            >
              {isActive && (
                <span
                  className="absolute right-2.5 top-3 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#c5050c" }}
                />
              )}

              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span
                  className="font-display font-600 text-sm leading-tight truncate"
                  style={{ color: isActive ? "#e8e8ea" : "#aaa" }}
                >
                  {report.opponent}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#444" }}>
                    {report.matchDate}
                  </span>
                  {result && (
                    <span
                      className="font-mono text-[9px] font-semibold"
                      style={{ color: resultColor(result) }}
                    >
                      {result}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#333" }}>
                  {report.record}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-3" style={{ borderColor: "#1a1a1c" }}>
        <div>
          <span className="label-mono block mb-1.5" style={{ color: "#333" }}>
            Season Overview
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Reports", value: reports.length },
              { label: "Compiled", value: "S. Mukherjee" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded px-2 py-1.5"
                style={{ background: "#0f0f11", border: "1px solid #1a1a1c" }}
              >
                <div className="font-display font-600 text-sm" style={{ color: "#e8e8ea" }}>
                  {s.value}
                </div>
                <div className="label-mono" style={{ color: "#444" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
