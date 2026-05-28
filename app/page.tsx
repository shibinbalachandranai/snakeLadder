"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"pvp" | "pvc">("pvp");
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");

  function handleStart() {
    const name1 = p1Name.trim() || "Player 1";
    const name2 = mode === "pvc" ? "Computer" : p2Name.trim() || "Player 2";
    const params = new URLSearchParams({ mode, p1: name1, p2: name2 });
    router.push(`/game?${params.toString()}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #0f2419 0%, #1a3a28 50%, #0a1a12 100%)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header banner */}
        <div
          className="px-8 pt-10 pb-8 text-center"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-6xl mb-3 leading-none">🐍🪜</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Snake &amp; Ladder
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Classic board game — reach 100 to win
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Mode selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              Game Mode
            </label>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {(["pvp", "pvc"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: mode === m ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                    color: mode === m ? "white" : "rgba(255,255,255,0.5)",
                    boxShadow: mode === m ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                  }}
                >
                  {m === "pvp" ? "👥 Two Players" : "🤖 vs Computer"}
                </button>
              ))}
            </div>
          </div>

          {/* Name inputs */}
          <div className="flex flex-col gap-3">
            <InputField
              label="Player 1 Name"
              value={p1Name}
              onChange={setP1Name}
              placeholder="Player 1"
              color="#6366f1"
            />
            {mode === "pvp" ? (
              <InputField
                label="Player 2 Name"
                value={p2Name}
                onChange={setP2Name}
                placeholder="Player 2"
                color="#f43f5e"
              />
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
              >
                <span>🤖</span>
                <span>Computer will auto-roll its turns</span>
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 6px 20px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            Start Game →
          </button>

          {/* Nav links */}
          <div className="flex justify-center gap-4 pt-1">
            <Link
              href="/leaderboard"
              className="text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              🏆 Leaderboard
            </Link>
            <Link
              href="/admin"
              className="text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              🛡️ Admin
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 pb-4 text-center">
        <a
          href="https://shibinbalachandran.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Made with ❤️ by Shibin Balachandran
        </a>
      </footer>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  color: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        className="w-full rounded-xl px-3 py-2.5 text-sm font-medium placeholder-white/20 text-white outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: `1.5px solid rgba(255,255,255,0.1)`,
          boxShadow: `0 0 0 0px ${color}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = `1.5px solid ${color}88`;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${color}22`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = `1.5px solid rgba(255,255,255,0.1)`;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
