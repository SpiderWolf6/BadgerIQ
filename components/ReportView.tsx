"use client";

import { useState, useEffect } from "react";
import { Report } from "@/types/report";
import StatGrid from "./StatGrid";
import TacticalBox from "./TacticalBox";
import PlayerCard from "./PlayerCard";
import ExploitZone from "./ExploitZone";

type ViewMode = "parsed" | "pdf";

interface ReportViewProps {
  report: Report;
}

export default function ReportView({ report }: ReportViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("parsed");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Reset PDF state when report changes
  useEffect(() => {
    setPdfUrl(null);
    setPdfError(false);
    setViewMode("parsed");
  }, [report.slug]);

  async function handlePdfView() {
    setViewMode("pdf");
    if (pdfUrl) return; // already fetched
    setPdfLoading(true);
    setPdfError(false);
    try {
      const res = await fetch(`/api/pdf/${report.slug}`);
      const data = await res.json();
      if (data.url) {
        setPdfUrl(data.url);
      } else {
        setPdfError(true);
      }
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Report header */}
      <div
        className="px-5 pt-3 pb-3 border-b shrink-0"
        style={{ borderColor: "#1a1a1c", background: "#0a0a0b" }}
      >
        {/* Top row: opponent name + view toggle */}
        <div className="flex items-start justify-between mb-2.5">
          <h1
            className="font-display font-700 text-2xl leading-none"
            style={{ color: "#e8e8ea", letterSpacing: "0.03em" }}
          >
            {report.opponent}
          </h1>

          {/* View toggle */}
          <div
            className="flex rounded overflow-hidden flex-shrink-0"
            style={{ border: "1px solid #1a1a1c" }}
          >
            <button
              onClick={() => setViewMode("parsed")}
              className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={{
                background: viewMode === "parsed" ? "#140406" : "#0f0f11",
                color: viewMode === "parsed" ? "#c5050c" : "#555",
                borderRight: "1px solid #1a1a1c",
              }}
            >
              Analysis
            </button>
            <button
              onClick={handlePdfView}
              className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={{
                background: viewMode === "pdf" ? "#140406" : "#0f0f11",
                color: viewMode === "pdf" ? "#c5050c" : "#555",
              }}
            >
              {pdfLoading ? "..." : "PDF"}
            </button>
          </div>
        </div>

        {/* Meta row: labeled fields */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="label-mono" style={{ color: "#333" }}>Date of Match</span>
            <span className="font-mono text-[11px]" style={{ color: "#888" }}>{report.matchDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="label-mono" style={{ color: "#333" }}>Opp Record</span>
            <span className="font-mono text-[11px]" style={{ color: "#888" }}>{report.record}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="label-mono" style={{ color: "#333" }}>Opp Last Result</span>
            <span className="font-mono text-[11px]" style={{ color: "#888" }}>{report.lastResult}</span>
          </div>
          {report.wisconsinResult && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="label-mono" style={{ color: "#333" }}>vs Wisconsin</span>
              <span
                className="font-display font-600 text-sm px-2 py-0.5 rounded"
                style={{
                  background: report.wisconsinResult.startsWith("W") ? "#0a1a0e" : report.wisconsinResult.startsWith("D") ? "#111108" : "#140406",
                  border: `1px solid ${report.wisconsinResult.startsWith("W") ? "#22c55e33" : report.wisconsinResult.startsWith("D") ? "#f59e0b33" : "#c5050c33"}`,
                  color: report.wisconsinResult.startsWith("W") ? "#22c55e" : report.wisconsinResult.startsWith("D") ? "#f59e0b" : "#c5050c",
                  letterSpacing: "0.05em",
                }}
              >
                {report.wisconsinResult}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "pdf" ? (
          pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="label-mono" style={{ color: "#444" }}>Loading PDF...</span>
            </div>
          ) : pdfError ? (
            <div className="flex items-center justify-center h-full">
              <span className="label-mono" style={{ color: "#c5050c" }}>Failed to load PDF</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={`${report.opponent} Scouting Report PDF`}
              style={{ background: "#fff" }}
            />
          ) : null
        ) : (
          <div className="h-full overflow-y-auto px-5 py-4 space-y-5">
            {/* Overview */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#444" }}>
                  Team Overview
                </span>
              </div>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "#777" }}
              >
                {report.overview}
              </p>
            </section>

            {/* Stats */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#444" }}>
                  Key Metrics
                </span>
              </div>
              <StatGrid stats={report.stats} />
            </section>

            {/* Tactical shape */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#444" }}>
                  Tactical Shape
                </span>
              </div>
              <TacticalBox
                inPossession={report.inPossession}
                outOfPossession={report.outOfPossession}
                formation={report.formation}
              />
            </section>

            {/* Key players */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#444" }}>
                  Key Players
                </span>
                {report.setPieceTargets && (
                  <span
                    className="font-mono text-[9px] ml-2"
                    style={{ color: "#555" }}
                  >
                    Set piece targets:{" "}
                    <span style={{ color: "#c5050c" }}>
                      {report.setPieceTargets.join(", ")}
                    </span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {report.keyPlayers.map((player) => (
                  <PlayerCard key={player.number} player={player} />
                ))}
              </div>
            </section>

            {/* Exploit zones */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#c5050c" }}>
                  Exploit Zones
                </span>
              </div>
              <div className="space-y-2">
                {report.exploitZones.map((zone, i) => (
                  <ExploitZone key={i} zone={zone} index={i} />
                ))}
              </div>
            </section>

            {/* AI Perspective */}
            <section>
              <div className="section-divider mb-3">
                <span className="label-mono" style={{ color: "#444" }}>
                  AI Perspective
                </span>
              </div>
              <div
                className="rounded p-4"
                style={{
                  background: "#0f0f11",
                  border: "1px solid #1a1a1c",
                  borderLeft: "3px solid #c5050c33",
                }}
              >
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: "#666" }}
                >
                  {report.aiPerspective}
                </p>
              </div>
            </section>

            {/* Compiled by */}
            <div className="pb-2">
              <span
                className="font-mono text-[9px] uppercase tracking-widest"
                style={{ color: "#333" }}
              >
                Compiled by {report.compiledBy}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
