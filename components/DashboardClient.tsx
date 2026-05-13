"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ReportView from "@/components/ReportView";
import { Report } from "@/types/report";

interface Props {
  reports: Report[];
}

export default function DashboardClient({ reports }: Props) {
  const [activeSlug, setActiveSlug] = useState(reports[0]?.slug ?? "");
  const [activeTab, setActiveTab] = useState<"reports" | "comparison" | "players" | "aichat">("reports");

  const activeReport = reports.find((r) => r.slug === activeSlug) ?? reports[0];

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#0a0a0b" }}
    >
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          reports={reports}
          activeSlug={activeSlug}
          onSelect={setActiveSlug}
        />

        <main className="flex-1 overflow-hidden">
          {activeReport ? (
            <ReportView report={activeReport} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "#333" }}
              >
                Select a report
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
