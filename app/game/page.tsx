"use client";

import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { gameReducer, initialState } from "@/lib/gameReducer";
import GameBoard from "@/components/GameBoard";
import DiceRoller from "@/components/DiceRoller";
import PlayerPanel from "@/components/PlayerPanel";
import GameSummaryModal from "@/components/GameSummaryModal";
import {
  playDiceRoll,
  playStep,
  playSnake,
  playLadder,
  playWin,
  startBgMusic,
  stopBgMusic,
  setMuted,
  isMuted,
  setBgMuted,
  isBgMuted,
  setSoundProfile,
  type SoundProfile,
} from "@/lib/sounds";

type Speed = "slow" | "medium" | "fast";
import type { TokenEmotion } from "@/components/GameBoard";
import { saveGame } from "@/lib/storage";

const PLAYER_COLORS = ["#6366f1", "#f43f5e"];

function GameScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") as "pvp" | "pvc") || "pvp";
  const p1 = searchParams.get("p1") || "Player 1";
  const p2 = searchParams.get("p2") || (mode === "pvc" ? "Computer" : "Player 2");
  const profile = (searchParams.get("profile") as SoundProfile) || "classic";

  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    mode,
    phase: "playing",
    players: [
      { name: p1, position: 0 },
      { name: p2, position: 0 },
    ],
  });

  // Displayed positions animate independently from game state
  const [displayPos, setDisplayPos] = useState<[number, number]>([0, 0]);
  const [animating, setAnimating] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [highlight, setHighlight] = useState<{ square: number; type: "snake" | "ladder" } | null>(null);
  const [muted, setMutedState] = useState(false);
  const [bgMutedLocal, setBgMutedLocal] = useState(false);
  const [speed, setSpeed] = useState<Speed>("fast");
  const stepMsRef = useRef(120);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const computerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgStartedRef = useRef(false);

  // Set sound profile once on mount
  useEffect(() => { setSoundProfile(profile); }, [profile]);

  // Keep stepMsRef current with speed state
  useEffect(() => {
    stepMsRef.current = speed === "fast" ? 120 : speed === "medium" ? 200 : 320;
  }, [speed]);

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }

  function toggleBgMute() {
    const next = !bgMutedLocal;
    setBgMutedLocal(next);
    setBgMuted(next);
  }

  // Start background music on first interaction
  function ensureBgMusic() {
    if (!bgStartedRef.current && !isMuted()) {
      bgStartedRef.current = true;
      startBgMusic();
    }
  }

  // Stop bg music when leaving the page
  useEffect(() => () => stopBgMusic(), []);

  // Step-by-step movement animation triggered by each roll
  useEffect(() => {
    if (
      state.lastMover === null ||
      state.moveFromPosition === null ||
      state.preEventPosition === null
    ) return;

    const mover = state.lastMover;
    const from = state.moveFromPosition;
    const pre = state.preEventPosition;
    const final = state.players[mover].position;

    // Clear previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimating(true);

    // Build step list (1 square at a time, wraps correctly via board numbering)
    const steps: number[] = [];
    if (pre > from) {
      for (let p = from + 1; p <= pre; p++) steps.push(p);
    }
    // pre < from means over-100 bounce-back — no animation needed (stays)

    const stepMs = stepMsRef.current;

    // Animate each step
    steps.forEach((pos, i) => {
      const t = setTimeout(() => {
        setDisplayPos((prev) => {
          const next = [...prev] as [number, number];
          next[mover] = pos;
          return next;
        });
        playStep();
      }, i * stepMs);
      timersRef.current.push(t);
    });

    const afterSteps = Math.max(steps.length * stepMs, 80);

    if (final !== pre) {
      // Capture event info for highlight (closure-safe)
      const eventType = state.lastEvent as "snake" | "ladder";
      const eventSquare = pre;
      // Funny snake gets extended timing so the swallow + prrrr animation plays in full
      const funnySnake = profile === "funny" && eventType === "snake";

      // Show glow effect on the snake/ladder as soon as steps complete
      const tHL = setTimeout(() => {
        setHighlight({ square: eventSquare, type: eventType });
        if (eventType === "snake") playSnake();
        else playLadder();
      }, afterSteps + 40);

      // Jump to final position (after swallow for funny snake, sooner otherwise)
      const t1 = setTimeout(() => {
        setDisplayPos((prev) => {
          const next = [...prev] as [number, number];
          next[mover] = final;
          return next;
        });
      }, afterSteps + (funnySnake ? 1050 : 380));

      // Clear highlight and finish animation
      const t2 = setTimeout(() => {
        setHighlight(null);
        setAnimating(false);
      }, afterSteps + (funnySnake ? 2800 : 780));

      timersRef.current.push(tHL, t1, t2);
    } else {
      const t = setTimeout(() => setAnimating(false), afterSteps + 120);
      timersRef.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rollId]);

  // Win sound + persist result
  useEffect(() => {
    if (state.phase === "won" && state.winner !== null) {
      playWin();
      saveGame({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: state.mode,
        duration: state.stats[0].totalMoves + state.stats[1].totalMoves,
        players: [
          { name: state.players[0].name, stats: state.stats[0] },
          { name: state.players[1].name, stats: state.stats[1] },
        ],
        winner: state.winner,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const doRoll = useCallback(() => {
    if (rolling || animating || state.phase !== "playing") return;
    ensureBgMusic();
    playDiceRoll();
    const diceValue = Math.floor(Math.random() * 6) + 1;
    setRolling(true);
    setTimeout(() => {
      dispatch({ type: "ROLL", diceValue });
      setRolling(false);
    }, 650);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, animating, state.phase]);

  // Computer auto-roll (waits for animation to finish)
  useEffect(() => {
    if (
      state.mode !== "pvc" ||
      state.phase !== "playing" ||
      state.currentTurn !== 1 ||
      rolling ||
      animating
    ) return;

    if (computerTimerRef.current) clearTimeout(computerTimerRef.current);
    const autoDelay = speed === "slow" ? 3200 : speed === "medium" ? 2000 : 1200;
    computerTimerRef.current = setTimeout(doRoll, autoDelay);
    return () => { if (computerTimerRef.current) clearTimeout(computerTimerRef.current); };
  }, [state.mode, state.phase, state.currentTurn, rolling, animating, doRoll, speed]);

  // Event toast
  let eventMsg: string | null = null;
  if (state.lastEvent === "snake")
    eventMsg = `🐍 Snake! Slid down ${Math.abs(state.eventDelta)} squares`;
  else if (state.lastEvent === "ladder")
    eventMsg = `🪜 Ladder! Climbed up ${state.eventDelta} squares`;

  const isComputerTurn = state.mode === "pvc" && state.currentTurn === 1;
  const rollDisabled = isComputerTurn || state.phase !== "playing" || animating;

  const boardPlayers = state.players.map((p, i) => ({
    name: p.name,
    position: displayPos[i],
    color: PLAYER_COLORS[i],
    isActive: state.currentTurn === i && state.phase === "playing",
  }));

  // Derive token emotions and snake-eating square for the funny profile
  const mover = state.lastMover ?? 0;
  const tokenEmotions: [TokenEmotion, TokenEmotion] = highlight
    ? mover === 0
      ? [highlight.type === "ladder" ? "happy" : "scared", "normal"]
      : ["normal", highlight.type === "ladder" ? "happy" : "scared"]
    : ["normal", "normal"];
  const snakeEatingSquare = highlight?.type === "snake" ? highlight.square : null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0f2419 0%, #1a3a28 50%, #0a1a12 100%)" }}
    >
      {/* Header */}
      <header
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          ← New Game
        </button>
        <h1
          className="font-extrabold text-lg tracking-tight"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          🐍 Snake &amp; Ladder 🪜
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBgMute}
            className="text-lg transition-opacity hover:opacity-80"
            title={bgMutedLocal ? "Music off" : "Music on"}
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {bgMutedLocal ? "🔕" : "🎵"}
          </button>
          <button
            onClick={toggleMute}
            className="text-xl transition-opacity hover:opacity-80"
            title={muted ? "Unmute" : "Mute all"}
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col lg:flex-row gap-4 p-4 max-w-5xl mx-auto w-full">
        {/* Board */}
        <div className="flex-1 min-w-0">
          <GameBoard
            players={boardPlayers}
            highlight={highlight}
            tokenEmotions={profile === "funny" ? tokenEmotions : undefined}
            snakeEatingSquare={profile === "funny" ? snakeEatingSquare : undefined}
            playerPositions={displayPos}
            rollId={state.rollId}
            soundProfile={profile}
          />
        </div>

        {/* Side panel */}
        <div className="lg:w-56 flex flex-row lg:flex-col gap-3">
          {/* Player cards */}
          <div className="flex flex-col gap-2 flex-1 lg:flex-none">
            {state.players.map((p, i) => (
              <PlayerPanel
                key={i}
                name={p.name}
                position={displayPos[i]}
                color={PLAYER_COLORS[i]}
                isActive={state.currentTurn === i && state.phase === "playing"}
                isComputer={state.mode === "pvc" && i === 1}
              />
            ))}
          </div>

          {/* Dice card */}
          <div
            className="flex flex-col items-center gap-3 rounded-2xl p-4 flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <DiceRoller
              value={state.diceValue}
              rolling={rolling}
              disabled={rollDisabled}
              onRoll={doRoll}
            />

            {/* Speed selector */}
            <div className="flex gap-1">
              {(["slow", "medium", "fast"] as Speed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="px-2 py-1 rounded-lg text-xs capitalize transition-all"
                  style={{
                    background: speed === s ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
                    color: speed === s ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${speed === s ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {s === "slow" ? "🐢" : s === "medium" ? "🚶" : "⚡"} {s}
                </button>
              ))}
            </div>

            {isComputerTurn && !rolling && !animating && (
              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                Computer is thinking…
              </p>
            )}

            {animating && (
              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                Moving…
              </p>
            )}

            {eventMsg && (
              <div
                key={state.rollId}
                className="text-xs font-bold text-center px-3 py-2 rounded-xl animate-toast"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                {eventMsg}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Summary modal */}
      {state.phase === "won" && state.winner !== null && !animating && (
        <GameSummaryModal
          players={state.players.map((p, i) => ({ name: p.name, color: PLAYER_COLORS[i] }))}
          stats={state.stats}
          winner={state.winner}
          onPlayAgain={() => router.push("/")}
        />
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)" }}>
          Loading…
        </div>
      }
    >
      <GameScreen />
    </Suspense>
  );
}
