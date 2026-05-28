"use client";

import { useMemo } from "react";
import type { PlayerStats } from "@/lib/gameReducer";
import { generateProfile, getDiceSummary } from "@/lib/analysis";

interface GameSummaryModalProps {
  players: { name: string; color: string }[];
  stats: [PlayerStats, PlayerStats];
  winner: 0 | 1;
  onPlayAgain: () => void;
}

export default function GameSummaryModal({
  players,
  stats,
  winner,
  onPlayAgain,
}: GameSummaryModalProps) {
  const profiles = useMemo(
    () => [
      generateProfile(stats[0], winner === 0),
      generateProfile(stats[1], winner === 1),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const diceSummaries = useMemo(
    () => [getDiceSummary(stats[0].diceHistory), getDiceSummary(stats[1].diceHistory)],
    [stats]
  );

  const winnerName = players[winner].name;
  const loserIdx = winner === 0 ? 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-bounce-in">

        {/* ── Winner banner ──────────────────────────────────────────── */}
        <div
          className="rounded-t-3xl px-6 py-8 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${players[winner].color}cc, ${players[winner].color})`,
          }}
        >
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold">{winnerName} Wins!</h2>
          <p className="text-white/80 text-sm mt-1">
            {players[loserIdx].name} kept up a great fight
          </p>
        </div>

        {/* ── Game Statistics ─────────────────────────────────────────── */}
        <section className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3">
            Game Statistics
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase">
                <th className="text-left pb-2 font-medium">Stat</th>
                {players.map((p, i) => (
                  <th key={i} className="text-center pb-2 font-medium">
                    <span
                      className="inline-flex items-center gap-1"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                      {i === winner && " 🏆"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                {
                  label: "🎲 Total Rolls",
                  vals: [stats[0].totalMoves, stats[1].totalMoves],
                  highlight: "lower",
                },
                {
                  label: "🐍 Snakes Hit",
                  vals: [stats[0].snakesHit, stats[1].snakesHit],
                  highlight: "lower",
                },
                {
                  label: "🪜 Ladders Climbed",
                  vals: [stats[0].laddersClimbed, stats[1].laddersClimbed],
                  highlight: "higher",
                },
                {
                  label: "📉 Squares Lost",
                  vals: [
                    stats[0].squaresLostToSnakes,
                    stats[1].squaresLostToSnakes,
                  ],
                  highlight: "lower",
                  fmt: (v: number) => `-${v}`,
                },
                {
                  label: "📈 Squares Gained",
                  vals: [
                    stats[0].squaresGainedFromLadders,
                    stats[1].squaresGainedFromLadders,
                  ],
                  highlight: "higher",
                  fmt: (v: number) => `+${v}`,
                },
                {
                  label: "⚖️ Net from Events",
                  vals: [
                    stats[0].squaresGainedFromLadders -
                      stats[0].squaresLostToSnakes,
                    stats[1].squaresGainedFromLadders -
                      stats[1].squaresLostToSnakes,
                  ],
                  highlight: "higher",
                  fmt: (v: number) => (v >= 0 ? `+${v}` : `${v}`),
                },
                {
                  label: "🎯 Avg Dice Roll",
                  vals: [diceSummaries[0].average, diceSummaries[1].average],
                  highlight: "higher",
                },
              ].map(({ label, vals, highlight, fmt }) => {
                const best =
                  highlight === "higher"
                    ? Math.max(vals[0], vals[1])
                    : Math.min(vals[0], vals[1]);
                return (
                  <tr key={label} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 text-gray-600">{label}</td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={`text-center py-2 font-semibold ${
                          v === best && vals[0] !== vals[1]
                            ? "text-indigo-600"
                            : "text-gray-700"
                        }`}
                      >
                        {fmt ? fmt(v) : v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ── Dice Breakdown ──────────────────────────────────────────── */}
        <section className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">
            Dice Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {players.map((p, i) => (
              <DiceChart key={i} name={p.name} color={p.color} summary={diceSummaries[i]} />
            ))}
          </div>
        </section>

        {/* ── Psychological Analysis ──────────────────────────────────── */}
        <section className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">
            Psychological Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((profile, i) => (
              <ProfileCard
                key={i}
                profile={profile}
                playerName={players[i].name}
                playerColor={players[i].color}
                isWinner={i === winner}
              />
            ))}
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 py-5 text-center">
          <button
            onClick={onPlayAgain}
            className="px-10 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg transition-all active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dice frequency chart ────────────────────────────────────────────────────

function DiceChart({
  name,
  color,
  summary,
}: {
  name: string;
  color: string;
  summary: ReturnType<typeof getDiceSummary>;
}) {
  const maxCount = Math.max(...Object.values(summary.counts), 1);

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-gray-600 truncate">{name}</span>
        <span className="ml-auto text-xs text-gray-400">avg {summary.average}</span>
      </div>

      <div className="flex items-end gap-1 h-14">
        {[1, 2, 3, 4, 5, 6].map((face) => {
          const count = summary.counts[face] ?? 0;
          const heightPct = (count / maxCount) * 100;
          const isMostCommon = face === summary.mostCommon && count > 0;
          return (
            <div key={face} className="flex flex-col items-center flex-1 gap-0.5">
              <span className="text-[9px] text-gray-500 leading-none">{count}</span>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  backgroundColor: isMostCommon ? color : "#e2e8f0",
                  minHeight: count > 0 ? "6px" : "2px",
                }}
              />
              <span className="text-[10px] text-gray-400 leading-none">
                {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][face - 1]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        {summary.total} rolls · most rolled:{" "}
        <span className="font-semibold text-gray-600">{summary.mostCommon}</span>
      </p>
    </div>
  );
}

// ─── Psychological profile card ──────────────────────────────────────────────

function ProfileCard({
  profile,
  playerName,
  playerColor,
  isWinner,
}: {
  profile: ReturnType<typeof generateProfile>;
  playerName: string;
  playerColor: string;
  isWinner: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${profile.bgClass} border-gray-200 flex flex-col gap-3`}>
      {/* Badge / logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl shadow flex items-center justify-center text-2xl bg-white border border-gray-100">
          {profile.emoji}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: playerColor }}
            />
            <span className="text-xs text-gray-500 font-medium">{playerName}</span>
            {isWinner && <span className="text-xs">🏆</span>}
          </div>
          <p className={`font-extrabold text-sm leading-tight ${profile.accentClass}`}>
            {profile.title}
          </p>
          <p className="text-[10px] text-gray-400 italic">{profile.insight}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed">{profile.description}</p>

      {/* Quote */}
      <blockquote className="border-l-2 border-gray-300 pl-3">
        <p className="text-[11px] italic text-gray-500 leading-snug">
          &ldquo;{profile.quote}&rdquo;
        </p>
        <footer className="text-[10px] text-gray-400 mt-1">— {profile.quoteAuthor}</footer>
      </blockquote>
    </div>
  );
}
