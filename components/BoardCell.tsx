import { SNAKES, LADDERS } from "@/lib/constants";

interface BoardCellProps {
  square: number;
}

// Color pairs [a, b] — alternated by (col+rowFromBottom) % 2
const CELL_PALETTE: [string, string][] = [
  ["#fca5a5", "#fee2e2"], // row 0  (1–10): red
  ["#fdba74", "#ffedd5"], // row 1  (11–20): orange
  ["#fde68a", "#fefce8"], // row 2  (21–30): yellow
  ["#86efac", "#dcfce7"], // row 3  (31–40): green
  ["#6ee7b7", "#d1fae5"], // row 4  (41–50): emerald
  ["#67e8f9", "#cffafe"], // row 5  (51–60): cyan
  ["#93c5fd", "#dbeafe"], // row 6  (61–70): blue
  ["#a5b4fc", "#e0e7ff"], // row 7  (71–80): indigo
  ["#c4b5fd", "#ede9fe"], // row 8  (81–90): violet
  ["#f9a8d4", "#fce7f3"], // row 9  (91–100): pink
];

export default function BoardCell({ square }: BoardCellProps) {
  const rowFromBottom = Math.floor((square - 1) / 10);
  const { col } = squareToGridCoords(square);
  const isSnakeHead = SNAKES[square] !== undefined;
  const isLadderBase = LADDERS[square] !== undefined;
  const isWin = square === 100;

  let bg: string;
  if (isWin) {
    bg = "linear-gradient(135deg, #fef08a, #fbbf24, #f59e0b)";
  } else if (isSnakeHead) {
    bg = "linear-gradient(135deg, #fca5a5, #f87171)";
  } else if (isLadderBase) {
    bg = "linear-gradient(135deg, #86efac, #4ade80)";
  } else {
    const [a, b] = CELL_PALETTE[rowFromBottom % CELL_PALETTE.length];
    bg = (col + rowFromBottom) % 2 === 0 ? a : b;
  }

  return (
    <div
      className="relative border border-white/30 select-none"
      style={{ aspectRatio: "1/1", background: bg }}
    >
      {/* Square number */}
      <span
        className="absolute top-[2px] left-[2px] font-bold text-gray-700 leading-none"
        style={{ fontSize: "clamp(5px, 0.9vw, 10px)" }}
      >
        {square === 100 ? "🏁" : square}
      </span>

      {/* Start marker */}
      {square === 1 && (
        <span
          className="absolute bottom-0 right-0.5 leading-none text-gray-500 font-bold"
          style={{ fontSize: "clamp(4px, 0.7vw, 8px)" }}
        >
          GO
        </span>
      )}

      {/* Snake head indicator */}
      {isSnakeHead && (
        <div
          className="absolute inset-0 rounded-sm border-2"
          style={{ borderColor: "#ef4444", opacity: 0.6 }}
        />
      )}

      {/* Ladder base indicator */}
      {isLadderBase && (
        <div
          className="absolute inset-0 rounded-sm border-2"
          style={{ borderColor: "#16a34a", opacity: 0.6 }}
        />
      )}
    </div>
  );
}

// Local helper (no need to import boardUtils here)
function squareToGridCoords(square: number): { row: number; col: number } {
  const idx = square - 1;
  const rowFromBottom = Math.floor(idx / 10);
  const posInRow = idx % 10;
  const row = 9 - rowFromBottom;
  const col = rowFromBottom % 2 === 0 ? posInRow : 9 - posInRow;
  return { row, col };
}
