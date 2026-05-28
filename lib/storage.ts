import type { PlayerStats } from "./gameReducer";

export type GameRecord = {
  id: string;
  date: string;
  mode: "pvp" | "pvc";
  duration: number; // total moves by both players
  players: [
    { name: string; stats: PlayerStats },
    { name: string; stats: PlayerStats }
  ];
  winner: 0 | 1;
};

export type LeaderboardEntry = {
  name: string;
  wins: number;
  losses: number;
  winRate: number;
  gamesPlayed: number;
  totalSnakes: number;
  totalLadders: number;
  totalMoves: number;
};

const KEY = "snl_games_v1";

export function saveGame(record: GameRecord): void {
  if (typeof window === "undefined") return;
  const games = loadGames();
  games.push(record);
  localStorage.setItem(KEY, JSON.stringify(games.slice(-500)));
}

export function loadGames(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearGames(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function getLeaderboard(games: GameRecord[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  for (const game of games) {
    game.players.forEach(({ name, stats }, idx) => {
      if (name === "Computer") return;
      const isWinner = game.winner === idx;
      const prev = map.get(name) ?? {
        name,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesPlayed: 0,
        totalSnakes: 0,
        totalLadders: 0,
        totalMoves: 0,
      };
      map.set(name, {
        ...prev,
        wins: prev.wins + (isWinner ? 1 : 0),
        losses: prev.losses + (isWinner ? 0 : 1),
        gamesPlayed: prev.gamesPlayed + 1,
        totalSnakes: prev.totalSnakes + stats.snakesHit,
        totalLadders: prev.totalLadders + stats.laddersClimbed,
        totalMoves: prev.totalMoves + stats.totalMoves,
        winRate: 0,
      });
    });
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      winRate: e.gamesPlayed > 0 ? Math.round((e.wins / e.gamesPlayed) * 100) : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
}

// Aggregate dice counts across all games for a given player index (or both)
export function getDiceFrequency(games: GameRecord[]): Record<number, number> {
  const freq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const game of games) {
    for (const player of game.players) {
      for (const d of player.stats.diceHistory) {
        freq[d] = (freq[d] ?? 0) + 1;
      }
    }
  }
  return freq;
}

// Count how many times each snake head was triggered (across all games)
export function getSnakeFrequency(games: GameRecord[]): Record<number, number> {
  const freq: Record<number, number> = {};
  for (const game of games) {
    // We don't store per-snake breakdown, so use snakesHit as proxy
    // For per-square breakdown we'd need richer data — skip for now
    void game;
  }
  return freq;
}
