"use client";

/**
 * DashboardClient — root layout for the main app shell.
 *
 * Renders the Topbar and switches between two main views:
 *  - Reports: sidebar + report viewer (scouting PDFs from Supabase)
 *  - Stats Corner: season stats and training analytics
 *
 * Each view has its own season toggle (Reports: Fall 25 / Fall 26,
 * Stats Corner: Spring 26 / Fall 26). Both selections live here so they
 * survive switching between top-level tabs and drive the Topbar indicator.
 *
 * Players and AI Chat tabs exist in the nav but are disabled (coming soon).
 */

import { useState } from "react";
import Topbar, { TopbarTab } from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ReportView from "@/components/ReportView";
import ComingSoon from "@/components/ComingSoon";
import StatsCorner from "@/components/stats/StatsCorner";
import { Report } from "@/types/report";
import {
  REPORT_SEASONS, ReportSeason, DEFAULT_REPORT_SEASON,
  STATS_SEASONS, StatsSeason, DEFAULT_STATS_SEASON,
} from "@/lib/seasons";

interface Props {
  reportsBySeason: Record<ReportSeason, Report[]>;
}

export default function DashboardClient({ reportsBySeason }: Props) {
  const [activeTab, setActiveTab]       = useState<TopbarTab>("reports");
  const [reportSeason, setReportSeason] = useState<ReportSeason>(DEFAULT_REPORT_SEASON);
  const [statsSeason, setStatsSeason]   = useState<StatsSeason>(DEFAULT_STATS_SEASON);

  const reports = reportsBySeason[reportSeason] ?? [];
  const [activeSlug, setActiveSlug] = useState(reports[0]?.slug ?? "");

  const activeReport = reports.find((r) => r.slug === activeSlug) ?? reports[0];

  function handleReportSeasonChange(season: ReportSeason) {
    setReportSeason(season);
    // jump to the first report of the new season
    setActiveSlug(reportsBySeason[season]?.[0]?.slug ?? "");
  }

  const seasonLabel = activeTab === "stats"
    ? STATS_SEASONS[statsSeason].fullLabel
    : REPORT_SEASONS[reportSeason].fullLabel;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#0a0a0b" }}>
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} seasonLabel={seasonLabel} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar only visible on the Reports tab */}
        {activeTab === "reports" && (
          <Sidebar
            reports={reports}
            activeSlug={activeSlug}
            onSelect={setActiveSlug}
            season={reportSeason}
            onSeasonChange={handleReportSeasonChange}
          />
        )}

        <main className="flex-1 overflow-hidden">
          {activeTab === "reports" && (
            !REPORT_SEASONS[reportSeason].available ? (
              <ComingSoon title={`${REPORT_SEASONS[reportSeason].fullLabel} Reports`} />
            ) : activeReport ? (
              <ReportView report={activeReport} season={reportSeason} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
                  Select a report
                </span>
              </div>
            )
          )}
          {activeTab === "stats" && (
            <StatsCorner season={statsSeason} onSeasonChange={setStatsSeason} />
          )}
        </main>
      </div>
    </div>
  );
}
