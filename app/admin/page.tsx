"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loadGames,
  clearGames,
  getLeaderboard,
  getDiceFrequency,
  type GameRecord,
  type LeaderboardEntry,
} from "@/lib/storage";
import { SNAKES, LADDERS } from "@/lib/constants";

const ADMIN_PIN =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_PIN
    ? process.env.NEXT_PUBLIC_ADMIN_PIN
    : "1234";

// ── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (pin === ADMIN_PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1400);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #0f2419 0%, #1a3a28 50%, #0a1a12 100%)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div className="text-5xl">🛡️</div>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-white">Admin Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Enter your PIN to continue
          </p>
        </div>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          placeholder="PIN"
          maxLength={20}
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-center text-white text-xl font-bold tracking-widest outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: `1.5px solid ${error ? "#f43f5e" : "rgba(255,255,255,0.12)"}`,
            boxShadow: error ? "0 0 0 3px rgba(244,63,94,0.2)" : "none",
          }}
        />
        {error && (
          <p className="text-sm font-semibold" style={{ color: "#f43f5e" }}>
            Wrong PIN — try again
          </p>
        )}
        <button
          onClick={tryUnlock}
          className="w-full py-3 rounded-xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
        >
          Unlock
        </button>
        <button onClick={() => router.push("/")} className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          ← Back to home
        </button>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </p>
      <p className="text-2xl font-extrabold" style={{ color: accent ?? "rgba(255,255,255,0.9)" }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
            {d.value > 0 ? d.value : ""}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}px`,
              background: color,
              opacity: 0.85,
            }}
          />
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
      {children}
    </h2>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard() {
  const router = useRouter();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const reload = useCallback(() => setGames(loadGames()), []);
  useEffect(() => reload(), [reload]);

  const leaders = getLeaderboard(games);
  const diceFreq = getDiceFrequency(games);
  const totalRolls = Object.values(diceFreq).reduce((a, b) => a + b, 0);

  const pvpCount = games.filter((g) => g.mode === "pvp").length;
  const pvcCount = games.filter((g) => g.mode === "pvc").length;
  const avgTurns =
    games.length > 0 ? Math.round(games.reduce((a, g) => a + g.duration, 0) / games.length) : 0;

  // Snake/ladder hit totals
  const totalSnakes = games.reduce((a, g) => a + g.players[0].stats.snakesHit + g.players[1].stats.snakesHit, 0);
  const totalLadders = games.reduce((a, g) => a + g.players[0].stats.laddersClimbed + g.players[1].stats.laddersClimbed, 0);

  // Per-square snake/ladder frequency
  const snakeSquares = Object.entries(SNAKES).map(([head, tail]) => {
    const count = games.reduce((acc, g) => {
      // Approximate: can't tell which snake without richer data; show static info
      void g;
      return acc;
    }, 0);
    return { head: Number(head), tail: Number(tail), count };
  });
  void snakeSquares;

  const filteredGames = [...games]
    .reverse()
    .filter((g) =>
      search
        ? g.players[0].name.toLowerCase().includes(search.toLowerCase()) ||
          g.players[1].name.toLowerCase().includes(search.toLowerCase())
        : true
    );

  function handleExport() {
    const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snl-games-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearGames();
    reload();
    setConfirmClear(false);
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
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
        <button onClick={() => router.push("/")} className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
          ← Home
        </button>
        <h1 className="font-extrabold text-lg" style={{ color: "rgba(255,255,255,0.92)" }}>
          🛡️ Admin Dashboard
        </h1>
        <button onClick={() => router.push("/leaderboard")} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
          Leaderboard →
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Overview cards */}
        <section>
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Games" value={games.length} accent="#22c55e" />
            <StatCard label="Unique Players" value={leaders.length} accent="#a5b4fc" />
            <StatCard label="Avg Turns" value={avgTurns} sub="per game" />
            <StatCard label="PvP / vs CPU" value={`${pvpCount} / ${pvcCount}`} />
            <StatCard label="Snakes Hit" value={totalSnakes} accent="#f43f5e" />
            <StatCard label="Ladders Climbed" value={totalLadders} accent="#fbbf24" />
          </div>
        </section>

        {/* Dice Frequency */}
        <section>
          <SectionTitle>Dice Frequency ({totalRolls.toLocaleString()} total rolls)</SectionTitle>
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <BarChart
              color="linear-gradient(to top, #6366f1, #8b5cf6)"
              data={[1, 2, 3, 4, 5, 6].map((n) => ({
                label: `🎲${n}`,
                value: diceFreq[n] ?? 0,
              }))}
            />
          </div>
        </section>

        {/* Player Leaderboard */}
        <section>
          <SectionTitle>Player Leaderboard</SectionTitle>
          {leaders.length === 0 ? (
            <EmptyCard text="No game data yet." />
          ) : (
            <div className="rounded-2xl overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["#", "Player", "W / L", "Win %", "Games", "🐍 Snakes", "🪜 Ladders", "Avg Turns"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((e, i) => (
                    <tr key={e.name} style={{ borderBottom: i < leaders.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td className="px-3 py-2.5 font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>{i + 1}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{e.name}</td>
                      <td className="px-3 py-2.5">
                        <span style={{ color: "#86efac" }}>{e.wins}W</span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}> / </span>
                        <span style={{ color: "#fca5a5" }}>{e.losses}L</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <WinRateBar rate={e.winRate} />
                      </td>
                      <td className="px-3 py-2.5" style={{ color: "rgba(255,255,255,0.55)" }}>{e.gamesPlayed}</td>
                      <td className="px-3 py-2.5" style={{ color: "#fca5a5" }}>{e.totalSnakes}</td>
                      <td className="px-3 py-2.5" style={{ color: "#fbbf24" }}>{e.totalLadders}</td>
                      <td className="px-3 py-2.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {e.gamesPlayed > 0 ? Math.round(e.totalMoves / e.gamesPlayed) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Snake & Ladder board reference */}
        <section>
          <SectionTitle>Board Reference</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#fca5a5" }}>🐍 Snakes</p>
              <div className="flex flex-col gap-1">
                {Object.entries(SNAKES).map(([head, tail]) => (
                  <div key={head} className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Square {head}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                    <span style={{ color: "#fca5a5" }}>Square {tail}</span>
                    <span className="font-bold" style={{ color: "#f43f5e" }}>−{Number(head) - Number(tail)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#fde68a" }}>🪜 Ladders</p>
              <div className="flex flex-col gap-1">
                {Object.entries(LADDERS).map(([base, top]) => (
                  <div key={base} className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Square {base}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                    <span style={{ color: "#fde68a" }}>Square {top}</span>
                    <span className="font-bold" style={{ color: "#22c55e" }}>+{Number(top) - Number(base)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Games Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>All Games ({filteredGames.length})</SectionTitle>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player…"
              className="text-xs px-3 py-1.5 rounded-full outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
                width: 150,
              }}
            />
          </div>
          {filteredGames.length === 0 ? (
            <EmptyCard text="No games match." />
          ) : (
            <div className="rounded-2xl overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Date", "Mode", "P1", "P2", "Winner", "Turns", "Snakes", "Ladders"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.slice(0, 100).map((g, i) => {
                    const totalS = g.players[0].stats.snakesHit + g.players[1].stats.snakesHit;
                    const totalL = g.players[0].stats.laddersClimbed + g.players[1].stats.laddersClimbed;
                    return (
                      <tr key={g.id} style={{ borderBottom: i < Math.min(filteredGames.length, 100) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td className="px-3 py-2" style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{fmt(g.date)}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: g.mode === "pvc" ? "rgba(99,102,241,0.2)" : "rgba(244,63,94,0.2)", color: g.mode === "pvc" ? "#a5b4fc" : "#fda4af" }}>
                            {g.mode === "pvc" ? "CPU" : "PvP"}
                          </span>
                        </td>
                        <td className="px-3 py-2" style={{ color: g.winner === 0 ? "#86efac" : "rgba(255,255,255,0.55)" }}>{g.players[0].name}</td>
                        <td className="px-3 py-2" style={{ color: g.winner === 1 ? "#86efac" : "rgba(255,255,255,0.55)" }}>{g.players[1].name}</td>
                        <td className="px-3 py-2 font-semibold" style={{ color: "#86efac" }}>🏆 {g.players[g.winner].name}</td>
                        <td className="px-3 py-2" style={{ color: "rgba(255,255,255,0.5)" }}>{g.duration}</td>
                        <td className="px-3 py-2" style={{ color: "#fca5a5" }}>{totalS}</td>
                        <td className="px-3 py-2" style={{ color: "#fde68a" }}>{totalL}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredGames.length > 100 && (
                <p className="text-center text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Showing 100 of {filteredGames.length} games
                </p>
              )}
            </div>
          )}
        </section>

        {/* Data management */}
        <section>
          <SectionTitle>Data Management</SectionTitle>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExport}
              disabled={games.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              ⬇ Export JSON
            </button>
            <button
              onClick={handleClear}
              disabled={games.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{
                background: confirmClear ? "rgba(244,63,94,0.3)" : "rgba(244,63,94,0.1)",
                color: "#fca5a5",
                border: `1px solid ${confirmClear ? "rgba(244,63,94,0.5)" : "rgba(244,63,94,0.2)"}`,
              }}
            >
              {confirmClear ? "⚠️ Confirm — delete all?" : "🗑 Clear All Data"}
            </button>
            {confirmClear && (
              <button
                onClick={() => setConfirmClear(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Data stored in browser localStorage · Default PIN: 1234 · Set NEXT_PUBLIC_ADMIN_PIN to change
          </p>
        </section>
      </main>
    </div>
  );
}

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 50 ? "#22c55e" : "#f43f5e" }} />
      </div>
      <span className="text-xs font-semibold" style={{ color: rate >= 50 ? "#86efac" : "#fca5a5" }}>{rate}%</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl px-6 py-6 text-center text-sm"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
      {text}
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}
