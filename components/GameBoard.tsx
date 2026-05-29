"use client";

import { SNAKES, LADDERS } from "@/lib/constants";
import {
  squareToGridCoords,
  squareToCellCenter,
  getSnakeRenderData,
  getLadderRenderData,
} from "@/lib/boardUtils";
import BoardCell from "./BoardCell";

export type TokenEmotion = "normal" | "happy" | "scared";

interface BoardPlayer {
  name: string;
  position: number;
  color: string;
  isActive: boolean;
}

interface GameBoardProps {
  players: BoardPlayer[];
  highlight?: { square: number; type: "snake" | "ladder" } | null;
  tokenEmotions?: [TokenEmotion, TokenEmotion];
  snakeEatingSquare?: number | null;
  playerPositions?: [number, number];
  rollId?: number;
  soundProfile?: "classic" | "funny";
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

export default function GameBoard({
  players,
  highlight,
  tokenEmotions,
  snakeEatingSquare,
  playerPositions,
  rollId = 0,
  soundProfile,
}: GameBoardProps) {
  const isFunny = soundProfile === "funny";

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
            <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="ladderWood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="40%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
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
          {Object.entries(SNAKES).map(([fromStr, to]) => {
            const snakeFrom = Number(fromStr);
            const eating = isFunny && snakeEatingSquare === snakeFrom;
            const nearby =
              isFunny &&
              !eating &&
              (playerPositions ?? [0, 0]).some(
                (pos) => pos > 0 && Math.abs(pos - snakeFrom) <= 4
              );
            return (
              <RealisticSnake
                key={`S${fromStr}-${eating ? rollId : "static"}`}
                from={snakeFrom}
                to={to}
                isHighlighted={highlight?.type === "snake" && highlight.square === snakeFrom}
                isSwallowing={eating}
                isNearby={nearby}
              />
            );
          })}

          {/* ── Player tokens (top layer) ───────────────────────────── */}
          {players.map((p, i) => {
            const emotion = isFunny ? (tokenEmotions?.[i] ?? "normal") : "normal";
            const swallowing =
              isFunny &&
              snakeEatingSquare !== null &&
              snakeEatingSquare !== undefined &&
              p.position === snakeEatingSquare;
            return (
              <PlayerToken
                key={`t${i}-${emotion !== "normal" ? rollId : "static"}`}
                position={p.position}
                name={p.name}
                color={p.color}
                isActive={p.isActive}
                offset={i}
                emotion={emotion}
                isBeingSwallowed={swallowing}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Realistic Snake ─────────────────────────────────────────────────────────

function RealisticSnake({
  from,
  to,
  isHighlighted,
  isSwallowing = false,
  isNearby = false,
}: {
  from: number;
  to: number;
  isHighlighted?: boolean;
  isSwallowing?: boolean;
  isNearby?: boolean;
}) {
  const { path, headX, headY, tailX, tailY, c1x, c1y } = getSnakeRenderData(from, to);

  const hdx = headX - c1x;
  const hdy = headY - c1y;
  const hlen = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
  const hnx = hdx / hlen;
  const hny = hdy / hlen;

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

  const perpAngle = baseAngle + Math.PI / 2;
  const eyeBackX = headX + hnx * (-6);
  const eyeBackY = headY + hny * (-6);
  const e1x = eyeBackX + Math.cos(perpAngle) * 7;
  const e1y = eyeBackY + Math.sin(perpAngle) * 7;
  const e2x = eyeBackX - Math.cos(perpAngle) * 7;
  const e2y = eyeBackY - Math.sin(perpAngle) * 7;

  // Eye size: bigger when snake notices a nearby coin
  const eyeR = isNearby && !isSwallowing ? 7 : 5.5;

  return (
    <g filter="url(#dropShadow)">
      {/* Hidden path used as motion track for the swallow-bulge animation */}
      <path id={`sp-${from}`} d={path} fill="none" stroke="none" />

      {/* ── Classic highlight glow ── */}
      {isHighlighted && (
        <>
          <path d={path} stroke="#ff2222" strokeWidth="42" strokeLinecap="round" fill="none" opacity="0">
            <animate attributeName="opacity" values="0;0.55;0;0.55;0;0.55;0" dur="0.55s" repeatCount="indefinite" />
            <animate attributeName="strokeWidth" values="40;50;40;50;40;50;40" dur="0.55s" repeatCount="indefinite" />
          </path>
          <circle cx={headX} cy={headY} r="28" fill="#ff0000" opacity="0">
            <animate attributeName="r" values="24;42;24;42;24;42;24" dur="0.55s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5;0;0.5;0;0" dur="0.55s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Body layers */}
      <path d={path} stroke="rgba(0,0,0,0.35)" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#052e16" strokeWidth="20" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#15803d" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#4ade80" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d={path} stroke="#bbf7d0" strokeWidth="2.5" strokeLinecap="round" fill="none"
        strokeDasharray="6 14" strokeDashoffset="0" opacity="0.7" />

      {/* ── Swallowing: open mouth circle growing at snout ── */}
      {isSwallowing && (
        <circle cx={headX + hnx * 21} cy={headY + hny * 21} r="0" fill="#052e16" opacity="0">
          <animate attributeName="r" values="0;15;13;0" keyTimes="0;0.3;0.72;1" dur="0.95s" fill="freeze" />
          <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.08;0.72;1" dur="0.95s" fill="freeze" />
        </circle>
      )}

      {/* ── Swallowing: bulge traveling from head to tail ── */}
      {isSwallowing && (
        <circle r="9" fill="#4ade80" opacity="0">
          <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.06;0.9;1" dur="1.3s" begin="0.42s" fill="freeze" />
          <animateMotion dur="1.3s" begin="0.42s" fill="freeze" rotate="auto">
            <mpath href={`#sp-${from}`} />
          </animateMotion>
        </circle>
      )}

      {/* Tongue */}
      <path
        d={`M ${headX + hnx * tongStart},${headY + hny * tongStart} L ${tx},${ty} L ${f1x},${f1y} M ${tx},${ty} L ${f2x},${f2y}`}
        stroke="#ef4444" strokeWidth={isSwallowing ? "3.5" : "2.5"} fill="none" strokeLinecap="round"
      />
      {/* Tongue flicker when swallowing */}
      {isSwallowing && (
        <path
          d={`M ${headX + hnx * tongStart},${headY + hny * tongStart} L ${tx},${ty}`}
          stroke="#ef4444" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0"
        >
          <animate attributeName="opacity" values="0;1;0;1;0;1" dur="0.18s" repeatCount="indefinite" />
        </path>
      )}

      {/* Head shadow */}
      <ellipse cx={headX + 3} cy={headY + 3} rx="23" ry="19" fill="rgba(0,0,0,0.35)" />
      {/* Head body (dark) */}
      <ellipse cx={headX} cy={headY} rx="23" ry="19" fill="#14532d" />
      {/* Head face (bright) */}
      <ellipse cx={headX} cy={headY} rx="18" ry="14" fill={isSwallowing ? "#16a34a" : "#22c55e"} />
      {/* Head shimmer */}
      <ellipse cx={headX - 4} cy={headY - 4} rx="8" ry="5" fill="rgba(255,255,255,0.15)" />

      {/* Eyes — whites */}
      <circle cx={e1x} cy={e1y} r={eyeR} fill="white" />
      <circle cx={e2x} cy={e2y} r={eyeR} fill="white" />

      {/* Eyes — pupils: hearts when swallowing, normal ellipses otherwise */}
      {isSwallowing ? (
        <>
          <text x={e1x + hnx * 1.5} y={e1y + hny * 1.5 + 2.5}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="#ef4444" style={{ fontFamily: "sans-serif" }}>♥</text>
          <text x={e2x + hnx * 1.5} y={e2y + hny * 1.5 + 2.5}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="#ef4444" style={{ fontFamily: "sans-serif" }}>♥</text>
        </>
      ) : (
        <>
          <ellipse cx={e1x + hnx * 1.5} cy={e1y + hny * 1.5} rx="2.5" ry="3.5" fill="#0f172a" />
          <ellipse cx={e2x + hnx * 1.5} cy={e2y + hny * 1.5} rx="2.5" ry="3.5" fill="#0f172a" />
        </>
      )}

      {/* Eyes — shine */}
      <circle cx={e1x + hnx - 1} cy={e1y + hny - 1} r="1.2" fill="rgba(255,255,255,0.9)" />
      <circle cx={e2x + hnx - 1} cy={e2y + hny - 1} r="1.2" fill="rgba(255,255,255,0.9)" />

      {/* ── Nearby alert: blinking "!" and pulsing outline ── */}
      {isNearby && !isSwallowing && (
        <>
          <ellipse cx={headX} cy={headY} rx="26" ry="22" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0">
            <animate attributeName="opacity" values="0;0.7;0;0.7;0" dur="0.45s" repeatCount="indefinite" />
            <animate attributeName="rx" values="26;33;26" dur="0.45s" repeatCount="indefinite" />
            <animate attributeName="ry" values="22;29;22" dur="0.45s" repeatCount="indefinite" />
          </ellipse>
          <text x={headX} y={headY - 38}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="22" fontWeight="900" fill="#fbbf24"
            style={{ fontFamily: "sans-serif" }}>
            !
            <animate attributeName="opacity" values="1;0;1;0" dur="0.45s" repeatCount="indefinite" />
          </text>
        </>
      )}

      {/* Tail tip */}
      <circle cx={tailX} cy={tailY} r="8" fill="#052e16" />
      <circle cx={tailX} cy={tailY} r="5" fill="#16a34a" />
      <circle cx={tailX} cy={tailY} r="2" fill="#86efac" />

      {/* ── Swallowing: gas cloud puffs at tail (the prrrr visual) ── */}
      {isSwallowing && (
        <>
          {[0, 0.13, 0.27].map((delay, i) => (
            <circle
              key={i}
              cx={tailX + (i - 1) * 7}
              cy={tailY}
              r="0"
              fill={["#86efac", "#4ade80", "#bbf7d0"][i]}
              opacity="0"
            >
              <animate attributeName="r" values="0;9;17;23" dur="0.78s" begin={`${1.85 + delay}s`} fill="freeze" />
              <animate attributeName="opacity" values="0;0.85;0.45;0" dur="0.78s" begin={`${1.85 + delay}s`} fill="freeze" />
              <animate
                attributeName="cy"
                values={`${tailY};${tailY};${tailY - 10};${tailY - 22}`}
                dur="0.78s"
                begin={`${1.85 + delay}s`}
                fill="freeze"
              />
            </circle>
          ))}
          {/* "prr!" text floats up from tail */}
          <text
            x={tailX + 20}
            y={tailY - 5}
            textAnchor="start"
            fontSize="12"
            fontWeight="900"
            fill="#86efac"
            opacity="0"
            style={{ fontFamily: "sans-serif" }}
          >
            prr!
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.65;1" dur="0.9s" begin="1.9s" fill="freeze" />
            <animate
              attributeName="y"
              values={`${tailY - 5};${tailY - 18};${tailY - 32}`}
              dur="0.9s"
              begin="1.9s"
              fill="freeze"
            />
          </text>
        </>
      )}
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

  const ladderLen = Math.round(
    Math.sqrt((topX - baseX) ** 2 + (topY - baseY) ** 2)
  );

  return (
    <g filter="url(#dropShadow)">
      {isHighlighted && (
        <>
          <line
            x1={baseX} y1={baseY} x2={topX} y2={topY}
            stroke="#fde68a" strokeWidth="32" strokeLinecap="round" opacity="0"
          >
            <animate attributeName="opacity" values="0;0.5;0;0.5;0;0.5;0" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="strokeWidth" values="30;44;30;44;30;44;30" dur="0.5s" repeatCount="indefinite" />
          </line>
          <line
            x1={baseX + nx} y1={baseY + ny} x2={topX + nx} y2={topY + ny}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`30 ${ladderLen}`} opacity="0.9"
          >
            <animate attributeName="strokeDashoffset" values={`${ladderLen + 30};-30`} dur="0.45s" repeatCount="indefinite" />
          </line>
          <line
            x1={baseX - nx} y1={baseY - ny} x2={topX - nx} y2={topY - ny}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`30 ${ladderLen}`} opacity="0.9"
          >
            <animate attributeName="strokeDashoffset" values={`${ladderLen + 30};-30`} dur="0.45s" begin="0.22s" repeatCount="indefinite" />
          </line>
        </>
      )}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rsh${i}`}
          x1={baseX + ox + 3} y1={baseY + oy + 3} x2={topX + ox + 3} y2={topY + oy + 3}
          stroke="rgba(0,0,0,0.3)" strokeWidth="13" strokeLinecap="round"
        />
      ))}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rb${i}`}
          x1={baseX + ox} y1={baseY + oy} x2={topX + ox} y2={topY + oy}
          stroke="#78350f" strokeWidth="10" strokeLinecap="round"
        />
      ))}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rm${i}`}
          x1={baseX + ox} y1={baseY + oy} x2={topX + ox} y2={topY + oy}
          stroke="#b45309" strokeWidth="6" strokeLinecap="round"
        />
      ))}
      {rails.map(({ ox, oy }, i) => (
        <line key={`rh${i}`}
          x1={baseX + ox - 1.5} y1={baseY + oy - 1.5} x2={topX + ox - 1.5} y2={topY + oy - 1.5}
          stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"
        />
      ))}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgs${i}`}
          x1={rx + nx + 3} y1={ry + ny + 3} x2={rx - nx + 3} y2={ry - ny + 3}
          stroke="rgba(0,0,0,0.3)" strokeWidth="9" strokeLinecap="round"
        />
      ))}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgb${i}`}
          x1={rx + nx} y1={ry + ny} x2={rx - nx} y2={ry - ny}
          stroke="#92400e" strokeWidth="7" strokeLinecap="round"
        />
      ))}
      {rungs.map(({ rx, ry }, i) => (
        <line key={`rgh${i}`}
          x1={rx + nx - 1.5} y1={ry + ny - 1.5} x2={rx - nx - 1.5} y2={ry - ny - 1.5}
          stroke="#fde68a" strokeWidth="3" strokeLinecap="round"
        />
      ))}
      <circle cx={topX} cy={topY} r="10" fill="#78350f" />
      <circle cx={topX} cy={topY} r="6" fill="#fbbf24" />
      <circle cx={topX - 2} cy={topY - 2} r="2" fill="rgba(255,255,255,0.5)" />
      <circle cx={baseX} cy={baseY} r="8" fill="#78350f" />
      <circle cx={baseX} cy={baseY} r="5" fill="#d97706" />
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
  emotion = "normal",
  isBeingSwallowed = false,
}: {
  position: number;
  name: string;
  color: string;
  isActive: boolean;
  offset: number;
  emotion?: TokenEmotion;
  isBeingSwallowed?: boolean;
}) {
  if (position === 0) return null;

  const { x: cx, y: cy } = squareToCellCenter(position);
  const ox = offset === 0 ? -14 : 14;
  const tx = cx + ox;

  const initials = name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  const label = name.split(" ")[0].slice(0, 9);

  // CSS animation for the inner token body group
  const bodyAnim =
    isBeingSwallowed
      ? "token-swallow 0.6s ease-in 0.28s forwards"
      : emotion === "happy"
      ? "token-happy-bounce 0.38s ease-out 2"
      : emotion === "scared"
      ? "token-scared-shake 0.22s ease-in-out 3"
      : "none";

  return (
    <g>
      {/* Active glow ring — stays in place */}
      {isActive && (
        <circle cx={tx} cy={cy} r="24" fill={color} opacity="0.25">
          <animate attributeName="r" values="22;28;22" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Happy sparkle stars — outside body so they don't shake */}
      {emotion === "happy" && !isBeingSwallowed && (
        <>
          {([[-22, 0], [0, -22], [22, 0], [0, 22], [-16, -16], [16, -16]] as [number, number][]).map(([dx, dy], i) => (
            <circle key={i} cx={tx + dx} cy={cy + dy} r="0" fill="#fbbf24" opacity="0">
              <animate attributeName="r" values="0;3.5;0" dur="0.5s" begin={`${i * 0.04}s`} fill="freeze" />
              <animate attributeName="opacity" values="0;1;0" dur="0.5s" begin={`${i * 0.04}s`} fill="freeze" />
            </circle>
          ))}
        </>
      )}

      {/* Token body + face — animated group */}
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: bodyAnim,
        }}
      >
        {/* Shadow */}
        <circle cx={tx + 3} cy={cy + 4} r="17" fill="rgba(0,0,0,0.45)" />
        {/* Body */}
        <circle cx={tx} cy={cy} r="17" fill={color} />
        {/* Inner rim */}
        <circle cx={tx} cy={cy} r="13" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />

        {/* Face content based on emotion */}
        {emotion === "normal" ? (
          <text
            x={tx} y={cy + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight="800" fill="white"
            style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "-0.5px" }}
          >
            {initials}
          </text>
        ) : emotion === "happy" ? (
          <HappyFace tx={tx} cy={cy} />
        ) : (
          <ScaredFace tx={tx} cy={cy} />
        )}
      </g>

      {/* Name label — stays in place */}
      <text
        x={tx} y={cy + 29}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700"
        fill={color}
        stroke="rgba(10,10,10,0.85)" strokeWidth="3.5" paintOrder="stroke"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Emotion Faces ────────────────────────────────────────────────────────────

function HappyFace({ tx, cy }: { tx: number; cy: number }) {
  return (
    <g>
      {/* ^^ shaped happy-squint eyes */}
      <path
        d={`M ${tx - 7},${cy - 1} Q ${tx - 5},${cy - 6} ${tx - 3},${cy - 1}`}
        stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d={`M ${tx + 3},${cy - 1} Q ${tx + 5},${cy - 6} ${tx + 7},${cy - 1}`}
        stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Big curved smile */}
      <path
        d={`M ${tx - 6},${cy + 2} Q ${tx},${cy + 8} ${tx + 6},${cy + 2}`}
        stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Rosy cheeks */}
      <circle cx={tx - 8} cy={cy + 3} r="3" fill="rgba(255,120,120,0.45)" />
      <circle cx={tx + 8} cy={cy + 3} r="3" fill="rgba(255,120,120,0.45)" />
    </g>
  );
}

function ScaredFace({ tx, cy }: { tx: number; cy: number }) {
  return (
    <g>
      {/* Wide eyes */}
      <circle cx={tx - 5} cy={cy - 2} r="4" fill="white" />
      <circle cx={tx + 5} cy={cy - 2} r="4" fill="white" />
      {/* Pupils looking upward (fear look) */}
      <circle cx={tx - 5} cy={cy - 3.5} r="2" fill="#0f172a" />
      <circle cx={tx + 5} cy={cy - 3.5} r="2" fill="#0f172a" />
      {/* Shine dots */}
      <circle cx={tx - 4} cy={cy - 4.5} r="0.8" fill="rgba(255,255,255,0.9)" />
      <circle cx={tx + 6} cy={cy - 4.5} r="0.8" fill="rgba(255,255,255,0.9)" />
      {/* Wavy scared mouth */}
      <path
        d={`M ${tx - 5},${cy + 4} Q ${tx - 2},${cy + 2} ${tx},${cy + 4} Q ${tx + 2},${cy + 6} ${tx + 5},${cy + 4}`}
        stroke="white" fill="none" strokeWidth="2" strokeLinecap="round"
      />
      {/* Sweat drop */}
      <path
        d={`M ${tx + 11},${cy - 7} Q ${tx + 14},${cy - 3} ${tx + 11},${cy - 1} Q ${tx + 8},${cy - 3} ${tx + 11},${cy - 7}`}
        fill="#60a5fa"
      />
    </g>
  );
}
