"use client";

import { SNAKES, LADDERS } from "@/lib/constants";
import {
  squareToGridCoords,
  squareToCellCenter,
  getSnakeRenderData,
  getLadderRenderData,
} from "@/lib/boardUtils";
import BoardCell from "./BoardCell";

interface BoardPlayer {
  name: string;
  position: number;
  color: string;
  isActive: boolean;
}

interface GameBoardProps {
  players: BoardPlayer[];
  highlight?: { square: number; type: "snake" | "ladder" } | null;
}

function buildBoardSquares(): number[] {
  const cells: number[] = new Array(100);
  for (let square = 1; square <= 100; square++) {
    const { row, col } = squareToGridCoords(square);
    cells[row * 10 + col] = square;
  }
  return cells;
}

const BOARD_SQUARES = buildBoardSquares();

export default function GameBoard({ players, highlight }: GameBoardProps) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        aspectRatio: "1/1",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 4px rgba(255,255,255,0.08)",
        background: "linear-gradient(145deg, #3d2008, #5c3210)",
      }}
    >
      {/* Wooden border frame */}
      <div
        className="absolute inset-[6px] rounded-xl overflow-hidden"
        style={{ background: "#1a0a00" }}
      >
        {/* Board grid */}
        <div className="grid grid-cols-10 w-full h-full">
          {BOARD_SQUARES.map((square, idx) => (
            <BoardCell key={idx} square={square} />
          ))}
        </div>

        {/* SVG overlay — snakes, ladders, tokens */}
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Snake gradient */}
            <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            {/* Ladder wood gradient */}
            <linearGradient id="ladderWood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="40%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            {/* Drop shadow filter */}
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* ── Ladders (behind snakes) ─────────────────────────────── */}
          {Object.entries(LADDERS).map(([fromStr, to]) => (
            <RealisticLadder
              key={`L${fromStr}`}
              from={Number(fromStr)}
              to={to}
              isHighlighted={highlight?.type === "ladder" && highlight.square === Number(fromStr)}
            />
          ))}

          {/* ── Snakes ─────────────────────────────────────────────── */}
          {Object.entries(SNAKES).map(([fromStr, to]) => (
            <RealisticSnake
              key={`S${fromStr}`}
              from={Number(fromStr)}
              to={to}
              isHighlighted={highlight?.type === "snake" && highlight.square === Number(fromStr)}
            />
          ))}

          {/* ── Player tokens (top layer) ───────────────────────────── */}
          {players.map((p, i) => (
            <PlayerToken
              key={i}
              position={p.position}
              name={p.name}
              color={p.color}
              isActive={p.isActive}
              offset={i}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Realistic Snake ─────────────────────────────────────────────────────────

function RealisticSnake({ from, to, isHighlighted }: { from: number; to: number; isHighlighted?: boolean }) {
  const { path, headX, headY, tailX, tailY, c1x, c1y } = getSnakeRenderData(from, to);

  // Head-forward direction (away from body)
  const hdx = headX - c1x;
  const hdy = headY - c1y;
  const hlen = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
  const hnx = hdx / hlen;
  const hny = hdy / hlen;

  // Tongue
  const tongStart = 16;
  const tongEnd = 34;
  const forkLen = 11;
  const forkAngle = 0.45;
  const baseAngle = Math.atan2(hny, hnx);
  const tx = headX + hnx * tongEnd;
  const ty = headY + hny * tongEnd;
  const f1x = tx + Math.cos(baseAngle + forkAngle) * forkLen;
  const f1y = ty + Math.sin(baseAngle + forkAngle) * forkLen;
  const f2x = tx + Math.cos(baseAngle - forkAngle) * forkLen;
  const f2y = ty + Math.sin(baseAngle - forkAngle) * forkLen;

  // Eyes (perpendicular to head direction, stepped back from tip)
  const perpAngle = baseAngle + Math.PI / 2;
  const eyeBackX = headX + hnx * (-6);
  const eyeBackY = headY + hny * (-6);
  const e1x = eyeBackX + Math.cos(perpAngle) * 7;
  const e1y = eyeBackY + Math.sin(perpAngle) * 7;
  const e2x = eyeBackX - Math.cos(perpAngle) * 7;
  const e2y = eyeBackY - Math.sin(perpAngle) * 7;

  return (
    <g filter="url(#dropShadow)">
      {/* ── Highlight glow when player lands on this snake ── */}
      {isHighlighted && (
        <>
          {/* Outer pulsing red aura */}
          <path d={path} stroke="#ff2222" strokeWidth="42" strokeLinecap="round" fill="none" opacity="0">
            <animate attributeName="opacity" values="0;0.55;0;0.55;0;0.55;0" dur="0.55s" repeatCount="indefinite" />
            <animate attributeName="strokeWidth" values="40;50;40;50;40;50;40" dur="0.55s" repeatCount="indefinite" />
          </path>
          {/* Head flash */}
          <circle cx={headX} cy={headY} r="28" fill="#ff0000" opacity="0">
            <animate attributeName="r" values="24;42;24;42;24;42;24" dur="0.55s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5;0;0.5;0;0" dur="0.55s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      {/* Body layers: shadow → dark outline → main → belly stripe */}
      <path d={path} stroke="rgba(0,0,0,0.35)" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#052e16" strokeWidth="20" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#15803d" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#4ade80" strokeWidth="6"  strokeLinecap="round" fill="none" />
      {/* Scale texture dashes */}
      <path d={path} stroke="#bbf7d0" strokeWidth="2.5" strokeLinecap="round" fill="none"
            strokeDasharray="6 14" strokeDashoffset="0" opacity="0.7" />

      {/* Tongue (behind head) */}
      <path
        d={`M ${headX + hnx * tongStart},${headY + hny * tongStart} L ${tx},${ty} L ${f1x},${f1y} M ${tx},${ty} L ${f2x},${f2y}`}
        stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />

      {/* Head shadow */}
      <ellipse cx={headX + 3} cy={headY + 3} rx="23" ry="19" fill="rgba(0,0,0,0.35)" />
      {/* Head body (dark) */}
      <ellipse cx={headX} cy={headY} rx="23" ry="19" fill="#14532d" />
      {/* Head face (bright) */}
      <ellipse cx={headX} cy={headY} rx="18" ry="14" fill="#22c55e" />
      {/* Head shimmer */}
      <ellipse cx={headX - 4} cy={headY - 4} rx="8" ry="5" fill="rgba(255,255,255,0.15)" />

      {/* Eyes — whites */}
      <circle cx={e1x} cy={e1y} r="5.5" fill="white" />
      <circle cx={e2x} cy={e2y} r="5.5" fill="white" />
      {/* Eyes — pupils */}
      <ellipse cx={e1x + hnx * 1.5} cy={e1y + hny * 1.5} rx="2.5" ry="3.5" fill="#0f172a" />
      <ellipse cx={e2x + hnx * 1.5} cy={e2y + hny * 1.5} rx="2.5" ry="3.5" fill="#0f172a" />
      {/* Eyes — shine */}
      <circle cx={e1x + hnx - 1} cy={e1y + hny - 1} r="1.2" fill="rgba(255,255,255,0.9)" />
      <circle cx={e2x + hnx - 1} cy={e2y + hny - 1} r="1.2" fill="rgba(255,255,255,0.9)" />

      {/* Tail tip */}
      <circle cx={tailX} cy={tailY} r="8" fill="#052e16" />
      <circle cx={tailX} cy={tailY} r="5" fill="#16a34a" />
      <circle cx={tailX} cy={tailY} r="2" fill="#86efac" />
    </g>
  );
}

// ─── Realistic Ladder ────────────────────────────────────────────────────────

function RealisticLadder({ from, to, isHighlighted }: { from: number; to: number; isHighlighted?: boolean }) {
  const { baseX, baseY, topX, topY, nx, ny, rungs } = getLadderRenderData(from, to);

  const rails = [
    { ox: nx, oy: ny },
    { ox: -nx, oy: -ny },
  ];

  // Length of the ladder for shimmer animation
  const ladderLen = Math.round(
    Math.sqrt((topX - baseX) ** 2 + (topY - baseY) ** 2)
  );

  return (
    <g filter="url(#dropShadow)">
      {/* ── Highlight shimmer when player climbs this ladder ── */}
      {isHighlighted && (
        <>
          {/* Gold aura behind the whole ladder */}
          <line
            x1={baseX} y1={baseY} x2={topX} y2={topY}
            stroke="#fde68a" strokeWidth="32" strokeLinecap="round" opacity="0"
          >
            <animate attributeName="opacity" values="0;0.5;0;0.5;0;0.5;0" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="strokeWidth" values="30;44;30;44;30;44;30" dur="0.5s" repeatCount="indefinite" />
          </line>
          {/* Shimmer streak running UP the left rail */}
          <line
            x1={baseX + nx} y1={baseY + ny}
            x2={topX + nx}  y2={topY + ny}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`30 ${ladderLen}`}
            opacity="0.9"
          >
            <animate
              attributeName="strokeDashoffset"
              values={`${ladderLen + 30};-30`}
              dur="0.45s"
              repeatCount="indefinite"
            />
          </line>
          {/* Shimmer streak on right rail */}
          <line
            x1={baseX - nx} y1={baseY - ny}
            x2={topX - nx}  y2={topY - ny}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`30 ${ladderLen}`}
            opacity="0.9"
          >
            <animate
              attributeName="strokeDashoffset"
              values={`${ladderLen + 30};-30`}
              dur="0.45s"
              begin="0.22s"
              repeatCount="indefinite"
            />
          </line>
        </>
      )}
      {/* Rail shadows */}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rsh${i}`}
          x1={baseX + ox + 3} y1={baseY + oy + 3}
          x2={topX + ox + 3}  y2={topY + oy + 3}
          stroke="rgba(0,0,0,0.3)" strokeWidth="13" strokeLinecap="round"
        />
      ))}
      {/* Rail base (dark wood) */}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rb${i}`}
          x1={baseX + ox} y1={baseY + oy}
          x2={topX + ox}  y2={topY + oy}
          stroke="#78350f" strokeWidth="10" strokeLinecap="round"
        />
      ))}
      {/* Rail mid (medium wood) */}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rm${i}`}
          x1={baseX + ox} y1={baseY + oy}
          x2={topX + ox}  y2={topY + oy}
          stroke="#b45309" strokeWidth="6" strokeLinecap="round"
        />
      ))}
      {/* Rail highlight */}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rh${i}`}
          x1={baseX + ox - 1.5} y1={baseY + oy - 1.5}
          x2={topX + ox - 1.5}  y2={topY + oy - 1.5}
          stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"
        />
      ))}

      {/* Rung shadows */}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgs${i}`}
          x1={rx + nx + 3} y1={ry + ny + 3}
          x2={rx - nx + 3} y2={ry - ny + 3}
          stroke="rgba(0,0,0,0.3)" strokeWidth="9" strokeLinecap="round"
        />
      ))}
      {/* Rung base */}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgb${i}`}
          x1={rx + nx} y1={ry + ny}
          x2={rx - nx} y2={ry - ny}
          stroke="#92400e" strokeWidth="7" strokeLinecap="round"
        />
      ))}
      {/* Rung highlight */}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgh${i}`}
          x1={rx + nx - 1.5} y1={ry + ny - 1.5}
          x2={rx - nx - 1.5} y2={ry - ny - 1.5}
          stroke="#fde68a" strokeWidth="3" strokeLinecap="round"
        />
      ))}

      {/* Top cap */}
      <circle cx={topX} cy={topY} r="10" fill="#78350f" />
      <circle cx={topX} cy={topY} r="6"  fill="#fbbf24" />
      <circle cx={topX - 2} cy={topY - 2} r="2" fill="rgba(255,255,255,0.5)" />

      {/* Base cap */}
      <circle cx={baseX} cy={baseY} r="8"  fill="#78350f" />
      <circle cx={baseX} cy={baseY} r="5"  fill="#d97706" />
    </g>
  );
}

// ─── Player Token ─────────────────────────────────────────────────────────────

function PlayerToken({
  position,
  name,
  color,
  isActive,
  offset,
}: {
  position: number;
  name: string;
  color: string;
  isActive: boolean;
  offset: number;
}) {
  if (position === 0) return null;

  const { x: cx, y: cy } = squareToCellCenter(position);
  // Offset two players on the same cell
  const ox = offset === 0 ? -14 : 14;
  const tx = cx + ox;

  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const label = name.split(" ")[0].slice(0, 9);

  return (
    <g>
      {/* Active glow ring */}
      {isActive && (
        <circle cx={tx} cy={cy} r="24" fill={color} opacity="0.25">
          <animate attributeName="r" values="22;28;22" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Token shadow */}
      <circle cx={tx + 3} cy={cy + 4} r="17" fill="rgba(0,0,0,0.45)" />
      {/* Token body */}
      <circle cx={tx} cy={cy} r="17" fill={color} />
      {/* Inner rim */}
      <circle cx={tx} cy={cy} r="13" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
      {/* Initials */}
      <text
        x={tx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="800"
        fill="white"
        style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "-0.5px" }}
      >
        {initials}
      </text>

      {/* Name label */}
      <text
        x={tx} y={cy + 29}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="700"
        fill={color}
        stroke="rgba(10,10,10,0.85)"
        strokeWidth="3.5"
        paintOrder="stroke"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}
