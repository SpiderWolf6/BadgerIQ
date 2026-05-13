"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("ACCESS DENIED");
      setLoading(false);
    }
  }

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
            <p className="label-mono mt-1" style={{ color: "#333" }}>
              Scout Intel / Restricted Access
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="label-mono block" style={{ color: "#333" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-3 py-2 rounded font-mono text-sm outline-none transition-colors"
                style={{
                  background: "#0a0a0b",
                  border: "1px solid #1a1a1c",
                  color: "#e8e8ea",
                  caretColor: "#c5050c",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c5050c33")}
                onBlur={(e) => (e.target.style.borderColor = "#1a1a1c")}
              />
            </div>

            <div className="space-y-1">
              <label className="label-mono block" style={{ color: "#333" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded font-mono text-sm outline-none transition-colors"
                style={{
                  background: "#0a0a0b",
                  border: "1px solid #1a1a1c",
                  color: "#e8e8ea",
                  caretColor: "#c5050c",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c5050c33")}
                onBlur={(e) => (e.target.style.borderColor = "#1a1a1c")}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{ background: "#140406", border: "1px solid #c5050c33" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#c5050c" }}
                />
                <span className="label-mono" style={{ color: "#c5050c" }}>
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-display font-600 text-sm tracking-widest transition-colors mt-2"
              style={{
                background: loading ? "#0f0f11" : "#c5050c",
                color: loading ? "#444" : "#fff",
                border: "1px solid",
                borderColor: loading ? "#1a1a1c" : "#c5050c",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.08em",
              }}
            >
              {loading ? "AUTHENTICATING..." : "ENTER"}
            </button>
          </form>
        </div>

        <p className="label-mono" style={{ color: "#222" }}>
          Wisconsin Badgers Athletics — Internal Use Only
        </p>
      </div>
    </div>
  );
}
