import { CELL_SVG_SIZE } from "./constants";

export function squareToGridCoords(square: number): { row: number; col: number } {
  const idx = square - 1;
  const rowFromBottom = Math.floor(idx / 10);
  const posInRow = idx % 10;
  const row = 9 - rowFromBottom;
  const col = rowFromBottom % 2 === 0 ? posInRow : 9 - posInRow;
  return { row, col };
}

export function squareToCellCenter(square: number): { x: number; y: number } {
  const { row, col } = squareToGridCoords(square);
  return {
    x: col * CELL_SVG_SIZE + CELL_SVG_SIZE / 2,
    y: row * CELL_SVG_SIZE + CELL_SVG_SIZE / 2,
  };
}

export type SnakeRenderData = {
  path: string;
  headX: number;
  headY: number;
  tailX: number;
  tailY: number;
  c1x: number;
  c1y: number;
};

export function getSnakeRenderData(from: number, to: number): SnakeRenderData {
  const { x: x1, y: y1 } = squareToCellCenter(from); // head
  const { x: x2, y: y2 } = squareToCellCenter(to);   // tail
  const lateral = y1 < y2 ? 80 : -80;
  const c1x = x1 + lateral;
  const c1y = y1 + (y2 - y1) * 0.3;
  const c2x = x2 - lateral;
  const c2y = y2 - (y2 - y1) * 0.3;
  const path = `M ${x1},${y1} C ${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
  return { path, headX: x1, headY: y1, tailX: x2, tailY: y2, c1x, c1y };
}

export type LadderRenderData = {
  baseX: number;
  baseY: number;
  topX: number;
  topY: number;
  nx: number;
  ny: number;
  rungs: { rx: number; ry: number }[];
};

export function getLadderRenderData(from: number, to: number): LadderRenderData {
  const { x: x1, y: y1 } = squareToCellCenter(from); // base
  const { x: x2, y: y2 } = squareToCellCenter(to);   // top
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = (-dy / len) * 11;
  const ny = (dx / len) * 11;
  const numRungs = Math.max(3, Math.round(len / 80));
  const rungs: { rx: number; ry: number }[] = [];
  for (let i = 1; i <= numRungs; i++) {
    const t = i / (numRungs + 1);
    rungs.push({ rx: x1 + dx * t, ry: y1 + dy * t });
  }
  return { baseX: x1, baseY: y1, topX: x2, topY: y2, nx, ny, rungs };
}

// Kept for backward compat
export function buildSnakePath(from: number, to: number): string {
  return getSnakeRenderData(from, to).path;
}

export function buildLadderRails(
  from: number,
  to: number
): { leftRail: string; rightRail: string; rungs: string[] } {
  const d = getLadderRenderData(from, to);
  const { baseX: x1, baseY: y1, topX: x2, topY: y2, nx, ny } = d;
  const leftRail = `M ${x1 + nx},${y1 + ny} L ${x2 + nx},${y2 + ny}`;
  const rightRail = `M ${x1 - nx},${y1 - ny} L ${x2 - nx},${y2 - ny}`;
  const rungs = d.rungs.map(
    ({ rx, ry }) => `M ${rx + nx},${ry + ny} L ${rx - nx},${ry - ny}`
  );
  return { leftRail, rightRail, rungs };
}
