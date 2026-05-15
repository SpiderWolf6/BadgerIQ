"use client";

import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export type TopbarTab = "reports" | "stats" | "players" | "aichat";

interface TopbarProps {
  activeTab: TopbarTab;
  onTabChange: (tab: TopbarTab) => void;
}

export default function Topbar({ activeTab, onTabChange }: TopbarProps) {
  const [toast, setToast] = useState(false);
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  function handleComingSoon() {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  const tabs: { id: TopbarTab; label: string; disabled: boolean }[] = [
    { id: "reports", label: "Reports", disabled: false },
    { id: "stats", label: "Stats Corner", disabled: false },
    { id: "players", label: "Players", disabled: true },
    { id: "aichat", label: "AI Chat", disabled: true },
  ];

  return (
    <>
      <header
        className="flex items-center h-12 px-4 border-b shrink-0 z-20 relative"
        style={{ background: "#0d0d0e", borderColor: "#1a1a1c" }}
      >
        {/* Logo + brand */}
        <div className="flex items-center gap-2.5 mr-6">
          <div className="w-7 h-7 relative flex-shrink-0">
            <Image src="/logo.png" alt="Wisconsin Badgers W" fill className="object-contain" priority />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-700 text-lg leading-none" style={{ color: "#c5050c", letterSpacing: "0.04em" }}>
              BADGER
            </span>
            <span className="font-display font-600 text-lg leading-none" style={{ color: "#e8e8ea", letterSpacing: "0.04em" }}>
              IQ
            </span>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.disabled ? handleComingSoon() : onTabChange(tab.id)}
              className="relative px-3 py-1.5 font-mono text-[12px] uppercase tracking-widest transition-colors"
              style={{
                color: tab.disabled ? "#555" : activeTab === tab.id ? "#e8e8ea" : "#666",
                cursor: tab.disabled ? "not-allowed" : "pointer",
              }}
            >
              {tab.label}
              {tab.disabled && <span className="ml-1 font-mono text-[12px]" style={{ color: "#555" }}>soon</span>}
              {!tab.disabled && activeTab === tab.id && (
                <span className="absolute bottom-0 left-3 right-3 h-px" style={{ background: "#c5050c" }} />
              )}
            </button>
          ))}
        </nav>

        {/* Season indicator + logout */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#c5050c" }} />
            <span className="font-mono text-[13px] uppercase tracking-widest" style={{ color: "#444" }}>Fall 2025</span>
          </div>
          {firstName && (
            <span className="font-mono text-[13px]" style={{ color: "#444" }}>
              Hello, {firstName}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="font-mono text-[13px] uppercase tracking-widest transition-colors px-2 py-1 rounded"
            style={{ color: "#555", border: "1px solid #1a1a1c" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#c5050c"; (e.target as HTMLElement).style.borderColor = "#c5050c33"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#555"; (e.target as HTMLElement).style.borderColor = "#1a1a1c"; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded font-mono text-[13px] uppercase tracking-widest"
          style={{ background: "#140406", border: "1px solid #c5050c33", color: "#888" }}>
          Coming soon
        </div>
      )}
    </>
  );
}
