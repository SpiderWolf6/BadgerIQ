"use client";

/**
 * DashboardClient — root layout for the main app shell.
 *
 * Renders the Topbar and switches between two main views:
 *  - Reports: sidebar + report viewer (scouting PDFs from Supabase)
 *  - Stats Corner: season stats and training analytics
 *
 * Players and AI Chat tabs exist in the nav but are disabled (coming soon).
 */

import { useState } from "react";
import Topbar, { TopbarTab } from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ReportView from "@/components/ReportView";
import StatsCorner from "@/components/stats/StatsCorner";
import { Report } from "@/types/report";

interface Props {
  reports: Report[];
}

export default function DashboardClient({ reports }: Props) {
  const [activeSlug, setActiveSlug] = useState(reports[0]?.slug ?? "");
  const [activeTab, setActiveTab]   = useState<TopbarTab>("reports");

  const activeReport = reports.find((r) => r.slug === activeSlug) ?? reports[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#0a0a0b" }}>
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar only visible on the Reports tab */}
        {activeTab === "reports" && (
          <Sidebar reports={reports} activeSlug={activeSlug} onSelect={setActiveSlug} />
        )}

        <main className="flex-1 overflow-hidden">
          {activeTab === "reports" && (
            activeReport ? (
              <ReportView report={activeReport} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
                  Select a report
                </span>
              </div>
            )
          )}
          {activeTab === "stats" && <StatsCorner />}
        </main>
      </div>
    </div>
  );
}
