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
} from "@/lib/sounds";

const PLAYER_COLORS = ["#6366f1", "#f43f5e"];
const STEP_MS = 120; // ms per square when animating

function GameScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") as "pvp" | "pvc") || "pvp";
  const p1 = searchParams.get("p1") || "Player 1";
  const p2 = searchParams.get("p2") || (mode === "pvc" ? "Computer" : "Player 2");

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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const computerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgStartedRef = useRef(false);

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
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

    // Animate each step
    steps.forEach((pos, i) => {
      const t = setTimeout(() => {
        setDisplayPos((prev) => {
          const next = [...prev] as [number, number];
          next[mover] = pos;
          return next;
        });
        playStep();
      }, i * STEP_MS);
      timersRef.current.push(t);
    });

    const afterSteps = Math.max(steps.length * STEP_MS, 80);

    if (final !== pre) {
      // Capture event info for highlight (closure-safe)
      const eventType = state.lastEvent as "snake" | "ladder";
      const eventSquare = pre;

      // Show glow effect on the snake/ladder as soon as steps complete
      const tHL = setTimeout(() => {
        setHighlight({ square: eventSquare, type: eventType });
        if (eventType === "snake") playSnake();
        else playLadder();
      }, afterSteps + 40);

      // Jump to final position after pause
      const t1 = setTimeout(() => {
        setDisplayPos((prev) => {
          const next = [...prev] as [number, number];
          next[mover] = final;
          return next;
        });
      }, afterSteps + 380);

      // Clear highlight and finish animation
      const t2 = setTimeout(() => {
        setHighlight(null);
        setAnimating(false);
      }, afterSteps + 780);

      timersRef.current.push(tHL, t1, t2);
    } else {
      const t = setTimeout(() => setAnimating(false), afterSteps + 120);
      timersRef.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rollId]);

  // Win sound
  useEffect(() => {
    if (state.phase === "won") playWin();
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
    computerTimerRef.current = setTimeout(doRoll, 1200);
    return () => { if (computerTimerRef.current) clearTimeout(computerTimerRef.current); };
  }, [state.mode, state.phase, state.currentTurn, rolling, animating, doRoll]);

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
        <button
          onClick={toggleMute}
          className="w-20 text-right text-xl transition-opacity hover:opacity-80"
          title={muted ? "Unmute" : "Mute"}
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col lg:flex-row gap-4 p-4 max-w-5xl mx-auto w-full">
        {/* Board */}
        <div className="flex-1 min-w-0">
          <GameBoard players={boardPlayers} highlight={highlight} />
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
