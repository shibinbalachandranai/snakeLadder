"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadGames, getLeaderboard, type GameRecord, type LeaderboardEntry } from "@/lib/storage";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameRecord[]>([]);

  useEffect(() => {
    setGames(loadGames());
  }, []);

  const leaders = getLeaderboard(games);
  const recent = [...games].reverse().slice(0, 15);

  function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0f2419 0%, #1a3a28 50%, #0a1a12 100%)" }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          ← Home
        </button>
        <h1 className="font-extrabold text-lg" style={{ color: "rgba(255,255,255,0.92)" }}>
          🏆 Leaderboard
        </h1>
        <button
          onClick={() => router.push("/admin")}
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
        >
          Admin →
        </button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Top Players */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Top Players
          </h2>
          {leaders.length === 0 ? (
            <Empty text="No games played yet — play a game to appear here!" />
          ) : (
            <div className="flex flex-col gap-2">
              {leaders.slice(0, 10).map((entry, i) => (
                <LeaderRow key={entry.name} entry={entry} rank={i} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Games */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Recent Games
          </h2>
          {recent.length === 0 ? (
            <Empty text="Games will appear here after you play." />
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Date", "Mode", "Winner", "Turns"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((g, i) => (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: i < recent.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <td className="px-4 py-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {fmt(g.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: g.mode === "pvc" ? "rgba(99,102,241,0.2)" : "rgba(244,63,94,0.2)",
                            color: g.mode === "pvc" ? "#a5b4fc" : "#fda4af",
                          }}
                        >
                          {g.mode === "pvc" ? "vs CPU" : "PvP"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                        🏆 {g.players[g.winner].name}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {g.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Play button */}
        <button
          onClick={() => router.push("/")}
          className="self-center px-8 py-3 rounded-full font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
          }}
        >
          🎲 Play Now
        </button>
      </main>
    </div>
  );
}

function LeaderRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTop = rank < 3;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: isTop ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isTop ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
      }}
    >
      <span className="text-xl w-7 text-center">{MEDAL[rank] ?? `${rank + 1}`}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
          {entry.name}
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? "s" : ""} · 🐍×{entry.totalSnakes} · 🪜×{entry.totalLadders}
        </p>
      </div>
      <div className="text-right">
        <p className="font-extrabold text-lg leading-none" style={{ color: "#22c55e" }}>
          {entry.wins}W
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          {entry.winRate}%
        </p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl px-6 py-8 text-center text-sm"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
    >
      {text}
    </div>
  );
}
