"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#0a0a0b" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1a1a1c 1px, transparent 1px), linear-gradient(90deg, #1a1a1c 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.25,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 relative">
            <Image src="/logo.png" alt="Wisconsin W" fill className="object-contain" priority />
          </div>
          <div className="text-center">
            <div className="flex items-baseline gap-2 justify-center">
              <span
                className="font-display font-700 text-3xl"
                style={{ color: "#c5050c", letterSpacing: "0.06em" }}
              >
                BADGER
              </span>
              <span
                className="font-display font-600 text-3xl"
                style={{ color: "#e8e8ea", letterSpacing: "0.06em" }}
              >
                IQ
              </span>
            </div>
            <p className="label-mono mt-1" style={{ color: "#555" }}>
              Wisconsin Badgers — Division I Men&#39;s Soccer
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="w-full rounded p-6 space-y-4"
          style={{ background: "#0f0f11", border: "1px solid #1a1a1c" }}
        >
          <div className="label-mono mb-5" style={{ color: "#444" }}>
            Authenticate
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded font-mono text-sm transition-colors"
            style={{
              background: "#0a0a0b",
              border: "1px solid #1a1a1c",
              color: "#e8e8ea",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#c5050c33";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1c";
              (e.currentTarget as HTMLElement).style.color = "#e8e8ea";
            }}
          >
            {/* Google icon */}
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
              <path d="M6.3 14.7l7 5.1C15.1 16.3 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.3 4.3-17.7 11.7z" fill="#FF3D00"/>
              <path d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.7 35.9 27 37 24 37c-5.9 0-10.9-3.9-12.7-9.3l-7 5.4C8 40.5 15.4 45 24 45z" fill="#4CAF50"/>
              <path d="M44.5 20H24v8.5h11.8c-.9 2.5-2.6 4.6-4.9 6l6.6 5.6C41.5 36.9 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
            </svg>
            Sign in with Google
          </button>

          <p className="font-mono text-[9px] text-center mt-2" style={{ color: "#4a4a4a" }}>
            Access restricted to authorized @wisc.edu accounts
          </p>
        </div>

        <p className="label-mono" style={{ color: "#444" }}>
          Internal Use Only
        </p>
      </div>
    </div>
  );
}
