"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DiceRollerProps {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

export default function DiceRoller({ value, rolling, disabled, onRoll }: DiceRollerProps) {
  const dots = value ? DOT_POSITIONS[value] : [];

  const [autoMode, setAutoMode] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpaceRef = useRef(0);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoRoll = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(onRoll, 500);
  }, [onRoll]);

  useEffect(() => {
    if (!autoMode) return;
    if (!disabled && !rolling) scheduleAutoRoll();
  }, [autoMode, disabled, rolling, scheduleAutoRoll]);

  useEffect(() => () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
  }, []);

  function toggleAuto() {
    setAutoMode((prev) => {
      const next = !prev;
      if (!next && autoTimerRef.current) clearTimeout(autoTimerRef.current);
      return next;
    });
  }

  // ── Keyboard: Space = roll · Ctrl+Space×2 = toggle auto ──────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      if (e.repeat) return;

      if (e.ctrlKey) {
        const now = Date.now();
        if (now - lastSpaceRef.current < 400) {
          toggleAuto();
          lastSpaceRef.current = 0;
        } else {
          lastSpaceRef.current = now;
        }
        return;
      }

      if (!disabled && !rolling && !autoMode) onRoll();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, rolling, autoMode, onRoll]);

  // ── Mouse: Ctrl + double-click = toggle auto ──────────────────────────────
  function handleDiceDoubleClick(e: React.MouseEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    toggleAuto();
  }

  // ── Mobile: triple tap on dice = toggle auto ──────────────────────────────
  function handleTouchStart() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      toggleAuto();
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 600);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Auto-mode badge */}
      {autoMode && (
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
          style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}
        >
          ⚡ AUTO
        </div>
      )}

      {/* Dice */}
      <div
        className={`relative cursor-pointer ${rolling ? "animate-dice-roll" : ""}`}
        style={{ width: 72, height: 72 }}
        onDoubleClick={handleDiceDoubleClick}
        onTouchStart={handleTouchStart}
        title="Desktop: Ctrl+dblclick or Ctrl+Space×2 · Mobile: triple tap"
      >
        {/* Top face */}
        <div
          className="absolute inset-0 rounded-2xl transition-all duration-200"
          style={{
            background: autoMode
              ? "linear-gradient(145deg, #fef9c3 0%, #fde68a 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #e2e8f0 100%)",
            boxShadow: autoMode
              ? "0 0 0 2px #fbbf24, 4px 6px 0 0 #d97706, 0 0 18px rgba(251,191,36,0.5)"
              : "0 0 0 1.5px #cbd5e1, 4px 6px 0 0 #94a3b8, 0 12px 28px rgba(0,0,0,0.4)",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {dots.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="9" fill={autoMode ? "#92400e" : "#1e293b"} />
            ))}
            {!value && (
              <text x="50" y="58" textAnchor="middle" fontSize="30" fill={autoMode ? "#d97706" : "#cbd5e1"}>
                ?
              </text>
            )}
          </svg>
        </div>
        {/* Right side 3-D illusion */}
        <div
          className="absolute rounded-r-lg"
          style={{
            right: -4, top: 6, width: 6, bottom: -4,
            background: autoMode ? "#d97706" : "#94a3b8",
            transform: "skewY(-8deg)",
            transformOrigin: "top left",
            zIndex: -1,
          }}
        />
        {/* Bottom face 3-D illusion */}
        <div
          className="absolute rounded-b-lg"
          style={{
            bottom: -4, left: 6, height: 6, right: -4,
            background: autoMode ? "#d97706" : "#94a3b8",
            transform: "skewX(-8deg)",
            transformOrigin: "top left",
            zIndex: -1,
          }}
        />
      </div>

      <button
        onClick={onRoll}
        disabled={disabled || rolling || autoMode}
        className="relative overflow-hidden rounded-full font-bold text-white transition-all active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        style={{
          padding: "10px 28px",
          background:
            autoMode
              ? "linear-gradient(135deg, #d97706, #b45309)"
              : disabled || rolling
              ? "linear-gradient(135deg, #6366f1, #4f46e5)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          boxShadow:
            autoMode
              ? "0 4px 14px rgba(217,119,6,0.5)"
              : disabled || rolling
              ? "none"
              : "0 4px 14px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {autoMode ? "⚡ Auto…" : rolling ? "Rolling…" : "🎲 Roll"}
      </button>

      {/* Hints */}
      {!autoMode && (
        <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
          <span className="hidden sm:inline">Space to roll · </span>
          Ctrl+Space×2 or triple tap for auto
        </p>
      )}
      {autoMode && (
        <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          Ctrl+dblclick · Ctrl+Space×2 · triple tap to stop
        </p>
      )}
    </div>
  );
}
